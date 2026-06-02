import React from "react";
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { theme } from "../theme";

export interface MediaSource {
  /** path under public/, e.g. "media/joining_hackathon/IMG_4880.MOV". Leave
   *  empty to render a labelled placeholder (handy while editing layout). */
  src?: string;
  /** seconds into the source video to start from (videos only) */
  startFromSec?: number;
  /** "video" | "image" — inferred from the extension if omitted */
  kind?: "video" | "image";
  /** muted for B-roll; keep audio only on your main talking clip */
  muted?: boolean;
  /** Ken Burns zoom for stills (and a gentle drift for video). 1 = off. */
  zoom?: number;
  label?: string;
}

const isVideo = (m: MediaSource) =>
  m.kind === "video" ||
  (!!m.src && /\.(mov|mp4|webm|m4v)$/i.test(m.src) && m.kind !== "image");

// One piece of footage, object-fit: cover into whatever box it's placed in.
// Stills get a slow Ken Burns; video gets a faint zoom so static framing feels
// alive. Falls back to a branded placeholder when no src is set.
export const MediaClip: React.FC<MediaSource & { className?: string }> = (m) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const zoomTo = m.zoom ?? 1.08;
  const scale = interpolate(frame, [0, durationInFrames], [1, zoomTo], {
    extrapolateRight: "clamp",
  });

  if (!m.src) {
    return (
      <AbsoluteFill
        style={{
          background: `repeating-linear-gradient(45deg, ${theme.colors.creamDark} 0 28px, ${theme.colors.cream} 28px 56px)`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontFamily: theme.fonts.sans,
            fontWeight: 600,
            fontSize: 34,
            color: theme.colors.primary,
            textAlign: "center",
            opacity: 0.7,
            padding: 24,
          }}
        >
          {m.label ?? "▶ vlož klip / fotku"}
        </div>
      </AbsoluteFill>
    );
  }

  const file = staticFile(m.src);
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: theme.colors.dark }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        {isVideo(m) ? (
          <OffthreadVideo
            src={file}
            muted={m.muted ?? true}
            startFrom={Math.round((m.startFromSec ?? 0) * fps)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <Img
            src={file}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
      </div>
    </AbsoluteFill>
  );
};
