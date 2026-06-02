#!/usr/bin/env bash
# Auto-generate subtitle timings from a clip's voiceover using Whisper.
#
#   ./scripts/transcribe.sh public/media/joining_hackathon/IMG_4880.MOV
#
# Produces a .srt + .json next to the clip. Then convert the lines into
# CaptionCue[] in src/captions.ts (from/to in seconds, ~3–6 words per cue).
#
# Needs whisper-cli (brew install whisper-cpp) or openai-whisper (pip install).
# Czech model recommended: --language cs.
set -euo pipefail

CLIP="${1:?usage: transcribe.sh <path-to-clip>}"
OUT_DIR="$(dirname "$CLIP")"
BASE="$(basename "${CLIP%.*}")"

# Extract mono 16kHz wav (what Whisper wants).
WAV="$OUT_DIR/$BASE.wav"
echo "→ extracting audio to $WAV"
ffmpeg -y -i "$CLIP" -ar 16000 -ac 1 -c:a pcm_s16le "$WAV" >/dev/null 2>&1

if command -v whisper >/dev/null 2>&1; then
  echo "→ transcribing with openai-whisper (cs)…"
  whisper "$WAV" --language cs --model small --output_format srt --output_format json \
    --word_timestamps True --output_dir "$OUT_DIR"
elif command -v whisper-cli >/dev/null 2>&1; then
  echo "→ transcribing with whisper.cpp (cs)…"
  whisper-cli -f "$WAV" -l cs -osrt -oj -of "$OUT_DIR/$BASE"
else
  echo "No whisper found. Install one:"
  echo "   pip install -U openai-whisper      # python"
  echo "   brew install whisper-cpp           # native"
  exit 1
fi

echo "✓ subtitles at $OUT_DIR/$BASE.srt"
echo "  Now paste/convert the lines into src/captions.ts as CaptionCue[]."
