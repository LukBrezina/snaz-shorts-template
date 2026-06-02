import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { theme, SAFE } from "../theme";
import { CaptionCue, cueAt } from "../captions";

interface Props {
  cues: CaptionCue[];
  /** distance of the caption's bottom edge from the frame bottom, in px. Default
   *  is SAFE.bottom so the text always clears the platform caption / like-share
   *  rail. Pass a larger number to lift captions higher. */
  bottom?: number;
  fontSize?: number;
}

const toneColor = (tone: CaptionCue["tone"]) =>
  tone === "primary"
    ? theme.colors.primary
    : tone === "danger"
      ? theme.colors.danger
      : theme.colors.accent;

// Captions in a solid cream pill — dark text on a clean white-ish card, the way
// the homepage reads. Every word is fully visible (no faded/ghost words); the
// currently spoken word gets a brand-coloured chip. High contrast on any
// footage because the pill is opaque.
export const Subtitles: React.FC<Props> = ({
  cues,
  bottom = SAFE.bottom,
  fontSize = 58,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const seconds = frame / fps;
  const cue = cueAt(cues, seconds);
  if (!cue) return null;

  const words = cue.text.split(" ").filter(Boolean);
  const cueStartFrame = cue.from * fps;
  const localFrame = frame - cueStartFrame;

  // pop-in
  const enter = spring({
    frame: localFrame,
    fps,
    config: { damping: 14, mass: 0.5 },
    durationInFrames: 12,
  });
  // word progress across the cue
  const progress = interpolate(seconds, [cue.from, cue.to], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const active = Math.min(words.length - 1, Math.floor(progress * words.length));
  const highlight = toneColor(cue.tone);

  return (
    <div
      style={{
        position: "absolute",
        left: SAFE.side,
        right: SAFE.side,
        bottom,
        display: "flex",
        justifyContent: "center",
        transform: `translateY(${(1 - enter) * 36}px) scale(${0.94 + enter * 0.06})`,
        opacity: enter,
      }}
    >
      <div
        style={{
          background: "rgba(250,248,245,0.97)", // cream
          borderRadius: 28,
          padding: "18px 30px",
          boxShadow: "0 18px 50px rgba(15,61,47,0.28)",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          gap: "4px 14px",
          maxWidth: 880,
        }}
      >
        {words.map((w, i) => {
          const isActive = i === active;
          return (
            <span
              key={i}
              style={{
                fontFamily: theme.fonts.sans,
                fontWeight: 700,
                fontSize,
                lineHeight: 1.12,
                letterSpacing: "-0.01em",
                color: isActive ? theme.colors.white : theme.colors.dark,
                background: isActive ? highlight : "transparent",
                padding: isActive ? "2px 14px" : "2px 0",
                borderRadius: 12,
                transform: isActive ? "scale(1.04)" : "scale(1)",
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
    </div>
  );
};
