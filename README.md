# Snáz.cz — Shorts generator

Turn a folder of raw phone footage into a polished **1080×1920 vertical short**
(Instagram Reels / TikTok / YouTube Shorts), on-brand and end to end. It's a
[Remotion](https://remotion.dev) project plus a small pipeline of scripts and a
[Claude Code](https://claude.com/claude-code) skill that drives the whole thing:
identify the main talking-head clip, cut out re-takes, transcribe to karaoke
captions, time supporting screenshots/photos to the narration, render, then run
a generator↔reviewer loop until it's clean.

## Layout

```
template/                 the Remotion project (compositions, scripts, brand assets)
  src/                    components + the data-driven `Short` composition
  scripts/                probe / transcribe / cut / render / review helpers
  public/                 fonts, logo, and media/ (footage — gitignored)
videos/                   raw source footage folders, one per short (gitignored)
.claude/skills/create-short/  the Claude Code skill that orchestrates the pipeline
```

## Quick start

```bash
cd template
npm install
npm run studio          # Remotion Studio — live preview + props editor
```

In Studio you'll see the compositions in the sidebar; pick one, edit its props
on the right, scrub the timeline. To render a finished short from a footage
folder, see the step-by-step pipeline in
[`.claude/skills/create-short/SKILL.md`](.claude/skills/create-short/SKILL.md)
(run it with Claude Code, or follow it by hand).

For the template internals — compositions, captions, split-screen options, brand
tweaks — see [`template/README.md`](template/README.md).

## Make a short, in short

1. Drop a footage folder in `videos/<name>/` — the talking-head clip plus the
   screenshots/photos you talk about.
2. Run the **create-short** skill (or follow `SKILL.md`): it probes the folder,
   transcribes, cuts re-takes, builds `props.json`, and renders.
3. Out comes `videos/<name>/short.mp4`.

## Requirements

- Node 18+ (for Remotion)
- `ffmpeg` / `ffprobe`
- `whisper-cpp` (`brew install whisper-cpp`) for Czech transcription
- Python 3 (for the cut script)

## Brand assets & fonts

The `public/logo/` files are **Snáz.cz** brand marks — reuse the structure, but
swap in your own logo if you fork this. Fonts (DM Serif Display + Outfit) load at
render time via `@remotion/google-fonts`; both are licensed under the SIL Open
Font License. Code is MIT (see `LICENSE`).
