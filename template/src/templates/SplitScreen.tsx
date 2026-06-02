import React from "react";
import { AbsoluteFill } from "remotion";
import { MediaClip, MediaSource } from "../components/MediaClip";
import { Collage, CollageItem } from "../components/Collage";
import { Subtitles } from "../components/Subtitles";
import { Watermark } from "../components/Watermark";
import { ProgressBar } from "../components/ProgressBar";
import { Kicker } from "../components/Kicker";
import { FontLoader } from "../fonts";
import { CaptionCue, SAMPLE_CAPTIONS } from "../captions";
import { theme, SAFE, HEIGHT } from "../theme";

export type SplitScreenProps = {
  /** which half holds the talking head */
  talkingOn?: "top" | "bottom";
  /** fraction of the height given to the talking head (0..1) */
  split?: number;
  /** your talking-to-camera clip (audio kept) */
  talking: MediaSource;
  /** B-roll for the other half. Either a stack of screenshots/photos
   *  (collage) or a single clip. */
  brollItems?: CollageItem[];
  brollClip?: MediaSource;
  captions: CaptionCue[];
  kicker?: string;
  /** suppress the progress bar (FullShort renders one global bar instead) */
  hideProgress?: boolean;
}

// TEMPLATE 2 — Split screen.
// Two stacked panels: one is YOU talking, the other is what you're talking about
// — screenshots, photos, a screen recording, collected one by one. This is the
// hackathon layout ("here's what I'm building" + the work flying in). The
// screenshots/b-roll get the LARGER panel (mobile screens are small — use the
// space). Captions sit just off the seam, in the b-roll panel, so they never
// cover your face. Logo + kicker live in opposite top corners.
export const SplitScreen: React.FC<SplitScreenProps> = ({
  talkingOn = "bottom",
  split = 0.4,
  talking,
  brollItems,
  brollClip,
  captions,
  kicker,
  hideProgress,
}) => {
  const talkingFrac = split; // talking panel always gets `split` of the height
  const topH = `${(talkingOn === "top" ? split : 1 - split) * 100}%`;
  const bottomH = `${(talkingOn === "top" ? 1 - split : split) * 100}%`;

  // Keep captions off the talking head. If you're on the bottom, captions float
  // just above the seam (in the b-roll); if you're on top, they sit low over the
  // b-roll. Either way they're above the platform safe zone.
  const captionBottom =
    talkingOn === "bottom"
      ? Math.round(talkingFrac * HEIGHT) + 24
      : SAFE.bottom;

  const Talking = (
    <MediaClip {...talking} muted={false} />
  );
  const Broll = brollClip ? (
    <MediaClip {...brollClip} muted />
  ) : (
    <AbsoluteFill style={{ background: theme.colors.primaryDark }}>
      <Collage items={brollItems ?? []} />
    </AbsoluteFill>
  );

  return (
    <AbsoluteFill style={{ background: theme.colors.dark }}>
      <FontLoader />

      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: topH, overflow: "hidden" }}>
        {talkingOn === "top" ? Talking : Broll}
      </div>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: bottomH, overflow: "hidden" }}>
        {talkingOn === "top" ? Broll : Talking}
      </div>

      {/* seam highlight */}
      <div
        style={{
          position: "absolute",
          top: topH,
          left: 0,
          right: 0,
          height: 6,
          marginTop: -3,
          background: theme.colors.accent,
          boxShadow: `0 0 24px ${theme.colors.accent}`,
        }}
      />

      <Watermark tone="dark" />
      {kicker ? (
        <div
          style={{
            position: "absolute",
            top: 44,
            right: SAFE.side,
          }}
        >
          <Kicker label={kicker} />
        </div>
      ) : null}

      <Subtitles cues={captions} bottom={captionBottom} />
      {hideProgress ? null : <ProgressBar />}
    </AbsoluteFill>
  );
};

export const splitScreenDefaults: SplitScreenProps = {
  talkingOn: "bottom",
  split: 0.4,
  talking: { src: undefined, label: "▶ ty, jak mluvíš o tom co stavíš", muted: false },
  brollItems: [
    { label: "první nápad" },
    { label: "návrh" },
    { label: "u stolu" },
    { label: "hotovo 🎉" },
  ],
  captions: SAMPLE_CAPTIONS,
  kicker: "JAK TO STAVÍM",
};
