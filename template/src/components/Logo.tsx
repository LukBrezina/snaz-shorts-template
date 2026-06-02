import React from "react";
import { Img, staticFile } from "remotion";

// Official Snáz.cz logo (the same assets the portal ships in public/logo/).
// Pre-rendered PNGs so the DM Serif Display wordmark stays pixel-correct even
// though an <img>-loaded SVG can't see the page's @font-face rules.
const ASSETS = {
  horizontal: {
    dark: "logo/logo-horizontal-dark@2x.png", // green wordmark — for light backgrounds
    light: "logo/logo-horizontal-white@2x.png", // white wordmark — for dark backgrounds
    aspect: 496 / 146,
  },
  stacked: {
    dark: "logo/logo-stacked-dark@2x.png",
    light: "logo/logo-stacked-white@2x.png",
    aspect: 329 / 432,
  },
  icon: {
    dark: "logo/icon-512.png", // badge only (same on any background)
    light: "logo/icon-512.png",
    aspect: 1,
  },
} as const;

export const Logo: React.FC<{
  variant?: keyof typeof ASSETS;
  /** ink tone: "dark" = green/dark logo (use on light bg), "light" = white logo (use on dark bg) */
  tone?: "dark" | "light";
  /** rendered height in px */
  size?: number;
}> = ({ variant = "horizontal", tone = "dark", size = 56 }) => {
  const a = ASSETS[variant];
  const file = tone === "dark" ? a.dark : a.light;
  return (
    <Img
      src={staticFile(file)}
      style={{ height: size, width: size * a.aspect, display: "block" }}
    />
  );
};
