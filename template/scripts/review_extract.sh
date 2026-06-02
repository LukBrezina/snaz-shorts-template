#!/usr/bin/env bash
# Turn a rendered short into something a review agent can actually inspect:
# sampled frames it can Read, plus a machine-readable report of quiet gaps and
# duration. The reviewer pairs this with props.json + the transcript to judge
# plot consistency, dead air, and whether the materials match the narration.
#
#   scripts/review_extract.sh ../videos/4hrs_in_hackathon/short.mp4 work/4hrs_in_hackathon/review
#
# Writes <outdir>/frame_####.jpg (one every STEP seconds) and prints a JSON
# summary {duration, frame_count, step, frames_dir, silences:[{start,end,dur}]}.
set -euo pipefail

VIDEO="${1:?usage: review_extract.sh <short.mp4> <outdir> [step-seconds] [silence-db]}"
OUTDIR="${2:?usage: review_extract.sh <short.mp4> <outdir> [step-seconds] [silence-db]}"
STEP="${3:-1.5}"          # one frame every STEP seconds
DB="${4:--32dB}"          # below this for >=0.6s counts as a quiet gap
MINSIL="0.6"

mkdir -p "$OUTDIR"
rm -f "$OUTDIR"/frame_*.jpg

DUR="$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$VIDEO")"

# Sampled frames for visual review.
ffmpeg -y -i "$VIDEO" -vf "fps=1/$STEP,scale=540:-1" -q:v 3 \
  "$OUTDIR/frame_%04d.jpg" >/dev/null 2>&1
FRAMES="$(ls "$OUTDIR"/frame_*.jpg 2>/dev/null | wc -l | tr -d ' ')"

# Silence map — find dead air / long quiet pauses in the finished short.
SIL="$(ffmpeg -i "$VIDEO" -af "silencedetect=noise=$DB:d=$MINSIL" -f null - 2>&1 || true)"
SIL_JSON="$(printf '%s\n' "$SIL" | awk '
  /silence_start/ { s=$NF }
  /silence_end/   { for(i=1;i<=NF;i++) if($i=="silence_end:") e=$(i+1);
                    if(s!=""){ printf "%s{\"start\":%.2f,\"end\":%.2f,\"dur\":%.2f}", sep, s, e, e-s; sep=","; s="" } }
')"

printf '{"duration":%.2f,"frame_count":%s,"step":%s,"frames_dir":"%s","silences":[%s]}\n' \
  "$DUR" "$FRAMES" "$STEP" "$OUTDIR" "$SIL_JSON"
