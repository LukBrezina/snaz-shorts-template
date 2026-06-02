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

## Headless permissions (unattended renders)

The dashboard runs Claude Code **non-interactively** (`claude -p "/create-short …"`)
with no TTY attached. The pipeline shells out a lot — `ffmpeg`, `ffprobe`,
`whisper-cli`, `python3`, `npx remotion`, `sips`, file writes — and by default
Claude Code asks for approval before each of those. With no terminal to answer,
the run **stalls or aborts** instead of rendering. So you have to pre-grant the
tools it needs. Two ways:

**A. Allowlist in `.claude/settings.json` (recommended).** Doesn't touch the
server, scoped to this repo. Create `.claude/settings.json` at the repo root:

```json
{
  "permissions": {
    "allow": [
      "Read", "Write", "Edit",
      "Bash(scripts/:*)",
      "Bash(ffmpeg:*)", "Bash(ffprobe:*)", "Bash(whisper-cli:*)",
      "Bash(python3:*)", "Bash(npx:*)", "Bash(npm:*)", "Bash(node:*)",
      "Bash(sips:*)", "Bash(mkdir:*)", "Bash(cp:*)", "Bash(mv:*)",
      "Task"
    ]
  }
}
```

Tighten or widen the list to taste — if you hit a stall, the
`.create-short.log` in the short's folder shows which tool was blocked; add it.
(`Task` lets it spawn the independent review agent in the generator↔reviewer
loop.)

**B. Skip prompts entirely.** Edit `server.js` and add the bypass flag to the
spawn — for a single-purpose box this is the simplest:

```js
const child = spawn(CLAUDE_BIN,
  ["-p", "--dangerously-skip-permissions", `/create-short ${name}`],
  { cwd: REPO_ROOT, detached: true, stdio: ["ignore", log.fd, log.fd] });
```

This lets the agent run **any** command with no approval. Only acceptable
*because the box is single-purpose and gated behind Tailscale* (see below) — it
still executes whatever the model decides to. Prefer **A** if you can.

Either way, the box needs Claude Code **authenticated headlessly** — export
`ANTHROPIC_API_KEY` in the service environment so the non-interactive runs pick
it up (no interactive login needed). See the root
[`README.md`](../README.md#set-it-up-on-a-vps-or-pc) for the full box setup.

## Security note

There's **no authentication** — anyone who can reach the port can upload files
and (because uploads spawn the Claude Code CLI) trigger code execution on the
host. **Do not expose it to the public internet.** Bind it to your Tailscale
network (or `localhost`) only. The HTTP handler guards against path traversal
and only ever serves files from under `../videos/`.
