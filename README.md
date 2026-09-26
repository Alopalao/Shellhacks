# BRIAN

**B**uilt for patients · **R**eliable prescription management · **I**ntegrated AI doctor · **A**lways connected to your physician · **N**ext-generation healthcare

BRIAN is a healthcare app with two sides, **patient** and **doctor**, connected live. Patients manage prescriptions, message their physician in real time, and ask an evidence-backed AI doctor to explain what their doctor said, answer drug and dosing questions, or flag red-flag symptoms. A Lessons library covers the healthcare system, insurance, liability, emergencies, illness and cosmetic care.

> ⚠️ Hackathon demo. Not medical advice, and not for real patient data. In an emergency call **911**. Mental-health crisis: **988**. Poisoning: **1-800-222-1222**.

---

## Features

| Patient | Doctor |
|---|---|
| **Home**: today's doses (tap to log), adherence, doctor card with online status, latest visit note | **Patients**: live list with online dots, 7-day adherence, pending refills, unread messages |
| **Meds**: prescriptions, dose history, refill requests, FDA drug info, self-reported OTC meds | **Patient chart**: prescribe/edit/pause/discontinue, 14-day adherence grid, refills, visit notes |
| **BRIAN AI**: AI doctor that explains doctor's notes, drugs and dosing, with PubMed / NIH MedlinePlus / FDA citations and emergency triage | **Evidence AI**: clinician-mode literature assistant |
| **Care**: real-time chat with the physician (typing, read receipts), visit notes with "Explain with BRIAN" | **Inbox**: approve/deny refills, live activity feed |
| **Lessons**: 56 sourced lessons in 8 categories, with quizzes | **Messages**: real-time chat with every patient |

Everything is pushed live over Socket.IO: messages, new prescriptions, refill decisions, visit notes, logged doses and presence.

**Demo login:** any email and any password are accepted, and the server replies `lgtm`. Seeded accounts:

| Role | Email | Password |
|---|---|---|
| Patient (Maya Johnson) | `patient@brian.demo` | anything |
| Doctor (Dr. Daniel Reyes) | `doctor@brian.demo` | anything |

---

## 1. Install the prerequisites

You need **Git** and **Node.js 24 LTS** (Node 22.13+ also works). Phones additionally need the free **Expo Go** app (App Store / Google Play), which must support Expo SDK 57.

### macOS (Terminal)

```bash
# Homebrew (skip if `brew -v` already works)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

brew install git node@24
brew link --overwrite --force node@24   # put node 24 on your PATH
node -v                                  # should print v24.x
```

No Homebrew? Install the LTS package from https://nodejs.org and Git from https://git-scm.com instead.

### Windows 10/11 (PowerShell)

```powershell
winget install --id Git.Git -e
winget install --id OpenJS.NodeJS.LTS -e
# Close and reopen PowerShell so git/node are on PATH, then:
node -v    # should print v24.x (or v22.13+)
```

If PowerShell blocks `npm` with an execution-policy error, run this once:
`Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

---

## 2. Get the code and install

Same on macOS and Windows:

```bash
git clone https://github.com/Alopalao/Shellhacks.git
cd Shellhacks
npm run setup
```

`npm run setup` installs the root, `server/` and `app/` dependencies (a few minutes the first time).

**Optional: environment files.** BRIAN runs without them. Every key is optional and blank by default, and features fall back to a demo mode.

```bash
# macOS
cp .env.example .env && cp app/.env.example app/.env
```
```powershell
# Windows
Copy-Item .env.example .env; Copy-Item app\.env.example app\.env
```

| Variable (`.env`) | What it does when set |
|---|---|
| `ANTHROPIC_API_KEY` | Uses Claude for AI doctor answers. When blank, answers come from live PubMed / MedlinePlus / FDA evidence plus a jargon glossary (marked "Demo mode"). Key: https://console.anthropic.com |
| `CLAUDE_MODEL`, `CLAUDE_EFFORT` | Model (default `claude-opus-5`) and effort (default `medium`) |
| `NCBI_API_KEY`, `NCBI_EMAIL` | Higher PubMed rate limit (works without). Key: https://www.ncbi.nlm.nih.gov/account/ |
| `OPENFDA_API_KEY` | Higher openFDA limit (works without). Key: https://open.fda.gov/apis/authentication/ |
| `PORT`, `HOST` | API server port and bind address (default `4000`, `0.0.0.0`) |
| `BRIAN_EVIDENCE_OFFLINE=1` | Turns off all outbound evidence lookups (fully offline demo) |
| `EXPO_PUBLIC_API_URL` (**`app/.env`**) | Points the app at a specific server, e.g. `http://192.168.1.23:4000` |

---

## 3. Run the demo

### A. One computer, two browser windows (easiest)

```bash
npm run dev:web
```

This starts the API on port 4000 and the web app on http://localhost:8081. Open it in a normal window and in a private/incognito window. Log in as the **patient** in one and the **doctor** in the other, then chat, prescribe, approve refills and watch updates appear live.

### B. Two phones with Expo Go (same Wi-Fi as the computer)

```bash
npm run dev
```

Scan the QR code in the terminal with the Camera app (iOS) or Expo Go (Android). The app finds the API automatically at `http://<your-computer's-LAN-IP>:4000`. Press `w` in the terminal to also open the web version.

### C. Two laptops

1. Laptop 1 runs everything: `npm run dev:web`. The server prints its LAN URL, e.g. `http://192.168.1.23:4000`.
2. Laptop 2 runs `npm run web`. On the login screen, open the server setting and enter Laptop 1's URL, then **Test connection**. You can also set `EXPO_PUBLIC_API_URL` in `app/.env`.

**Finding your LAN IP.** macOS: `ipconfig getifaddr en0`. Windows: run `ipconfig` and look for "IPv4 Address".

**Firewall.** The first run may ask whether to allow Node.js to accept incoming connections. Allow it on **private** networks (Windows) or click **Allow** (macOS), or other devices can't connect.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Port 4000 or 8081 already in use | macOS: `lsof -ti :4000 \| xargs kill`. Windows: `netstat -ano \| findstr :4000`, then `taskkill /PID <pid> /F` |
| Phone can't reach the server | Same Wi-Fi? Firewall allowed? Venue Wi-Fi often isolates devices from each other: use a phone hotspot for both devices, or run `npx expo start --tunnel` in `app/` and point the app at a tunnel for port 4000 |
| "Project is incompatible with this version of Expo Go" | Update Expo Go from the App Store / Play Store (needs SDK 57 support) |
| Weird bundler errors | `cd app && npx expo start -c` (clears the Metro cache) |
| Demo data looks stale / messy | `npm run reset-data` (or Profile → Reset demo data) |
| AI says "Demo mode" | Expected without `ANTHROPIC_API_KEY`. Answers still cite live NIH/FDA evidence |

---

## Scripts

| Command | What it does |
|---|---|
| `npm run setup` | Install all dependencies |
| `npm run dev` | API server + Expo (QR code for phones) |
| `npm run dev:web` | API server + web app at http://localhost:8081 |
| `npm run server` | API server only (port 4000, auto-restarts on changes) |
| `npm run app` / `npm run web` | Expo only (native / web) |
| `npm run typecheck` | TypeScript checks for server + app |
| `npm test` | Server test suite (Vitest) |
| `npm run reset-data` | Re-seed the demo data |

## Project structure

```
server/   Node + TypeScript API: Express 5, Socket.IO, JSON-file store, AI doctor (Claude + PubMed/MedlinePlus/openFDA/RxNorm)
app/      Expo SDK 57 app (iOS/Android via Expo Go, and web): expo-router screens for patient + doctor
docs/     SPEC.md: architecture, API, realtime events
```

The API stores data in `server/data/db.json` (created and seeded on first run, git-ignored).
