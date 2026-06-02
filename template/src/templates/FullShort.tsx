import React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { HookIntro, hookIntroDefaults } from "./HookIntro";
import { SplitScreen, splitScreenDefaults } from "./SplitScreen";
import { CtaOutro, ctaOutroDefaults } from "./CtaOutro";
import { ProgressBar } from "../components/ProgressBar";
import { FPS } from "../theme";

// ASSEMBLED EXAMPLE — how to chain templates into one finished short.
// TransitionSeries cross-fades each block (no hard cuts). Children pass
// hideProgress so the per-template bars don't reset on every segment; ONE global
// ProgressBar runs over the whole composition instead. Watermarks stay
// per-segment so the logo tone matches each background.
//
// Segments: hook 2s · body 16s · cta 3s = 21s, minus two 0.5s cross-fades = 20s.
const HOOK = 2 * FPS;
const BODY = 16 * FPS;
const CTA = 3 * FPS;
const XFADE = Math.round(0.5 * FPS);
export const FULL_SHORT_FRAMES = HOOK + BODY + CTA - 2 * XFADE;

const xfade = (
  <TransitionSeries.Transition
    timing={linearTiming({ durationInFrames: XFADE })}
    presentation={fade()}
  />
);

export const FullShort: React.FC = () => {
  return (
    <AbsoluteFill>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={HOOK}>
          <HookIntro {...hookIntroDefaults} hideProgress />
        </TransitionSeries.Sequence>
        {xfade}
        <TransitionSeries.Sequence durationInFrames={BODY}>
          <SplitScreen {...splitScreenDefaults} hideProgress />
        </TransitionSeries.Sequence>
        {xfade}
        <TransitionSeries.Sequence durationInFrames={CTA}>
          <CtaOutro {...ctaOutroDefaults} hideProgress />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* one true progress bar across the whole short */}
      <ProgressBar />
    </AbsoluteFill>
  );
};
