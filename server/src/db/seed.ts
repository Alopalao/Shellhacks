// Demo seed data (SPEC §8). Every timestamp is computed relative to `now`, so a freshly
// seeded store always looks current: recent dose history, a chat from the last few days,
// and a visit note from last week.
import type { DbData } from '../context';
import type {
  ChatMessage,
  DoseLog,
  MessageAttachment,
  Prescription,
  PrescriptionInput,
  RefillRequest,
  User,
  VisitNote,
} from '../shared/contracts';
import { addDays, atLocalTime, dateRange, maxKey, toDateKey } from './dates';
import { newId } from './ids';
import { threadIdFor } from './queries';

/** Stable ids for the seeded accounts so sessions survive a demo reset. */
export const DEMO_IDS = {
  doctor: 'usr_demo_reyes',
  patient: 'usr_demo_maya',
  patient2: 'usr_demo_jordan',
} as const;

export const DEMO_ACCOUNTS = {
  patient: 'patient@brian.demo',
  doctor: 'doctor@brian.demo',
  patient2: 'jordan@brian.demo',
} as const;

/** Small deterministic PRNG (mulberry32) so the seeded adherence pattern is stable. */
function createRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createSeedData(now: Date = new Date()): DbData {
  const random = createRandom(20_260_926);
  const today = toDateKey(now);
  const dayKey = (daysAgo: number): string => addDays(today, -daysAgo);
  /** ISO timestamp for local time `hhmm`, `daysAgo` days before today. */
  const at = (daysAgo: number, hhmm: string): string => atLocalTime(dayKey(daysAgo), hhmm).toISOString();
  const minutesAgo = (minutes: number): string => new Date(now.getTime() - minutes * 60_000).toISOString();

  // ───────────── Users ─────────────
  const doctor: User = {
    id: DEMO_IDS.doctor,
    email: DEMO_ACCOUNTS.doctor,
    name: 'Dr. Daniel Reyes',
    role: 'doctor',
    avatar: 'doctor-photo',
    createdAt: at(420, '09:00'),
    doctor: {
      specialty: 'Internal Medicine',
      credentials: 'MD',
      clinic: 'BRIAN Health Clinic',
      bio: 'Board-certified internist focused on preventive care, blood pressure, and diabetes. I believe every patient deserves clear answers and a plan they understand.',
    },
  };

  const maya: User = {
    id: DEMO_IDS.patient,
    email: DEMO_ACCOUNTS.patient,
    name: 'Maya Johnson',
    role: 'patient',
    avatar: null,
    createdAt: at(400, '10:15'),
    patient: {
      dateOfBirth: '1986-04-12',
      allergies: ['Penicillin'],
      conditions: ['Hypertension', 'Type 2 diabetes', 'High cholesterol'],
      pharmacy: 'CVS Pharmacy — Main St',
    },
    doctorId: doctor.id,
  };

  const jordan: User = {
    id: DEMO_IDS.patient2,
    email: DEMO_ACCOUNTS.patient2,
    name: 'Jordan Lee',
    role: 'patient',
    avatar: null,
    createdAt: at(210, '16:40'),
    patient: {
      dateOfBirth: '1998-09-03',
      allergies: [],
      conditions: ['Asthma'],
      pharmacy: 'Walgreens — Oak Ave',
    },
    doctorId: doctor.id,
  };

  // ───────────── Visit notes ─────────────
  const annualNote: VisitNote = {
    id: newId('note'),
    patientId: maya.id,
    doctorId: doctor.id,
    title: 'Annual physical',
    body:
      'Annual PE. Pt feels well, no CP/SOB. BP 134/86 on lisinopril 10 mg PO qd — above goal; reinforced low-Na diet & home BP log. ' +
      'A1c 7.8%. Wt 182 lb (−4 lb since last visit). BMP WNL. Fasting lipid panel ordered. Flu vax given today. ' +
      'Cont current meds. F/u 3 mo w/ labs.',
    createdAt: at(95, '10:30'),
  };

  const followUpNote: VisitNote = {
    id: newId('note'),
    patientId: maya.id,
    doctorId: doctor.id,
    title: 'Follow-up: blood pressure & diabetes',
    body:
      'F/u HTN & T2DM. BP 128/82, well controlled on lisinopril 10 mg PO qd. A1c 7.2% (down from 7.8%). ' +
      'Cont metformin 500 mg PO BID w/ meals. LDL 162 → start atorvastatin 20 mg PO qhs. ' +
      'Recheck lipids + CMP in 6–8 wks. Pt counseled re: diet/exercise, SE of statins (myalgias). RTC 3 mo, sooner PRN.',
    createdAt: at(10, '14:30'),
  };

  const asthmaNote: VisitNote = {
    id: newId('note'),
    patientId: jordan.id,
    doctorId: doctor.id,
    title: 'Asthma check-in',
    body:
      'Mild persistent asthma, improved since stepping up ICS. ACT 21 (well controlled). Night sx ~1x/mo. Lungs CTA, no wheeze. ' +
      'Cont fluticasone 110 mcg 2 puffs BID; rinse & spit after use. Albuterol 2 puffs q4–6h PRN SOB/wheeze. ' +
      'Reviewed inhaler technique w/ spacer. Asthma action plan updated. RTC 6 mo, sooner PRN.',
    createdAt: at(30, '11:00'),
  };

  // ───────────── Prescriptions ─────────────
  const rx = (
    patient: User,
    input: PrescriptionInput & { selfReported?: boolean; createdAt: string },
  ): Prescription => ({
    id: newId('rx'),
    patientId: patient.id,
    doctorId: input.selfReported ? null : doctor.id,
    drugName: input.drugName,
    strength: input.strength,
    form: input.form,
    dose: input.dose,
    route: input.route,
    frequency: input.frequency,
    times: input.times,
    instructions: input.instructions,
    purpose: input.purpose ?? null,
    quantity: input.quantity ?? null,
    refillsRemaining: input.refillsRemaining ?? 0,
    startDate: input.startDate ?? toDateKey(new Date(input.createdAt)),
    endDate: input.endDate ?? null,
    status: input.status ?? 'active',
    selfReported: input.selfReported ?? false,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  });

  const lisinopril = rx(maya, {
    drugName: 'Lisinopril',
    strength: '10 mg',
    form: 'tablet',
    dose: '1 tablet',
    route: 'by mouth',
    frequency: 'once daily',
    times: ['08:00'],
    instructions: 'Take in the morning. Rise slowly if dizzy.',
    purpose: 'Blood pressure',
    quantity: 30,
    refillsRemaining: 2,
    startDate: dayKey(380),
    createdAt: at(380, '11:05'),
  });

  const metformin = rx(maya, {
    drugName: 'Metformin',
    strength: '500 mg',
    form: 'tablet',
    dose: '1 tablet',
    route: 'by mouth',
    frequency: 'twice daily with meals',
    times: ['08:00', '19:00'],
    instructions: 'Take with breakfast and dinner to reduce stomach upset.',
    purpose: 'Blood sugar',
    quantity: 60,
    refillsRemaining: 0,
    startDate: dayKey(250),
    createdAt: at(250, '15:20'),
  });

  const atorvastatin = rx(maya, {
    drugName: 'Atorvastatin',
    strength: '20 mg',
    form: 'tablet',
    dose: '1 tablet',
    route: 'by mouth',
    frequency: 'once daily at bedtime',
    times: ['21:00'],
    instructions: 'Take at bedtime. Tell Dr. Reyes about unexplained muscle pain, weakness, or dark urine.',
    purpose: 'Cholesterol',
    quantity: 30,
    refillsRemaining: 5,
    startDate: dayKey(10),
    createdAt: at(10, '14:45'),
  });

  const vitaminD = rx(maya, {
    drugName: 'Vitamin D3',
    strength: '1,000 IU',
    form: 'softgel',
    dose: '1 softgel',
    route: 'by mouth',
    frequency: 'once daily',
    times: ['08:00'],
    instructions: 'Take with breakfast.',
    purpose: 'Supplement',
    quantity: null,
    refillsRemaining: 0,
    startDate: dayKey(60),
    selfReported: true,
    createdAt: at(60, '08:30'),
  });

  const albuterol = rx(jordan, {
    drugName: 'Albuterol HFA',
    strength: '90 mcg/actuation',
    form: 'inhaler',
    dose: '2 puffs',
    route: 'inhaled',
    frequency: 'every 4–6 hours as needed',
    times: [],
    instructions: 'Use for wheezing or shortness of breath. Shake well and use with a spacer. Call the clinic if you need it more than twice a week.',
    purpose: 'Rescue inhaler for asthma symptoms',
    quantity: 1,
    refillsRemaining: 0,
    startDate: dayKey(200),
    createdAt: at(200, '12:10'),
  });

  const fluticasone = rx(jordan, {
    drugName: 'Fluticasone HFA',
    strength: '110 mcg/actuation',
    form: 'inhaler',
    dose: '2 puffs',
    route: 'inhaled',
    frequency: 'twice daily',
    times: ['08:00', '20:00'],
    instructions: 'Use every day, even when you feel well. Rinse your mouth with water and spit after each use.',
    purpose: 'Asthma controller',
    quantity: 1,
    refillsRemaining: 3,
    startDate: dayKey(200),
    createdAt: at(200, '12:12'),
  });

  const prescriptions = [lisinopril, metformin, atorvastatin, vitaminD, albuterol, fluticasone];

  // ───────────── Dose logs (last 14 days) ─────────────
  // Misses are more likely in the evening and for supplements — roughly 85% adherence for
  // Maya and a bit lower for Jordan. Today's doses are only logged once they're an hour
  // past due, so the live demo always has something left to check off.
  const doseLogs: DoseLog[] = [];
  const missChance = (p: Prescription, slot: string): number => {
    if (p.patientId === jordan.id) return slot >= '12:00' ? 0.4 : 0.25;
    if (p.selfReported) return 0.3;
    return slot >= '12:00' ? 0.22 : 0.1;
  };
  const logDose = (p: Prescription, date: string, slot: string, takenAt: Date): void => {
    doseLogs.push({
      id: newId('dose'),
      prescriptionId: p.id,
      patientId: p.patientId,
      date,
      slot,
      takenAt: takenAt.toISOString(),
    });
  };

  const historyStart = dayKey(13);
  for (const p of prescriptions) {
    for (const date of dateRange(maxKey(historyStart, p.startDate), today)) {
      for (const slot of p.times) {
        const scheduled = atLocalTime(date, slot);
        if (date === today) {
          if (now.getTime() - scheduled.getTime() < 60 * 60_000) continue;
        } else if (random() < missChance(p, slot)) {
          continue;
        }
        const offsetMinutes = Math.round(random() * 50) - 12;
        const takenAt = new Date(Math.min(scheduled.getTime() + offsetMinutes * 60_000, now.getTime()));
        logDose(p, date, slot, takenAt);
      }
    }
  }
  // As-needed rescue inhaler uses: the slot records the time it was actually taken.
  for (const [daysAgo, time] of [[9, '17:40'], [5, '07:15'], [2, '22:05']] as const) {
    logDose(albuterol, dayKey(daysAgo), time, atLocalTime(dayKey(daysAgo), time));
  }

  // ───────────── Refill requests ─────────────
  const refillRequests: RefillRequest[] = [
    {
      id: newId('ref'),
      prescriptionId: albuterol.id,
      patientId: jordan.id,
      doctorId: doctor.id,
      status: 'pending',
      patientNote: 'Down to my last few puffs — allergy season has been rough.',
      doctorNote: null,
      refillsAdded: null,
      createdAt: minutesAgo(19 * 60),
      resolvedAt: null,
    },
    {
      id: newId('ref'),
      prescriptionId: lisinopril.id,
      patientId: maya.id,
      doctorId: doctor.id,
      status: 'approved',
      patientNote: 'About a week of tablets left.',
      doctorNote: 'Approved — nice work keeping up your home blood pressure log.',
      refillsAdded: 2,
      createdAt: at(38, '18:20'),
      resolvedAt: at(37, '09:10'),
    },
  ];

  // ───────────── Messages ─────────────
  const mayaThread = threadIdFor(maya.id, doctor.id);
  const jordanThread = threadIdFor(jordan.id, doctor.id);
  const message = (
    threadId: string,
    patient: User,
    sender: User,
    body: string,
    createdAt: string,
    read: boolean,
    attachment: MessageAttachment | null = null,
  ): ChatMessage => ({
    id: newId('msg'),
    threadId,
    patientId: patient.id,
    doctorId: doctor.id,
    senderId: sender.id,
    body,
    createdAt,
    // Read a few minutes after it was sent, but never in the future.
    readAt: read ? new Date(Math.min(Date.parse(createdAt) + 6 * 60_000, now.getTime())).toISOString() : null,
    attachment,
  });

  const messages: ChatMessage[] = [
    message(
      mayaThread,
      maya,
      doctor,
      "Great seeing you today, Maya. I've posted your visit note — tap it and BRIAN can explain anything in plain language.",
      at(10, '16:05'),
      true,
      { type: 'visit-note', noteId: followUpNote.id },
    ),
    message(
      mayaThread,
      maya,
      maya,
      'Hi Dr. Reyes — I picked up the atorvastatin. Is it okay to take it at night with my other meds?',
      at(2, '09:14'),
      true,
    ),
    message(
      mayaThread,
      maya,
      doctor,
      "Yes — bedtime works well for atorvastatin, and it's fine alongside lisinopril and metformin. Keep taking metformin with meals.",
      at(2, '10:02'),
      true,
      { type: 'prescription', prescriptionId: atorvastatin.id },
    ),
    message(
      mayaThread,
      maya,
      maya,
      "Thanks! One more thing: my legs have been a little sore since I started it. Is that normal?",
      at(1, '19:40'),
      true,
    ),
    message(
      mayaThread,
      maya,
      doctor,
      'Mild aches can happen with statins. If the soreness is severe, you feel weak, or your urine turns dark, stop the atorvastatin and call us right away. Otherwise keep going and we will review it at your lab visit.',
      at(1, '20:15'),
      true,
    ),
    message(
      mayaThread,
      maya,
      doctor,
      'Reminder: your lipid panel + CMP is due in about 6 weeks. The front desk can book it whenever you are ready.',
      minutesAgo(3 * 60),
      false,
    ),
    message(
      jordanThread,
      jordan,
      doctor,
      "Hi Jordan — how's your breathing been since we stepped up the fluticasone?",
      at(2, '18:30'),
      true,
    ),
    message(
      jordanThread,
      jordan,
      jordan,
      'Much better at night! My rescue inhaler is almost empty though, so I just sent a refill request.',
      minutesAgo(20 * 60),
      false,
    ),
  ];

  return {
    version: 1,
    users: [doctor, maya, jordan],
    sessions: [],
    messages,
    prescriptions,
    doseLogs,
    refillRequests,
    visitNotes: [followUpNote, asthmaNote, annualNote],
    aiConversations: [],
  };
}
