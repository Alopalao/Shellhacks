import type { Lesson } from '../types';

// Content for category 'healthcare-system' — see src/lessons/types.ts for the format.
// US-focused health-literacy lessons. Every source URL was checked to resolve (Sept 2026).

/** Joins markdown-lite blocks (paragraphs and lists) with a blank line. */
const md = (...blocks: string[]): string => blocks.join('\n\n');
/** Builds a "- " bullet list (one bullet per line). */
const bullets = (...items: string[]): string => items.map((item) => `- ${item}`).join('\n');
/** Builds a "1. " numbered list (one step per line). */
const steps = (...items: string[]): string => items.map((item, i) => `${i + 1}. ${item}`).join('\n');

export const lessons: Lesson[] = [
  // ---------------------------------------------------------------------------
  {
    id: 'healthcare-system-basics',
    categoryId: 'healthcare-system',
    title: 'How US Health Care Fits Together',
    summary:
      "Primary care, specialists, referrals, and networks — a plain-language map of the US health care system so you know where to start.",
    readMinutes: 4,
    level: 'Basics',
    icon: 'git-network-outline',
    callout: {
      kind: 'tip',
      text: "This lesson describes the US system. Rules differ by insurance plan, so when in doubt, check your plan's member handbook or call the number on your insurance card.",
    },
    sections: [
      {
        heading: 'The big picture',
        body: md(
          "The US doesn't have one single health care system. It's a patchwork of **providers** (doctors, nurses, clinics, hospitals, pharmacies, labs) and **payers** (private insurers, employer plans, Medicare, Medicaid, the VA, and people paying out of pocket).",
          "Your insurance plan shapes a lot: which doctors you can see, whether you need permission first, and how much you pay. That's why two people with the same health problem can have very different experiences.",
          'A simple way to think about it:',
          bullets(
            '**Primary care** is your home base for everyday health.',
            '**Specialists** focus on specific organs or conditions.',
            "**Urgent care and emergency rooms** handle problems that can't wait.",
            "**Your plan's network and rules** decide what's covered and at what price.",
          ),
        ),
      },
      {
        heading: 'Your primary care provider (PCP)',
        body: md(
          'A primary care provider is the clinician you see for checkups, common illnesses, and long-term conditions like high blood pressure or diabetes. They also help you decide how urgent a problem is and send you to specialists when needed.',
          'Your PCP might be:',
          bullets(
            'A **family medicine** doctor (children and adults)',
            'An **internal medicine** doctor, or internist (adults)',
            'A **pediatrician** (children and teens)',
            'A **geriatrician** (older adults with complex needs)',
            'A **nurse practitioner (NP)** or **physician assistant (PA)**',
          ),
          "Seeing the same PCP over time builds a record of what's normal for you. That makes it easier to spot changes early and avoid repeated tests.",
        ),
      },
      {
        heading: 'Specialists and referrals',
        body: md(
          'Specialists focus on one area — for example, cardiologists (heart), endocrinologists (hormones and diabetes), or dermatologists (skin).',
          'A **referral** is a written order from your PCP saying you need to see a specialist or get a certain service. Many HMO and POS plans require one. If you skip it, the plan may refuse to pay.',
          'Before a specialist visit:',
          steps(
            'Check whether your plan requires a referral.',
            "Ask your PCP's office to send the referral and your recent records.",
            "Confirm the specialist is in your plan's network.",
            'Ask the specialist to send a visit summary back to your PCP.',
          ),
          "Good to know: under the Affordable Care Act, most plans can't require a referral before you see an in-network OB-GYN.",
        ),
      },
      {
        heading: 'Networks: in-network vs. out-of-network',
        body: md(
          "Insurers sign contracts with certain doctors, hospitals, labs, and pharmacies. Together these form the plan's **network**. In-network providers agree to set prices, so you usually pay less.",
          "Going **out-of-network** can cost much more — or not be covered at all. An out-of-network provider may also bill you for the difference between their charge and what your plan allows. This is called **balance billing**.",
          'Protect yourself:',
          bullets(
            "Check the plan's online provider directory, then call the office to confirm they take your specific plan.",
            'Check the facility (hospital, lab, imaging center), not just the doctor.',
            'In an emergency, go to the nearest ER. Federal law limits surprise out-of-network bills for most emergency care.',
          ),
        ),
      },
      {
        heading: 'Other members of your care team',
        body: md(
          "Doctors aren't the only people who can help:",
          bullets(
            '**Pharmacists** can answer medicine questions, check for drug interactions, and often give vaccines.',
            '**Nurse advice lines** can help you decide where to get care, often 24/7. Look on the back of your insurance card.',
            '**Community health centers** offer primary care — and often dental and mental health care — with fees based on income. They serve people with or without insurance.',
            '**Telehealth** lets you see a clinician by video or phone for many common problems.',
            '**Hospitals** handle emergencies, surgery, and overnight care.',
          ),
        ),
      },
      {
        heading: 'Putting it together',
        body: md(
          "Here's a common path through the system:",
          steps(
            "You notice a new health problem that isn't an emergency.",
            "You call your PCP's office or use the patient portal (or a nurse line after hours).",
            'Your PCP examines you, orders tests if needed, and starts treatment.',
            'If you need more expertise, your PCP refers you to an in-network specialist.',
            'The specialist sends results back so your PCP can keep the whole picture.',
          ),
          "If you don't have a PCP yet, finding one before you get sick is one of the best things you can do for your health — and your wallet.",
        ),
      },
    ],
    keyTakeaways: [
      'Your primary care provider is your home base for everyday care and referrals.',
      'Many HMO and POS plans require a referral before you see a specialist.',
      'In-network care usually costs much less — confirm both the doctor and the facility.',
      'Pharmacists, nurse lines, community health centers, and telehealth are part of your care team too.',
    ],
    quiz: [
      {
        question: 'What is a referral?',
        options: [
          'A bill from a specialist',
          'A discount card for prescriptions',
          'A written order from your primary care provider for specialist care or a service',
          'A list of in-network hospitals',
        ],
        answerIndex: 2,
        explanation:
          "A referral is a written order from your PCP. Many HMO and POS plans won't pay for specialist visits without one.",
      },
      {
        question: 'You want to see a new dermatologist. What should you check first?',
        options: [
          "Whether they're in your plan's network and whether your plan needs a referral",
          'Whether their office is the closest one to your home',
          'Whether they have good photos on their website',
          'Nothing — insurance covers every doctor the same way',
        ],
        answerIndex: 0,
        explanation:
          'Network status and referral rules decide whether your plan pays and how much. Call the office to confirm they take your specific plan.',
      },
      {
        question: 'What is balance billing?',
        options: [
          'When your insurance pays the full bill',
          'When you split a bill into monthly payments',
          'A fee for missing an appointment',
          'When an out-of-network provider bills you for the difference between their charge and what your plan allows',
        ],
        answerIndex: 3,
        explanation:
          "Balance billing happens with out-of-network providers. Staying in-network helps you avoid it, and the No Surprises Act limits it in many emergency situations.",
      },
    ],
    sources: [
      {
        title: 'Types of health care providers',
        publisher: 'NIH MedlinePlus',
        url: 'https://medlineplus.gov/ency/article/001933.htm',
      },
      {
        title: 'Referral - Glossary',
        publisher: 'HealthCare.gov',
        url: 'https://www.healthcare.gov/glossary/referral/',
      },
      {
        title: 'Balance billing - Glossary',
        publisher: 'HealthCare.gov',
        url: 'https://www.healthcare.gov/glossary/balance-billing/',
      },
      {
        title: 'Doctor Choice & Emergency Room Access',
        publisher: 'HealthCare.gov',
        url: 'https://www.healthcare.gov/health-care-law-protections/doctor-choice-emergency-room-access/',
      },
      {
        title: 'Find a Health Center',
        publisher: 'HRSA',
        url: 'https://findahealthcenter.hrsa.gov/',
      },
    ],
    askBrianPrompts: [
      'Do I need a referral to see a specialist with my plan type?',
      'How do I find out if a doctor is in my insurance network?',
      "What's the difference between a family medicine doctor and an internist?",
    ],
    tags: [
      'primary care',
      'PCP',
      'specialist',
      'referral',
      'network',
      'in-network',
      'out-of-network',
      'balance billing',
      'health system',
      'community health center',
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'where-to-go-for-care',
    categoryId: 'healthcare-system',
    title: 'ER, Urgent Care, Telehealth, or Your Doctor?',
    summary:
      "How to pick the right place for care — fast when it matters, and without overpaying when it doesn't.",
    readMinutes: 4,
    level: 'Basics',
    icon: 'navigate-outline',
    callout: {
      kind: 'emergency',
      text: "If someone may be having a life-threatening emergency — chest pain or pressure, trouble breathing, stroke signs (face drooping, arm weakness, speech trouble), severe bleeding, a seizure, or passing out — call 911 now. Don't drive yourself. For a mental-health crisis, call or text 988. For a possible poisoning, call Poison Help at 1-800-222-1222.",
    },
    sections: [
      {
        heading: 'First question: could this be life-threatening?',
        body: md(
          'If a person could die or be permanently harmed, treat it as an emergency. **Call 911** instead of driving — paramedics can start treatment on the way and alert the hospital.',
          'Call 911 right away for:',
          bullets(
            'Chest pain or pressure',
            'Severe trouble breathing',
            'Sudden weakness or drooping on one side, trouble speaking, or sudden trouble seeing or walking',
            "A seizure that lasts more than a minute, or someone who passes out and doesn't wake up quickly",
            "Heavy bleeding that won't stop",
            'A head, neck, or spine injury with confusion, numbness, or trouble moving',
            'A severe allergic reaction with trouble breathing or swelling',
          ),
          "When in doubt, call. It's always OK to let 911 decide.",
        ),
      },
      {
        heading: 'When the emergency room is the right place',
        body: md(
          'Some problems are serious, but you may be able to get to the ER safely with someone else driving. Go to the ER — or call 911 if things get worse — for problems like:',
          bullets(
            'A sudden, severe, or unusual headache',
            'Dizziness or weakness that does not go away',
            'A possible broken bone, especially if the bone is pushing through the skin',
            'Coughing up or vomiting blood',
            'Severe pain anywhere in the body',
            'High fever with a stiff neck and headache',
            "Vomiting or diarrhea that won't stop",
            'Breathing in smoke or toxic fumes',
          ),
          "If you are thinking about hurting yourself, call or text **988** any time, or go to the nearest ER. Don't wait.",
        ),
      },
      {
        heading: 'Urgent care: soon, but not life-threatening',
        body: md(
          "Urgent care clinics treat problems that need attention today but aren't emergencies — especially when your regular office is closed or booked.",
          'Urgent care is usually a good fit for:',
          bullets(
            'Colds, flu symptoms, sore throats, and earaches',
            'Low-grade fevers and limited rashes',
            'Sprains, back strain, and minor broken bones (like a finger or toe)',
            'Small cuts that may need stitches, and minor burns',
            'Minor eye injuries or irritation',
          ),
          "Urgent care usually costs much less than the ER, but it can't handle true emergencies. If symptoms are severe or getting worse fast, go to the ER or call 911.",
        ),
      },
      {
        heading: "Your doctor's office and nurse lines",
        body: md(
          'For new problems that are not urgent, ongoing conditions, medicine questions, and checkups, your primary care office is usually the best choice. They know your history, which leads to safer, better-coordinated care.',
          'Many offices offer same-day sick visits. After hours, calls often go to an on-call nurse or doctor. Many insurance plans also have a free 24/7 **nurse advice line** — look on the back of your card.',
          'Tip: save these numbers in your phone now, before you need them:',
          bullets(
            "Your doctor's office and its after-hours line",
            "Your plan's nurse advice line",
            'The nearest in-network urgent care',
            'The nearest emergency room',
          ),
        ),
      },
      {
        heading: 'Telehealth: care by video or phone',
        body: md(
          'Telehealth visits let you talk with a clinician from home. They can work well for:',
          bullets(
            'Minor illnesses, like a cold or pink eye',
            'Rashes you can show on camera',
            'Medicine refills and follow-up visits',
            'Many mental health visits',
          ),
          "Telehealth is **not** for emergencies, and some problems need an in-person exam, like listening to your lungs or checking a possible broken bone. Coverage varies by insurance plan and state, so check before you book.",
          'To prepare: charge your device, test your camera and sound, find a quiet, well-lit spot, and have your medicine list and pharmacy information ready.',
        ),
      },
      {
        heading: 'Cost and your rights in the ER',
        body: md(
          "ER care can cost 2 to 3 times more than the same care in a doctor's office, and many plans charge a higher copay. But never skip the ER in a real emergency because of cost.",
          'Federal protections help:',
          bullets(
            'Hospitals that take Medicare and offer emergency services must give you a medical screening exam and stabilize an emergency **regardless of your ability to pay** (a law called EMTALA).',
            "Most plans can't require prior approval for emergency care or charge you more for using an out-of-network ER.",
            'The No Surprises Act protects most people with insurance from surprise out-of-network bills for emergency care.',
          ),
        ),
      },
    ],
    keyTakeaways: [
      "Life-threatening symptoms mean calling 911 — don't drive yourself.",
      "Urgent care handles problems that can't wait but aren't emergencies, for less than the ER.",
      'Your primary care office and nurse lines are best for non-urgent problems and ongoing care.',
      'Telehealth is convenient for many minor issues, but not for emergencies.',
      'ERs at hospitals that take Medicare must screen and stabilize you regardless of ability to pay.',
    ],
    quiz: [
      {
        question: "Your father suddenly can't lift one arm and his speech is slurred. What should you do?",
        options: [
          'Drive him to urgent care',
          'Book a telehealth visit',
          'Call 911 right away',
          'Wait an hour to see if it passes',
        ],
        answerIndex: 2,
        explanation:
          'These are stroke warning signs. Call 911 — every minute matters, and paramedics can start care on the way.',
      },
      {
        question:
          "You twisted your ankle. You can walk on it, but it's swollen and your doctor's office is closed. Which is usually the best fit?",
        options: ['Urgent care', 'The emergency room', 'Wait a week before getting care', 'Call 988'],
        answerIndex: 0,
        explanation:
          'A sprain you can walk on is a good fit for urgent care. Go to the ER instead if the bone looks out of place or the pain is severe.',
      },
      {
        question: 'Which statement about ER care in the US is true?',
        options: [
          "ERs can turn you away if you can't pay",
          'Hospital ERs that take Medicare must screen and stabilize you regardless of ability to pay',
          'You need prior approval from your insurer before going to the ER',
          'The ER is always cheaper than urgent care',
        ],
        answerIndex: 1,
        explanation:
          "Under EMTALA, Medicare-participating hospitals with emergency departments must screen and stabilize emergencies no matter whether you can pay. Most plans also can't require prior approval for emergency care.",
      },
    ],
    sources: [
      {
        title: 'When to use the emergency room - adult',
        publisher: 'NIH MedlinePlus',
        url: 'https://medlineplus.gov/ency/patientinstructions/000593.htm',
      },
      {
        title: 'Emergency Medical Treatment & Labor Act (EMTALA)',
        publisher: 'CMS',
        url: 'https://www.cms.gov/medicare/regulations-guidance/legislation/emergency-medical-treatment-labor-act',
      },
      {
        title: 'Doctor Choice & Emergency Room Access',
        publisher: 'HealthCare.gov',
        url: 'https://www.healthcare.gov/health-care-law-protections/doctor-choice-emergency-room-access/',
      },
      {
        title: 'Telehealth: What Is It, How to Prepare, Is It Covered?',
        publisher: 'National Institute on Aging (NIH)',
        url: 'https://www.nia.nih.gov/health/medical-care-and-appointments/telehealth-what-it-how-prepare-it-covered',
      },
      {
        title: 'Know your rights with insurance',
        publisher: 'CMS',
        url: 'https://www.cms.gov/initiatives/your-patient-rights/medical-bill-rights/know-your-medical-bill-rights/know-your-rights-insurance',
      },
    ],
    askBrianPrompts: [
      'Is urgent care or the ER better for a cut that might need stitches?',
      'What symptoms mean I should call 911 instead of driving to the hospital?',
      "What can a telehealth visit handle, and what can't it?",
    ],
    tags: [
      'emergency room',
      'ER',
      'urgent care',
      'telehealth',
      '911',
      '988',
      'nurse line',
      'where to go',
      'EMTALA',
      'virtual visit',
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'doctor-visit-prep',
    categoryId: 'healthcare-system',
    title: 'Getting the Most From a Doctor Visit',
    summary:
      "Simple steps before, during, and after an appointment so you're heard, understand the plan, and know what to do next.",
    readMinutes: 4,
    level: 'Basics',
    icon: 'clipboard-outline',
    callout: {
      kind: 'tip',
      text: 'Visits are often short. Pick your top 3 or 4 concerns ahead of time and mention them at the start of the visit.',
    },
    sections: [
      {
        heading: 'Before: make a short list',
        body: md(
          "Write down what you want to talk about, then put the most important items first. Bring up your biggest worry at the start — don't save it for the end, when time may run out.",
          'For each symptom, note:',
          bullets(
            'When it started',
            'How often it happens and how long it lasts',
            'What makes it better or worse',
            "What you've already tried",
          ),
          'Also jot down big changes since your last visit, like an ER trip, a new specialist, a new medicine, or changes in your sleep, appetite, weight, energy, or mood.',
        ),
      },
      {
        heading: 'Bring the right things',
        body: md(
          'Pack these before you leave:',
          bullets(
            'A list of **every** medicine you take — prescriptions, over-the-counter drugs, vitamins, and supplements — with doses. Or bring the bottles in a bag.',
            'Your allergies, especially to medicines',
            'Your insurance card and photo ID',
            'Names and phone numbers of your other doctors and your pharmacy',
            'Recent test results or records from other providers',
            'Glasses and hearing aids, so you can see and hear clearly',
          ),
          "A friend or family member can take notes and help you remember details. Tell them ahead of time how they can help — and remember you can still ask for private time with the doctor.",
        ),
      },
      {
        heading: 'During: be honest and speak up',
        body: md(
          "Your clinician can only help with what they know. Share the full story, even if it feels embarrassing — for example, how often you really take your medicine, or whether you smoke, drink, or use other substances.",
          "It's OK to:",
          bullets(
            'Say that you feel rushed or worried',
            'Ask the doctor to slow down or explain a word',
            "Ask for an interpreter if English isn't your first language — call ahead so the office can plan",
            'Take notes, or ask permission to record the visit',
          ),
          'Three useful questions to ask:',
          bullets('What is my main problem?', 'What do I need to do?', 'Why is it important for me to do this?'),
        ),
      },
      {
        heading: 'Use teach-back to check your understanding',
        body: md(
          'Teach-back means repeating the plan in your own words so you and your clinician can catch any mix-ups before you leave.',
          'Try saying:',
          bullets(
            '“Let me make sure I have this right. I take this pill twice a day with food, and I call you if the rash spreads. Is that correct?”',
            '“So the next step is a blood test this week, and you will send the results through the portal?”',
          ),
          "If something is off, your clinician can explain it a different way. It's easy to forget a lot of what you hear at a visit, so this simple step matters. Ask for written instructions or a visit summary, too.",
        ),
      },
      {
        heading: 'Before you leave',
        body: md(
          'Make sure you know:',
          steps(
            'What your diagnosis or likely problem is',
            'What each new medicine is for, how to take it, and which side effects to watch for',
            "What tests you need, and how and when you'll get the results",
            'When to come back, and which symptoms mean you should call sooner or go to the ER',
            'Who to contact with questions after the visit',
          ),
          "Don't assume “no news is good news” with test results. Ask when to expect them, and call if you don't hear back.",
        ),
      },
      {
        heading: 'After: follow through',
        body: md(
          "Once you're home:",
          bullets(
            'Read your visit summary in the patient portal and check that it matches what you heard.',
            'Fill new prescriptions and update your medicine list.',
            'Schedule any follow-up visits and tests.',
            'Tell your other doctors about important changes.',
            "Call the office or send a portal message if you're confused. A nurse or pharmacist can often help.",
          ),
          "If you're unsure about a specialist's advice, your primary care provider can help you understand it and fit it into your overall care.",
        ),
      },
    ],
    keyTakeaways: [
      'Bring up your most important concern first.',
      'Bring a full list of medicines, including supplements and over-the-counter drugs.',
      'Use teach-back: repeat the plan in your own words to check that you understood.',
      "Ask how and when you'll get test results — don't assume no news is good news.",
    ],
    quiz: [
      {
        question: 'What is the teach-back method?',
        options: [
          'Teaching your doctor about your symptoms',
          'Repeating the care plan in your own words to confirm you understood it',
          'Reading your medical records online',
          'Asking for a second opinion',
        ],
        answerIndex: 1,
        explanation:
          'Teach-back helps you and your clinician catch misunderstandings before you leave, like the wrong dose or a missed follow-up step.',
      },
      {
        question: 'What should be on the medicine list you bring to a visit?',
        options: [
          'Only prescriptions from this doctor',
          'Only medicines you take every day',
          'Prescriptions, over-the-counter medicines, vitamins, and supplements, with doses',
          'Just the name of your pharmacy',
        ],
        answerIndex: 2,
        explanation:
          'Over-the-counter drugs and supplements can interact with prescriptions, so your clinician needs the full list.',
      },
      {
        question: "You had blood drawn a week ago and haven't heard anything. What's the best move?",
        options: [
          'Call the office or check your patient portal for the results',
          'Assume everything is normal',
          'Wait until your next yearly checkup',
          'Get the same test again somewhere else',
        ],
        answerIndex: 0,
        explanation:
          "Results can fall through the cracks. Follow up if you haven't heard back when expected.",
      },
    ],
    sources: [
      {
        title: "How To Prepare for a Doctor's Appointment",
        publisher: 'National Institute on Aging (NIH)',
        url: 'https://www.nia.nih.gov/health/medical-care-and-appointments/how-prepare-doctors-appointment',
      },
      {
        title: "Five Ways to Get the Most Out of Your Doctor's Visit",
        publisher: 'National Institute on Aging (NIH)',
        url: 'https://www.nia.nih.gov/health/medical-care-and-appointments/five-ways-get-most-out-your-doctors-visit',
      },
      {
        title: 'What Do I Need to Tell the Doctor?',
        publisher: 'National Institute on Aging (NIH)',
        url: 'https://www.nia.nih.gov/health/medical-care-and-appointments/what-do-i-need-tell-doctor',
      },
      {
        title: 'Talking With Your Doctor',
        publisher: 'NIH MedlinePlus',
        url: 'https://medlineplus.gov/talkingwithyourdoctor.html',
      },
    ],
    askBrianPrompts: [
      'Help me make a list of questions for my next appointment.',
      'How do I describe my symptoms clearly to my doctor?',
      'What should I ask about a new medication before I leave the office?',
    ],
    tags: [
      'doctor visit',
      'appointment',
      'questions',
      'teach-back',
      'medication list',
      'communication',
      'preparation',
      'visit summary',
      'follow-up',
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'medical-records-patient-portal',
    categoryId: 'healthcare-system',
    title: 'Your Medical Records and Patient Portal',
    summary:
      'You have a legal right to see and get copies of your health records. Learn how to use your portal, request records, and fix mistakes.',
    readMinutes: 4,
    level: 'Basics',
    icon: 'folder-open-outline',
    callout: {
      kind: 'tip',
      text: 'In the US, a federal law called HIPAA gives you the right to see and get a copy of your health records from doctors, hospitals, pharmacies, labs, and health plans — even if you have unpaid bills.',
    },
    sections: [
      {
        heading: 'Your right to your records',
        body: md(
          "Under **HIPAA**, you have the right to see and get a copy of your health information. This covers records held by doctors' offices, clinics, hospitals, pharmacies, labs, nursing homes, and health plans.",
          'Your records can include:',
          bullets(
            'Visit notes and summaries',
            'Lab results and imaging reports',
            'Medicines, allergies, and immunizations',
            'Billing and insurance information',
          ),
          "A provider can't refuse just because you have unpaid bills. If staff say “HIPAA won't let us give you that,” politely explain that HIPAA actually protects your right to get your own records.",
        ),
      },
      {
        heading: 'Start with the patient portal',
        body: md(
          "A **patient portal** is a secure website or app run by your doctor's office, hospital, or health system. Through it, you can often:",
          bullets(
            'See test results and visit notes',
            'Send messages to your care team',
            'Request prescription refills',
            'Book or change appointments',
            'Download your records or share them with another provider',
          ),
          "Heads-up: results often appear in the portal as soon as they're ready — sometimes before your clinician has reviewed them with you. If a result worries you, send a message or call the office instead of guessing. Many portals also let a caregiver get their own “proxy” login with your permission.",
        ),
      },
      {
        heading: 'How to request a full copy',
        body: md(
          "If what you need isn't in the portal, ask for it directly:",
          steps(
            "Contact the office's medical records (health information) department. Check the “Contact us” section of their website.",
            'Fill out their request form, or send a written request with your name, date of birth, and contact details.',
            'Say exactly what you want — for example, all records from last year or copies of your MRI images — and the format you prefer: electronic, paper, or disc.',
            'Keep a copy of your request and note the date you sent it.',
          ),
          'The provider generally has **30 days** to respond. They can take up to 30 more days only if they tell you why in writing. Some states set shorter deadlines.',
        ),
      },
      {
        heading: 'What it costs',
        body: md(
          'Getting records electronically — through a portal, an app, or email — is often free. If there is a charge, HIPAA allows only a **reasonable, cost-based fee** to cover making and mailing the copies. Ask about the cost when you make your request.',
          'Money-saving tips:',
          bullets(
            'Ask for electronic copies when you can.',
            'Request only what you need, like recent notes and results.',
            "Ask your new doctor's office to request records from your old one. Providers are allowed to share records with each other for your treatment.",
          ),
        ),
      },
      {
        heading: 'Check it: find and fix mistakes',
        body: md(
          'Errors happen. Look over your records for:',
          bullets(
            'Wrong medicines, doses, or allergies',
            "Health conditions you don't have, or missing ones you do",
            'Wrong contact, insurance, or emergency contact information',
            'Charges for tests you never had',
          ),
          "To fix a mistake, ask the office how to request a correction (sometimes called an amendment). Send it in writing with a copy of the page, and explain what's wrong and why. They generally have **60 days** to respond.",
          'If they disagree, you can send a written statement explaining why. It becomes part of your record.',
        ),
      },
      {
        heading: 'Keep your information safe',
        body: md(
          'Your health information is valuable, so protect it:',
          bullets(
            'Use a strong, unique password for each portal, and turn on two-step login if offered.',
            'Log out when you use a shared computer.',
            'Before connecting a health app to your portal, read its privacy policy. Apps you choose yourself may not be covered by HIPAA, and some may share or sell data.',
            "Avoid sending records through regular personal email, which isn't as secure as portal messages.",
          ),
          'If a provider refuses access or ignores your request, you can file a complaint with the HHS Office for Civil Rights.',
        ),
      },
    ],
    keyTakeaways: [
      'HIPAA gives you the right to see and get copies of your health records.',
      "Check your patient portal first — it's often the fastest option, and usually free.",
      'Providers generally must respond within 30 days, with one 30-day extension allowed.',
      'You can ask to correct mistakes; providers generally must respond within 60 days.',
    ],
    quiz: [
      {
        question:
          "Your doctor's office says you can't have your records because you owe money. Is that allowed under HIPAA?",
        options: [
          'Yes, they can hold records until you pay',
          'No, you have a right to your records even with unpaid bills',
          'Only if the bill is over $500',
          'Only for hospital records',
        ],
        answerIndex: 1,
        explanation:
          "Under HIPAA, you're entitled to see and get your health records even if you haven't paid your bills.",
      },
      {
        question: 'How long does a provider generally have to act on your records request under HIPAA?',
        options: ['24 hours', '7 days', '30 days, with one possible 30-day extension', '6 months'],
        answerIndex: 2,
        explanation:
          'Providers generally have 30 days. If they need more time, they must explain why in writing and can take up to 30 more days. Some states require faster responses.',
      },
      {
        question: "You find an allergy in your record that you don't have. What should you do?",
        options: [
          'Ask the provider in writing to correct it, and include a copy of the page',
          "Nothing — records can't be changed",
          'Delete it yourself in the portal',
          'Only mention it if you end up in the hospital',
        ],
        answerIndex: 0,
        explanation:
          'You have the right to request a correction. Wrong allergy information can affect which medicines you are given, so fix it early.',
      },
    ],
    sources: [
      {
        title: 'Get It, Check It, Use It: The Guide to Getting & Using Your Health Records',
        publisher: 'HealthIT.gov (ONC)',
        url: 'https://healthit.gov/get-it-check-it-use-it/',
      },
      {
        title: 'Get It',
        publisher: 'HealthIT.gov (ONC)',
        url: 'https://healthit.gov/get-it-check-it-use-it/get-it/',
      },
      {
        title: 'Check It',
        publisher: 'HealthIT.gov (ONC)',
        url: 'https://healthit.gov/get-it-check-it-use-it/check-it/',
      },
      {
        title: 'Use It',
        publisher: 'HealthIT.gov (ONC)',
        url: 'https://healthit.gov/get-it-check-it-use-it/use-it/',
      },
      {
        title: 'Personal Health Records',
        publisher: 'NIH MedlinePlus',
        url: 'https://medlineplus.gov/personalhealthrecords.html',
      },
    ],
    askBrianPrompts: [
      'How do I read the lab results in my patient portal?',
      'What should I do if I find a mistake in my medical record?',
      'Can a family member get access to my patient portal?',
    ],
    tags: [
      'medical records',
      'patient portal',
      'HIPAA',
      'right of access',
      'health information',
      'amendment',
      'copies',
      'privacy',
      'lab results',
      'proxy access',
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'second-opinion-guide',
    categoryId: 'healthcare-system',
    title: 'Getting a Second Opinion',
    summary:
      'When a diagnosis is serious or surgery is on the table, another expert can confirm the plan or reveal new options. Here is how to get one.',
    readMinutes: 4,
    level: 'Intermediate',
    icon: 'git-compare-outline',
    callout: {
      kind: 'warning',
      text: "Don't let a second opinion delay urgent treatment. If your condition may need care right away, ask your doctor how much time you can safely take to decide.",
    },
    sections: [
      {
        heading: 'What a second opinion is',
        body: md(
          'A second opinion means asking another qualified doctor — usually a specialist in the same field — to review your diagnosis and treatment plan. They look at your records, test results, and imaging, and may examine you or order more tests.',
          'The second doctor may agree with the first plan, suggest changes, or recommend a different approach. Either way, you gain:',
          bullets(
            'More information about your options',
            'Answers to questions you may still have',
            'More confidence in your decision',
          ),
          "Second opinions are common. Most doctors expect them, especially for serious conditions, and won't be offended.",
        ),
      },
      {
        heading: "When it's worth considering",
        body: md(
          'A second opinion can be especially helpful when:',
          bullets(
            "You've been diagnosed with a serious or rare condition, like cancer",
            'A doctor recommends major surgery or a risky treatment',
            "Treatment isn't working, or your symptoms don't seem to fit the diagnosis",
            'There are several reasonable treatment options',
            'A treatment is described as experimental',
            'You feel unsure, rushed, or not fully heard',
          ),
          "It's usually not needed for minor, common problems with a clear, low-risk treatment. And in an emergency, get care first — questions can come later.",
        ),
      },
      {
        heading: 'Will insurance pay for it?',
        body: md(
          'Many health plans cover second opinions, and some require one before certain surgeries. Before you book:',
          steps(
            'Call the number on your insurance card and ask whether second opinions are covered.',
            'Ask whether you need a referral or prior approval.',
            'Choose an in-network doctor to keep costs down.',
            'Ask whether any new tests would be covered.',
          ),
          'In some cases, **Medicare Part B** covers a second opinion for medically necessary surgery that is not an emergency, and a third opinion if the first two disagree. You usually pay 20% of the Medicare-approved amount after the Part B deductible.',
        ),
      },
      {
        heading: 'How to ask your doctor',
        body: md(
          "Bringing it up can feel awkward, but it's a normal part of care. You might say:",
          bullets(
            '“I trust you, and I want to be sure I understand all my options before I decide. Can you recommend someone for a second opinion?”',
            '“Could your office send my records and scans to the doctor I am seeing for a second opinion?”',
          ),
          "It helps to involve your current doctor, since their office can send your records, test results, and imaging. You don't need their permission, though. You have a right to your records and can request copies yourself.",
        ),
      },
      {
        heading: 'Finding the right second doctor',
        body: md(
          'Look for a doctor who:',
          bullets(
            'Specializes in your specific condition',
            'Is board certified in that specialty',
            'Ideally works at a different practice or hospital, for a more independent review',
            'Is in your insurance network',
          ),
          "To find one, ask your doctor, check your plan's directory, or contact a major medical center or teaching hospital. For cancer, NCI-Designated Cancer Centers are a good place to look, and NCI's Cancer Information Service at 1-800-4-CANCER (1-800-422-6237) can help.",
          'Some centers offer remote second opinions, where experts review your records without an in-person visit. Check whether your plan covers them.',
        ),
      },
      {
        heading: 'Getting ready, and what comes next',
        body: md(
          'Before the visit, make sure the second doctor has your records, test results, imaging, and any pathology reports (the lab findings from a biopsy). Bring your medicine list and a few questions, such as:',
          bullets(
            'Do you agree with the diagnosis?',
            'What treatment would you recommend, and why?',
            'What are the risks, benefits, and costs of each option?',
            'What happens if I wait, or choose no treatment?',
          ),
          'If the two opinions differ, ask each doctor to explain their reasoning, and share the second opinion with your first doctor. Sometimes a third opinion helps. The final choice is yours.',
        ),
      },
    ],
    keyTakeaways: [
      'Second opinions are common, and most doctors expect them.',
      'Consider one for serious diagnoses, major surgery, or whenever you feel unsure.',
      'Check with your insurer first; Medicare Part B covers second opinions for non-emergency surgery.',
      'Make sure the second doctor gets your full records, imaging, and pathology reports.',
      "Don't let a second opinion delay urgent care.",
    ],
    quiz: [
      {
        question: 'When is a second opinion MOST worth considering?',
        options: [
          'For a mild cold',
          'When a doctor recommends major surgery for a serious condition',
          'Before a routine flu shot',
          'For a routine prescription refill',
        ],
        answerIndex: 1,
        explanation:
          'Second opinions are most valuable for serious diagnoses, major surgery, or when there are several reasonable options.',
      },
      {
        question: 'Which statement about Medicare and second opinions is true?',
        options: [
          'Medicare never pays for second opinions',
          'Only Medicare Part D covers second opinions',
          'Medicare Part B can cover a second opinion before non-emergency surgery, and a third if the first two differ',
          'You must always pay the full cost yourself',
        ],
        answerIndex: 2,
        explanation:
          'Part B covers second surgical opinions in some cases, plus a third opinion if the first two disagree. You usually pay 20% after the deductible.',
      },
      {
        question: 'Why can it help to choose a second doctor from a different practice or hospital?',
        options: [
          'Their review is more likely to be independent',
          'It is always cheaper',
          'It is required by law',
          'They can prescribe stronger medicines',
        ],
        answerIndex: 0,
        explanation:
          "A doctor outside the first practice is less likely to share the same assumptions, which makes the review more independent.",
      },
    ],
    sources: [
      {
        title: 'Finding Cancer Care',
        publisher: 'National Cancer Institute (NIH)',
        url: 'https://www.cancer.gov/about-cancer/managing-care/finding-cancer-care',
      },
      {
        title: 'Second Surgical Opinion Coverage',
        publisher: 'Medicare.gov',
        url: 'https://www.medicare.gov/coverage/second-surgical-opinions',
      },
      {
        title: 'Discussing Health Decisions with Your Doctor',
        publisher: 'National Institute on Aging (NIH)',
        url: 'https://www.nia.nih.gov/health/medical-care-and-appointments/discussing-health-decisions-your-doctor',
      },
      {
        title: 'Get It',
        publisher: 'HealthIT.gov (ONC)',
        url: 'https://healthit.gov/get-it-check-it-use-it/get-it/',
      },
    ],
    askBrianPrompts: [
      'What questions should I ask at a second-opinion appointment?',
      'How do I ask my doctor for a second opinion without offending them?',
      'Does insurance usually cover a second opinion before surgery?',
    ],
    tags: [
      'second opinion',
      'surgery',
      'diagnosis',
      'cancer',
      'specialist',
      'Medicare',
      'treatment options',
      'medical records',
      'decision making',
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'choosing-a-doctor',
    categoryId: 'healthcare-system',
    title: 'Finding and Choosing a Doctor',
    summary:
      'How to find a primary care provider who takes your insurance, fits your needs, and is someone you can talk to.',
    readMinutes: 3,
    level: 'Basics',
    icon: 'person-add-outline',
    callout: {
      kind: 'tip',
      text: "Look for a primary care provider before you get sick. It's much easier to compare options when you're not in a hurry.",
    },
    sections: [
      {
        heading: 'Why a regular doctor matters',
        body: md(
          "A primary care provider — a doctor, nurse practitioner, or physician assistant — is usually the clinician you'll see most. Over time, they get to know your history, your goals, and what's normal for you.",
          'A good primary care provider can:',
          bullets(
            'Recommend screenings and vaccines to prevent problems',
            'Treat many physical and mental health issues',
            'Help manage long-term conditions',
            'Refer you to specialists and coordinate your care',
            'Answer your health questions and help you build healthy habits',
          ),
          "You're looking for someone you trust and can talk to openly, since you may see them for years.",
        ),
      },
      {
        heading: 'Step 1: Start with your insurance',
        body: md(
          "If you have insurance, you'll usually pay much less with an in-network provider.",
          steps(
            "Use your insurer's online directory, or call the member services number on your card.",
            'Filter by type (family medicine, internal medicine, pediatrics, or geriatrics), location, and language.',
            'Call the office to confirm they take **your specific plan** and are accepting new patients. Online directories can be out of date.',
          ),
          "No insurance? Community health centers provide primary care with fees based on your income. Search for one near you on HRSA's Find a Health Center website. You can also check HealthCare.gov or your state Medicaid program to see if you qualify for coverage.",
        ),
      },
      {
        heading: 'Step 2: Get recommendations and check credentials',
        body: md(
          "Ask people you trust — friends, family, co-workers, or your current doctor if they're retiring or you're moving. Pharmacists and other health professionals can also have useful insight.",
          'Then do a quick background check:',
          bullets(
            "**License:** Most state medical boards have a website where you can confirm a doctor's license and see any disciplinary actions.",
            '**Board certification:** This means the doctor completed extra training and passed exams in their specialty. Ask the office, or check the specialty board.',
            '**Hospital ties:** Ask which hospitals the doctor works with, in case you ever need to be admitted.',
          ),
          'Online reviews can give you a feel for the office, but take them with a grain of salt.',
        ),
      },
      {
        heading: 'Step 3: Ask the office practical questions',
        body: md(
          'A quick phone call can tell you a lot. Ask:',
          bullets(
            'How long does it usually take to get an appointment?',
            'Do you offer same-day sick visits, evening or weekend hours, or video visits?',
            'Who covers when my doctor is away, or after hours?',
            'Is there a patient portal for messages, refills, and results?',
            'Can I get lab tests and X-rays done here?',
            'Is there a doctor, nurse, or interpreter who speaks my language?',
            'Does the doctor have experience with my health conditions?',
          ),
          'Also think about location, parking or public transit, and any accessibility needs.',
        ),
      },
      {
        heading: 'Step 4: Judge the first visit',
        body: md(
          'After your first appointment, ask yourself whether the doctor:',
          bullets(
            'Listened without interrupting or rushing you',
            'Explained things in a way you understood',
            'Treated you with respect',
            'Invited your questions and included you in decisions',
            'Took your concerns seriously',
          ),
          "If the answer to any of these is “no,” it's OK to keep looking. You can switch doctors. If you have an HMO, you may need to tell your plan when you change your primary care provider.",
        ),
      },
    ],
    keyTakeaways: [
      'Choose a primary care provider before you need one.',
      'Call to confirm the doctor takes your specific plan and is accepting new patients.',
      'Check license and board certification, and ask practical questions about access.',
      'Community health centers offer care with fees based on income if you are uninsured.',
      "It's OK to switch if the relationship isn't working.",
    ],
    quiz: [
      {
        question: "Your insurer's online directory lists a doctor as in-network. What's the best next step?",
        options: [
          "Book the visit and assume it's covered",
          'Check their social media',
          'Ask your pharmacy',
          'Call the office to confirm they take your specific plan and new patients',
        ],
        answerIndex: 3,
        explanation:
          'Provider directories can be out of date. A quick call confirms network status and whether the doctor is accepting new patients.',
      },
      {
        question: 'Where can you usually check whether a doctor is licensed or has had disciplinary action?',
        options: [
          "Your state medical board's website",
          'A search engine ad',
          "The doctor's business card",
          'Your pharmacy receipt',
        ],
        answerIndex: 0,
        explanation:
          'State medical boards license doctors, and most let you look up license status and public disciplinary actions online.',
      },
      {
        question: 'Which is a sign a doctor may NOT be a good fit for you?',
        options: [
          'They explain things clearly',
          'They invite your questions',
          'They regularly rush you or brush off your concerns',
          'They include you in decisions',
        ],
        answerIndex: 2,
        explanation:
          "You should feel heard and respected. If a doctor regularly dismisses your concerns, it's reasonable to look for another one.",
      },
    ],
    sources: [
      {
        title: 'Choosing a Doctor: Quick Tips',
        publisher: 'HHS Office of Disease Prevention and Health Promotion (MyHealthfinder)',
        url: 'https://odphp.health.gov/myhealthfinder/doctor-visits/regular-checkups/choosing-doctor-quick-tips',
      },
      {
        title: 'Choosing a primary care provider',
        publisher: 'NIH MedlinePlus',
        url: 'https://medlineplus.gov/ency/article/001939.htm',
      },
      {
        title: 'How To Choose a Doctor You Can Talk to',
        publisher: 'National Institute on Aging (NIH)',
        url: 'https://www.nia.nih.gov/health/medical-care-and-appointments/how-choose-doctor-you-can-talk',
      },
      {
        title: '17 Questions to Ask When Choosing a New Doctor',
        publisher: 'National Institute on Aging (NIH)',
        url: 'https://www.nia.nih.gov/health/medical-care-and-appointments/17-questions-ask-when-choosing-new-doctor',
      },
      {
        title: 'Find a Health Center',
        publisher: 'HRSA',
        url: 'https://findahealthcenter.hrsa.gov/',
      },
    ],
    askBrianPrompts: [
      'What questions should I ask when calling a new doctor’s office?',
      'Should I choose a family medicine doctor or an internist?',
      "How do I switch primary care doctors if I'm not happy with mine?",
    ],
    tags: [
      'find a doctor',
      'choosing a doctor',
      'primary care',
      'PCP',
      'board certified',
      'in-network',
      'new patient',
      'community health center',
      'medical board',
    ],
  },
];
