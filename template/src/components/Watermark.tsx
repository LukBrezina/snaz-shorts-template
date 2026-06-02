import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { SAFE } from "../theme";
import { Logo } from "./Logo";

// Persistent, unobtrusive branding bug. Sits top-left inside the safe zone so
// it survives a re-share/screen-record. Fades in after the hook.
export const Watermark: React.FC<{ tone?: "light" | "dark" }> = ({
  tone = "light",
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [10, 25], [0, tone === "light" ? 0.92 : 0.85], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        top: 40,
        left: SAFE.side,
        opacity,
        filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.35))",
      }}
    >
      <Logo size={44} tone={tone === "light" ? "dark" : "light"} />
    </div>
  );
};
