# Social platform presets

Exact, copy-pasteable commands for the common deliverables. Each produces a
web-safe H.264 MP4 (yuv420p, faststart, AAC) sized for the platform. All assume
a high-quality master named `master.mp4`; change the input name as needed.

Design choices shared by every preset:

- Fit-to-frame then pad, so any input aspect ratio lands in the target canvas
  without stretching (swap `pad` for `crop` if you prefer fill-and-crop).
- `setsar=1` to force square pixels.
- CRF 20, preset medium for a strong quality/size balance; raise CRF for smaller
  files. See `references/encoding.md` for the rate-control trade-offs.
- `-r 30` normalises frame rate; drop it to keep the source rate.

A note on filenames: these examples use fixed names. If a filename comes from
untrusted input, do not paste it into the shell. Pass it as a separate argument
from an argument array. See `references/security.md`.

## Landscape 1920x1080 (YouTube, X, LinkedIn, Facebook)

Fill-and-crop variant (no bars; crops overflow):

```bash
ffmpeg -i master.mp4 -vf \
  "scale=1920:1080:force_original_aspect_ratio=increase,\
crop=1920:1080,setsar=1,fps=30" \
  -c:v libx264 -crf 20 -preset medium -pix_fmt yuv420p \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart \
  yt_1080p.mp4
```

Fit-and-pad variant (letterbox; no content lost):

```bash
ffmpeg -i master.mp4 -vf \
  "scale=1920:1080:force_original_aspect_ratio=decrease,\
pad=1920:1080:-1:-1:color=black,setsar=1,fps=30" \
  -c:v libx264 -crf 20 -preset medium -pix_fmt yuv420p \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart \
  yt_1080p.mp4
```

`pad=...:-1:-1` centres the scaled video on the canvas automatically.

## Vertical 1080x1920 (TikTok, Instagram Reels, YouTube Shorts)

Fill-and-crop (recommended for full-bleed vertical):

```bash
ffmpeg -i master.mp4 -vf \
  "scale=1080:1920:force_original_aspect_ratio=increase,\
crop=1080:1920,setsar=1,fps=30" \
  -c:v libx264 -crf 20 -preset medium -pix_fmt yuv420p \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart \
  vertical_1080x1920.mp4
```

Fit-and-pad (keeps a 16:9 source intact with bars):

```bash
ffmpeg -i master.mp4 -vf \
  "scale=1080:1920:force_original_aspect_ratio=decrease,\
pad=1080:1920:-1:-1:color=black,setsar=1,fps=30" \
  -c:v libx264 -crf 20 -preset medium -pix_fmt yuv420p \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart \
  vertical_1080x1920.mp4
```

Keep Shorts/Reels/TikTok at or under 60s where the format requires it; trim with
the recipes in `references/filters.md`.

## Square 1080x1080 (Instagram feed)

```bash
ffmpeg -i master.mp4 -vf \
  "scale=1080:1080:force_original_aspect_ratio=increase,\
crop=1080:1080,setsar=1,fps=30" \
  -c:v libx264 -crf 20 -preset medium -pix_fmt yuv420p \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart \
  ig_square_1080.mp4
```

## Portrait 1080x1350 (Instagram 4:5 feed)

4:5 portrait gets more feed real estate than square. Crop variant:

```bash
ffmpeg -i master.mp4 -vf \
  "scale=1080:1350:force_original_aspect_ratio=increase,\
crop=1080:1350,setsar=1,fps=30" \
  -c:v libx264 -crf 20 -preset medium -pix_fmt yuv420p \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart \
  ig_portrait_1080x1350.mp4
```

## Poster frame extraction

A still for thumbnails, link previews, or app placeholders. Grab a frame at a
chosen time (`-ss`), highest JPEG quality (`-q:v 2`):

```bash
ffmpeg -ss 2 -i master.mp4 -frames:v 1 -q:v 2 poster.jpg
```

PNG (lossless) instead:

```bash
ffmpeg -ss 2 -i master.mp4 -frames:v 1 poster.png
```

Poster sized to a specific deliverable (for example the vertical thumbnail):

```bash
ffmpeg -ss 2 -i master.mp4 -frames:v 1 -vf \
  "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" \
  -q:v 2 poster_vertical.jpg
```

To produce one poster per deliverable, run this once per output with the same
scale/crop chain you used for that video so the framing matches.

## Background-music mix with a tail fade

Mix a music bed under the video's own audio and fade the music out at the end.
Replace `12` with the music fade-out start (clip duration minus fade length) and
`2` with the fade duration.

Mix existing audio with music (both kept, music ducked by lowering its volume):

```bash
ffmpeg -i video.mp4 -i music.m4a -filter_complex \
  "[1:a]volume=0.25,afade=t=out:st=12:d=2[bg];\
   [0:a][bg]amix=inputs=2:duration=first:dropout_transition=2[a]" \
  -map 0:v -map "[a]" \
  -c:v copy -c:a aac -b:a 192k -movflags +faststart \
  out_with_music.mp4
```

- `duration=first` ends the mix when the video ends (so a longer music file does
  not extend the clip).
- `amix` can reduce overall level; raise the music `volume` or add
  `,dynaudnorm` to taste.

If the video has no audio track, just lay music over it with a tail fade:

```bash
ffmpeg -i video.mp4 -i music.m4a -filter_complex \
  "[1:a]afade=t=out:st=12:d=2[a]" \
  -map 0:v -map "[a]" -shortest \
  -c:v copy -c:a aac -b:a 192k -movflags +faststart \
  out_with_music.mp4
```

`-shortest` stops at the end of the shorter input (the video) so trailing music
is trimmed. To compute the fade start automatically, probe the duration first
(`ffprobe -v error -show_entries format=duration -of csv=p=0 video.mp4`) and
subtract the fade length.

## Tips that apply across platforms

- Upload the highest-quality master the platform accepts; every platform
  re-encodes on upload, so a clean CRF 18-20 master survives better than a file
  squeezed to an exact bitrate.
- `-ar 48000` (48 kHz audio) is the safe sample rate for video everywhere.
- If a player rejects an H.264 file, the usual fixes are `-pix_fmt yuv420p` and
  `-movflags +faststart` (both already in these presets).
- Normalise loudness to roughly -14 LUFS for social with the `loudnorm` recipe
  in `references/filters.md` before the final encode.
