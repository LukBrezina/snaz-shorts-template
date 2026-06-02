# Shorts dashboard

A tiny (~200-line, one dependency) web app so you can drive the whole pipeline
**from your phone**: upload raw footage, it kicks off `/create-short` in the
background, and when the render finishes you preview, **download**, or hit the
native **share** sheet (Instagram / TikTok / Files) — all from the browser.

It's deliberately minimal: plain Node `http` + [`formidable`](https://www.npmjs.com/package/formidable)
for uploads, no framework, no build step.

## What it does

- **🎬 Shorty** — grid of every folder under `../videos/`. A folder with a
  `short.mp4` shows an inline player + **Stáhnout** (download) / **Sdílet**
  (native share); others show as *koncept* (just materials) or *běží* (render in
  progress).
- **➕ Nový short** — name it, drop in photos/videos (drag-drop or the file
  picker — on a phone that's your camera roll), upload. The server creates
  `../videos/<slug>/`, drops the files in, and spawns
  `claude -p "/create-short <slug>"` in the background, logging to
  `../videos/<slug>/.create-short.log`.

## Run

```bash
cd dashboard
npm install        # once
npm start          # → http://0.0.0.0:4321
```

| Env var      | Default     | Meaning |
|--------------|-------------|---------|
| `PORT`       | `4321`      | Port to listen on |
| `HOST`       | `0.0.0.0`   | Bind address — `0.0.0.0` so Tailscale/LAN peers can reach it |
| `CLAUDE_BIN` | `claude`    | Path to the Claude Code CLI used to run `/create-short` |

For the **`/create-short` upload button to actually render**, the machine
running this server needs the full pipeline installed: the
[Claude Code CLI](https://claude.com/claude-code) (logged in), `ffmpeg`,
`whisper-cpp`, Node, and `template/`'s `npm install` done. See the root
[`README.md`](../README.md) for the one-time setup and for exposing this safely
over **Tailscale** so you can reach it from your phone anywhere.

> Without Claude Code installed, the dashboard still works as an
> **upload + browse + download/share** UI — the upload just won't auto-render;
> you'd run `/create-short <slug>` yourself.

## Security note

There's **no authentication** — anyone who can reach the port can upload files
and (because uploads spawn the Claude Code CLI) trigger code execution on the
host. **Do not expose it to the public internet.** Bind it to your Tailscale
network (or `localhost`) only. The HTTP handler guards against path traversal
and only ever serves files from under `../videos/`.
