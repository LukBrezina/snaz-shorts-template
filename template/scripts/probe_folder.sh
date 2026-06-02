#!/usr/bin/env bash
# Inventory a video folder: list every media file with type, duration and size,
# so you can pick the MAIN talking-head clip (usually the longest .MOV/.mp4) and
# see which screenshots/photos are supporting material.
#
#   scripts/probe_folder.sh ../videos/4hrs_in_hackathon
#
# Prints a table to stdout. The longest video is flagged "← likely MAIN".
set -euo pipefail

DIR="${1:?usage: probe_folder.sh <video-folder>}"
[ -d "$DIR" ] || { echo "no such folder: $DIR" >&2; exit 1; }

longest=""; longest_dur=0
printf '%-44s %-7s %9s %10s  %s\n' FILE KIND DURATION SIZE DIMENSIONS

shopt -s nullglob nocaseglob
for f in "$DIR"/*; do
  [ -f "$f" ] || continue
  base="$(basename "$f")"
  case "$base" in .DS_Store|*.wav|*.srt|*.json) continue;; esac

  ext="$(printf '%s' "${base##*.}" | tr '[:upper:]' '[:lower:]')"
  dur="$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$f" 2>/dev/null || true)"
  dims="$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "$f" 2>/dev/null | head -1 || true)"
  size="$(du -h "$f" | cut -f1)"

  case "$ext" in
    mov|mp4|m4v|webm) kind=video;;
    png|jpg|jpeg|heic|webp|gif) kind=image;;
    *) kind="$ext";;
  esac

  if [ "$kind" = video ] && [ -n "$dur" ]; then
    printf '%-44s %-7s %8.1fs %10s  %s\n' "$base" "$kind" "$dur" "$size" "${dims:-?}"
    if awk "BEGIN{exit !($dur > $longest_dur)}"; then longest_dur="$dur"; longest="$base"; fi
  else
    printf '%-44s %-7s %9s %10s  %s\n' "$base" "$kind" "-" "$size" "${dims:-?}"
  fi
done

[ -n "$longest" ] && echo && echo "← likely MAIN: $longest (${longest_dur}s)"
