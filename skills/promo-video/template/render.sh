#!/usr/bin/env bash
# render every composition in clapper.config.json to a high-quality master, then
# encode social deliverables with ffmpeg (correct pixel format, faststart,
# bitrate caps) plus a poster frame for each. if public/music.m4a (or .mp3)
# exists it is mixed under every deliverable with a fade-out at the tail.
#
# the format list is read straight from the config, so deliverables always match
# whatever formats you have configured - no list to keep in sync here.
set -euo pipefail
cd "$(dirname "$0")"

MASTER=out/master
DELIV=out/deliverables
mkdir -p "$MASTER" "$DELIV"

# read formats from the config as "id<TAB>width<TAB>height" lines, with a
# bitrate cap chosen by aspect (wide gets the most, square/portrait less).
mapfile -t FORMATS < <(node -e '
  const c = JSON.parse(require("fs").readFileSync("clapper.config.json", "utf8"));
  for (const f of c.formats) {
    const wide = f.width > f.height;
    const sq = Math.abs(f.width - f.height) < f.width * 0.1;
    const cap = wide ? "12M" : sq ? "8M" : "10M";
    process.stdout.write([f.id, f.width, f.height, cap].join("\t") + "\n");
  }
')

if [[ ${#FORMATS[@]} -eq 0 ]]; then
  echo "no formats found in clapper.config.json" >&2
  exit 1
fi

# locate optional background music.
MUSIC=""
for cand in public/music.m4a public/music.mp3; do
  if [[ -f "$cand" ]]; then MUSIC="$cand"; break; fi
done

dur() { ffprobe -v error -show_entries format=duration -of csv=p=0 "$1"; }

encode() {
  local src="$1" dst="$2" maxrate="$3"
  if [[ -n "$MUSIC" ]]; then
    local d fade
    d=$(dur "$src")
    fade=$(awk -v d="$d" 'BEGIN { f = d - 1.5; if (f < 0) f = 0; print f }')
    ffmpeg -y -i "$src" -i "$MUSIC" \
      -filter_complex "[1:a]afade=t=out:st=${fade}:d=1.5[a]" -map 0:v -map "[a]" \
      -c:v libx264 -preset slow -crf 19 -maxrate "$maxrate" -bufsize 20M \
      -pix_fmt yuv420p -profile:v high -movflags +faststart \
      -c:a aac -b:a 192k -shortest "$dst" -loglevel error
  else
    ffmpeg -y -i "$src" \
      -c:v libx264 -preset slow -crf 19 -maxrate "$maxrate" -bufsize 20M \
      -pix_fmt yuv420p -profile:v high -movflags +faststart \
      -an "$dst" -loglevel error
  fi
}

for row in "${FORMATS[@]}"; do
  IFS=$'\t' read -r id w h cap <<< "$row"
  name="${id}_${w}x${h}"
  echo "==> rendering $id (${w}x${h})"
  npx remotion render src/index.ts "$id" "$MASTER/$name.mp4" --codec h264 --crf 16
  echo "==> encoding $name (cap $cap)"
  encode "$MASTER/$name.mp4" "$DELIV/$name.mp4" "$cap"
done

echo "==> poster frames"
for f in "$DELIV"/*.mp4; do
  d=$(dur "$f")
  ss=$(awk -v d="$d" 'BEGIN { s = d * 0.2; if (s > 8.5) s = 8.5; print s }')
  ffmpeg -y -ss "$ss" -i "$f" -frames:v 1 -q:v 2 "${f%.mp4}_poster.jpg" -loglevel error
done

echo "==> done"
ls -la "$DELIV"
