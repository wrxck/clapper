# Filters reference

The filtergraph (`-vf` for video, `-af` for audio, `-filter_complex` for
multi-input or multi-output graphs) is where most of the real work happens.

Mental model: filters are chained with commas inside one chain; chains are
separated with semicolons; `[labels]` route streams between chains. `-vf` is
shorthand for a single-input single-output `-filter_complex`.

Any filter chain forces a re-encode (you cannot `-c copy` through a filter).

## scale, crop, pad, setsar

Scale to a height, auto width, keeping even dimensions (required by yuv420p):

```bash
-vf "scale=-2:1080"
```

`-2` means "auto, divisible by 2". Use `-1` only when you do not need even
dimensions. Scale to fit within a box without distortion:

```bash
-vf "scale=1920:1080:force_original_aspect_ratio=decrease"
```

Crop a region `w:h:x:y` (top-left origin). When x/y are omitted, ffmpeg centres
the crop automatically:

```bash
-vf "crop=1080:1080"
```

To place the crop explicitly, give x and y as `crop=w:h:x:y`, for example
`x = (in_w-1080)/2` and `y = (in_h-1080)/2` for a manual centre.

Pad to a canvas, centring the source (letterbox/pillarbox):

```bash
-vf "scale=1920:1080:force_original_aspect_ratio=decrease,\
pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black"
```

The fit-to-box-then-pad combo above is the safe way to put any input into a
fixed frame without stretching. Reset pixel aspect ratio if a source has a
non-square one: append `,setsar=1`.

## fps and frame rate

Change frame rate (drops/dupes frames as needed):

```bash
-vf "fps=30"
```

For smooth slow-motion or retiming, prefer `minterpolate` (motion interpolation,
slow) or simply set `-r` on output. To change container/playback rate without
re-timing audio, set `-r`.

## overlay (watermark, picture-in-picture)

Overlay a logo in the bottom-right with a 20px margin:

```bash
ffmpeg -i video.mp4 -i logo.png -filter_complex \
  "[0:v][1:v]overlay=W-w-20:H-h-20" \
  -c:a copy out.mp4
```

`W,H` are the main video size; `w,h` are the overlay size. Common positions:

- top-left: `overlay=20:20`
- top-right: `overlay=W-w-20:20`
- bottom-left: `overlay=20:H-h-20`
- centre: `overlay=(W-w)/2:(H-h)/2`

Scale the logo first and control opacity:

```bash
ffmpeg -i video.mp4 -i logo.png -filter_complex \
  "[1:v]scale=180:-1,format=rgba,colorchannelmixer=aa=0.6[wm];\
   [0:v][wm]overlay=W-w-24:H-h-24" \
  -c:a copy out.mp4
```

## Watermark text (drawtext)

Burn a text watermark. Pass dynamic text via a file (`textfile=`) rather than
interpolating it into the command (see security.md):

```bash
ffmpeg -i in.mp4 -vf \
  "drawtext=fontfile=/path/font.ttf:textfile=caption.txt:\
   x=w-tw-24:y=h-th-24:fontsize=36:fontcolor=white@0.8:\
   box=1:boxcolor=black@0.4:boxborderw=10" \
  -c:a copy out.mp4
```

`tw,th` are text width/height; `w,h` are frame size. Using `textfile=` keeps
arbitrary text out of the shell and away from drawtext's own `%{...}` expansion.

## fade and afade

Video fade-in over 1s at the start, fade-out over 1s ending at 10s:

```bash
-vf "fade=t=in:st=0:d=1,fade=t=out:st=9:d=1"
```

Audio fades (avoid clicks at cut points):

```bash
-af "afade=t=in:st=0:d=1,afade=t=out:st=9:d=1"
```

`st` is the start time of the fade; for a fade-out it is `total_duration -
fade_duration`.

## Trimming

Fast, no re-encode, keyframe-aligned (best for cuts where exact frame is not
critical). Put `-ss`/`-to` before `-i` for a fast seek:

```bash
ffmpeg -ss 00:00:05 -to 00:00:20 -i in.mp4 -c copy clip.mp4
```

Frame-accurate trim (re-encodes, exact in/out points):

```bash
ffmpeg -ss 00:00:05 -to 00:00:20 -i in.mp4 \
  -c:v libx264 -crf 20 -preset medium -pix_fmt yuv420p \
  -c:a aac -b:a 160k clip.mp4
```

`-t 15` (duration) can be used instead of `-to` (end timestamp).

## concat: joining clips

Two methods; choose by whether the inputs already share codec/params.

### Demuxer (fast, no re-encode) - same codec, resolution, fps

Create a list file (one entry per line) then concat with `-c copy`:

```bash
printf "file '%s'\n" clip1.mp4 clip2.mp4 clip3.mp4 > list.txt
ffmpeg -f concat -safe 0 -i list.txt -c copy joined.mp4
```

`-safe 0` allows arbitrary paths; only use it with paths you control. This fails
or glitches if the inputs differ in codec/resolution/timebase - use the filter
method then.

### concat filter (re-encodes) - mixed inputs

Normalises and joins inputs of differing properties. Scale each to a common size
first for clean results:

```bash
ffmpeg -i a.mp4 -i b.mp4 -filter_complex \
  "[0:v]scale=1920:1080:force_original_aspect_ratio=decrease,\
pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v0];\
   [1:v]scale=1920:1080:force_original_aspect_ratio=decrease,\
pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v1];\
   [v0][0:a][v1][1:a]concat=n=2:v=1:a=1[v][a]" \
  -map "[v]" -map "[a]" -c:v libx264 -crf 20 -preset medium \
  -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart joined.mp4
```

`n` is the number of segments; `v=1:a=1` declares one video and one audio stream
per segment.

## loudnorm (broadcast/social loudness)

EBU R128 loudness normalisation. One-pass is fine for most social work;
two-pass is more accurate.

One-pass to -14 LUFS (a common streaming/social target):

```bash
ffmpeg -i in.mp4 -af "loudnorm=I=-14:TP=-1.5:LRA=11" \
  -c:v copy -c:a aac -b:a 192k out.mp4
```

Two-pass: first measure, then apply the measured values. Run pass 1 and read the
JSON it prints:

```bash
ffmpeg -i in.mp4 -af "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json" \
  -f null -
```

Then feed the measured fields back:

```bash
ffmpeg -i in.mp4 -af \
  "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=<i>:measured_TP=<tp>:\
measured_LRA=<lra>:measured_thresh=<th>:offset=<off>:linear=true" \
  -c:v copy -c:a aac -b:a 192k out.mp4
```

Common integrated-loudness targets: -14 LUFS (YouTube/Spotify-style), -16 LUFS
(podcasts/Apple), -23 LUFS (EBU broadcast).

## Subtitles

### Burn-in (hardcode) from an SRT/ASS file

```bash
ffmpeg -i in.mp4 -vf "subtitles=subs.srt" \
  -c:v libx264 -crf 20 -preset medium -pix_fmt yuv420p \
  -c:a copy out.mp4
```

Style SRT burn-in with ASS overrides:

```bash
-vf "subtitles=subs.srt:force_style='FontName=Inter,FontSize=24,\
PrimaryColour=&H00FFFFFF,OutlineColour=&H80000000,BorderStyle=3'"
```

Filenames with special characters need escaping inside the filter string; the
robust approach is to `cd` to the directory and pass a plain basename, or escape
`:` and `'`. Keep untrusted filenames out of the filter string entirely.

### Soft (selectable) subtitles - mux without burning

```bash
ffmpeg -i in.mp4 -i subs.srt -c copy -c:s mov_text out.mp4   # mp4
ffmpeg -i in.mkv -i subs.srt -c copy out.mkv                  # mkv (srt ok)
```

## Useful one-liners

```bash
# Strip audio
-an
# Strip video (audio only)
-vn
# Rotate metadata-free 90 deg clockwise
-vf "transpose=1"
# Speed up video 2x (and audio)
-filter_complex "[0:v]setpts=0.5*PTS[v];[0:a]atempo=2.0[a]" -map "[v]" -map "[a]"
# Generate silent audio track to satisfy a player that needs one
-f lavfi -i anullsrc=channel_layout=stereo:sample_rate=48000 -shortest
```
