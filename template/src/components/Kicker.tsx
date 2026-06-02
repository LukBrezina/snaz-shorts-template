import React from "react";
import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import { theme } from "../theme";

// Small uppercase pill — section label / topic tag (e.g. "HACKATHON · DEN 1").
export const Kicker: React.FC<{ label: string; tone?: "accent" | "primary" }> = ({
  label,
  tone = "accent",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 14 }, durationInFrames: 14 });
  const bg = tone === "accent" ? theme.colors.accent : theme.colors.primary;
  const ink = tone === "accent" ? theme.colors.primaryDark : theme.colors.white;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        background: bg,
        color: ink,
        fontFamily: theme.fonts.sans,
        fontWeight: 700,
        fontSize: 30,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        padding: "10px 22px",
        borderRadius: 999,
        transform: `translateY(${(1 - enter) * -20}px) scale(${0.9 + enter * 0.1})`,
        opacity: enter,
        boxShadow: "0 14px 34px rgba(15,61,47,0.28)",
      }}
    >
      {label}
    </div>
  );
};
