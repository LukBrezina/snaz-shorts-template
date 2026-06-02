import React from "react";
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { theme } from "../theme";

// One timed piece of supporting material (a screenshot, photo or screen
// recording) shown in the TOP panel of a short while it is being talked about
// in the main clip. `from`/`to` are seconds on the MAIN clip's timeline (the
// already-cut talking-head video), so the visual lands exactly when the
// founder references it.
export interface TimedMedia {
  /** path under public/, e.g. "media/4hrs_in_hackathon/shot_01.png" */
  src?: string;
  /** seconds on the main clip's timeline when this should appear */
  from: number;
  /** seconds on the main clip's timeline when this should disappear */
  to: number;
  /** "video" | "image" — inferred from the extension if omitted */
  kind?: "video" | "image";
  /** seconds into the source video to start from (videos only) */
  startFromSec?: number;
  /** small caption chip on the tile (e.g. "hotová appka") */
  label?: string;
  /** Ken Burns zoom target for stills. 1 = off. */
  zoom?: number;
}

const isVideo = (m: TimedMedia) =>
  m.kind === "video" ||
  (!!m.src && /\.(mov|mp4|webm|m4v)$/i.test(m.src) && m.kind !== "image");

const FADE = 8; // frames of cross-fade at each end of a clip

// A single material, shown for the length of its Sequence. Whole screenshots
// are shown over a blurred zoomed copy of themselves (blur-fill) so nothing is
// cropped and there are no dead letterbox bars — the same look as Collage.
const BrollItem: React.FC<{ item: TimedMedia }> = ({ item }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, FADE], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - FADE, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const opacity = Math.min(fadeIn, fadeOut);

  const zoomTo = item.zoom ?? 1.06;
  const scale = interpolate(frame, [0, durationInFrames], [1, zoomTo], {
    extrapolateRight: "clamp",
  });

  if (!item.src) {
    return (
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
        {item.label ?? "▶ podklad"}
      </AbsoluteFill>
    );
  }

  const file = staticFile(item.src);
  return (
    <AbsoluteFill style={{ background: theme.colors.primaryDark, opacity }}>
      {isVideo(item) ? (
        <div
          style={{
            width: "100%",
            height: "100%",
            transform: `scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          <OffthreadVideo
            src={file}
            muted
            startFrom={Math.round((item.startFromSec ?? 0) * fps)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      ) : (
        <>
          {/* blurred zoomed fill so there are no empty bars */}
          <Img
            src={file}
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
          {/* the whole screenshot, never cropped, with a gentle Ken Burns */}
          <Img
            src={file}
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              objectFit: "contain",
              transform: `scale(${scale})`,
              transformOrigin: "center center",
            }}
          />
        </>
      )}

      {item.label ? (
        <div
          style={{
            position: "absolute",
            left: 22,
            bottom: 22,
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
    </AbsoluteFill>
  );
};

// The top panel: each material plays inside its own <Sequence>, placed on the
// main clip's timeline. Overlapping windows are allowed — a later item simply
// fades in over the earlier one. Gaps fall back to a branded backdrop.
export const TimedBroll: React.FC<{ items: TimedMedia[] }> = ({ items }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: theme.colors.primaryDark }}>
      {items.map((item, i) => {
        const from = Math.max(0, Math.round(item.from * fps));
        const dur = Math.max(1, Math.round((item.to - item.from) * fps));
        return (
          <Sequence key={i} from={from} durationInFrames={dur} layout="none">
            <BrollItem item={item} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
