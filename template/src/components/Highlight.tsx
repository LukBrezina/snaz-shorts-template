import React from "react";
import { theme } from "../theme";

// Accent highlighter behind a word/phrase — a 1:1 port of the homepage
// `.price-highlight::after`: a short accent bar (≈12px on a 60px heading) pinned
// near the baseline, 30% opacity, BEHIND the text (never over it). Used for
// "Snáz.", prices, etc. Sizes in `em` so it scales with the font.
export const Highlight: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <span
    style={{ position: "relative", display: "inline-block", whiteSpace: "nowrap" }}
  >
    <span
      aria-hidden
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: "0.07em", // homepage: bottom 4px
        height: "0.2em", // homepage: height 12px
        background: theme.colors.accent,
        opacity: 0.3,
        borderRadius: 3,
        zIndex: 0, // sits behind the text below
      }}
    />
    <span style={{ position: "relative", zIndex: 1 }}>{children}</span>
  </span>
);
