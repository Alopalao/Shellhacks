# BRIAN live demo — end-to-end test

A Playwright script that plays the pitch: a **patient** (390×844 phone viewport) and a **doctor**
(1280×800 desktop) in two browser contexts, talking to one BRIAN server in real time. Nothing in
`app/` or `server/` is imported or modified; the test only drives the web UI (plus a few REST calls
for setup, cleanup and cross-checks).

| Step | What it checks |
|---|---|
| 1a–1b | Welcome → Get started → login → **LGTM ✓** confirmation → the right home for each role |
| 1c | Signing up a brand-new patient and a brand-new doctor; the demo doctor's list picks up the new patient live |
| 2 | Presence: doctor sees Maya online, patient sees the doctor online, a second patient (Jordan) goes online → offline |
| 3a | Chat both ways without refresh, "typing…" indicator, **Seen** receipts |
| 3b | Toasts + unread badges (patient Care tab, doctor Messages tab), **Sent → Seen** when the doctor opens the thread |
| 3c | Patient shares a visit note → attachment card on both sides |
| 4a–4b | Doctor prescribes → patient Meds/Home update live + toast; edit strength, pause, discontinue → reflected live |
| 5 | Patient logs / undoes a dose → doctor's 14-day adherence grid and Inbox activity update live |
| 6 | Patient requests a Metformin refill → doctor Inbox live → approve with 3 refills → patient sees *Approved* and the new count |
| 7 | Doctor writes a visit note → patient toast (tapped) → note → **Explain this with BRIAN** → answer with glossary + sources |
| 8 | BRIAN AI: medication question (FDA label / NSAIDs), emergency message (triage banner + Call 911), history survives a reload |
| 9 | Lessons: open a lesson, take the quiz, mark complete, "Ask BRIAN" deep link |
| 10a | Patient edits allergies → doctor's chart updates live (the original allergies are restored afterwards) |
| 10b | Server stops → "Reconnecting to BRIAN…" on both → server restarts → reconnects and chat is live again (managed mode only) |

## Setup (once)

```bash
npm run setup                  # repo root: installs server + app deps
npm run setup:e2e              # repo root: `npm install` in e2e/ + the pinned Chromium build
```

(Equivalent by hand: `cd e2e`, `npm install`, `npx playwright install chromium`.)

## Run it

### A. Against `npm run dev:web` (quickest)

```bash
npm run dev:web                # repo root — server on :4000, web on :8081
npm run test:e2e               # repo root, in a second terminal (same as `cd e2e`, `npm test`)
```

The first page load waits for Metro to bundle (up to 3 min, `E2E_FIRST_LOAD_TIMEOUT`).

### B. Isolated run with a private server (recommended before a demo; includes the server-restart step)

```bash
# 1. a static web build (any EXPO_PUBLIC_API_URL — the test points the app at BRIAN_API_URL itself)
cd app && npx expo export --platform web --output-dir /tmp/brian-web
npx --yes serve -s /tmp/brian-web -l 8200        # keep running

# 2. the test starts/stops its own server on BRIAN_API_URL's port with a throw-away data file
cd e2e
BRIAN_WEB_URL=http://localhost:8200 BRIAN_API_URL=http://localhost:4200 npm run test:managed
```

Windows (PowerShell): `$env:BRIAN_WEB_URL="http://localhost:8200"; $env:BRIAN_API_URL="http://localhost:4200"; npm run test:managed`

Make sure nothing else listens on the API port in managed mode.

## Options

| Env var / flag | Default | Meaning |
|---|---|---|
| `BRIAN_WEB_URL` | `http://localhost:8081` | Where the web app is served |
| `BRIAN_API_URL` | `http://localhost:4000` | The BRIAN server |
| `--managed` / `E2E_MANAGE_SERVER=1` | off | Start a private server (temp data file) on the API port; enables step 10b |
| `--reset` / `E2E_RESET=1` | off | `POST /api/admin/reset` before the run (wipes + re-seeds demo data; accounts created during the demo are removed and signed out) |
| `--headed` / `HEADED=1` | off | Show the browsers (with `SLOWMO` ms between actions, default 150) |
| `E2E_ONLY=3,4` | all | Run only these step numbers (setup always runs; later steps assume earlier ones ran) |
| `E2E_PIN_SERVER_URL=0` | pinned | Don't inject `brian.serverUrl` into localStorage — test the build's own server-URL detection |
| `E2E_SHOTS` | `e2e/shots` | Screenshots (`NN-*.png`, `FAIL-<step>-<role>.png`) + `results.json` |
| `E2E_TIMEOUT` | `15000` | Per-assertion timeout (ms) |

Exit code: `0` all passed · `1` a step failed · `2` setup failed (server/web not reachable, seed data missing).

## Side effects

Against a shared server the run leaves demo artifacts behind: two new accounts
(`e2e.patient.<run>@example.com`, `e2e.doctor.<run>@example.com`, the patient is assigned to Dr. Reyes),
chat messages and a visit note tagged `e2e <run>`, a discontinued *Amlodipine* for Maya, +3 Metformin
refills, AI conversations. Leftover e2e prescriptions and pending Metformin refills from an interrupted run are
cleaned up at the start. Use managed mode (B) or `--reset` to keep the demo data pristine.

Each run signs in to the demo patient and doctor accounts twice (once in the browser, once over REST). The server
keeps at most 20 sessions per account (idle, least recently used ones are dropped first), so running the suite many times against the server you present
from can eventually sign your own demo browser out — another reason to prefer managed mode.

## Notes for maintainers

- There are no `testID`s in the app; selectors use accessibility labels/roles (e.g. `Demo patient: sign in as …`,
  `Message`, `Write a new prescription for …`, `Approve refill of …`, tab titles).
- On web, inactive tab screens stay mounted underneath the active one, so a plain locator can hit a covered
  element or background text. The spec uses `clickOnTop()` (clicks the match that is actually on top) and
  checks accessibility labels of specific elements (chat bubbles, med cards, adherence grids) instead of page text.
- If you change `EXPO_PUBLIC_API_URL` for a web export, add `--clear`: Metro's cache otherwise keeps the old
  inlined value.
