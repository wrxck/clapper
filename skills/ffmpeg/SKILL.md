---
name: ffmpeg
description: >-
  Professional ffmpeg usage for encoding, transcoding, filtering, and producing
  social-platform video and audio deliverables, with version and security
  discipline baked in. Use whenever a task involves ffmpeg or ffprobe directly,
  converting or compressing video/audio, changing codecs/containers/resolution/
  frame rate/bitrate, trimming, concatenating, overlaying watermarks or
  subtitles, normalising loudness, extracting frames or poster images, mixing
  background music, or exporting web-safe MP4/WebM for YouTube, X, LinkedIn,
  TikTok, Reels, Shorts or Instagram. Also load this when another pipeline (for
  example a Remotion render) needs ffmpeg to finish, package, or re-encode its
  output.
---

# ffmpeg

A focused, professional guide to driving `ffmpeg` (and `ffprobe`) well: correct
codecs, web-safe output, clean filters, exact social deliverables, and a
security posture that treats input media as untrusted.

This file is intentionally short. Pick a recipe below for the common path; open
the matching reference for depth.

## Prerequisites and version check

ffmpeg moves fast and old builds carry known memory-safety bugs (see
`references/security.md`). Always confirm a current, supported build before
relying on it.

```bash
ffmpeg -version
ffprobe -version
```

Read the first line (for example `ffmpeg version 8.1.1`). Supported lines as of
mid-2026:

- 8.1 "Hoare" (first released 2026-03-16) - current stable major.
- 8.0 "Huffman" (2025-08-22) - supported; added the Whisper ASR filter.
- 7.1 (2024-09-30) - the current long-term-support (LTS) branch.

Anything 6.x or older is past its comfortable support window: prefer to update
before processing untrusted files. Treat 4.x/5.0/6.0 as "upgrade first".

Install or update per OS:

- macOS: `brew install ffmpeg` / `brew upgrade ffmpeg`
- Debian/Ubuntu: `sudo apt update && sudo apt install ffmpeg` (distro builds
  can lag; for the latest use a static build below)
- Fedora/RHEL: `sudo dnf install ffmpeg` (via RPM Fusion)
- Windows: `winget install Gyan.FFmpeg` or `choco install ffmpeg-full`
- Static builds (any OS, newest): Linux/Windows from BtbN
  (github.com/BtbN/FFmpeg-Builds), Windows from gyan.dev, macOS from
  evermeet.cx. Official links and signature-verification steps live at
  ffmpeg.org/download.html.

Confirm the encoders a recipe needs are actually compiled in:

```bash
ffmpeg -hide_banner -encoders | grep -E 'libx264|libx265|libvpx-vp9|libsvtav1|aac'
```

## Inspect before you encode

Never guess at input properties. Probe first:

```bash
ffprobe -v error -show_format -show_streams -of json input.mp4
ffprobe -v error -select_streams v:0 \
  -show_entries stream=width,height,r_frame_rate,codec_name,pix_fmt \
  -of default=noprint_wrappers=1 input.mp4
```

## Quick-start recipes

Web-safe H.264 MP4 (the safe default for almost any web or app player):

```bash
ffmpeg -i input.mov \
  -c:v libx264 -crf 20 -preset medium -pix_fmt yuv420p \
  -c:a aac -b:a 160k -movflags +faststart \
  output.mp4
```

- `yuv420p` guarantees broad decoder/browser compatibility.
- `-movflags +faststart` moves the index to the front so the file starts
  playing before it is fully downloaded.
- `-crf 20` is visually near-lossless for 1080p; raise the number for smaller
  files, lower it for higher quality. See `references/encoding.md`.

Resize to 1080p keeping aspect ratio (even dimensions required by yuv420p):

```bash
ffmpeg -i input.mp4 -vf "scale=-2:1080" -c:v libx264 -crf 20 \
  -preset medium -pix_fmt yuv420p -c:a copy output_1080p.mp4
```

Extract a poster frame at 2 seconds:

```bash
ffmpeg -ss 2 -i input.mp4 -frames:v 1 -q:v 2 poster.jpg
```

Trim without re-encoding (fast, keyframe-aligned):

```bash
ffmpeg -ss 00:00:05 -to 00:00:20 -i input.mp4 -c copy clip.mp4
```

Extract audio to AAC:

```bash
ffmpeg -i input.mp4 -vn -c:a aac -b:a 192k audio.m4a
```

## Safety note (read this)

Input media is untrusted data and ffmpeg's parsers are a recurring source of
critical CVEs. Two rules cover most of the risk:

1. Keep ffmpeg current and process unknown files with the newest build you have
   (ideally in a sandbox or container with no network and a CPU/time limit).
2. Build commands as argument arrays, never by string-concatenating
   user-supplied filenames or filter text into a shell line. One untrusted
   filename like `; rm -rf ~` becomes command execution otherwise.

Full guidance, including `-nostdin`, `-xerror`, input-format pinning, and
resource limits, is in `references/security.md`.

## Reference files

Open the one you need; do not inline everything here.

- `references/encoding.md` - codec choice (H.264/H.265/VP9/AV1), CRF vs
  bitrate-capped (maxrate/bufsize), two-pass, AAC/Opus audio, presets, and
  sensible bitrate targets per resolution.
- `references/filters.md` - scale/crop/pad/fps, overlay, concat (demuxer and
  filter), fade/afade, loudnorm, trimming, watermarks, subtitle burn-in.
- `references/social-presets.md` - exact, copy-pasteable commands for YouTube/X/
  LinkedIn (1920x1080), TikTok/Reels/Shorts (1080x1920), IG feed (1080x1080),
  IG portrait (1080x1350), plus poster frames and a background-music mix with a
  tail fade.
- `references/security.md` - keeping ffmpeg current, processing untrusted media
  safely, injection-safe command construction, and resource limits.

## Using this skill from another pipeline

A render pipeline (for example Remotion) typically produces a high-quality
master; this skill packages it into platform deliverables. The usual flow:
render once at the highest needed resolution, then run the matching command from
`references/social-presets.md` per target aspect ratio, and extract a poster
frame for each. Keep the master lossless-ish and let these commands do the
platform-specific compression so quality only degrades once.
