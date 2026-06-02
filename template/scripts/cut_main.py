#!/usr/bin/env python3
"""Cut re-takes / dead air out of the main talking-head clip.

The founder re-records flubbed sentences, so the raw clip has the same line two
or three times — the LAST take is the keeper, the earlier ones are mistakes.
This removes a list of [start, end] ranges and concatenates what's left into one
clean clip (re-encoded so cuts are frame-accurate), with loudness normalised so
the voice is even and loud enough for phone speakers.

Usage:
    cut_main.py <input> <output> <plan.json>

plan.json is one of:
    {"cut":  [[12.4, 18.9], [33.0, 37.2]]}          # ranges to REMOVE
    {"keep": [[0, 12.4], [18.9, 33.0], [37.2, 999]]}# ranges to KEEP
A "cut" plan is converted to keep-ranges using the source duration. Provide the
plan that's easier to read from the transcript — usually "cut".
"""
import json
import subprocess
import sys


def duration(path: str) -> float:
    out = subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=nw=1:nk=1", path,
    ])
    return float(out.strip())


def keep_ranges(plan: dict, total: float):
    if "keep" in plan:
        ranges = [(max(0.0, a), min(total, b)) for a, b in plan["keep"]]
    elif "cut" in plan:
        cuts = sorted((max(0.0, a), min(total, b)) for a, b in plan["cut"])
        ranges, t = [], 0.0
        for a, b in cuts:
            if a > t:
                ranges.append((t, a))
            t = max(t, b)
        if t < total:
            ranges.append((t, total))
    else:
        raise SystemExit("plan.json needs a 'cut' or 'keep' key")
    return [(a, b) for a, b in ranges if b - a > 0.05]


def main():
    if len(sys.argv) != 4:
        raise SystemExit(__doc__)
    src, out, plan_path = sys.argv[1:]
    total = duration(src)
    with open(plan_path) as fh:
        plan = json.load(fh)
    ranges = keep_ranges(plan, total)
    if not ranges:
        raise SystemExit("nothing left to keep — check the plan")

    print(f"keeping {len(ranges)} segment(s):")
    for a, b in ranges:
        print(f"  {a:8.2f} → {b:8.2f}  ({b - a:5.2f}s)")
    print(f"  total out ≈ {sum(b - a for a, b in ranges):.2f}s of {total:.2f}s")

    # Build a trim/concat filtergraph: each kept range becomes a [vN][aN] pair,
    # then concat. Re-encode so arbitrary cut points are frame-accurate.
    parts, labels = [], ""
    for i, (a, b) in enumerate(ranges):
        parts.append(
            f"[0:v]trim=start={a}:end={b},setpts=PTS-STARTPTS[v{i}];"
            f"[0:a]atrim=start={a}:end={b},asetpts=PTS-STARTPTS[a{i}]"
        )
        labels += f"[v{i}][a{i}]"
    n = len(ranges)
    fg = ";".join(parts) + f";{labels}concat=n={n}:v=1:a=1[vc][ac];"
    # Normalise loudness on the concatenated audio (force 48k afterwards so the
    # loudnorm resampler doesn't leak a doubled-duration stream).
    fg += "[ac]loudnorm=I=-16:TP=-1.5:LRA=11[a]"

    cmd = [
        "ffmpeg", "-y", "-i", src,
        "-filter_complex", fg,
        "-map", "[vc]", "-map", "[a]",
        "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p",
        "-r", "30", "-video_track_timescale", "30000",
        "-c:a", "aac", "-ar", "48000", "-b:a", "192k",
        out,
    ]
    print("→ rendering cut main clip…")
    subprocess.run(cmd, check=True)
    print(f"✓ {out} ({duration(out):.2f}s)")


if __name__ == "__main__":
    main()
