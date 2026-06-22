#!/usr/bin/env bash
# scaffold the promo-video template into a target repo's promo/ dir and install.
#
# usage:
#   bash scaffold.sh <repo-root> [--dir <name>] [--force] [--no-install]
#
#   <repo-root>      the repo to scaffold into (required)
#   --dir <name>     destination dir name under the repo (default: promo)
#   --force          overwrite an existing destination's source files
#   --no-install     copy only; skip npm install
#
# copies template/ (the remotion film + tuning ui + render.sh + a starter
# clapper.config.json) and runs npm install there. existing clapper.config.json
# and public/ assets are preserved unless --force is given.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE="$SCRIPT_DIR/../template"

REPO=""
DIRNAME="promo"
FORCE=0
INSTALL=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dir) DIRNAME="$2"; shift 2 ;;
    --force) FORCE=1; shift ;;
    --no-install) INSTALL=0; shift ;;
    -*) echo "unknown option: $1" >&2; exit 1 ;;
    *) REPO="$1"; shift ;;
  esac
done

if [[ -z "$REPO" ]]; then
  echo "usage: bash scaffold.sh <repo-root> [--dir promo] [--force] [--no-install]" >&2
  exit 1
fi
if [[ ! -d "$REPO" ]]; then
  echo "repo-root not found: $REPO" >&2
  exit 1
fi
if [[ ! -d "$TEMPLATE" ]]; then
  echo "template not found at $TEMPLATE" >&2
  exit 1
fi

DEST="$REPO/$DIRNAME"
mkdir -p "$DEST"

# preserve a pre-existing config / public assets unless forced.
PRESERVE_CONFIG=0
if [[ -f "$DEST/clapper.config.json" && $FORCE -eq 0 ]]; then
  PRESERVE_CONFIG=1
fi

echo "==> scaffolding template into $DEST"
copy() {
  local rel="$1"
  mkdir -p "$DEST/$(dirname "$rel")"
  cp -R "$TEMPLATE/$rel" "$DEST/$(dirname "$rel")/"
}

# copy the project skeleton (everything except node_modules/out/dist, which the
# template .gitignore already excludes and which should not exist in a clean
# checkout). use a find-based copy so we never drag build artefacts across.
( cd "$TEMPLATE" && find . \
    -path ./node_modules -prune -o \
    -path ./out -prune -o \
    -path ./dist -prune -o \
    -path ./ui/dist -prune -o \
    -type f -print ) | while read -r rel; do
  rel="${rel#./}"
  # keep an existing config when preserving.
  if [[ "$rel" == "clapper.config.json" && $PRESERVE_CONFIG -eq 1 ]]; then
    continue
  fi
  mkdir -p "$DEST/$(dirname "$rel")"
  cp "$TEMPLATE/$rel" "$DEST/$rel"
done

if [[ $PRESERVE_CONFIG -eq 1 ]]; then
  echo "    kept existing clapper.config.json (use --force to overwrite)"
fi

if [[ $INSTALL -eq 1 ]]; then
  echo "==> npm install in $DEST"
  ( cd "$DEST" && npm install )
else
  echo "==> skipped npm install (--no-install)"
fi

cat <<EOF

scaffolded. next:
  1. extract the brand:   node "$SCRIPT_DIR/extract-brand.mjs" "$REPO" --merge "$DEST/clapper.config.json" > /tmp/c.json && mv /tmp/c.json "$DEST/clapper.config.json"
  2. drop screenshots / logo / optional music.m4a into $DEST/public/
  3. tune the script:     cd "$DEST" && npm run ui
  4. render deliverables: cd "$DEST" && npm run render   (needs ffmpeg on PATH)
EOF
