import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { theme, SAFE } from "../theme";
import { Kicker } from "./Kicker";
import { Logo } from "./Logo";
import { Highlight } from "./Highlight";

interface Props {
  kicker?: string;
  /** the big line. Wrap an emphasised phrase in *asterisks* to accent it. */
  title: string;
  subtitle?: string;
}

// Tokenise the title into words while tracking which fall inside a *…* emphasis
// span. We animate per word, so emphasis is resolved across the whole string
// first (an asterisk can wrap several words). Scanning char-by-char means a `*`
// next to punctuation — e.g. "*skvěle vypadá*." — toggles correctly instead of
// leaking emphasis onto the rest of the line.
const tokenizeTitle = (title: string): { word: string; em: boolean }[] => {
  const out: { word: string; em: boolean }[] = [];
  let em = false;
  let word = "";
  let wordEm = false;
  const flush = () => {
    if (word) out.push({ word, em: wordEm });
    word = "";
  };
  for (const ch of title) {
    if (ch === "*") {
      em = !em;
    } else if (ch === " ") {
      flush();
    } else {
      if (!word) wordEm = em; // emphasis is decided at the word's first char
      word += ch;
    }
  }
  flush();
  return out;
};

// Opening hook card. Big serif headline whose words rise in one at a time — the
// first 1–2 seconds that decide whether someone keeps watching. Use as a
// standalone intro composition or as the first Sequence of a longer short.
export const TitleCard: React.FC<Props> = ({ kicker, title, subtitle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = tokenizeTitle(title);

  const sub = spring({ frame: frame - 18, fps, durationInFrames: 16, config: { damping: 16 } });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: `0 ${SAFE.side + 20}px`,
        textAlign: "center",
      }}
    >
      {kicker ? (
        <div style={{ marginBottom: 28 }}>
          <Kicker label={kicker} />
        </div>
      ) : null}

      <h1
        style={{
          fontFamily: theme.fonts.serif,
          fontSize: 100,
          lineHeight: 1.06,
          letterSpacing: "-0.02em", // homepage tracking-tight
          color: theme.colors.dark, // homepage headings are near-black, not green
          margin: 0,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0 24px",
        }}
      >
        {words.map((w, i) => {
          const enter = spring({
            frame: frame - i * 3,
            fps,
            durationInFrames: 18,
            config: { damping: 15, mass: 0.6 },
          });
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                transform: `translateY(${(1 - enter) * 60}px)`,
                opacity: enter,
              }}
            >
              {/* emphasis = homepage .price-highlight: accent bar behind the
                  text near the baseline, never over it */}
              {w.em ? <Highlight>{w.word}</Highlight> : w.word}
            </span>
          );
        })}
      </h1>

      {subtitle ? (
        <p
          style={{
            fontFamily: theme.fonts.sans,
            fontWeight: 300, // homepage body is font-light
            fontSize: 40,
            color: "#7a7a7a", // homepage gray-500
            marginTop: 28,
            maxWidth: 820,
            lineHeight: 1.5,
            opacity: sub,
            transform: `translateY(${(1 - sub) * 24}px)`,
          }}
        >
          {subtitle}
        </p>
      ) : null}

      <div
        style={{
          position: "absolute",
          bottom: SAFE.bottom - 80,
          opacity: interpolate(frame, [24, 40], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        <Logo size={96} />
      </div>
    </AbsoluteFill>
  );
};
