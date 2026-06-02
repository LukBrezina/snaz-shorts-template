# Snáz.cz — Shorts generator

Turn a folder of raw phone footage into a polished **1080×1920 vertical short**
(Instagram Reels / TikTok / YouTube Shorts), on-brand and end to end. It's a
[Remotion](https://remotion.dev) project plus a small pipeline of scripts and a
[Claude Code](https://claude.com/claude-code) skill that drives the whole thing:
identify the main talking-head clip, cut out re-takes, transcribe to karaoke
captions, time supporting screenshots/photos to the narration, render, then run
a generator↔reviewer loop until it's clean.

There's also a tiny **mobile dashboard** so you can do all of this from your
phone — upload footage, watch it render, download/share the result — by running
the generator on a PC or VPS behind [Tailscale](https://tailscale.com). See
[Run it from your phone](#run-it-from-your-phone-vps--pc-behind-tailscale).

## Layout

```
template/                 the Remotion project (compositions, scripts, brand assets)
  src/                    components + the data-driven `Short` composition
  scripts/                probe / transcribe / cut / render / review helpers
  public/                 fonts, logo, and media/ (footage — gitignored)
videos/                   raw source footage folders, one per short (gitignored)
dashboard/                mobile upload/download web app (Node, ~1 dependency)
.claude/skills/create-short/  the Claude Code skill that orchestrates the pipeline
```

## Quick start (local)

```bash
cd template
npm install
npm run studio          # Remotion Studio — live preview + props editor
```

In Studio you'll see the compositions in the sidebar; pick one, edit its props
on the right, scrub the timeline. To render a finished short from a footage
folder, see the step-by-step pipeline in
[`.claude/skills/create-short/SKILL.md`](.claude/skills/create-short/SKILL.md)
(run it with Claude Code, or follow it by hand).

For the template internals — compositions, captions, split-screen options, brand
tweaks — see [`template/README.md`](template/README.md).

## Make a short, in short

1. Drop a footage folder in `videos/<name>/` — the talking-head clip plus the
   screenshots/photos you talk about.
2. Run the **create-short** skill (or follow `SKILL.md`): it probes the folder,
   transcribes, cuts re-takes, builds `props.json`, and renders.
3. Out comes `videos/<name>/short.mp4`.

## Requirements

| Tool | Why | Install |
|------|-----|---------|
| **Node 18+** | Remotion + the dashboard | [nodejs.org](https://nodejs.org) / `nvm` |
| **ffmpeg / ffprobe** | probe, cut, normalise audio | `brew install ffmpeg` · `apt install ffmpeg` |
| **whisper-cpp** | Czech transcription (`whisper-cli`) | `brew install whisper-cpp` · [build from source](https://github.com/ggerganov/whisper.cpp) |
| **Python 3** | the cut script | preinstalled on most systems |
| **Claude Code CLI** | runs the `create-short` skill | [claude.com/claude-code](https://claude.com/claude-code) |

The first run downloads the Whisper model:

```bash
mkdir -p ~/.cache/whisper
curl -L -o ~/.cache/whisper/ggml-large-v3-turbo.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin
```

---

## Run it from your phone (VPS / PC, behind Tailscale)

You film on your phone, but rendering wants a real machine with `ffmpeg`, Whisper
and Node. The setup: run the generator + **dashboard** on a always-on box (a
cheap Linux VPS, or just your desktop), put that box on your private
[Tailscale](https://tailscale.com) network, and open the dashboard from your
phone's browser. Upload clips → it renders → download or share straight into
Instagram/TikTok. No ports exposed to the public internet, no auth to build —
Tailscale *is* the access control.

```
 📱 phone (Tailscale)  ──https──►  🖥️ VPS/PC (Tailscale)
   upload footage                  dashboard :4321
   download / share short          ├─ /create-short  (Claude Code → ffmpeg/Whisper/Remotion)
                                    └─ videos/<name>/short.mp4
```

### 1. Get the box ready

Any Linux box (Ubuntu/Debian example) or your own Mac/PC:

```bash
# system deps
sudo apt update && sudo apt install -y ffmpeg python3 git curl
# Node 18+ (nodesource, or use nvm)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs
# whisper-cpp — build from source if no package (provides `whisper-cli`)
#   git clone https://github.com/ggerganov/whisper.cpp && cd whisper.cpp && make && sudo cp build/bin/whisper-cli /usr/local/bin/
```

Then clone this repo and install both Node projects:

```bash
git clone https://github.com/LukBrezina/snaz-shorts-template.git
cd snaz-shorts-template
( cd template && npm install )      # Remotion
( cd dashboard && npm install )     # dashboard
# Whisper model (see Requirements above)
```

Install and log in to the **Claude Code CLI** on the box (this is what actually
runs `/create-short`):

```bash
# install per claude.com/claude-code, then:
claude            # log in once, interactively
claude --version  # confirm it's on PATH — this is dashboard's CLAUDE_BIN
```

Because the dashboard runs Claude Code **non-interactively**, you also need to
pre-grant the tools the pipeline shells out (ffmpeg, Whisper, Remotion, …) or the
unattended render stalls on a permission prompt. See
[dashboard/README.md → Headless permissions](dashboard/README.md#headless-permissions-unattended-renders).

### 2. Put the box on Tailscale

Install Tailscale on the box **and** on your phone (App Store / Play Store), log
both into the **same** Tailscale account:

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
tailscale ip -4          # the box's 100.x.y.z address — you'll use this from the phone
tailscale status         # or use the MagicDNS name, e.g. http://my-box:4321
```

Tailscale gives the box a stable private IP (`100.x.y.z`) reachable only by your
own devices. Nothing is published to the internet.

### 3. Start the dashboard

```bash
cd snaz-shorts-template/dashboard
npm start                # listens on 0.0.0.0:4321 by default
```

It binds `0.0.0.0` so your Tailscale peers can reach it. Override with env vars
if you like: `PORT=8080 CLAUDE_BIN=/usr/local/bin/claude npm start`.

**Keep it running** after you log out — pick one:

```bash
# systemd (recommended on a VPS) — create /etc/systemd/system/shorts-dashboard.service:
#   [Unit]
#   Description=Snáz shorts dashboard
#   After=network-online.target
#   [Service]
#   WorkingDirectory=/home/USER/snaz-shorts-template/dashboard
#   ExecStart=/usr/bin/node server.js
#   Environment=CLAUDE_BIN=/usr/local/bin/claude
#   Restart=always
#   User=USER
#   [Install]
#   WantedBy=multi-user.target
sudo systemctl enable --now shorts-dashboard

# …or quick and dirty:
npx pm2 start server.js --name shorts-dashboard && npx pm2 save
```

### 4. Use it from your phone

On your phone (connected to Tailscale), open:

```
http://<box-tailscale-ip>:4321      e.g. http://100.101.102.103:4321
# or, with MagicDNS enabled:  http://my-box:4321
```

- **➕ Nový short** → name it, pick photos/videos from your camera roll, upload.
  The box runs `/create-short` in the background.
- **🎬 Shorty** → watch the render land; when it's *hotovo*, tap **Sdílet** to
  open the native share sheet (Instagram/TikTok) or **Stáhnout** to save the MP4.

> **Tip — add it to your home screen.** In mobile Safari/Chrome, "Add to Home
> Screen" makes the dashboard feel like an app.

### Security

The dashboard has **no authentication**, and uploads trigger code execution
(they spawn the Claude Code CLI). That's fine *because Tailscale is the gate* —
only your own devices can reach it. **Never** port-forward it or put it behind a
public reverse proxy without adding auth. Keep `HOST` on the Tailscale interface
or `0.0.0.0` within the tailnet; don't expose `:4321` to `0.0.0.0` on a public IP.

---

## Brand assets & fonts

The `public/logo/` files are **Snáz.cz** brand marks — reuse the structure, but
swap in your own logo if you fork this. Fonts (DM Serif Display + Outfit) load at
render time via `@remotion/google-fonts`; both are licensed under the SIL Open
Font License. Code is MIT (see `LICENSE`).
