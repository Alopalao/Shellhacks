# BRIAN — Build Spec

**B**uilt for patients · **R**eliable prescription management · **I**ntegrated AI doctor · **A**lways connected to your physician · **N**ext-generation healthcare.

A demo healthcare app with two roles, **patient** and **doctor**, connected live through one local backend.

## 1. Product scope

### Patient
| Tab | Route | What it does |
|---|---|---|
| Home | `/patient` | Greeting, today's dose checklist (tap to log), next dose, adherence ring/%, doctor card (photo, online dot, "Message"), latest visit note ("Explain with BRIAN"), pending refills, quick actions (Ask BRIAN, Message doctor, Lessons), emergency strip (911 / 988 / Poison Control). |
| Meds | `/patient/meds` | Active/paused prescriptions (drug, strength, dose, frequency, times, instructions, prescriber, refills left). Per-med detail: schedule, today's doses, dose history (14 days), **Request refill**, **Drug info** (FDA label via `/api/drugs/info`, sources), **Ask BRIAN about this med**. Patient may add self-reported OTC/supplements. Live updates when the doctor prescribes/edits. |
| BRIAN AI | `/patient/ai` | The AI doctor. Chat with modes (General · Explain my doctor's note · Medication & dosing · Symptoms). Evidence cards under each answer (PubMed / MedlinePlus / openFDA with links), triage banner for red flags, "demo mode" badge when mocked, conversation history, suggested prompts. Accepts route params (`prompt`, `mode`, `noteId`, `prescriptionId`, `drugName`, `lessonId`) so other screens can deep-link a question. |
| Care | `/patient/care` | Physician card (photo, name, specialty, online/typing), **real-time chat** with the doctor, visit notes list → note detail with "Explain this with BRIAN" (plain-language explanation of jargon). |
| Lessons | `/patient/lessons` | Health-literacy library: categories, search, lesson reader (callout, sections, key takeaways, sources), 3-question quiz, progress (completed ✓, stored locally), "Ask BRIAN" follow-ups. |
| Profile (hidden tab) | `/patient/profile` | Name, email, DOB, allergies, conditions (used as AI context), pharmacy, assigned doctor (pick from list), server URL + connection status, reset demo, log out. |

### Doctor
| Tab | Route | What it does |
|---|---|---|
| Patients | `/doctor` | Patient list: online dot, active meds count, 7-day adherence, pending refills, unread messages; search. Tap → patient detail. |
| Patient detail (hidden) | `/doctor/patients/[id]` | Profile (allergies/conditions), prescriptions (add / edit / pause / discontinue), adherence (14-day dose grid), refill requests, visit notes (write new), "Message". Prescribe form at `/doctor/patients/prescribe?patientId=&rxId=`; new note at `/doctor/patients/note?patientId=`. |
| Inbox | `/doctor/inbox` | Pending refill requests (approve with N refills / deny with note), recent live activity (doses logged, messages). |
| Messages | `/doctor/messages` | Threads with all assigned patients → `/doctor/messages/[threadId]` real-time chat (same chat component as the patient). |
| Evidence AI | `/doctor/ai` | Same AI chat UI in clinician mode (more technical, PubMed-heavy). |
| Profile | `/doctor/profile` | Name, specialty, credentials, clinic, bio, server URL, log out. |

### Shared
- `/` Welcome: brand hero with the doctor photo, the B-R-I-A-N acronym, "Get started" → `/login`. Redirects to `/patient` or `/doctor` if already signed in.
- `/login`: email + password (+ name and **I am a patient / I am a doctor** toggle). Any credentials work: the server replies `lgtm` and the UI shows an "LGTM ✓" confirmation, then routes by role. One-tap **Demo patient** / **Demo doctor** buttons.
- Global in-app toast for `notify` socket events (e.g. "Dr. Reyes prescribed Atorvastatin"), tappable → `href`.
- Connection indicator (socket connected / reconnecting) available in profile + a slim banner when disconnected.

### Live demo scenarios (must work)
1. **One computer:** `npm run dev:web` → open `http://localhost:8081` in two browser windows (one normal, one private). Log in as patient in one and doctor in the other.
2. **Phones:** `npm run dev` → scan the QR with Expo Go on two phones (same Wi-Fi). The app auto-targets `http://<computer-LAN-IP>:4000`.
3. **Two computers:** one runs `npm run server`; the other runs the app and sets the server URL (Profile → Server, or `app/.env` `EXPO_PUBLIC_API_URL`).

Everything a patient does that a doctor should see (message, dose logged, refill request, profile change) and vice versa (message, new/edited prescription, refill decision, new visit note) is pushed instantly over Socket.IO.

## 2. Architecture

```
BRIAN/
├── .env / .env.example          # server keys (blank = mock). ANTHROPIC_API_KEY, CLAUDE_MODEL, NCBI_API_KEY, NCBI_EMAIL, OPENFDA_API_KEY, PORT, HOST, BRIAN_EVIDENCE_OFFLINE
├── package.json                 # setup / dev / dev:web / server / app / web / typecheck / test / reset-data
├── docs/SPEC.md
├── server/                      # Node 24, TS (ESM) via tsx, Express 5, Socket.IO 4, zod 4, @anthropic-ai/sdk
│   └── src/
│       ├── index.ts             # boot: load db, create app + http server + socket.io, listen on HOST:PORT, print LAN URLs
│       ├── config.ts            # (exists) env loading
│       ├── context.ts           # (exists) ServerContext / Db / Realtime interfaces + currentUser()
│       ├── shared/contracts.ts  # (exists) API types — identical copy in app/src/lib/contracts.ts
│       ├── app.ts               # createApp(ctx): express app, CORS *, JSON, routes, error handler; mounts createAiRouter(ctx) at '/api'
│       ├── db/                  # JSON store (atomic debounced writes to config.dataFile), seed.ts
│       ├── auth/                # lgtm login, bearer sessions, requireAuth
│       ├── realtime/            # socket.io auth, rooms `user:<id>`, presence, typing, Realtime impl
│       ├── routes/              # me, doctors, threads/messages, prescriptions, doses, refills, notes, dashboard, patients, admin(reset)
│       ├── ai/                  # AI doctor: router.ts (createAiRouter), claude client, prompts, triage, glossary, mock responder
│       └── evidence/            # PubMed, MedlinePlus, openFDA, RxNorm clients + cache
│   └── test/                    # vitest
└── app/                         # Expo SDK 57 + expo-router
    ├── .env / .env.example      # EXPO_PUBLIC_API_URL (optional override)
    ├── assets/images/doctor.jpg, doctor-avatar.jpg
    └── src/
        ├── app/                 # routes (see §5)
        ├── theme/index.ts       # (exists) design tokens
        ├── lib/                 # contracts.ts (exists), api.ts, server-url.ts, auth.tsx, socket.tsx, format.ts, storage.ts
        ├── components/ui/       # design-system components
        ├── features/<name>/     # feature components & hooks (home, meds, chat, notes, ai, lessons, doctor)
        └── lessons/             # (exists) types.ts, categories.ts, index.ts registry, content/<category>.ts
```

## 3. REST API (server)

JSON everywhere. Auth header `Authorization: Bearer <token>` on everything except `/api/health` and `/api/auth/login`. Errors: `{ error: string, details? }` with proper status (400 validation via zod, 401, 403, 404). CORS open (`*`). Types come from `shared/contracts.ts`.

| Method & path | Who | Body / query | Response |
|---|---|---|---|
| GET `/api/health` | anyone | | `HealthResponse` |
| POST `/api/auth/login` | anyone | `LoginRequest` | `LoginResponse` (`status:'lgtm'`). Existing email → sign in (role ignored). New email → create user (role default patient; name default from email). New patients get `patient: {allergies:[],conditions:[]}` and are assigned to the demo doctor (first doctor). New doctors get `doctor: {specialty:'General Practice', credentials:'MD'}`, `avatar: null`. Empty email/password → 400. Email is trimmed + lowercased. |
| POST `/api/auth/logout` | auth | | `{ ok: true }` |
| GET `/api/me` | auth | | `{ user }` |
| PATCH `/api/me` | auth | `UpdateMeRequest` | `{ user }`; emits `user:updated` to the user's counterparts (doctor ↔ patients) |
| GET `/api/doctors` | auth | | `{ doctors: User[] }` |
| PUT `/api/me/doctor` | patient | `{ doctorId }` | `{ user }` |
| GET `/api/dashboard` | patient | `?date=YYYY-MM-DD` (patient local today) | `PatientDashboard` |
| GET `/api/threads` | auth | | `{ threads: Thread[] }` — patient: exactly one thread with their doctor (even if empty); doctor: one per assigned patient, sorted by last activity |
| GET `/api/threads/:threadId/messages` | participant | `?limit=50&before=<ISO>` | `{ messages: ChatMessage[] }` ascending |
| POST `/api/threads/:threadId/messages` | participant | `SendMessageRequest` | `{ message }`; emits `message:new` to both participants and `notify` to recipient |
| POST `/api/threads/:threadId/read` | participant | | `{ ok: true }`; marks counterpart's messages read; emits `message:read` to both |
| GET `/api/prescriptions` | auth | patient: own; doctor: `?patientId=` (assigned) | `{ prescriptions }` |
| POST `/api/prescriptions` | doctor (assigned patient) / patient (self-reported, own id) | `CreatePrescriptionRequest` | `{ prescription }`; emits `prescription:upsert` to patient + doctor; `notify` to the other party |
| PATCH `/api/prescriptions/:id` | prescribing/assigned doctor; patient only for selfReported | `Partial<PrescriptionInput>` | `{ prescription }`; same emits |
| DELETE `/api/prescriptions/:id` | same | | `{ prescription }` with status `discontinued`; same emits |
| GET `/api/doses` | auth | patient: own; doctor: `?patientId=`; `&from=&to=` (YYYY-MM-DD, inclusive) | `{ doseLogs }` |
| POST `/api/doses` | patient | `LogDoseRequest` | `{ doseLog }` (idempotent per prescription+date+slot); emits `dose:logged` to patient + doctor |
| DELETE `/api/doses/:id` | patient (own) | | `{ ok: true }`; emits `dose:removed` |
| GET `/api/refills` | auth | patient: own; doctor: theirs; `?status=` | `{ refillRequests }` newest first |
| POST `/api/refills` | patient | `CreateRefillRequest` | `{ refillRequest }` (409 if one is already pending for that Rx; 400 for self-reported); emits `refill:upsert` + `notify` doctor |
| PATCH `/api/refills/:id` | doctor | `ResolveRefillRequest` | `{ refillRequest, prescription }`; approval adds `refillsAdded` (default 1) to `refillsRemaining`; emits `refill:upsert`, `prescription:upsert`, `notify` patient |
| GET `/api/notes` | auth | patient: own; doctor: `?patientId=` | `{ notes }` newest first |
| POST `/api/notes` | doctor | `CreateVisitNoteRequest` | `{ note }`; emits `note:new` + `notify` patient |
| GET `/api/patients` | doctor | | `{ patients: PatientSummary[] }` |
| GET `/api/patients/:id` | doctor (assigned) | | `PatientDetail` |
| POST `/api/admin/reset` | auth | | `{ ok: true }` — wipes and re-seeds demo data (demo convenience), then sends a `system` `notify` to other signed-in devices and disconnects every socket so clients reconnect and refetch |
| GET `/api/ai/status` | anyone | | `AiStatus` |
| POST `/api/ai/chat` | auth | `AiChatRequest` | `AiChatResponse` |
| GET `/api/ai/conversations` | auth | | `{ conversations: AiConversation[] }` newest first |
| GET `/api/ai/conversations/:id` | owner | | `{ conversation }` |
| DELETE `/api/ai/conversations/:id` | owner | | `{ ok: true }` |
| GET `/api/drugs/info` | auth | `?name=` | `DrugInfo` |
| GET `/api/evidence/search` | auth | `?q=` | `EvidenceSearchResponse` |

Thread id = `${patientId}__${doctorId}`. Only the patient and their assigned doctor may access a thread.

## 4. Realtime (Socket.IO)
- Client: `io(serverUrl, { auth: { token }, transports: ['websocket', 'polling'] })`. Invalid token → connection error `unauthorized`.
- On connect the socket joins `user:<id>`. Presence: when a user's first socket connects / last socket disconnects, emit `presence` to their counterparts (patient → their doctor; doctor → all their patients). `presence:query` acks current presence for a list of ids.
- `typing` from client `{threadId,isTyping}` → server relays `typing {threadId,userId,isTyping}` to the other participant (validate membership).
- All other events are emitted by REST handlers via `ctx.realtime.emitToUser` (see §3). Event types: `ServerToClientEvents` in contracts.
- `notify` payload is human-friendly (`title`, `body`, `href` pointing at the right in-app route for the recipient's role).

## 5. App routes (expo-router, `app/src/app/`) and owners

| File | Owner |
|---|---|
| `_layout.tsx` (providers: SafeArea, Auth, Socket, Toast; root Stack headerless), `index.tsx` (welcome), `login.tsx` | app-foundation |
| `patient/_layout.tsx` (auth/role guard + `Tabs` from `expo-router/js-tabs`: index "Home", meds "Meds", ai "BRIAN AI", care "Care", lessons "Lessons"; `profile` hidden with `href: null`) | app-foundation |
| `patient/profile.tsx`, `doctor/profile.tsx` | app-foundation |
| `doctor/_layout.tsx` (guard + Tabs: index "Patients", inbox "Inbox", messages "Messages", ai "Evidence AI", profile "Profile"; `patients` hidden) | app-foundation |
| `patient/index.tsx`, `patient/meds/_layout.tsx`, `patient/meds/index.tsx`, `patient/meds/[id].tsx`, `patient/meds/add.tsx` | patient-home-meds |
| `patient/care/_layout.tsx`, `patient/care/index.tsx`, `patient/care/chat.tsx`, `patient/care/notes/[id].tsx`, `doctor/messages/_layout.tsx`, `doctor/messages/index.tsx`, `doctor/messages/[threadId].tsx` | care-chat |
| `patient/ai/_layout.tsx`, `patient/ai/index.tsx`, `patient/ai/history.tsx`, `doctor/ai/_layout.tsx`, `doctor/ai/index.tsx`, `doctor/ai/history.tsx` | ai-ui |
| `patient/lessons/_layout.tsx`, `patient/lessons/index.tsx`, `patient/lessons/[id].tsx`, `patient/lessons/category/[categoryId].tsx` | lessons-ui |
| `doctor/index.tsx`, `doctor/inbox.tsx`, `doctor/patients/_layout.tsx`, `doctor/patients/[id].tsx`, `doctor/patients/prescribe.tsx`, `doctor/patients/note.tsx` | doctor-ui |

app-foundation creates a **placeholder** for every route file above (simple screen with its title) so navigation works before feature agents land; feature agents overwrite their placeholders. Nested folders use a `_layout.tsx` Stack (header styled per theme, or headerless with custom headers — consistent within the app).

Non-route ownership: `src/lib/*`, `src/components/ui/*`, `src/hooks/*` → app-foundation. `src/features/home|meds` → patient-home-meds; `src/features/chat|notes` → care-chat; `src/features/ai` → ai-ui; `src/features/lessons` (+ lesson progress storage) → lessons-ui; `src/features/doctor` → doctor-ui. `src/lessons/content/<category>.ts` → content agents. Feature agents may *read* but not edit files owned by others; if a shared component is missing, build it inside your feature folder.

## 6. App foundation API (what feature agents can rely on)
- `src/lib/server-url.ts` — resolves the server base URL: saved override (AsyncStorage) → `process.env.EXPO_PUBLIC_API_URL` → web: `${location.protocol}//${location.hostname}:4000` → native: host of `Constants.expoConfig?.hostUri` + `:4000` → `http://localhost:4000`. `getServerUrl()`, `setServerUrl(url | null)`, subscribe/hook.
- `src/lib/api.ts` — typed fetch client that attaches the bearer token, parses JSON, throws `ApiRequestError {status, message}`; typed helpers for every endpoint in §3 (e.g. `api.login`, `api.dashboard(date)`, `api.threads()`, `api.sendMessage(threadId, body)`, `api.aiChat(req)`, `api.drugInfo(name)` …).
- `src/lib/auth.tsx` — `AuthProvider`, `useAuth()` → `{ status: 'loading'|'signed-out'|'signed-in', user, token, login(req), logout(), refreshUser(), setUser(u) }`; token persisted in AsyncStorage.
- `src/lib/socket.tsx` — `SocketProvider` (connects when signed in, reconnects on server-URL/token change), `useSocket()` → `{ socket, connected }`, `useSocketEvent(event, handler)`, `usePresence(userId)` → boolean.
- `src/lib/format.ts` — `todayKey()` (local YYYY-MM-DD), `formatTime`, `formatDate`, `formatRelative`, `initials(name)`, `greeting()`.
- `src/hooks/useApiQuery.ts` — `{ data, error, loading, refreshing, refresh, setData }` for GET calls; refetch on focus.
- `src/components/ui/` — `Screen` (safe area, white bg, max width, optional scroll + pull-to-refresh), `AppText` (variants: display/title1/title2/title3/body/bodyStrong/small/caption/label), `Button` (variants: primary = yellow/black, secondary = black/white, outline, ghost, danger; sizes; loading; icon), `IconButton`, `Card` (variants: default white w/ border, yellow = light-yellow, outline), `Input`, `TextArea`, `Badge`, `Chip`, `Avatar` (user → doctor photo if `avatar==='doctor-photo'`, else initials on yellow; optional online dot), `SectionHeader`, `ListItem`, `EmptyState`, `LoadingState`, `ErrorState`, `Divider`, `SegmentedControl`, `Markdown` (renders markdown-lite incl. `[n]` citation chips via an `onCitationPress` callback), `Disclaimer`, `EmergencyStrip` (911 / 988 / Poison Control; `tel:` links via `Linking`), `ToastProvider` + `useToast()`, `ConnectionBanner`, `BrandMark` (BRIAN wordmark with yellow accent).

### Markdown-lite (lessons, AI replies, notes)
Paragraphs separated by blank lines; `- ` bullets; `1. ` numbered; `**bold**`; `### ` small headings (AI replies only); bare `https://` links become tappable; `[1]`-style citation markers render as small yellow chips.

## 7. AI doctor design (server `src/ai`, `src/evidence`)
- **Always** run rule-based **triage** first on the user message (emergency: stroke signs (F.A.S.T. per MedlinePlus, plus sudden vision or balance loss; the lesson teaches BE FAST), chest pain/pressure, trouble breathing, severe bleeding, anaphylaxis, suicidal thoughts → 988, overdose/poisoning → Poison Control 1-800-222-1222 & 911, seizure, loss of consciousness; urgent: high fever with stiff neck, etc.). Emergency triage is attached to the reply and the assistant leads with it.
- **Evidence retrieval** (keys optional; cache results in memory; timeouts ~6 s; failures degrade gracefully):
  - PubMed E-utilities `esearch` → `esummary` (+ `efetch` abstracts), prefer reviews/guidelines/meta-analyses; send `tool=brian`, `email=NCBI_EMAIL`, `api_key=NCBI_API_KEY` when set; respect 3 req/s without key.
  - MedlinePlus Web Service `https://wsearch.nlm.nih.gov/ws/query?db=healthTopics&term=…` (plain-language summaries).
  - openFDA drug labels `https://api.fda.gov/drug/label.json` (indications, dosage, warnings, boxed warning, interactions, adverse reactions) with DailyMed links; `api_key` when set.
  - RxNorm `https://rxnav.nlm.nih.gov/REST/…` to normalize drug names (approximateTerm / properties).
- **With `ANTHROPIC_API_KEY`**: `@anthropic-ai/sdk`, model `config.claudeModel` (default `claude-opus-5`), adaptive thinking, `output_config.effort = config.claudeEffort`, server-side refusal fallback (`betas: ['server-side-fallback-2026-07-01']`, `fallbacks: 'default'`), handle `stop_reason === 'refusal'`. Pre-retrieved evidence is passed as numbered sources; the model may call evidence tools (search_pubmed / search_medlineplus / lookup_drug_label) for up to 3 rounds; it must cite only provided sources as `[n]`; server validates markers against returned citations. Patient context (conditions, allergies, active meds, the referenced note / med / lesson) is included.
- **Without a key (or on LLM failure)**: deterministic **mock responder** — triage + glossary-based plain-language translation of doctor notes (e.g. BID, PO, qhs, HTN, A1c, BMP, f/u, PRN, SOB) + evidence summaries (MedlinePlus summary text, FDA label sections, top PubMed titles) with citations, clearly labelled via `mocked: true` (the app shows a "Demo mode" badge and notice; the answer text itself carries no such label). Offline (`BRIAN_EVIDENCE_OFFLINE=1` or network down) still returns a helpful glossary/triage/safety answer.
- Persona: "BRIAN, your AI health guide" — an AI, not a licensed clinician; plain language (≈8th-grade), warm, concise; explains what the doctor said; answers drug & dosing questions from FDA labeling while deferring personal dose changes to the prescriber/pharmacist; lists questions to ask your doctor; ends with a short safety note. Clinician mode (doctor users) is technical and PubMed-forward.

## 8. Seed data (server)
- Doctor: **Dr. Daniel Reyes, MD** — Internal Medicine, "BRIAN Health Clinic", `doctor@brian.demo`, `avatar: 'doctor-photo'`, short bio.
- Patient: **Maya Johnson** — `patient@brian.demo`, DOB 1986-04-12, allergies [Penicillin], conditions [Hypertension, Type 2 diabetes, High cholesterol], pharmacy "CVS Pharmacy — Main St", doctor = Dr. Reyes.
- Second patient (for the doctor list): **Jordan Lee** — `jordan@brian.demo`, conditions [Asthma], allergies [], Albuterol inhaler 90 mcg/actuation 2 puffs as needed + Fluticasone 110 mcg 2 puffs twice daily.
- Maya's prescriptions (by Dr. Reyes): Lisinopril 10 mg tablet, 1 tablet by mouth once daily 08:00, "Take in the morning. Rise slowly if dizzy.", purpose Blood pressure, refills 2. Metformin 500 mg tablet, 1 tablet twice daily with meals 08:00/19:00, purpose Blood sugar, refills 0 (so a refill request makes sense). Atorvastatin 20 mg tablet, once daily at bedtime 21:00, purpose Cholesterol, refills 5. Plus a self-reported Vitamin D3 1,000 IU daily.
- A few dose logs over the past days (realistic ~85% adherence), 4–6 chat messages, one visit note with clinician shorthand, e.g. *"F/u HTN & T2DM. BP 128/82, well controlled on lisinopril 10 mg PO qd. A1c 7.2% (down from 7.8%). Cont metformin 500 mg PO BID w/ meals. LDL 162 → start atorvastatin 20 mg PO qhs. Recheck lipids + CMP in 6–8 wks. Pt counseled re: diet/exercise, SE of statins (myalgias). RTC 3 mo, sooner PRN."*
- `npm run reset-data` (server script) and `POST /api/admin/reset` re-seed.

## 9. Lessons (content agents)
Each category file exports `lessons: Lesson[]` (see `app/src/lessons/types.ts`). ~6–9 lessons per category (60 in total), accurate, practical, plain language (≈8th grade), US context stated where relevant, real source URLs that resolve (verify with curl), emergency lessons start with an `emergency` callout. Category topics:
- **emergencies**: stroke (BE FAST, time matters, note the time symptoms started, don't drive yourself), heart attack (incl. women's symptoms), car accident step-by-step (safety, 911, exchange info, photos, get checked — delayed injuries like whiplash/concussion, notify insurer), first aid basics (bleeding, burns, choking, Hands-Only CPR, AED), allergic reactions & anaphylaxis (epinephrine), poisoning & overdose (Poison Help 1-800-222-1222, naloxone), head injury/concussion, mental-health crisis (988).
- **illness**: think you're getting sick? (self-care vs. getting seen; red flags), describing symptoms to a clinician, cold vs. flu vs. COVID-19 (testing, antivirals timing), fever in adults vs. kids, silent conditions (high blood pressure, prediabetes) & early warning signs, depression & anxiety — getting help, cancer warning signs & screening basics.
- **healthcare-system**: how US healthcare fits together (PCP, specialists, referrals, networks), where to go (telehealth vs. PCP vs. urgent care vs. ER), getting the most from a visit (prep, questions, bring meds list, teach-back), your medical records & patient portal (HIPAA right of access), second opinions, finding & choosing a doctor.
- **insurance**: insurance vocabulary (premium, deductible, copay, coinsurance, out-of-pocket max), plan types (HMO/PPO/EPO/POS/HDHP), HSA vs FSA, Medicare & Medicaid basics, ACA Marketplace & enrollment periods, reading an EOB & disputing bills (No Surprises Act, itemized bills, financial assistance), prior authorization & appeals.
- **rights-liability**: patient rights & informed consent, privacy & HIPAA, medical malpractice basics (duty/breach/causation/damages; statutes of limitations vary by state; not legal advice), advance directives & health-care proxy, after an accident: liability & who pays (auto PIP/MedPay, health insurance, workers' comp, documentation), medical debt & your rights.
- **medications**: reading a prescription label, brand vs. generic, saving money on prescriptions, drug interactions & OTC safety (acetaminophen limits, NSAID cautions, supplements), antibiotics — when they help, safe storage & disposal (take-back), sticking to your meds (adherence tips).
- **cosmetic**: thinking about plastic surgery (board certification, accredited facility, risks, recovery, realistic expectations, cost/insurance, medical tourism risks), teeth whitening (options, sensitivity, doesn't work on crowns/veneers, dentist check first), clear skin/acne (OTC benzoyl peroxide, salicylic acid, adapalene; when to see a dermatologist; isotretinoin needs a prescriber & pregnancy prevention), Botox & fillers (licensed injectors, risks incl. vascular occlusion, counterfeit products), laser & skin treatments (hair removal, resurfacing, skin-of-color considerations), hair loss options (minoxidil, finasteride — prescriber), med-spa safety checklist (incl. body contouring), LASIK/vision correction, cosmetic dentistry (veneers, bonding, clear aligners).
- **wellness**: preventive screenings by age (USPSTF), adult vaccines (CDC schedule), sleep, physical activity guidelines, healthy eating basics, stress & mental well-being.

## 10. Quality bar
- `npx tsc --noEmit` passes in `server/` and `app/`; `npm test` passes in `server/`; `npx expo export --platform web` succeeds in `app/`.
- No crashes on empty states, slow network, server down (clear message + retry + server URL hint).
- Accessible: `accessibilityRole`/`accessibilityLabel` on tappables, 44pt touch targets, sufficient contrast (black on yellow, never white on yellow).
- Web layout: content centered with `maxContentWidth`; tab bar works on web.
