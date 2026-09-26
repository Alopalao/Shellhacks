# BRIAN — project rules

BRIAN = **B**uilt for patients · **R**eliable prescription management · **I**ntegrated AI doctor · **A**lways connected to your physician · **N**ext-generation healthcare.

Demo app: a patient and a doctor each run the app locally and talk to one local backend in real time.
Read `docs/SPEC.md` before writing code — it defines the architecture, API, socket events, routes, and file ownership.

## Layout
- `server/` — Node 24 + TypeScript (ESM, run with `tsx`, no build step), Express 5, Socket.IO, JSON-file store, `@anthropic-ai/sdk`.
- `app/` — Expo SDK 57 (React Native 0.86, React 19.2, expo-router 57, TypeScript strict). Runs on iOS/Android (Expo Go) and web.
- `.env` at repo root (server reads it). API keys are intentionally blank; every external integration must work in a mock/fallback mode when its key is missing.

## Shared contracts
- `server/src/shared/contracts.ts` and `app/src/lib/contracts.ts` are **identical copies** of the API types. If you must change one, change both byte-for-byte.

## Expo / React Native rules (SDK 57 — do not trust memory)
- Expo ships breaking changes every SDK. Before using an Expo/RN API you are unsure of, check the installed package's `.d.ts` under `app/node_modules/` or fetch `https://docs.expo.dev/versions/v57.0.0/`.
- Install app deps only with `npx expo install <pkg>` (run inside `app/`). Do not add packages with native code that Expo Go lacks.
- Routes live in `app/src/app/` (every file is a screen; `_layout.tsx` defines navigators). Non-route code lives elsewhere under `app/src/`.
- Imports: `Stack`, `Link`, `Redirect`, `router`, `useLocalSearchParams`, `useFocusEffect` from `'expo-router'`; **Tabs from `'expo-router/js-tabs'`** (the `Tabs` export from `'expo-router'` is deprecated). Icons: `Ionicons` from `'@expo/vector-icons'`. Images: `Image` from `'expo-image'`.
- Path alias `@/*` → `app/src/*`, `@/assets/*` → `app/assets/*`.
- React Compiler is on: do not mutate props/state; keep hooks rules strict.
- Must work on web too: no `Alert.alert` for anything important (it is a no-op on web) — use in-app UI (toast/banner/modal). Avoid `window`/`document` unless guarded by `Platform.OS === 'web'`.
- Typecheck with `npx tsc --noEmit` in `app/` (and in `server/`). Server tests: `npm test` in `server/`.

## Design system (non-negotiable)
- White background (`#FFFFFF`), black text (`#0A0A0A`), **sunny yellow buttons** (`#FFD400` with black label), occasional **light-yellow surfaces** (`#FFF8D6` / `#FFFBEA`). Use tokens from `app/src/theme/index.ts` — never hard-code other brand colors. Red is reserved for emergencies/errors.
- The doctor photo (`app/assets/images/doctor.jpg`, avatar `doctor-avatar.jpg`, original `/image.png`) is the brand's professional-doctor image: use it on the welcome screen and as the demo physician's avatar.
- Tone: warm, plain-language, confident. Every medical screen carries a short "not a substitute for professional care" note; emergencies always point to 911 (and 988 for mental-health crises, Poison Control 1-800-222-1222).

## Medical content rules
- Evidence-backed: cite NIH (MedlinePlus, NIH institutes, PubMed), CDC, FDA, CMS/HealthCare.gov, USPSTF, AHA/ASA, ADA (dental), AAD, ABPS/ASPS. Use real, stable URLs only — never invent a URL, PMID, statistic, or quote. When unsure, cite the organization's topic landing page.
- Never give individualized diagnoses or dosing that overrides a prescriber; always direct to a clinician/pharmacist for personal decisions.
- US-centric insurance/legal content must say so and must not be legal advice.

## Demo auth
- Any email + any non-empty password succeeds and the server answers `lgtm`. Seeded accounts: `patient@brian.demo` / `doctor@brian.demo` (any password).
