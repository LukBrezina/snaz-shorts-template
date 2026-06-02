import React from "react";
import { AbsoluteFill } from "remotion";
import { MediaClip, MediaSource } from "../components/MediaClip";
import { Subtitles } from "../components/Subtitles";
import { Watermark } from "../components/Watermark";
import { ProgressBar } from "../components/ProgressBar";
import { Kicker } from "../components/Kicker";
import { FontLoader } from "../fonts";
import { CaptionCue, SAMPLE_CAPTIONS } from "../captions";
import { SAFE } from "../theme";

export type TalkingHeadProps = {
  media: MediaSource;
  captions: CaptionCue[];
  kicker?: string;
  /** suppress the progress bar (FullShort renders one global bar instead) */
  hideProgress?: boolean;
}

// TEMPLATE 1 — Talking head.
// You, full-frame, talking to camera, with big karaoke subtitles. The bread &
// butter reel. Your phone clip is cover-cropped to 9:16; keep your face in the
// upper-middle third while filming so the bottom caption band stays clear.
// Logo (top-left) and kicker (top-right) sit in opposite corners so they never
// collide; captions clear the platform safe zone and carry their own scrim.
export const TalkingHead: React.FC<TalkingHeadProps> = ({
  media,
  captions,
  kicker,
  hideProgress,
}) => {
  return (
    <AbsoluteFill>
      <FontLoader />
      <MediaClip {...media} muted={false} />

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

      <Subtitles cues={captions} />
      {hideProgress ? null : <ProgressBar />}
    </AbsoluteFill>
  );
};

export const talkingHeadDefaults: TalkingHeadProps = {
  media: { src: undefined, label: "▶ tvůj klip (mluvíš do kamery)", muted: false },
  captions: SAMPLE_CAPTIONS,
  kicker: "HACKATHON · DEN 1",
};
