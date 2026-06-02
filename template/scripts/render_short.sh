#!/usr/bin/env bash
# Render the data-driven `Short` composition from a props.json and drop the
# result next to the source folder as short.mp4.
#
#   scripts/render_short.sh <folder-name>
#
# Expects, relative to the template root:
#   work/<folder-name>/props.json          the short's config (built by the skill)
#   public/media/<folder-name>/…           the cut main clip + materials, already copied
# Writes:
#   out/<folder-name>.mp4                   render output
#   ../videos/<folder-name>/short.mp4       the deliverable (copied back to the source folder)
set -euo pipefail

cd "$(dirname "$0")/.."   # -> template root

NAME="${1:?usage: render_short.sh <folder-name>}"
PROPS="work/$NAME/props.json"
[ -f "$PROPS" ] || { echo "missing $PROPS — build the props first" >&2; exit 1; }

OUT="out/$NAME.mp4"
mkdir -p out "work/$NAME"

echo "→ rendering Short with $PROPS"
npx remotion render Short "$OUT" --props="$PROPS"

DEST="../videos/$NAME/short.mp4"
cp "$OUT" "$DEST"
echo "✓ $OUT"
echo "✓ $DEST"
