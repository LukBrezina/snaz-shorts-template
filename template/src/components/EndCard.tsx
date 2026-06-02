import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { theme, SAFE } from "../theme";
import { Logo } from "./Logo";
import { Highlight } from "./Highlight";

interface Props {
  /** wrap a phrase in *asterisks* for the homepage's accent-highlight */
  headline?: string;
  /** small line under the headline (e.g. price / what's included) */
  subline?: string;
  cta?: string; // the button label
  url?: string;
}

// Render text, giving any *…*-wrapped phrase the homepage .price-highlight: an
// accent bar behind the text near the baseline (see Highlight), never over it.
const renderMarked = (text: string) =>
  text
    .split(/(\*[^*]+\*)/g)
    .filter(Boolean)
    .map((part, i) => {
      const em = part.startsWith("*") && part.endsWith("*");
      return em ? (
        <Highlight key={i}>{part.slice(1, -1)}</Highlight>
      ) : (
        <React.Fragment key={i}>{part}</React.Fragment>
      );
    });

// Closing call-to-action. Brand logo, one-line promise, a pulsing pill button
// and the URL. Keep it ≥2s so the CTA registers before the loop restarts.
// Defaults are verbatim from the Snáz.cz homepage (config/locales/cs.yml —
// home.index.final_cta + hero.cta_primary). Don't invent new copy here.
export const EndCard: React.FC<Props> = ({
  headline = "Web, který skvěle vypadá. *Snáz.*",
  subline = "Jednoduchý web za *799 Kč/rok* včetně domény",
  cta = "Vytvořit web",
  url = "www.snaz.cz",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = spring({ frame, fps, durationInFrames: 18, config: { damping: 13 } });
  const head = spring({ frame: frame - 10, fps, durationInFrames: 18, config: { damping: 15 } });
  const subSpring = spring({ frame: frame - 16, fps, durationInFrames: 16, config: { damping: 16 } });
  const btn = spring({ frame: frame - 24, fps, durationInFrames: 16, config: { damping: 12 } });
  const pulse = 1 + Math.sin(frame / 6) * 0.03;

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: `0 ${SAFE.side + 20}px`,
        textAlign: "center",
      }}
    >
      <div style={{ transform: `scale(${0.7 + logo * 0.3})`, opacity: logo }}>
        <Logo variant="stacked" size={260} />
      </div>

      <h2
        style={{
          fontFamily: theme.fonts.serif,
          fontSize: 64,
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
          color: theme.colors.dark, // match homepage headings (near-black)
          margin: "34px 0 0",
          maxWidth: 880,
          opacity: head,
          transform: `translateY(${(1 - head) * 30}px)`,
        }}
      >
        {renderMarked(headline)}
      </h2>

      {subline ? (
        <p
          style={{
            fontFamily: theme.fonts.sans,
            fontWeight: 300, // homepage body is font-light
            fontSize: 38,
            lineHeight: 1.45,
            color: "#7a7a7a", // homepage gray-500
            margin: "20px 0 0",
            maxWidth: 760,
            opacity: subSpring,
            transform: `translateY(${(1 - subSpring) * 20}px)`,
          }}
        >
          {renderMarked(subline)}
        </p>
      ) : null}

      <div
        style={{
          marginTop: 48,
          opacity: btn,
          transform: `scale(${(0.8 + btn * 0.2) * pulse})`,
        }}
      >
        <div
          style={{
            // mirrors the homepage .btn-primary exactly
            background: theme.colors.accent,
            color: theme.colors.dark,
            fontFamily: theme.fonts.sans,
            fontWeight: 600,
            fontSize: 46,
            letterSpacing: "0.01em",
            padding: "26px 56px",
            borderRadius: 100,
            boxShadow: `0 8px 30px ${theme.colors.accent}4d`,
          }}
        >
          {cta}
        </div>
      </div>

      <div
        style={{
          marginTop: 36,
          fontFamily: theme.fonts.sans,
          fontWeight: 600,
          fontSize: 44,
          color: theme.colors.primary,
          opacity: interpolate(frame, [30, 46], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        {url}
      </div>
    </AbsoluteFill>
  );
};
