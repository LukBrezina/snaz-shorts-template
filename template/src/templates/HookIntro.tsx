import React from "react";
import { AbsoluteFill } from "remotion";
import { BrandBg } from "../components/BrandBg";
import { TitleCard } from "../components/TitleCard";
import { ProgressBar } from "../components/ProgressBar";
import { FontLoader } from "../fonts";

export type HookIntroProps = {
  kicker?: string;
  title: string;
  subtitle?: string;
  /** suppress the progress bar (FullShort renders one global bar instead) */
  hideProgress?: boolean;
}

// TEMPLATE 3 — Hook intro.
// A 1.5–2s branded title card to open a short. Words rise in; the line that
// matters is accented. Use standalone or as the first Sequence before footage.
export const HookIntro: React.FC<HookIntroProps> = ({ hideProgress, ...props }) => {
  return (
    <AbsoluteFill>
      <FontLoader />
      <BrandBg tone="light" />
      <TitleCard {...props} />
      {hideProgress ? null : <ProgressBar />}
    </AbsoluteFill>
  );
};

export const hookIntroDefaults: HookIntroProps = {
  kicker: "HACKATHON",
  title: "Stavím aplikaci za *24 hodin*",
  subtitle: "Pojď se mnou na můj první hackathon",
};
