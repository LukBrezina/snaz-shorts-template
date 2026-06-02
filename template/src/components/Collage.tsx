import React from "react";
import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { theme } from "../theme";

export interface CollageItem {
  src?: string; // path under public/ (image). Empty => placeholder tile.
  label?: string; // small caption chip on the tile (e.g. "první verze")
}

interface Props {
  items: CollageItem[];
  /** how long each item holds, in seconds */
  holdSec?: number;
}

// A "collecting screenshots/photos" panel: shots fly in one after another, the
// newest on top, filling as much of the panel as possible (mobile screens are
// small). Each card is a blur-fill — the whole screenshot is shown (contain)
// over a blurred, zoomed copy of itself, so nothing is cropped and there are no
// dead letterbox bars. Cycles through `items` over the panel's lifetime.
export const Collage: React.FC<Props> = ({ items, holdSec = 2.2 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const hold = holdSec * fps;
  const shown = Math.min(items.length, Math.floor(frame / hold) + 1);
  // small deterministic tilt per index (no Math.random — must be pure)
  const tilt = (i: number) => ((i * 37) % 5) - 2;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: 24 }}>
      {items.slice(0, shown).map((item, i) => {
        const appearAt = i * hold;
        const local = frame - appearAt;
        const enter = spring({
          frame: local,
          fps,
          config: { damping: 14, mass: 0.6 },
          durationInFrames: 16,
        });
        const depth = shown - 1 - i; // older cards sink back slightly
        const settle = interpolate(depth, [0, 3], [0, 1], { extrapolateRight: "clamp" });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              width: "96%",
              height: "96%",
              borderRadius: 24,
              overflow: "hidden",
              background: theme.colors.dark,
              boxShadow: "0 28px 64px rgba(0,0,0,0.45)",
              transform: `
                translateY(${(1 - enter) * 110 + settle * -16}px)
                rotate(${tilt(i) * enter}deg)
                scale(${(0.9 + enter * 0.1) * (1 - settle * 0.05)})`,
              opacity: enter * (1 - settle * 0.2),
            }}
          >
            {item.src ? (
              <>
                {/* blurred zoomed fill so there are no empty bars */}
                <Img
                  src={staticFile(item.src)}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    filter: "blur(28px) brightness(0.7)",
                    transform: "scale(1.15)",
                  }}
                />
                {/* whole screenshot, never cropped */}
                <Img
                  src={staticFile(item.src)}
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              </>
            ) : (
              <AbsoluteFill
                style={{
                  background: `repeating-linear-gradient(45deg, ${theme.colors.primaryDark} 0 30px, ${theme.colors.primary} 30px 60px)`,
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: theme.fonts.sans,
                  fontWeight: 700,
                  fontSize: 40,
                  color: theme.colors.white,
                  opacity: 0.9,
                }}
              >
                {item.label ?? `foto ${i + 1}`}
              </AbsoluteFill>
            )}

            {item.src && item.label ? (
              <div
                style={{
                  position: "absolute",
                  left: 20,
                  bottom: 20,
                  background: theme.colors.primary,
                  color: theme.colors.white,
                  fontFamily: theme.fonts.sans,
                  fontWeight: 700,
                  fontSize: 28,
                  padding: "8px 18px",
                  borderRadius: 12,
                }}
              >
                {item.label}
              </div>
            ) : null}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
