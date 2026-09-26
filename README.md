<img src="app/assets/images/doctor.jpg" alt="Dr. Daniel Reyes, BRIAN's demo physician" width="150" align="right">

# BRIAN

**B**uilt for patients · **R**eliable prescription management · **I**ntegrated AI doctor · **A**lways connected to your physician · **N**ext-generation healthcare

BRIAN is a healthcare app with two sides, **patient** and **doctor**, connected live. Patients manage prescriptions, message their physician in real time, and ask an evidence-backed AI doctor to explain what their doctor wrote, answer drug and dosing questions, or flag red-flag symptoms. A Lessons library covers the healthcare system, insurance, patient rights, emergencies, illness, medications, cosmetic care and wellness.

> [!WARNING]
> **Hackathon demo. Not medical advice, and not for real patient data.** In an emergency call **911**. Mental-health crisis: call or text **988**. Poisoning: Poison Control **1-800-222-1222**.

**Quick start** (after installing [Git and Node.js 24 LTS](#1-install-the-prerequisites)):

```bash
git clone https://github.com/Alopalao/Shellhacks.git
cd Shellhacks
npm run setup
npm run dev:web
```

Then open http://localhost:8081 in a normal window and a private window. Sign in as the patient in one and the doctor in the other.

---

## Contents

- [Features](#features) · [How it works](#how-it-works)
- [1. Install the prerequisites](#1-install-the-prerequisites) ([macOS](#macos-terminal) · [Windows](#windows-1011-powershell))
- [2. Get the code and install](#2-get-the-code-and-install)
- [3. Run the demo](#3-run-the-demo) (browser · phones · two laptops)
- [Networking: phones and other computers](#networking-phones-and-other-computers)
- [Environment variables](#environment-variables-all-optional)
- [Troubleshooting](#troubleshooting)
- [Scripts](#scripts) · [Testing](#testing) · [Project structure](#project-structure) · [Safety](#safety)

## Features

| Patient | Doctor |
|---|---|
| **Home**: today's doses (tap to log), adherence, doctor card with online status, latest visit note | **Patients**: live list with online dots, 7-day adherence, pending refills, unread messages |
| **Meds**: prescriptions, dose history, refill requests, FDA drug info, self-reported OTC meds | **Patient chart**: prescribe/edit/pause/discontinue, 14-day adherence grid, refills, visit notes, allergies |
| **BRIAN AI**: AI doctor that explains doctor's notes, drugs and dosing, with PubMed / NIH MedlinePlus / FDA citations and emergency triage | **Evidence AI**: clinician-mode literature assistant |
| **Care**: real-time chat with the physician (typing, read receipts), visit notes with "Explain this with BRIAN" | **Inbox**: approve/deny refills, live activity feed |
| **Lessons**: 60 sourced lessons in 8 categories, with quizzes | **Messages**: real-time chat with every patient |

Everything is pushed live over Socket.IO: messages, typing, new prescriptions, refill decisions, visit notes, logged doses and online presence.

**Demo login:** any email and any password are accepted, and the server replies `lgtm`. A new email creates a new account (tick "I'm a doctor" for a doctor account). The login screen also has one-tap **Demo patient** / **Demo doctor** buttons.

| Role | Email | Password |
|---|---|---|
| Patient (Maya Johnson) | `patient@brian.demo` | anything |
| Doctor (Dr. Daniel Reyes) | `doctor@brian.demo` | anything |
| Second patient (Jordan Lee) | `jordan@brian.demo` | anything |

## How it works

```
  Patient app                        Doctor app
  (Expo Go on a phone, or browser)   (Expo Go on a phone, or browser)
        │                                  │
        │  REST /api/*  +  Socket.IO live events (chat, Rx, refills, notes, doses, presence)
        └───────────────┬──────────────────┘
                        ▼
        BRIAN server · port 4000 · Node + TypeScript, Express 5, Socket.IO
        ├── JSON data file: server/data/db.json (seeded demo data, git-ignored)
        └── AI doctor: triage → evidence → answer
              ├── Claude (only when ANTHROPIC_API_KEY is set)
              └── PubMed · NIH MedlinePlus · openFDA drug labels · RxNorm (no keys needed)

        Expo dev server (Metro) · port 8081: serves the app to Expo Go and the web app to browsers
```

Everyone who should see each other live (the patient and the doctor) must use the **same** BRIAN server. The app finds it automatically:

- **Browser**: the same host as the page, port 4000 (or `EXPO_PUBLIC_API_PORT`, see [environment variables](#environment-variables-all-optional)). `http://localhost:8081` → `http://localhost:4000`; `http://192.168.1.23:8081` → `http://192.168.1.23:4000`.
- **Expo Go**: the computer that ran `expo start`, port 4000.
- **Override**: tap **"Server: … · Change"** at the bottom of the login screen (or Profile → **Server & connection**), enter the address, then **Test connection**. The app saves it on that device. **Use automatic** switches back. You can also set `EXPO_PUBLIC_API_URL` in `app/.env`.

---

## 1. Install the prerequisites

You need **Git** and **Node.js 24 LTS**. BRIAN supports Node `^22.13.0 || ^24.3.0 || >=26`, and `npm run setup` checks this. Phones also need the free **Expo Go** app (App Store / Google Play), and it must support **Expo SDK 57** (see [Expo Go version](#expo-go-says-the-project-is-incompatible)). Watchman is **not** required.

### macOS (Terminal)

```bash
# 1. Homebrew (skip if `brew -v` already works). When it finishes, run the
#    "Next steps" commands it prints, which add brew to your PATH.
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Git and Node 24 LTS
brew install git node@24
brew link --overwrite --force node@24

# 3. Check (open a new Terminal window first)
node -v      # v24.x
git --version
```

<details><summary>No Homebrew? Other options</summary>

- **Installer:** download the macOS installer from https://nodejs.org (choose **LTS**). For Git, run `xcode-select --install`, or skip it: macOS offers to install Git the first time you run `git`.
- **nvm:** `nvm install 24`, or `nvm install` inside the repo, since it has an `.nvmrc`. fnm works the same way.
</details>

### Windows 10/11 (PowerShell)

Open **PowerShell** (Start → type "PowerShell"). Run one command per line:

```powershell
winget install --id Git.Git -e --source winget --accept-source-agreements --accept-package-agreements
winget install --id OpenJS.NodeJS.LTS -e --source winget --accept-source-agreements --accept-package-agreements
```

**Close PowerShell and open a new window**, so `git` and `node` are on your PATH. Then check:

```powershell
node -v          # v24.x (or v22.13+)
git --version
```

- **`npm` is blocked** ("npm.ps1 cannot be loaded because running scripts is disabled on this system"). Windows blocks PowerShell scripts by default. Run this once, answer `Y`, and try again:
  ```powershell
  Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
  ```
  You can also use **Command Prompt** (`cmd`) or **Git Bash** instead, where the same `npm` commands work.
- **No `winget`?** (older Windows 10.) Install "App Installer" from the Microsoft Store, or download Node **LTS** from https://nodejs.org and Git from https://git-scm.com/downloads/win.
- Windows PowerShell 5.1 doesn't support `&&`, so run the commands in this README one per line.
- Clone somewhere **outside OneDrive**. Synced folders like Documents or Desktop can lock files in `node_modules`, so `C:\dev` or your home folder is safer.

---

## 2. Get the code and install

The steps are the same on macOS (Terminal) and Windows (PowerShell / cmd):

```bash
git clone https://github.com/Alopalao/Shellhacks.git
cd Shellhacks
npm run setup
```

`npm run setup` (a few minutes the first time):

1. checks your Node.js version, and explains how to install Node 24 if it's too old;
2. installs the root, `server/` and `app/` dependencies;
3. creates `.env` and `app/.env` from their `.example` files if they don't exist yet (it never overwrites them). Every key is **optional and blank**, and BRIAN runs in demo mode without them;
4. prints the next steps.

Optional check: `npm run doctor` verifies Node, npm, dependencies, free ports and your LAN IP, and says how to fix anything that's wrong.

---

## 3. Run the demo

### A. One computer, two browser windows (easiest)

```bash
npm run dev:web
```

This starts the API on port 4000 and the web app on **http://localhost:8081**, and usually opens a browser for you. Open the same URL in a **private/incognito window** (or a second browser), because each sign-in is stored per browser profile. Sign in as the **patient** in one window and the **doctor** in the other. Then chat, prescribe, request and approve a refill, and watch both sides update live.

### B. Two phones with Expo Go (same Wi-Fi as the computer)

```bash
npm run dev
```

1. Connect the computer and both phones to the **same Wi-Fi**.
2. Scan the QR code in the terminal: with the **Camera** app on iPhone, or the **Scan QR code** button in Expo Go on Android. On iPhone, allow Expo Go to **find devices on your local network** when asked.
3. One phone signs in as the patient, the other as the doctor.

The app reaches the API automatically at `http://<this computer's LAN IP>:4000`. In the terminal, press `w` to also open the web version, or `r` to reload the app. Browsers and phones can be mixed: for example, the patient on a phone and the doctor in a laptop browser.

### C. Two laptops

Everyone must use **one** server. Laptop 1 runs it:

```bash
npm run dev:web
npm run lan        # in a second terminal: prints this laptop's LAN IP and URLs
```

Laptop 2 then picks **one** of these:

- **Nothing to install:** open `http://<laptop-1-IP>:8081` in Laptop 2's browser. The web app automatically uses Laptop 1's server at `http://<laptop-1-IP>:4000`.
- **Run the app locally** (after `npm run setup`): `npm run web`, then on the login screen tap **"Server: … · Change"**, enter `http://<laptop-1-IP>:4000` and tap **Test connection**.

Phones with Expo Go can join Laptop 1's session too: scan the QR from a `npm run dev` on Laptop 1.

> [!NOTE]
> `EXPO_PUBLIC_API_URL` in `app/.env` pins the app to one server. Expo reads it at start-up, so **restart** `npm run dev` / `npm run dev:web` after changing it, and add `--clear` if the old address sticks: `npm run dev:web -- --clear`. For static web builds use `npm run export:web`, which always clears the cache. A plain `npx expo export` can silently keep the old value from Metro's cache. The in-app "Server: … · Change" setting needs no restart.

---

## Networking: phones and other computers

**Find your LAN IP:** `npm run lan` works on every OS and ignores VPN/WSL/Docker adapters. It also prints the URLs to use. Manual alternatives:

- macOS: `ipconfig getifaddr en0` (Wi-Fi on most Macs; try `en1` if it prints nothing)
- Windows: run `ipconfig` and read **IPv4 Address** under your "Wireless LAN adapter Wi-Fi"

**Firewall prompts.** The first `npm run dev` / `dev:web` makes Node listen on ports 4000 and 8081, and your OS may ask about it:

- **Windows:** the "Windows Defender Firewall has blocked some features of Node.js JavaScript Runtime" prompt. Tick **both Private and Public networks**, because hackathon and campus Wi-Fi is usually "Public". Then click **Allow**. If you clicked Cancel, go to Windows Security → Firewall & network protection → **Allow an app through firewall** → Change settings → tick *Node.js JavaScript Runtime* for Private and Public. Or set your Wi-Fi to Private: Settings → Network & internet → Wi-Fi → *your network* → Network profile type → **Private**.
- **macOS:** only if the firewall is on. Click **Allow** on "Do you want the application "node" to accept incoming network connections?" To fix it later: System Settings → Network → Firewall → Options → set *node* to **Allow incoming connections**.
- **iPhone:** Expo Go needs **Local Network** access, under Settings → Privacy & Security → Local Network → Expo Go.

**Several network adapters (VPN, WSL, Docker, VirtualBox).** Expo may put the wrong IP in the QR code. Disconnect the VPN, or tell Expo which IP to use:

```bash
# macOS
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.23 npm run dev
```
```powershell
# Windows PowerShell
$env:REACT_NATIVE_PACKAGER_HOSTNAME="192.168.1.23"
npm run dev
```

**The venue Wi-Fi blocks device-to-device traffic** (client isolation, common at hackathons). The phone shows "Could not connect" or times out even though the firewall is fine. Options, from easiest:

1. **Phone hotspot:** connect the laptop and the other devices to one phone's personal hotspot and run `npm run dev` again. The QR code picks up the new IP.
2. **Browser-only on one laptop:** mode A (two browser windows) needs no network at all.
3. **Tunnels** (the phones only need internet; this uses two tunnels, because Expo's `--tunnel` only forwards the app bundle and not the API):
   - API: install [cloudflared](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/) (`brew install cloudflared` / `winget install --id Cloudflare.cloudflared`). Run `npm run server` in one terminal and `cloudflared tunnel --url http://localhost:4000` in another. Copy the `https://….trycloudflare.com` URL it prints. It needs no account. `ngrok http 4000` also works if you have an ngrok account.
   - App: `npm run dev -- --tunnel` (Expo offers to install `@expo/ngrok` the first time; answer yes). This also starts the server if the one above isn't running, or reuses it if it is.
   - On each phone, scan the QR code. Because the Expo tunnel only forwards Metro, the login screen shows **"Tunnel mode: connect to your BRIAN server"** and asks for the server's public `https://` address: paste the `https://…trycloudflare.com` URL, then tap **Test connection**. (Change it later under Profile → **Server & connection**.)
   - Any tunnel that exposes port 4000 works: `ngrok http 4000` (free ngrok account) or `npx localtunnel --port 4000` (no account; open its URL once in a browser and follow its one-time reminder page before using it in the app).

**Without Expo Go:** a phone browser works too. Open `http://<laptop-IP>:8081` while `npm run dev:web` runs.

---

## Environment variables (all optional)

`npm run setup` creates `.env` (server) and `app/.env` (app) from the `.example` files. Leave everything blank for the demo: every integration falls back to a working demo mode. **Restart the server** after editing `.env` (`Ctrl+C`, then `npm run dev` again).

| Variable | File | What it does when set | How to get it |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | `.env` | Uses Claude for AI doctor answers. When blank, answers come from live PubMed / MedlinePlus / FDA evidence plus a jargon glossary, labelled **Demo mode**. | https://platform.claude.com/settings/keys (Anthropic Console → API keys; paid usage) |
| `CLAUDE_MODEL`, `CLAUDE_EFFORT` | `.env` | Claude model (default `claude-opus-5`) and effort `low`…`max` (default `medium`) | n/a |
| `NCBI_API_KEY`, `NCBI_EMAIL` | `.env` | PubMed rate limit rises from 3 to 10 requests/second. NCBI asks E-utilities users to give a contact email. | Free: sign in at https://account.ncbi.nlm.nih.gov/settings/ → API Key Management → Create |
| `OPENFDA_API_KEY` | `.env` | openFDA daily limit rises from 1,000 per IP to 120,000 per key | Free: https://open.fda.gov/apis/authentication/ (enter your email) |
| `PORT`, `HOST` | `.env` | API port and bind address (default `4000`, `0.0.0.0`). `npm run dev` / `dev:web` pass `PORT` to the app as `EXPO_PUBLIC_API_PORT`, so auto-detection follows it. | n/a |
| `BRIAN_EVIDENCE_OFFLINE=1` | `.env` | No outbound evidence lookups, for a fully offline demo. The AI still translates jargon, with fewer sources. | n/a |
| `BRIAN_DATA_FILE` | `.env` | Where the JSON data lives (default `server/data/db.json`) | n/a |
| `EXPO_PUBLIC_API_URL` | `app/.env` | Pins the app to one server, e.g. `http://192.168.1.23:4000` (see the note in [section 3](#c-two-laptops)) | n/a |
| `EXPO_PUBLIC_API_PORT` | `app/.env` | Port used for auto-detected server URLs (default `4000`). Only needed when the server's `PORT` isn't 4000 and you start Expo yourself (`npm run app` / `npm run web`); `npm run dev` sets it for you. | n/a |

Never commit `.env`. It is git-ignored, and only the `.example` files are tracked.

---

## Troubleshooting

`npm run doctor` catches most setup problems. Common issues:

#### "Port 4000 is already in use"
`npm run dev` reuses a BRIAN server that is already running on port 4000. For any other program on the port, it prints how to stop it:
- **macOS:** `lsof -nP -iTCP:4000 -sTCP:LISTEN` shows the PID, then `kill <PID>`. Or run `kill $(lsof -ti tcp:4000)`.
- **Windows:** `netstat -ano | findstr :4000` shows the PID in the last column, then `taskkill /PID <PID> /F`. In PowerShell: `Stop-Process -Id (Get-NetTCPConnection -LocalPort 4000 -State Listen).OwningProcess`.

Port **8081** busy? McAfee often uses it on Windows. Expo offers another port, so answer **Y** and open `http://localhost:8082` instead. The app still finds the API on port 4000.

#### The phone can't reach the server / "Could not connect"
Check that the phone and computer are on the same Wi-Fi, allow the firewall prompts (both Private and Public on Windows), and allow Local Network on iPhone. On hackathon Wi-Fi, see [client isolation](#networking-phones-and-other-computers) (hotspot or tunnels). On the login screen, "Server: …" shows which address the app is trying. Open `http://<that address>/api/health` in the phone's browser: if it doesn't load, the problem is the network, not the app.

#### Expo Go says the project is incompatible
BRIAN uses **Expo SDK 57**, and the store version of Expo Go supports only the latest SDK.
- If Expo Go is **older**: update it from the App Store or Google Play.
- If Expo Go is **newer** (SDK 58+): on Android, install the SDK 57 build from https://expo.dev/go. On iPhone, use the phone's browser at `http://<laptop-IP>:8081` instead. You could also upgrade the project (`cd app`, then `npx expo install expo@^58 --fix`), but that's a bigger change, so test it before a demo.

#### "Node.js … is not supported" / odd install errors
Install Node 24 LTS (see [prerequisites](#1-install-the-prerequisites)), open a **new** terminal, and run `npm run setup` again. If an install keeps failing, delete `node_modules` in `server/` or `app/` and retry.

#### `npm` / `node` / `git` "is not recognized" (Windows)
Close and reopen the terminal after installing. If PowerShell says scripts are disabled, see the [execution-policy fix](#windows-1011-powershell).

#### Strange bundler errors, or old code/config still showing
Clear the Metro cache: `npm run dev -- --clear` (or `npm run dev:web -- --clear`). Inside `app/`: `npx expo start -c`.

#### Changed `EXPO_PUBLIC_API_URL` / `EXPO_PUBLIC_API_PORT` but the app still uses the old server
`EXPO_PUBLIC_*` values are inlined into the bundle, and Metro's cache can keep the old ones. After changing them, restart Expo with a cleared cache: `npm run dev -- --clear` / `npm run dev:web -- --clear` from the repo root, or `npx expo start -c` inside `app/`. `npm run export:web` (and `npm --prefix app run export:web`) always passes `--clear`. To switch servers without a restart, use the in-app override: **"Server: … · Change"** on the login screen, or Profile → **Server & connection**.

#### Messy demo data
`npm run reset-data` re-seeds everything. If the server is running, it resets the live data: open screens refresh, the demo accounts stay signed in, and accounts created during the demo are removed. You can also do it in the app: Profile (your avatar, top right) → **Reset demo data**.

#### The AI says "Demo mode"
Expected without `ANTHROPIC_API_KEY`. Answers still cite live NIH/FDA sources. Add a key to `.env` and restart the server to use Claude.

---

## Scripts

Run these from the repo root. They work in macOS/Linux terminals, PowerShell and cmd.

| Command | What it does |
|---|---|
| `npm run setup` | Check Node, install all dependencies, create `.env` / `app/.env` if missing |
| `npm run doctor` | Check Node, npm, dependencies, `.env`, ports 4000/8081 and your LAN IP |
| `npm run lan` | Print this computer's LAN IP and the URLs phones / other laptops should use |
| `npm run dev` | API server + Expo (QR code for phones). Extra Expo flags go after `--`, e.g. `npm run dev -- --clear` |
| `npm run dev:web` | API server + web app at http://localhost:8081 |
| `npm run server` | API server only (port 4000, restarts when server code changes) |
| `npm run app` / `npm run web` | Expo only (phones / web). Needs a server somewhere |
| `npm run export:web` | Static web build in `app/dist` (clears the Metro cache so `EXPO_PUBLIC_API_URL` is applied) |
| `npm run typecheck` | TypeScript checks for server + app |
| `npm test` | Server test suite (Vitest; offline, never touches your data) |
| `npm run setup:e2e` / `npm run test:e2e` | Install / run the live two-user browser test (see below) |
| `npm run reset-data` | Re-seed the demo data |

`Ctrl+C` stops `npm run dev` / `dev:web`, including the server.

## Testing

- `npm run typecheck`: strict TypeScript for `server/` and `app/`.
- `npm test`: server unit and integration tests (REST, Socket.IO, auth, AI triage/glossary/citations). They run offline against a temporary data file. Live evidence-API checks are opt-in: `cd server`, then `LIVE=1 npx vitest run test/evidence-live.test.ts` (macOS; in PowerShell, set `$env:LIVE="1"` first).
- `e2e/`: a Playwright script that plays the whole demo with a patient and a doctor side by side: login, presence, chat, prescriptions, doses, refills, visit notes, BRIAN AI, lessons and reconnects. Install once with `npm run setup:e2e`. Start `npm run dev:web`, then run `npm run test:e2e` in a second terminal. See [e2e/README.md](e2e/README.md) for options such as `--managed` and `--headed`.

## Project structure

```
server/            Node + TypeScript API (ESM, run with tsx, no build step)
  src/routes/        REST endpoints (auth, prescriptions, doses, refills, notes, threads, dashboards)
  src/realtime/      Socket.IO: live events + presence
  src/ai/            AI doctor: triage, jargon glossary, retrieval, Claude / demo answers
  src/evidence/      PubMed, MedlinePlus, openFDA, RxNorm clients
  src/db/            JSON-file store, demo seed data, reset
  test/              Vitest suite
app/               Expo SDK 57 app (iOS/Android via Expo Go, and web)
  src/app/           expo-router screens: welcome, login, patient/*, doctor/*
  src/features/      chat, meds, AI, notes, lessons, doctor tools
  src/lessons/       60 sourced lessons (8 categories)
  src/lib/           API client, auth, socket, server-URL detection
e2e/               Playwright live-demo test
scripts/           setup / dev / doctor / lan helpers (plain Node, cross-platform)
docs/              SPEC.md (architecture, API, realtime events), DEMO_SCRIPT.md (live demo run-sheet)
```

The API stores its data in `server/data/db.json`. The file is created and seeded on first run and is git-ignored.

## Safety

BRIAN is a hackathon demo, **not a medical device and not medical advice**. AI answers and lessons are educational, and cite public sources such as NIH MedlinePlus, PubMed, FDA drug labels and CDC. They may still be incomplete or wrong. Always follow your own clinician or pharmacist. Insurance and legal lessons are US-centric general information, not legal advice. **Do not enter real patient data:** demo sign-in has no real security (any password works), and the data sits in a plain JSON file. In an emergency call **911**. For a mental-health crisis call or text **988**. For poisoning, call Poison Control at **1-800-222-1222**.
