import React from "react";
import { AbsoluteFill, CalculateMetadataFunction } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { HookIntro, HookIntroProps } from "./HookIntro";
import { CtaOutro, CtaOutroProps } from "./CtaOutro";
import { MediaClip, MediaSource } from "../components/MediaClip";
import { TimedBroll, TimedMedia } from "../components/TimedBroll";
import { Subtitles } from "../components/Subtitles";
import { Watermark } from "../components/Watermark";
import { Kicker } from "../components/Kicker";
import { ProgressBar } from "../components/ProgressBar";
import { FontLoader } from "../fonts";
import { CaptionCue, SAMPLE_CAPTIONS } from "../captions";
import { theme, SAFE, HEIGHT, FPS } from "../theme";

// THE COMMAND COMPOSITION — a complete short, fully data-driven from props.
//
// `create-short` writes one props.json per video folder and renders this with
//   remotion render Short out/<folder>.mp4 --props=<work>/props.json
// so no .tsx is edited per video. Layout:
//   • bottom panel: the (already re-take-cut) talking-head clip, audio kept
//   • top panel:    supporting materials timed to the narration (TimedBroll)
//   • karaoke captions from the cut clip's transcript
//   • optional branded HookIntro before + CtaOutro after, cross-faded
// Everything in `broll`/`captions` is timed on the MAIN clip's timeline.

export type ShortProps = {
  /** the already-cut talking-head clip (re-takes removed); audio kept */
  main: MediaSource;
  /** duration of the cut main clip in seconds — drives the body length */
  mainDurationSec: number;
  /** height fraction given to the talking head (rest is the materials panel) */
  split?: number;
  /** which half is the talking head */
  talkingOn?: "top" | "bottom";
  /** talking head fills the whole frame — no materials panel, no seam */
  fullscreen?: boolean;
  kicker?: string;
  /** supporting materials, each timed to when it's referenced in the main clip */
  broll: TimedMedia[];
  /** karaoke captions, timed on the main clip's timeline */
  captions: CaptionCue[];
  /** branded opener; null to skip */
  hook?: HookIntroProps | null;
  hookSec?: number;
  /** branded closer; null to skip */
  cta?: CtaOutroProps | null;
  ctaSec?: number;
};

const XFADE = Math.round(0.5 * FPS);
const xfade = (
  <TransitionSeries.Transition
    timing={linearTiming({ durationInFrames: XFADE })}
    presentation={fade()}
  />
);

const seg = (sec: number) => Math.max(1, Math.round(sec * FPS));

// Duration is computed from props so each short is exactly as long as its clip.
// hook + body + cta, minus one XFADE per transition actually present.
export const calcShortMetadata: CalculateMetadataFunction<ShortProps> = ({
  props,
}) => {
  const hook = props.hook ? seg(props.hookSec ?? 2) : 0;
  const cta = props.cta ? seg(props.ctaSec ?? 3) : 0;
  const body = seg(props.mainDurationSec);
  const transitions = (props.hook ? 1 : 0) + (props.cta ? 1 : 0);
  return { durationInFrames: hook + body + cta - transitions * XFADE };
};

// The split body — talking head on one half, timed materials on the other.
// Caption/broll times are relative to this body's start (= main clip t=0).
const Body: React.FC<Omit<ShortProps, "hook" | "cta" | "hookSec" | "ctaSec">> = ({
  main,
  split = 0.45,
  talkingOn = "bottom",
  fullscreen = false,
  kicker,
  broll,
  captions,
}) => {
  // Fullscreen: the talking head fills the frame, no materials panel / seam.
  // Captions sit in the lower safe zone; logo + kicker stay in their corners.
  if (fullscreen) {
    return (
      <AbsoluteFill style={{ background: theme.colors.dark }}>
        <FontLoader />
        <AbsoluteFill style={{ overflow: "hidden" }}>
          <MediaClip {...main} muted={false} />
        </AbsoluteFill>

        <Watermark tone="dark" />
        {kicker ? (
          <div style={{ position: "absolute", top: 44, right: SAFE.side }}>
            <Kicker label={kicker} />
          </div>
        ) : null}

        <Subtitles cues={captions} bottom={SAFE.bottom} />
      </AbsoluteFill>
    );
  }

  const topH = `${(talkingOn === "top" ? split : 1 - split) * 100}%`;
  const bottomH = `${(talkingOn === "top" ? 1 - split : split) * 100}%`;

  // Lift captions off the talking head: just above the seam when you're on the
  // bottom, otherwise in the lower safe zone.
  const captionBottom =
    talkingOn === "bottom" ? Math.round(split * HEIGHT) + 24 : SAFE.bottom;

  const Talking = <MediaClip {...main} muted={false} />;
  const Broll = <TimedBroll items={broll} />;

  return (
    <AbsoluteFill style={{ background: theme.colors.dark }}>
      <FontLoader />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: topH, overflow: "hidden" }}>
        {talkingOn === "top" ? Talking : Broll}
      </div>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: bottomH, overflow: "hidden" }}>
        {talkingOn === "top" ? Broll : Talking}
      </div>

      {/* seam highlight */}
      <div
        style={{
          position: "absolute",
          top: topH,
          left: 0,
          right: 0,
          height: 6,
          marginTop: -3,
          background: theme.colors.accent,
          boxShadow: `0 0 24px ${theme.colors.accent}`,
        }}
      />

      <Watermark tone="dark" />
      {kicker ? (
        <div style={{ position: "absolute", top: 44, right: SAFE.side }}>
          <Kicker label={kicker} />
        </div>
      ) : null}

      <Subtitles cues={captions} bottom={captionBottom} />
    </AbsoluteFill>
  );
};

export const Short: React.FC<ShortProps> = ({
  hook,
  hookSec = 2,
  cta,
  ctaSec = 3,
  ...body
}) => {
  return (
    <AbsoluteFill>
      <TransitionSeries>
        {hook ? (
          <TransitionSeries.Sequence durationInFrames={seg(hookSec)}>
            <HookIntro {...hook} hideProgress />
          </TransitionSeries.Sequence>
        ) : null}
        {hook ? xfade : null}

        <TransitionSeries.Sequence durationInFrames={seg(body.mainDurationSec)}>
          <Body {...body} />
        </TransitionSeries.Sequence>

        {cta ? xfade : null}
        {cta ? (
          <TransitionSeries.Sequence durationInFrames={seg(ctaSec)}>
            <CtaOutro {...cta} hideProgress />
          </TransitionSeries.Sequence>
        ) : null}
      </TransitionSeries>

      {/* one true progress bar across the whole short */}
      <ProgressBar />
    </AbsoluteFill>
  );
};

// Placeholder props so the composition opens in Studio before a real short is
// built. `create-short` overrides all of this via --props.
export const shortDefaults: ShortProps = {
  main: { src: undefined, label: "▶ sestříhaný hlavní klip (mluvíš do kamery)", muted: false },
  mainDurationSec: 14,
  split: 0.45,
  talkingOn: "bottom",
  kicker: "JAK TO STAVÍM",
  broll: [
    { from: 0, to: 4, label: "podklad 1" },
    { from: 4, to: 9, label: "podklad 2" },
    { from: 9, to: 14, label: "hotovo 🎉" },
  ],
  captions: SAMPLE_CAPTIONS,
  hook: {
    kicker: "HACKATHON",
    title: "Stavím aplikaci za *24 hodin*",
    subtitle: "Pojď se mnou na můj první hackathon",
  },
  hookSec: 2,
  cta: {
    headline: "Web, který skvěle vypadá. *Snáz.*",
    subline: "Jednoduchý web za *799 Kč/rok* včetně domény",
    cta: "Vytvořit web",
    url: "www.snaz.cz",
  },
  ctaSec: 3,
};
