# Snáz.cz — Shorts generator

Turn a folder of raw phone footage into a finished **1080×1920 vertical short**
(Reels / TikTok / YouTube Shorts). A [Remotion](https://remotion.dev) template
plus a [Claude Code](https://claude.com/claude-code) skill that cuts out
re-takes, transcribes to karaoke captions, times your screenshots/photos to the
narration, renders, and self-reviews until it's clean.

> ⚠️ **Disclaimer.** This was extracted from my private monorepo and lightly
> adapted to stand alone. It is **not tested as a standalone repo** — treat it as
> a starting point, expect a few rough edges, and check paths/commands before
> trusting them.

## What it does

- **In:** a folder `videos/<name>/` with your talking-head clip + the
  screenshots/photos you talk about. **Out:** `videos/<name>/short.mp4`.
- The **create-short** Claude Code skill drives it end to end (probe → cut →
  caption → render → review loop). See
  [`.claude/skills/create-short/SKILL.md`](.claude/skills/create-short/SKILL.md).
- An optional **mobile dashboard** (`dashboard/`) lets you do the whole thing
  from your phone — upload, watch it render, download or share to Instagram/TikTok.

## Run it

**On your computer** — preview and edit the templates live:

```bash
cd template && npm install && npm run studio   # Remotion Studio
```

To render a real short, drop footage in `videos/<name>/` and run the
**create-short** skill in Claude Code (or follow the steps in `SKILL.md` by hand).

**From your phone** — run the generator on an always-on box (a cheap Linux VPS,
or your own desktop) joined to your private [Tailscale](https://tailscale.com)
network. Any device on the same tailnet — your phone included — opens the
dashboard in a browser and can upload footage and download/share the finished
shorts. Nothing is exposed to the public internet; Tailscale is the access
control. **Setup is in [Set it up on a VPS or PC](#set-it-up-on-a-vps-or-pc)
below** — hand that whole section to Claude Code and let it do it.

## Make it your brand

The look of every short lives in three places:

- `template/src/theme.ts` — colours and safe zones
- `template/src/fonts.tsx` — fonts (loaded via `@remotion/google-fonts`)
- `template/public/logo/` — the logo shown in the corner / outro

The fastest way to re-skin it: **drop an existing website or design system into a
folder** (e.g. `brand/` — the HTML/CSS, a Figma/tokens export, brand screenshots,
or just the URL) and tell Claude Code:

> "Restyle the shorts template to match the brand in `./brand` — pull its colours,
> fonts and logo and update `template/src/theme.ts`, `template/src/fonts.tsx` and
> `template/public/logo/`. Then re-render the sample short so I can see it."

Claude reads the source, rewrites the theme, and every short you make afterwards
matches your site. (The shipped theme + copy are Snáz.cz's — swap them out.)

## Layout

```
template/                     the Remotion project (compositions, scripts, brand assets)
videos/                       raw footage folders, one per short (gitignored)
dashboard/                    mobile upload/download web app — see dashboard/README.md
.claude/skills/create-short/  the skill that orchestrates the pipeline
```

---

## Set it up on a VPS or PC

Instructions for an agent (or a patient human) to stand the whole thing up on an
always-on box and expose it to your phone over Tailscale. No interactive login is
required — auth is via an API key, and the renders run fully headless. Commands
assume Ubuntu/Debian; adjust for your distro or for macOS.

### 1. Install system dependencies

```bash
sudo apt update
sudo apt install -y ffmpeg python3 git curl build-essential
# Node 20+ (NodeSource; or use nvm)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs
```

`whisper-cpp` (provides the `whisper-cli` binary the transcribe step needs).
If there's no system package, build it:

```bash
git clone https://github.com/ggerganov/whisper.cpp /tmp/whisper.cpp
make -C /tmp/whisper.cpp -j
sudo cp /tmp/whisper.cpp/build/bin/whisper-cli /usr/local/bin/
```

Download the Whisper model:

```bash
mkdir -p ~/.cache/whisper
curl -L -o ~/.cache/whisper/ggml-large-v3-turbo.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin
```

### 2. Install the Claude Code CLI (headless auth)

Install the CLI per [claude.com/claude-code](https://claude.com/claude-code),
then authenticate **without an interactive login** by exporting an API key — the
unattended renders inherit it:

```bash
export ANTHROPIC_API_KEY=sk-ant-...      # put this in the service env (step 5), not just your shell
claude --version                          # confirm it's on PATH — this is the dashboard's CLAUDE_BIN
```

### 3. Clone and install

```bash
git clone https://github.com/LukBrezina/snaz-shorts-template.git
cd snaz-shorts-template
( cd template  && npm install )           # Remotion
( cd dashboard && npm install )           # dashboard (one dep: formidable)
```

### 4. Pre-grant tools so headless renders don't stall

The dashboard runs `claude -p "/create-short <slug>"` with no terminal attached.
The pipeline shells out a lot (`ffmpeg`, `whisper-cli`, `npx remotion`, …) and
Claude Code would normally prompt before each — with no TTY the run just stalls.
Allowlist the tools in a repo-local `.claude/settings.json` at the repo root:

```json
{
  "permissions": {
    "allow": [
      "Read", "Write", "Edit", "Task",
      "Bash(scripts/:*)",
      "Bash(ffmpeg:*)", "Bash(ffprobe:*)", "Bash(whisper-cli:*)",
      "Bash(python3:*)", "Bash(npx:*)", "Bash(npm:*)", "Bash(node:*)",
      "Bash(sips:*)", "Bash(mkdir:*)", "Bash(cp:*)", "Bash(mv:*)"
    ]
  }
}
```

If a render stalls, the short's `.create-short.log` shows which tool was blocked
— add it. (Or, on a single-purpose box, edit `dashboard/server.js` to pass
`--dangerously-skip-permissions` to the spawn; broader, see
[`dashboard/README.md`](dashboard/README.md#headless-permissions-unattended-renders).)

### 5. Run the dashboard as a service

It binds `0.0.0.0:4321` by default so tailnet peers can reach it. Keep it alive
with systemd — create `/etc/systemd/system/shorts-dashboard.service`:

```ini
[Unit]
Description=Snáz shorts dashboard
After=network-online.target

[Service]
WorkingDirectory=/home/USER/snaz-shorts-template/dashboard
ExecStart=/usr/bin/node server.js
Environment=ANTHROPIC_API_KEY=sk-ant-...
Environment=CLAUDE_BIN=/usr/local/bin/claude
Restart=always
User=USER

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now shorts-dashboard
sudo systemctl status shorts-dashboard      # check it's running
```

### 6. Join Tailscale and connect from your phone

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
tailscale ip -4                              # the box's 100.x.y.z address
```

Install Tailscale on your phone, log into the **same** account, then open
`http://<box-100.x.y.z>:4321` (or the MagicDNS name, `http://<box-name>:4321`).
Use **➕ Nový short** to upload from your camera roll; the box renders in the
background; **🎬 Shorty** lets you download or share the result. "Add to Home
Screen" makes it feel like an app.

### Security

No auth by design — **Tailscale is the gate**, and uploads execute the Claude
Code CLI on the host. Only your own tailnet devices can reach `:4321`. Never
port-forward it or put it behind a public reverse proxy without adding
authentication.

---

## Licence & assets

Code is MIT (see `LICENSE`). The `template/public/logo/` files are **Snáz.cz**
trademarks — swap in your own. The bundled fonts (DM Serif Display + Outfit) are
under the SIL Open Font License.
