# Snáz.cz — Shorts templates

Reusable, on-brand vertical-video templates for **Instagram Reels / TikTok /
YouTube Shorts**, built with [Remotion](https://remotion.dev). Drop in a phone
clip, write a few caption lines, render a 1080×1920 MP4.

```bash
npm install
npm run studio          # open Remotion Studio — live preview + props editor
```

In Studio you'll see five compositions in the sidebar. Pick one, edit its props
on the right, scrub the timeline.

## The templates

| Composition   | What it is | Use it for |
|---------------|------------|------------|
| **HookIntro**   | Branded title card, words rise in, one phrase accented | The first 1–2s that stop the scroll |
| **TalkingHead** | You full-frame + big karaoke subtitles | Plain "talking to camera" reel |
| **SplitScreen** | You on one half, screenshots/photos collecting on the other | Building-in-public / the hackathon clip |
| **CtaOutro**    | Logo + promise + button + URL | Closing call to action |
| **FullShort**   | Hook → SplitScreen → CTA cross-faded with `<TransitionSeries>` | A finished ~20s short, end to end |

All share the Snáz palette (`src/theme.ts`), the brand fonts (DM Serif Display +
Outfit, loaded from Google Fonts via `@remotion/google-fonts` in `src/fonts.tsx`
— the exact same source the homepage uses), the cream glow background, the top
progress bar and the corner logo watermark — so anything you make looks like
Snáz. Headlines are near-black DM Serif Display with tight tracking; body is
light-weight Outfit — matching the homepage.

## Make a short in 4 steps

1. **Drop your footage** in `public/media/…` (e.g.
   `public/media/joining_hackathon/IMG_4880.MOV`). Landscape clips are
   centre-cropped to 9:16 — film with your subject in the middle.
2. **Point a template at it.** In `src/templates/SplitScreen.tsx` (or live in
   Studio) set `talking.src` to your clip and fill `brollItems` with the
   screenshots/photos for the other half.
3. **Write captions** in `src/captions.ts` — short lines with `from`/`to`
   seconds. Or auto-generate: `./scripts/transcribe.sh public/media/your-clip.MOV`
   (Whisper) then convert to `CaptionCue[]`.
4. **Render:**
   ```bash
   npm run render SplitScreen out/my-short.mp4
   # or a specific one:  npm run render-split
   ```

## Subtitles, in short

`src/captions.ts` holds a `CaptionCue[]` — each cue is one on-screen line with a
start/end time. `src/components/Subtitles.tsx` renders the active cue in a solid
cream pill with dark text (the way the homepage reads); every word is fully
visible and the spoken word gets a brand-coloured chip. The opaque pill keeps it
readable on any footage. Captions sit in the lower third, **above** the platform
safe zone (`SAFE.bottom`); in SplitScreen they float just off the seam so they
never cover your face. Keep cues to 3–6 words.

## Split-screen options (`SplitScreenProps`)

- `talkingOn` — `"top"` or `"bottom"` (which half is you)
- `split` — `0..1` height share for the **talking** half (default `0.4`, so the
  screenshots/b-roll get the bigger panel)
- `talking` — your `MediaSource` (audio kept)
- `brollItems` — a `Collage` of screenshots/photos that fly in one by one; cards
  are blur-filled so phone screenshots show in full (no crop, no letterbox), **or**
- `brollClip` — a single `MediaSource` instead of the collage

## TikTok / IG best practices baked in

- **1080×1920, 30fps** native vertical.
- **Safe zones** (`SAFE` in `theme.ts`) keep text clear of the platform UI
  (caption rail, like/share buttons, username).
- **Progress bar** + **hook intro** for retention; **karaoke captions** because
  most people watch muted.
- **Persistent logo** so re-shares stay branded.
- Keep finished shorts **≤ 30–35s** for best reach; loop-friendly CTA at the end.

## Layout / brand tweaks

- Colours & fonts: `src/theme.ts`
- Background look: `src/components/BrandBg.tsx`
- Caption style: `src/components/Subtitles.tsx`
- Logo: official Snáz.cz assets in `public/logo/` (copied from the portal),
  rendered by `src/components/Logo.tsx` — `variant` is `horizontal` /
  `stacked` / `icon`, `tone` is `dark` (green, for light bg) or `light` (white,
  for dark bg). To refresh, recopy from the app's `public/logo/`.
