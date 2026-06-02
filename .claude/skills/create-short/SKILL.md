---
name: create-short
description: >-
  Compile a finished vertical short (Reel / TikTok / YouTube Short) from a raw footage folder under
  videos/<name>. Identifies the main talking-head clip, cuts out re-takes (keeps the LAST take),
  transcribes it into karaoke captions, mixes the folder's supporting materials (screenshots/photos/screen
  recordings) into the top panel timed to where they're referenced, renders the on-brand Remotion `Short`
  composition, then runs a generator↔reviewer loop until quality is good — no dead air, consistent plot,
  materials matching the narration. Czech voiceover. Use whenever the user wants to make/build/compile a
  short or reel from a video folder.
---

# create-short (Snáz.cz)

Turn a folder of raw phone footage into one polished vertical short. Input is a folder under
`videos/<name>/`; output is `videos/<name>/short.mp4`, rendered with the branded Remotion template in
`template/`.

The user films a talking-head clip and, in the same folder, drops the screenshots / photos / screen
recordings they *talk about*. They often re-record flubbed sentences — **the last take is the keeper**;
earlier ones are mistakes to cut. Your job is to assemble all of it into a short where the supporting
material appears on top exactly when it's mentioned, captions track the voice, and there are no long quiet
gaps, then to *verify* that with a separate reviewer and iterate.

All paths below are relative to the repo root unless absolute. The template root is `template/`; per-short
scratch lives in `template/work/<name>/` (gitignored); footage that the renderer reads lives in
`template/public/media/<name>/` (gitignored). Take the folder name from the user (e.g. `4hrs_in_hackathon`).

## Prerequisites (check once)

```bash
ffmpeg -version | head -1            # cut + probe
ffprobe -version | head -1
whisper-cli --help | head -1         # brew install whisper-cpp (Czech transcript)
test -f ~/.cache/whisper/ggml-large-v3-turbo.bin || \
  curl -L -o ~/.cache/whisper/ggml-large-v3-turbo.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin
cd template && npm install           # once, for remotion
```

The template ships a data-driven composition called **`Short`** (`template/src/templates/Short.tsx`). You
never edit `.tsx` per video — you write `template/work/<name>/props.json` and render with `--props`.

## The pipeline

Set `NAME=<folder>` and work from `template/`. `scripts/*` are relative to `template/`.

### 1. Inventory & identify the main video
```bash
scripts/probe_folder.sh ../videos/$NAME
```
The longest video clip is almost always the **main talking-head** (it prints `← likely MAIN`). Everything
else — `.png/.jpg/.heic` and the short screen-recording `.mp4`s — is **supporting material** for the top
panel. Confirm the main pick makes sense (it's the one where the founder talks to camera).

### 2. Transcribe the main clip
```bash
scripts/transcribe.sh "../videos/$NAME/<MAIN>"      # -> <MAIN>.srt + .json next to it
```
Read the `.srt`. This is your source of truth for **what is said and when** — you use it for both the cut
list and the captions. Whisper word timings smear across silence and can hallucinate over long gaps
(e.g. "Titulky vytvořil…"); ignore those, trust the spoken content.

### 3. Find re-takes → build the cut plan (human judgment)
Read the transcript and find sentences the founder **repeated** (flubbed, then redid). **Keep the LAST
version; cut the earlier take(s).** Also mark any long dead air at the start/end or mid-clip. Write the
ranges to remove into `template/work/$NAME/cut.json`:
```json
{ "cut": [[12.4, 18.9], [33.0, 37.2]] }
```
(Use `"keep"` instead if that's easier to read off the transcript.) If a cut would remove the only mention
of something important (price, the product name), flag it to the user before cutting.

### 4. Cut the main clip
```bash
mkdir -p public/media/$NAME work/$NAME
python3 scripts/cut_main.py "../videos/$NAME/<MAIN>" "public/media/$NAME/main.mp4" work/$NAME/cut.json
```
This concatenates the kept segments (frame-accurate re-encode) and loudness-normalises the voice. Note the
printed **out duration** — that's `mainDurationSec` for the props.

**Re-transcribe the cut clip** so caption/broll timings match the final timeline:
```bash
scripts/transcribe.sh "public/media/$NAME/main.mp4"   # -> public/media/$NAME/main.srt
```
Use **this** transcript (post-cut) for captions and for placing materials.

### 5. Stage the supporting materials
Copy the materials the user references into `public/media/$NAME/` with short, stable names. Convert HEIC to
jpg (Remotion can't decode HEIC):
```bash
for f in ../videos/$NAME/*.HEIC; do sips -s format jpeg "$f" --out "public/media/$NAME/$(basename "${f%.*}").jpg"; done
cp "../videos/$NAME/<screenshot>.png" public/media/$NAME/
# screen-recording mp4s can be referenced directly as broll clips (they'll be muted)
```

### 6. Map materials to the narration → build props.json
Read `public/media/$NAME/main.srt` and decide, for each material, the **window** (seconds on the cut
timeline) when the founder talks about it — that's its `from`/`to` in the top panel. Materials may overlap;
a later one fades in over the earlier. Write `template/work/$NAME/props.json` matching `ShortProps` in
`src/templates/Short.tsx`:

```json
{
  "main": { "src": "media/4hrs_in_hackathon/main.mp4", "muted": false },
  "mainDurationSec": 96.4,
  "split": 0.45,
  "talkingOn": "bottom",
  "kicker": "JAK TO STAVÍM",
  "broll": [
    { "src": "media/4hrs_in_hackathon/idea.png",      "from": 0.0,  "to": 8.5,  "label": "první nápad" },
    { "src": "media/4hrs_in_hackathon/build.mp4",     "from": 8.5,  "to": 22.0, "kind": "video", "startFromSec": 3 },
    { "src": "media/4hrs_in_hackathon/done.jpg",      "from": 22.0, "to": 31.0, "label": "hotovo 🎉" }
  ],
  "captions": [
    { "from": 0.0, "to": 2.6, "text": "Jedu na svůj první hackathon", "tone": "accent" },
    { "from": 2.6, "to": 5.2, "text": "a stavím tam celou aplikaci" }
  ],
  "hook": { "kicker": "HACKATHON", "title": "Stavím appku za *24 hodin*", "subtitle": "Můj první hackathon" },
  "cta":  { "headline": "Web, který skvěle vypadá. *Snáz.*", "subline": "Vlastní web za *799 Kč/rok* včetně domény", "cta": "Vytvořit web", "url": "www.snaz.cz" }
}
```
Rules for good props:
- `broll` paths are **relative to `public/`** (`media/$NAME/…`), not absolute.
- Captions: 3–6 words per cue, timed to the voice; fix Czech proper nouns ("Snáz", "Cloudflare").
- Cover the whole main timeline with broll windows where you can — gaps fall back to a branded backdrop,
  which is fine briefly but shouldn't dominate the top panel.
- Keep the finished short **≤ ~35s** for reach. If the cut clip is much longer, tell the user it's long and
  suggest trimming content (don't silently truncate).
- Drop `hook`/`cta` (set to `null`) only if the user asks for a bare short.

### 7. Render
```bash
scripts/render_short.sh $NAME
```
Renders `Short` from `work/$NAME/props.json` and copies the result to `../videos/$NAME/short.mp4`. (To
preview interactively instead: `npm run studio`, pick **Short**, load the props.)

## The generator ↔ reviewer loop

After each render, **launch a separate review agent** (the `Agent` tool, a fresh general-purpose agent) so
the critique is independent of the choices you just made. Do not grade your own render.

**Prepare inspectable evidence for the reviewer:**
```bash
scripts/review_extract.sh "../videos/$NAME/short.mp4" "work/$NAME/review" 1.5
```
This prints a JSON summary `{duration, frame_count, step, frames_dir, silences:[…]}` and writes one sampled
frame every 1.5s to `work/$NAME/review/frame_####.jpg`.

**Give the reviewer:** the JSON summary, the path to the frames dir (tell it to `Read` a spread of frames —
it can see images), `work/$NAME/props.json`, and `public/media/$NAME/main.srt`. Instruct it to return a
**structured verdict** and to be specific and adversarial:

```
You are reviewing a finished vertical short. Be a harsh critic; assume it's flawed.
Return JSON: { "pass": bool, "score": 1-10, "issues": [ { "severity": "blocker|major|minor",
  "t": <seconds>, "what": "...", "fix": "concrete change to cut.json / props.json" } ] }
Check, grounded in the frames + silences + transcript + props:
  1. Dead air: any silence > 1.0s in the body that isn't a deliberate beat (use the silences[] list).
  2. Plot/consistency: does the narration tell one coherent story start→finish? Any dangling references?
  3. Material sync: does each top-panel material match what's being said at that timestamp (cross-check
     broll windows against the transcript)? Any material shown with nothing said about it, or a claim with
     no supporting visual?
  4. Captions: on-screen text matches the voice, 3–6 words, no smeared/hallucinated lines, good timing.
  5. Cuts: re-takes actually removed (no repeated sentences), no mid-word chops, no abrupt jumps.
  6. Framing/brand: face not covered by captions, materials readable, hook+CTA present and on-brand.
  7. Length: ≤ ~35s; flag if it drags.
Only set pass=true if there are zero blocker/major issues.
```

**Iterate:** read the verdict. Apply the fixes at their source — re-time/extend a `broll` window, fix a
caption, add a range to `cut.json` and re-run step 4, adjust `split`/`talkingOn`, etc. — then re-render
(step 7) and review again. Repeat until `pass: true` **or** ~4 iterations with no improving score; if it
plateaus, stop and report the remaining issues to the user rather than looping forever. Keep `work/$NAME/`
between iterations so re-renders are cheap.

When it passes, tell the user the final path, duration, and a one-line summary of what you cut/mapped.
**Confirm before treating the short as published** — it's the user's video; don't post or upload it.

## Brand & content notes (Snáz.cz, Czech audience = cafés/tradespeople, not devs)
- Fonts/colours/safe-zones are baked into the template (DM Serif Display + Outfit; green `#1a5f4a`,
  accent amber `#e8a54b`, cream `#faf8f5`). The CTA uses verbatim homepage copy.
- No anglicisms, no tech jargon (SSL/DNS/CMS/API). Don't claim "bez reklamy" — Snáz shows a footer ad on
  every plan. Price is **799 Kč/rok včetně domény**. Use **www.snaz.cz** (with www).
- Honest setup time: ~10 min for a first working version + ~2 h for dotažení — never "5 minut".
- `*word*` in hook/CTA/title text marks the accented word (the template renders it in brand colour).

## Conventions / lessons
- Trust `silencedetect` for *where* silence is; trust whisper for *what* is said (not its gap timings).
- One material can span several caption cues — windows don't have to align to cues, only to the topic.
- HEIC must be converted to jpg; landscape screenshots are shown whole (blur-fill, no crop) in the panel.
- If `npm install` / fonts fail, captions/headlines fall back to Georgia — fonts load via
  `@remotion/google-fonts` (see `src/fonts.tsx`); a fresh `npm install` fixes it.
