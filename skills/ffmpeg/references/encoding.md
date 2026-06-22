# Encoding reference

How to choose a codec and drive its rate control well. The goal for most work is
a web-safe MP4 that plays everywhere; the alternatives matter when you need
smaller files, wider colour, or royalty-free formats.

## Choosing a video codec

| Codec | Encoder | Container | Use it when |
|-------|---------|-----------|-------------|
| H.264 / AVC | libx264 | mp4, mov | Default. Universal playback (browsers, phones, social). |
| H.265 / HEVC | libx265 | mp4, mov | ~40% smaller than H.264 at equal quality; patent-encumbered; Safari/Apple play it, Chrome/Firefox support is partial. |
| VP9 | libvpx-vp9 | webm | Royalty-free, great for web; YouTube re-encodes to it. Slower than x264. |
| AV1 | libsvtav1 | mp4, webm, mkv | Best compression, royalty-free; encode is slower and decode support is still growing. Use SVT-AV1 (libsvtav1), not the reference aom, for sane speed. |

Default recommendation: H.264 for delivery, then add a VP9 or AV1 variant only
if bandwidth or a modern-only audience justifies the slower encode.

## Pixel format and web safety

Always end delivery encodes with these, regardless of codec, for an MP4/MOV:

- `-pix_fmt yuv420p` - 4:2:0 8-bit chroma. Many encoders default to 4:4:4 or
  10-bit which browsers and QuickTime refuse to play. This is the single most
  common "the video is black / will not play" cause.
- `-movflags +faststart` - relocates the moov atom to the start so the file is
  streamable (plays before fully downloaded). MP4/MOV only.

For 10-bit HDR or wide-gamut work use `yuv420p10le` deliberately and know your
target supports it.

## Rate control: CRF vs capped bitrate

There are two main strategies. Pick based on whether you care more about
consistent quality or a predictable file size / stream bitrate.

### CRF (constant quality) - preferred for files

Constant Rate Factor targets a perceptual quality and lets the bitrate float.
Lower = higher quality and bigger file.

```bash
ffmpeg -i in.mp4 -c:v libx264 -crf 20 -preset medium -pix_fmt yuv420p \
  -c:a aac -b:a 160k -movflags +faststart out.mp4
```

CRF scales differ per codec:

- libx264 / libx265: 0-51, default 23. Sane range 18-28. Start at 20 (x264) or
  24-28 (x265, since it is more efficient).
- libvpx-vp9: 0-63. Start around 31; VP9 CRF also needs `-b:v 0` to be true
  constant-quality (see VP9 below).
- libsvtav1: `-crf` 0-63, start around 30.

### Capped quality (maxrate + bufsize) - for streaming / upload limits

When a platform caps bitrate, or you want CRF-like quality but bounded, combine
CRF with a ceiling:

```bash
ffmpeg -i in.mp4 -c:v libx264 -crf 21 -maxrate 8M -bufsize 16M \
  -preset medium -pix_fmt yuv420p -c:a aac -b:a 160k \
  -movflags +faststart out.mp4
```

- `-maxrate` caps the instantaneous bitrate; `-bufsize` is the rate-control
  window (commonly 1-2x maxrate). Without bufsize, maxrate is nearly ignored.
- Pure constant bitrate (rarely wanted): `-b:v 8M -maxrate 8M -bufsize 8M`.

### Two-pass (target an exact average bitrate)

Use when you must hit a specific file size or average bitrate (for example a hard
upload size limit). Two-pass distributes bits better than single-pass ABR.

```bash
ffmpeg -y -i in.mp4 -c:v libx264 -b:v 5M -preset slow -pass 1 \
  -an -f mp4 /dev/null && \
ffmpeg -i in.mp4 -c:v libx264 -b:v 5M -preset slow -pass 2 \
  -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart out.mp4
```

On Windows the first pass output target is `NUL` instead of `/dev/null`. The
pass-1 log files (`ffmpeg2pass-*`) are written to the working directory.

To compute `-b:v` for a target size: `bitrate (bits/s) ~= (target_bytes * 8) /
duration_seconds`, then subtract the audio bitrate.

## Presets and speed/quality trade-off

`-preset` (libx264/libx265/libsvtav1 differ) trades encode time for compression
efficiency. Slower preset = smaller file at the same quality, more CPU.

- libx264/libx265: ultrafast, superfast, veryfast, faster, fast, medium
  (default), slow, slower, veryslow. Use `medium` for general work, `slow` or
  `slower` for final delivery when time allows, `veryfast` for quick previews.
- libsvtav1: numeric `-preset 0` (slowest/best) to `13` (fastest). 6-8 is a good
  balance; 4 for high-quality finals.

`-tune` (x264/x265) can help specific content: `film`, `animation`,
`grain`, `stillimage`, `fastdecode`, `zerolatency`.

## Audio

| Codec | Encoder | Use it when |
|-------|---------|-------------|
| AAC | aac (native) | Default for MP4/MOV. Use `-b:a 128k`-`256k`. |
| Opus | libopus | Best quality per bit, for WebM/Opus. `-b:a 96k`-`128k`. |
| copy | - | `-c:a copy` to remux audio untouched when the codec already fits the container. |

Examples:

```bash
# AAC stereo at 192 kbps
-c:a aac -b:a 192k -ac 2
# Opus for WebM
-c:a libopus -b:a 128k
```

The native `aac` encoder in current ffmpeg is good; the old `-strict
experimental` flag is no longer needed.

## Codec-specific notes

### H.264 (libx264)

The workhorse. For maximum device compatibility (older phones, TVs) constrain
the profile and level:

```bash
ffmpeg -i in.mp4 -c:v libx264 -profile:v high -level 4.1 -crf 20 \
  -preset medium -pix_fmt yuv420p -c:a aac -b:a 160k \
  -movflags +faststart out.mp4
```

### H.265 (libx265)

Smaller files; tag the stream `hvc1` so Apple players accept the MP4:

```bash
ffmpeg -i in.mp4 -c:v libx265 -crf 26 -preset medium -pix_fmt yuv420p \
  -tag:v hvc1 -c:a aac -b:a 160k -movflags +faststart out_hevc.mp4
```

### VP9 (libvpx-vp9) - WebM

For constant-quality VP9, set `-b:v 0` alongside `-crf`. Two-pass markedly
improves VP9; `-row-mt 1` uses more threads:

```bash
ffmpeg -i in.mp4 -c:v libvpx-vp9 -crf 31 -b:v 0 -row-mt 1 \
  -c:a libopus -b:a 128k out.webm
```

### AV1 (libsvtav1)

Best compression, royalty-free. SVT-AV1 is the practical encoder:

```bash
ffmpeg -i in.mp4 -c:v libsvtav1 -crf 30 -preset 6 -pix_fmt yuv420p \
  -svtav1-params tune=0 -c:a libopus -b:a 128k out.mp4
```

Lower `-preset` numbers are slower and smaller. `tune=0` favours perceptual
quality; `tune=1` favours PSNR metrics.

## Sensible starting bitrates (H.264, ~30 fps)

When you must specify a target rather than use CRF:

| Resolution | Video bitrate | Notes |
|------------|---------------|-------|
| 1080p | 8-12 Mbps | 50-60 fps: +50%. |
| 1080p (social upload) | 8-10 Mbps | Platforms re-encode anyway. |
| 720p | 5 Mbps | |
| 1080x1920 vertical | 8-10 Mbps | TikTok/Reels/Shorts. |
| 1080x1080 square | 6-8 Mbps | IG feed. |
| 4K (2160p) | 35-45 Mbps | H.264; H.265/AV1 roughly half. |

Prefer CRF for files and use these only for capped/ABR scenarios. Social
platforms transcode on upload, so uploading a high-quality master (CRF 18-20)
generally beats hitting an exact bitrate.
