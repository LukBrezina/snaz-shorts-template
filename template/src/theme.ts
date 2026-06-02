// Snáz brand theme — mirrored from app/assets/tailwind/application.css
export const theme = {
  colors: {
    primary: "#1a5f4a",
    primaryLight: "#2d8a6c",
    primaryDark: "#0f3d2f",
    accent: "#e8a54b",
    accentLight: "#f5c97d",
    accentDark: "#c78c3a",
    danger: "#c44536",
    cream: "#faf8f5",
    creamDark: "#f0ebe4",
    dark: "#1a1a1a",
    darkSoft: "#2d2d2d",
    white: "#ffffff",
  },
  fonts: {
    serif: "'DM Serif Display', Georgia, serif",
    sans: "'Outfit', system-ui, sans-serif",
  },
  // Snáz signature easing (from .btn / .animate-fade in the portal CSS).
  ease: "cubic-bezier(0.22, 0.61, 0.36, 1)",
} as const;

export type Theme = typeof theme;

// Canvas — 9:16 vertical, the native aspect for Reels / Shorts / TikTok.
export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

// Platform-UI safe zones (px on the 1080×1920 canvas). Keep captions, logos and
// CTAs inside these so the TikTok/IG/Shorts chrome (caption, buttons, username,
// progress bar) never covers them.
export const SAFE = {
  top: 220, // status bar + top actions
  bottom: 420, // caption text, like/share rail, progress bar
  side: 60,
};
