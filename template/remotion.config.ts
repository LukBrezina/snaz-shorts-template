import { Config } from "@remotion/cli/config";

// Vertical social video. H.264, high quality, good for Reels / Shorts / TikTok.
Config.setVideoImageFormat("jpeg");
Config.setConcurrency(4);
Config.setEntryPoint("./src/index.ts");
Config.setCodec("h264");
Config.setCrf(18);
// Audio: keep the founder's voice clean and loud enough for phone speakers.
Config.setAudioCodec("aac");
