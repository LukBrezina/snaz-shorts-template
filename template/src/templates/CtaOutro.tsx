import React from "react";
import { AbsoluteFill } from "remotion";
import { BrandBg } from "../components/BrandBg";
import { EndCard } from "../components/EndCard";
import { Watermark } from "../components/Watermark";
import { ProgressBar } from "../components/ProgressBar";
import { FontLoader } from "../fonts";

export type CtaOutroProps = {
  headline?: string;
  subline?: string;
  cta?: string;
  url?: string;
  /** suppress the progress bar (FullShort renders one global bar instead) */
  hideProgress?: boolean;
}

// TEMPLATE 4 — CTA outro.
// Closing card with logo, promise, button and URL. Carries the same chrome
// (watermark + progress bar) as the other templates so the most-screenshotted
// final frame stays branded and the bar reads 100%.
export const CtaOutro: React.FC<CtaOutroProps> = ({ hideProgress, ...props }) => {
  return (
    <AbsoluteFill>
      <FontLoader />
      <BrandBg tone="light" />
      <Watermark tone="light" />
      <EndCard {...props} />
      {hideProgress ? null : <ProgressBar />}
    </AbsoluteFill>
  );
};

// Verbatim homepage copy. Headline = hero tagline (home.index.hero.title_html),
// "Snáz." gets the accent marker via *…*. Button = hero.cta_primary.
// Alt closing line: "Připraveni mít vlastní web?" (home.index.final_cta.title).
export const ctaOutroDefaults: CtaOutroProps = {
  headline: "Web, který skvěle vypadá. *Snáz.*",
  subline: "Jednoduchý web za *799 Kč/rok* včetně domény",
  cta: "Vytvořit web",
  url: "www.snaz.cz",
};
