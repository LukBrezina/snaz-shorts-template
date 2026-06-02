import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { theme } from "../theme";

// Warm cream backdrop with two slowly drifting brand-coloured glow blobs and a
// faint grain. Matches the Snáz portal's cream + primary/accent palette. Use
// `dark` behind bright media, `light` behind text cards.
export const BrandBg: React.FC<{ tone?: "light" | "dark" }> = ({
  tone = "light",
}) => {
  const frame = useCurrentFrame();
  const t = frame / 30;

  const base =
    tone === "dark"
      ? `radial-gradient(120% 120% at 50% 0%, ${theme.colors.primaryDark} 0%, ${theme.colors.dark} 70%)`
      : `linear-gradient(180deg, ${theme.colors.cream} 0%, ${theme.colors.creamDark} 100%)`;

  const blob1X = 50 + Math.sin(t * 0.5) * 14;
  const blob1Y = 22 + Math.cos(t * 0.4) * 8;
  const blob2X = 70 + Math.cos(t * 0.35) * 12;
  const blob2Y = 78 + Math.sin(t * 0.45) * 8;

  const accentGlow = "rgba(232,165,75,0.28)";
  const primaryGlow =
    tone === "dark" ? "rgba(45,138,108,0.40)" : "rgba(45,138,108,0.22)";

  return (
    <AbsoluteFill style={{ background: base, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(38% 30% at ${blob1X}% ${blob1Y}%, ${accentGlow} 0%, transparent 65%)`,
          filter: "blur(40px)",
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(42% 32% at ${blob2X}% ${blob2Y}%, ${primaryGlow} 0%, transparent 65%)`,
          filter: "blur(50px)",
        }}
      />
      {/* subtle grain */}
      <AbsoluteFill
        style={{
          opacity: tone === "dark" ? 0.06 : 0.04,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          mixBlendMode: tone === "dark" ? "screen" : "multiply",
        }}
      />
    </AbsoluteFill>
  );
};
