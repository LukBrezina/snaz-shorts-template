// ---------------------------------------------------------------------------
// Subtitles / captions data model
// ---------------------------------------------------------------------------
// A short is just a list of timed "cues". Each cue is one on-screen line that
// appears between `from` and `to` (seconds). Within a cue, words are highlighted
// one at a time, karaoke-style — the look that drives retention on Reels/TikTok.
//
// Two ways to fill this in:
//
//   1. By hand — watch your clip, type the lines, eyeball the timings. Fine for
//      a 30–60s short; ~10 cues.
//
//   2. Auto — run `scripts/transcribe.sh public/media/your-clip.mov` (Whisper)
//      to get word-level timestamps, then paste/convert into cues. See the
//      script for the exact command. Auto-captions are 90% there; always skim
//      for Czech proper nouns ("Snáz", "Cloudflare") and fix punctuation.
//
// Tip: keep each cue to 3–6 words. Big, short lines read on a phone; long
// sentences do not.

export interface CaptionCue {
  /** seconds from the start of the composition */
  from: number;
  /** seconds from the start of the composition */
  to: number;
  text: string;
  /** optional emphasis colour key for the whole cue (defaults to accent) */
  tone?: "accent" | "primary" | "danger";
}

/** Find the cue active at a given time (seconds). */
export const cueAt = (cues: CaptionCue[], seconds: number): CaptionCue | null =>
  cues.find((c) => seconds >= c.from && seconds < c.to) ?? null;

// ---------------------------------------------------------------------------
// Sample script — placeholder copy for the hackathon clip. Replace the text and
// retime to your real voiceover. Timings are deliberately spaced ~2.5s/cue.
// ---------------------------------------------------------------------------
export const SAMPLE_CAPTIONS: CaptionCue[] = [
  { from: 0.0, to: 2.6, text: "Jedu na svůj první hackathon", tone: "accent" },
  { from: 2.6, to: 5.2, text: "a stavím tam celou aplikaci" },
  { from: 5.2, to: 8.0, text: "od nuly za 24 hodin" },
  { from: 8.0, to: 11.0, text: "Tady je co se mi povedlo" },
  { from: 11.0, to: 14.0, text: "Sleduj jak to roste", tone: "primary" },
];
