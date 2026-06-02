import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { theme } from "../theme";

// Thin accent progress bar pinned to the very top — a classic retention cue
// ("how much is left?"). Sits above the platform's own progress UI.
export const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const w = interpolate(frame, [0, durationInFrames], [0, 100], {
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 8,
        background: "rgba(0,0,0,0.18)",
      }}
    >
      <div
        style={{
          width: `${w}%`,
          height: "100%",
          background: theme.colors.accent,
          boxShadow: `0 0 16px ${theme.colors.accent}`,
        }}
      />
    </div>
  );
};
