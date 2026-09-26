# BRIAN live demo run-sheet (3–5 minutes)

Two presenters: **P** plays the patient (Maya Johnson) and **D** plays the doctor (Dr. Daniel Reyes). Both screens should be visible to the audience: two phones on a document camera, or two browser windows side by side on the projector.

## 10 minutes before

1. On the laptop that runs the server:
   ```bash
   npm run reset-data     # fresh seed data (Maya, Jordan, Dr. Reyes)
   npm run dev:web        # or `npm run dev` for phones with Expo Go
   ```
   Venue Wi-Fi blocks phones? Use a phone hotspot, or run everything in two browser windows (README → Networking).
2. **P** opens http://localhost:8081 in a normal window (or scans the QR in Expo Go). **D** opens it in a private window, or on the second phone. Leave both on the **welcome screen**.
3. Check the AI once: P → BRIAN AI → "What is lisinopril for?" If the answer is marked **Demo mode**, that's fine (no API key needed). Then tap **New chat** to clear it. No internet at the venue? Set `BRIAN_EVIDENCE_OFFLINE=1` in `.env` and restart. The AI then still translates jargon, with fewer sources.
4. Have the visit note below ready to paste (in D's clipboard or a notes app).
5. Zoom both browsers to 125% so the audience can read them. Turn on Do Not Disturb on the phones.

## The run (about 4 minutes)

| Time | Who | Do | Say (short) |
|---|---|---|---|
| 0:00 | P | Show the welcome screen with the doctor photo | "BRIAN: Built for patients, Reliable prescriptions, Integrated AI doctor, Always connected to your physician, Next-gen healthcare. One app, two sides, live." |
| 0:20 | P + D | **Get started** → P taps **Demo patient**, D taps **Demo doctor** | "Sign-in is intentionally simple for the demo: the server just says **lgtm**." |
| 0:35 | D | Patients list: point at Maya's **online** dot | "Presence is live. Dr. Reyes sees that Maya is online right now." |
| 0:45 | P | **Care** → **Message Dr. Reyes** → type *"Hi Dr. Reyes, my home BP readings were higher this week."* → send | (D's screen shows a toast and the **typing…** indicator while P types) |
| 1:00 | D | Open the toast / **Messages** → Maya → reply *"Thanks Maya, let's add a medication. Sending it now."* | "Real-time chat with typing indicators and **Seen** receipts, no refresh." |
| 1:20 | D | Maya's chart → **Prescribe**: *Amlodipine*, *5 mg*, *1 tablet*, *Take once daily in the morning*, purpose *Blood pressure* → **Send prescription** | "The doctor prescribes…" |
| 1:40 | P | A toast arrives. **Home** shows today's Amlodipine dose, and **Meds** lists it | "…and it's on Maya's phone instantly, with a schedule." |
| 1:55 | P | **Home** → tap today's Lisinopril dose to log it | "Maya logs a dose…" |
| 2:05 | D | Maya's chart: the 14-day adherence grid updates, and **Inbox** shows "Maya logged a dose" | "…and her doctor sees adherence live." |
| 2:15 | P | **Meds** → **Metformin 500 mg** (no refills left) → **Request renewal** → note *"Almost out"* → **Send request** | |
| 2:30 | D | **Inbox** → **Approve** → **+** twice → **Approve 3 refills** | |
| 2:40 | P | Metformin shows **Approved** and **3 refills left** | "Renewal requested, approved and confirmed in seconds." |
| 2:50 | D | Maya's chart → **Write note** → title *"BP follow-up"* → paste the note below → **Share with Maya** | "Doctors write in shorthand…" |
| 3:05 | P | Tap the toast → the note opens → **Explain this with BRIAN** | "…so BRIAN translates it line by line into plain language, with sources from NIH MedlinePlus." |
| 3:35 | P | **BRIAN AI** → **New chat** → type *"I have crushing chest pain spreading to my left arm and I'm sweating"* → send | "And it knows when *not* to chat: red-flag symptoms get an emergency banner with **Call 911**, not a paragraph." |
| 3:55 | P | *(optional, if time)* **Lessons** → open a lesson → answer the quiz | "60 short, sourced lessons, from spotting a stroke to reading an insurance bill." |
| 4:10 | Both | Back to both home screens | "BRIAN is Expo on iOS, Android and web, a Node + Socket.IO server, and an AI doctor grounded in PubMed, MedlinePlus and FDA labels. It's educational, not a substitute for your clinician. Thank you!" |

### Visit note to paste (D)

```
F/u HTN. BP 142/90 today, above goal on lisinopril 10 mg PO qd.
Start amlodipine 5 mg PO qAM. Cont lisinopril.
Home BP log BID x 2 wks. Low-Na diet.
RTC 4 wks, sooner PRN.
```

## If something goes wrong

| Symptom | Fix on stage |
|---|---|
| "Reconnecting to BRIAN…" banner | The server restarted or Wi-Fi dropped. Wait 2–3 s: it reconnects on its own and catches up. |
| A phone can't connect | Switch that role to a browser window on the laptop (http://localhost:8081, private window) and keep going. |
| Toast missed | Every update is also on the screen itself: Meds, Inbox, the chart. Just open it. |
| AI is slow | Talk over it ("it's pulling the FDA label and MedlinePlus pages"), or skip ahead to the emergency example. |
| Data got messy in rehearsal | `npm run reset-data` (or Profile → **Reset demo data**) and sign in again with the demo buttons. |

Safety line to keep in the pitch: *BRIAN is a demo. It's not medical advice, and we never enter real patient data. Emergencies: 911. Crisis: 988. Poison Control: 1-800-222-1222.*
