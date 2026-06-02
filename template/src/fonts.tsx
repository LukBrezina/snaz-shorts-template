import React from "react";
import { loadFont as loadSerif } from "@remotion/google-fonts/DMSerifDisplay";
import { loadFont as loadSans } from "@remotion/google-fonts/Outfit";

// Load the EXACT fonts the snaz.cz homepage uses, straight from Google Fonts —
// the same source the site's <link> pulls. Calling loadFont() at module load
// registers the @font-face AND adds a delayRender() internally, so the render
// blocks until the real font is ready (no more falling back to system Georgia,
// which is what made headlines look "off-brand"). `latin-ext` = Czech glyphs.
//
// fontFamily comes back as "DM Serif Display" / "Outfit" — exactly the strings
// in theme.fonts, so nothing else needs to change.
loadSerif("normal", { weights: ["400"], subsets: ["latin", "latin-ext"] });
loadSans("normal", {
  weights: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "latin-ext"],
});

// Kept as a no-op component so existing <FontLoader /> usages still compile; the
// actual loading happens above, on import.
export const FontLoader: React.FC = () => null;
