import React from "react";
import { Composition } from "remotion";
import { FPS, WIDTH, HEIGHT } from "./theme";

import { TalkingHead, talkingHeadDefaults } from "./templates/TalkingHead";
import { SplitScreen, splitScreenDefaults } from "./templates/SplitScreen";
import { HookIntro, hookIntroDefaults } from "./templates/HookIntro";
import { CtaOutro, ctaOutroDefaults } from "./templates/CtaOutro";
import { FullShort, FULL_SHORT_FRAMES } from "./templates/FullShort";
import { Short, shortDefaults, calcShortMetadata } from "./templates/Short";

// Every template is its own Composition so you can pick one in Remotion Studio,
// tweak its props live, and render it on its own. `dur(sec)` -> frames.
const dur = (sec: number) => Math.round(sec * FPS);

export const RemotionRoot: React.FC = () => {
  const common = { fps: FPS, width: WIDTH, height: HEIGHT };
  return (
    <>
      <Composition
        id="HookIntro"
        component={HookIntro}
        durationInFrames={dur(2)}
        defaultProps={hookIntroDefaults}
        {...common}
      />
      <Composition
        id="TalkingHead"
        component={TalkingHead}
        durationInFrames={dur(14)}
        defaultProps={talkingHeadDefaults}
        {...common}
      />
      <Composition
        id="SplitScreen"
        component={SplitScreen}
        durationInFrames={dur(14)}
        defaultProps={splitScreenDefaults}
        {...common}
      />
      <Composition
        id="CtaOutro"
        component={CtaOutro}
        durationInFrames={dur(3)}
        defaultProps={ctaOutroDefaults}
        {...common}
      />
      <Composition
        id="FullShort"
        component={FullShort}
        durationInFrames={FULL_SHORT_FRAMES}
        {...common}
      />
      {/* Data-driven short — `create-short` renders this with --props=<work>/props.json.
          Duration comes from the props (mainDurationSec) via calculateMetadata. */}
      <Composition
        id="Short"
        component={Short}
        durationInFrames={dur(19)}
        defaultProps={shortDefaults}
        calculateMetadata={calcShortMetadata}
        {...common}
      />
    </>
  );
};
