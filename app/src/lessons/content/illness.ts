import type { Lesson } from '../types';

// Content for category 'illness' ("Feeling Sick?").
// Format: see src/lessons/types.ts (markdown-lite). Every source URL was checked to resolve to the
// named page. Facts reflect CDC / NIH / FDA / AHA / USPSTF / SAMHSA guidance as published through 2026.
// Educational content only — not a diagnosis or a substitute for a clinician's advice.

/** Joins lines with "\n". Use "" for a blank line (paragraph break). */
const md = (...lines: string[]): string => lines.join('\n');

export const lessons: Lesson[] = [
  // ───────────────────────────── 1. Getting sick: self-care vs. getting seen ─────────────────────────────
  {
    id: 'getting-sick-self-care-or-see-a-doctor',
    categoryId: 'illness',
    title: "Getting Sick? Self-Care vs. Getting Seen",
    summary:
      "How to care for a cold or other mild illness at home, which warning signs mean you should call a clinician, and when to call 911.",
    readMinutes: 5,
    level: 'Basics',
    icon: 'medkit-outline',
    callout: {
      kind: 'emergency',
      text: "Call 911 right away for trouble breathing, chest pain or pressure that won't go away, new confusion, fainting, trouble staying awake, sudden weakness or trouble speaking, heavy bleeding, or a seizure. If you are thinking about suicide, call or text 988.",
    },
    sections: [
      {
        heading: 'Most common illnesses get better on their own',
        body: md(
          "Colds, most sore throats, and many coughs are caused by viruses. Your immune system usually clears them without treatment. Cold symptoms tend to peak in 2 to 3 days, and most people feel better within about a week, although a runny nose or cough can hang on for up to 10 to 14 days.",
          '',
          "**Antibiotics do not work on viruses.** They won't help you feel better faster, and they can cause side effects like rash or diarrhea. Your clinician will tell you if a bacterial infection, such as strep throat, needs an antibiotic.",
          '',
          "The goal of home care is to stay comfortable, get rest, and watch for signs that something more serious is going on.",
        ),
      },
      {
        heading: 'Self-care that helps',
        body: md(
          '- **Rest** and **drink plenty of fluids** like water, broth, or warm tea.',
          '- Use a cool-mist humidifier or breathe steam from a hot shower.',
          '- Try saline (salt-water) nose spray or drops for a stuffy nose.',
          '- Use lozenges or cough drops for a sore throat (not for children under 4).',
          '- **Honey** can ease a cough for adults and children 1 year and older. Never give honey to a baby under 12 months.',
          "- Over-the-counter pain and fever relievers such as acetaminophen or ibuprofen can help. Follow the label, and check the active ingredients so you don't take the same medicine twice in a combination cold product. If you take too much by mistake, call Poison Help at 1-800-222-1222.",
          '',
          "CDC does not recommend over-the-counter cough and cold medicines for children under 6. If you take prescription medicines, ask a pharmacist which over-the-counter products are safe for you.",
        ),
      },
      {
        heading: 'Protect the people around you',
        body: md(
          "Stay home and away from others while you have symptoms like fever, cough, or a runny nose that aren't explained by something else, such as allergies.",
          '',
          'CDC says you can go back to your normal activities when, **for at least 24 hours**, both of these are true:',
          '',
          '- Your symptoms are getting better overall, and',
          '- You have not had a fever, and you are not using fever-reducing medicine.',
          '',
          "For the **next 5 days**, take extra care: wash your hands often, cover coughs and sneezes, wear a well-fitting mask around others, keep your distance, and open windows or use air filters when you can. This matters most around people at higher risk, like older adults and babies. If your fever comes back or you feel worse, stay home again.",
        ),
      },
      {
        heading: 'When to call a clinician or use telehealth',
        body: md(
          'Contact your doctor, a nurse advice line, or a telehealth service if:',
          '',
          '- Symptoms last more than 10 days without getting better.',
          '- You start to improve, then your fever or cough comes back or gets worse.',
          '- A fever lasts longer than 2 to 3 days, or stays at or above 103°F (39.4°C).',
          "- You're getting dehydrated: very little urine, a dry mouth, or dizziness when you stand.",
          '- A chronic condition such as asthma, diabetes, or heart disease is getting worse.',
          "- You're at higher risk of complications (for example, age 65 or older, pregnant, or a weakened immune system). Testing and early treatment can matter for flu and COVID-19.",
          '- Something just feels wrong. You know your body best.',
        ),
      },
      {
        heading: 'Emergency warning signs',
        body: md(
          'Call 911 or go to the emergency room for:',
          '',
          '- Trouble breathing or severe shortness of breath',
          "- Chest pain or pressure that won't go away",
          '- New confusion, fainting, or being hard to wake up',
          '- Pale, gray, or bluish lips, face, or nail beds',
          '- A seizure',
          '- Sudden weakness, numbness, or drooping on one side of the body, or sudden trouble speaking or seeing',
          '- Signs of severe dehydration, such as not urinating',
          '- Signs of **sepsis** when an infection is getting worse, such as confusion, a racing heart, fast breathing, extreme pain, or clammy skin. Ask, "Could this infection be leading to sepsis?"',
          '',
          "In children, also watch for fast breathing or ribs pulling in with each breath. If you're very sick, don't drive yourself.",
          '',
          "A baby 3 months or younger with a rectal temperature of 100.4°F (38°C) or higher needs to be seen right away. Call their clinician now, or go to the emergency room if you can't reach them quickly.",
        ),
      },
      {
        heading: 'Where to go when it is not an emergency',
        body: md(
          "In the US, you usually have several options. Your costs depend on your insurance plan, so check your plan's network before you go.",
          '',
          '- **Your primary care office**: best for most illnesses because they know your history. Many offer same-day visits.',
          "- **Nurse advice line**: often listed on the back of your insurance card. A nurse can help you decide where to go.",
          '- **Telehealth**: a video or phone visit works well for many mild illnesses.',
          '- **Urgent care**: for mild illnesses and minor injuries (like sprains or small cuts) when your doctor is not available.',
          '- **Emergency room**: for serious or life-threatening symptoms.',
          '',
          'Before you get sick, keep a thermometer, a fever reducer, and a list of your medicines and allergies where you can find them.',
        ),
      },
    ],
    keyTakeaways: [
      "Most colds and mild viral illnesses get better with rest, fluids, and time. Antibiotics don't help viruses.",
      'Stay home until your symptoms have been improving and you have had no fever (without medicine) for 24 hours, then take extra precautions for 5 more days.',
      'Call a clinician if symptoms last more than 10 days, get better and then worse, or you are at higher risk for complications.',
      'Call 911 for trouble breathing, chest pain or pressure, new confusion, bluish lips, a seizure, or signs of sepsis.',
    ],
    quiz: [
      {
        question: 'Which of these is an emergency warning sign that means you should call 911?',
        options: [
          'A runny nose and sneezing',
          'A mild sore throat',
          'New confusion or trouble staying awake',
          'Feeling tired for a couple of days',
        ],
        answerIndex: 2,
        explanation:
          'New confusion, being hard to wake, trouble breathing, and chest pain are emergency signs. The other symptoms are common with colds and can usually be managed at home.',
      },
      {
        question: 'According to CDC, when can you usually go back to normal activities after a respiratory illness?',
        options: [
          'As soon as one home test is negative',
          'After 24 hours of improving and no fever',
          'After exactly 10 days, no matter how you feel',
          'As soon as you start taking an antibiotic',
        ],
        answerIndex: 1,
        explanation:
          'CDC guidance is based on how you feel: at least 24 hours of improving symptoms and no fever without medicine. Then take extra precautions, like masking and hand washing, for the next 5 days.',
      },
      {
        question: "Why don't antibiotics help with most colds?",
        options: [
          'Colds are caused by viruses, not bacteria',
          'Colds are too mild for medicine to matter',
          'Antibiotics only work when given as a shot',
          'Antibiotics take a month to start working',
        ],
        answerIndex: 0,
        explanation:
          'Antibiotics kill bacteria, not viruses. Taking them for a cold will not speed recovery and can cause side effects.',
      },
    ],
    sources: [
      {
        title: 'Manage Common Cold',
        publisher: 'CDC',
        url: 'https://www.cdc.gov/common-cold/treatment/index.html',
      },
      {
        title: "Preventing Spread of Respiratory Viruses When You're Sick",
        publisher: 'CDC',
        url: 'https://www.cdc.gov/respiratory-viruses/prevention/precautions-when-sick.html',
      },
      {
        title: 'Signs and Symptoms of Flu',
        publisher: 'CDC',
        url: 'https://www.cdc.gov/flu/signs-symptoms/index.html',
      },
      {
        title: 'When to use the emergency room - adult',
        publisher: 'NIH MedlinePlus',
        url: 'https://medlineplus.gov/ency/patientinstructions/000593.htm',
      },
      {
        title: 'Fever',
        publisher: 'NIH MedlinePlus',
        url: 'https://medlineplus.gov/ency/article/003090.htm',
      },
    ],
    askBrianPrompts: [
      'Which over-the-counter cold medicines are safe to take with my prescriptions?',
      'How do I know if my cough needs to be checked by a doctor?',
      'Am I at higher risk for complications from the flu or COVID-19?',
    ],
    tags: ['sick', 'cold', 'self-care', 'when to see a doctor', 'urgent care', 'telehealth', 'red flags', 'antibiotics', 'stay home', 'cough', 'sepsis'],
  },

  // ───────────────────────────── 2. Describing symptoms ─────────────────────────────
  {
    id: 'describing-symptoms-to-your-clinician',
    categoryId: 'illness',
    title: 'How to Describe Your Symptoms',
    summary:
      "A simple checklist for explaining what you're feeling so your clinician can figure out what's going on, plus what to bring and what to ask before you leave.",
    readMinutes: 4,
    level: 'Basics',
    icon: 'chatbubbles-outline',
    callout: {
      kind: 'tip',
      text: "Before your visit, jot down a few notes on your phone: when the problem started, what it feels like, what makes it better or worse, and what you've already tried.",
    },
    sections: [
      {
        heading: 'Why your description matters',
        body: md(
          "Your own description of the problem is one of the most important clues your clinician has. Along with an exam and sometimes tests, it helps them narrow down what's going on and decide what to check next.",
          '',
          "Appointments are often short, so a little preparation goes a long way. Be clear and specific, start with the problem that worries you most, and don't downplay or exaggerate. If something is embarrassing, say it anyway. Clinicians hear about every kind of symptom, and the details you leave out can be the ones that matter.",
        ),
      },
      {
        heading: 'The symptom checklist',
        body: md(
          'Try to answer these questions about each symptom:',
          '',
          '- **When** did it start? Did it come on suddenly or slowly?',
          '- **Where** is it? Does it spread anywhere?',
          '- **What does it feel like?** Sharp, dull, burning, throbbing, pressure, aching, tingling?',
          '- **How bad** is it, from 0 (none) to 10 (worst you can imagine)?',
          '- **How often** does it happen, and **how long** does it last? Is it worse at a certain time of day?',
          '- **What makes it better or worse?** Eating, moving, resting, a certain position, or a medicine?',
          '- **What else** is going on? Fever, nausea, rash, weight change, or trouble sleeping?',
          '- Is it **getting better, worse, or staying the same**?',
        ),
      },
      {
        heading: 'Describe how it affects your life',
        body: md(
          'Numbers help, but real-life examples often say more. Compare it to your normal and describe what you can no longer do:',
          '',
          '- "The pain wakes me up at night."',
          '- "I get out of breath climbing one flight of stairs. I used to do three."',
          '- "I\'ve missed work twice this week."',
          '',
          "Everyday comparisons help too, like \"it feels like a tight band around my head.\" If you've had this problem before, say what helped last time and what didn't.",
        ),
      },
      {
        heading: 'Keep a symptom diary',
        body: md(
          'If a symptom comes and goes, a short diary can show patterns that are hard to remember in the exam room. For each episode, write down:',
          '',
          '- The date and time, and how long it lasted',
          '- What you were doing, eating, or drinking beforehand',
          '- How bad it was (0 to 10)',
          '- What you took or did, and whether it helped',
          '- Any readings, such as temperature, blood pressure, or blood sugar',
          '',
          'Take **photos** of rashes, swelling, or other visible changes, since they may look different by the day of your visit. You can bring the diary or send it through your patient portal before the appointment.',
        ),
      },
      {
        heading: 'Bring the full picture',
        body: md(
          'Bring or send a list with:',
          '',
          '- **All your medicines**: prescriptions, over-the-counter products, vitamins, and supplements, with doses',
          '- **Allergies** and the reaction you had',
          '- **Recent changes**: new medicines, travel, injuries, stress, or contact with someone who was sick',
          '- **Your health history** and family history, such as heart disease, diabetes, or cancer',
          '- **Your questions**, with the most important ones first',
          '',
          'Be honest about alcohol, tobacco, drug use, and sexual health. Your clinician needs the real picture to keep you safe, for example to avoid a dangerous drug interaction.',
        ),
      },
      {
        heading: 'Before you leave, check your understanding',
        body: md(
          'Good questions to ask:',
          '',
          '1. What do you think is causing this?',
          '2. What tests do I need, and why?',
          '3. What should I do at home, and what should I avoid?',
          '4. Which warning signs mean I should call you or go to the ER?',
          '5. When should I follow up, and how will I get my results?',
          '',
          "Then repeat the plan back in your own words, such as \"So I'll take this twice a day and call if the fever lasts past Friday.\" It's fine to bring a friend or family member to take notes, ask for written instructions, or ask for an interpreter if you prefer another language.",
        ),
      },
    ],
    keyTakeaways: [
      'Describe when it started, where it is, what it feels like, how bad it is, and what makes it better or worse.',
      'Explain how the symptom changes your daily life compared with your normal.',
      'Use a symptom diary and photos for problems that come and go.',
      'Bring a list of all your medicines, including over-the-counter products and supplements.',
      'Before leaving, repeat the plan back and ask which warning signs mean you should call or come back.',
    ],
    quiz: [
      {
        question: 'Which description gives your clinician the most useful information?',
        options: [
          '"My stomach has been hurting, and I just feel awful all the time."',
          '"For 2 weeks I\'ve had burning upper stomach pain, worse after meals, about 6 of 10."',
          '"It\'s probably nothing, but I feel off and wanted someone to take a look."',
          '"I looked it up online, and I\'m sure it\'s an ulcer. I need medicine for it."',
        ],
        answerIndex: 1,
        explanation:
          'The second answer covers when it started, where it is, what it feels like, what makes it worse, and how bad it is. That gives your clinician far more to work with.',
      },
      {
        question: 'What should your medication list include?',
        options: [
          'Prescriptions, but not vitamins or supplements',
          'Only the medicines you take every day',
          'Everything, including vitamins and supplements',
          'Just the medicines this clinician prescribed',
        ],
        answerIndex: 2,
        explanation:
          'List all prescriptions, over-the-counter medicines, vitamins, and supplements. Over-the-counter products and supplements can cause side effects and interact with prescriptions, so your clinician needs to know about everything you take.',
      },
      {
        question: 'Why is it helpful to take a photo of a rash?',
        options: [
          'It may look different or be gone by the time of your visit',
          'Clinicians are not allowed to examine skin in person',
          'Insurance requires a photo before a visit',
          'So you can diagnose it yourself online',
        ],
        answerIndex: 0,
        explanation:
          'Rashes and swelling can change quickly. A photo shows your clinician what it looked like at its worst.',
      },
    ],
    sources: [
      {
        title: 'What Do I Need to Tell the Doctor?',
        publisher: 'National Institute on Aging (NIH)',
        url: 'https://www.nia.nih.gov/health/medical-care-and-appointments/what-do-i-need-tell-doctor',
      },
      {
        title: "How To Prepare for a Doctor's Appointment",
        publisher: 'National Institute on Aging (NIH)',
        url: 'https://www.nia.nih.gov/health/medical-care-and-appointments/how-prepare-doctors-appointment',
      },
      {
        title: 'Questions Are the Answer',
        publisher: 'Agency for Healthcare Research and Quality (AHRQ)',
        url: 'https://www.ahrq.gov/questions/index.html',
      },
      {
        title: 'Talking With Your Doctor',
        publisher: 'NIH MedlinePlus',
        url: 'https://medlineplus.gov/talkingwithyourdoctor.html',
      },
    ],
    askBrianPrompts: [
      'Help me turn my symptoms into clear notes for my next visit.',
      'What questions should I ask my doctor about a new symptom?',
      'What is the best way to describe pain on a 0 to 10 scale?',
    ],
    tags: ['symptoms', 'doctor visit', 'appointment', 'pain scale', 'symptom diary', 'communication', 'questions to ask', 'medication list'],
  },

  // ───────────────────────────── 3. Cold vs. flu vs. COVID-19 ─────────────────────────────
  {
    id: 'cold-flu-covid-testing-treatment',
    categoryId: 'illness',
    title: 'Cold, Flu, or COVID-19? Testing and Treatment',
    summary:
      'How these common respiratory illnesses differ, why testing matters, and why flu and COVID-19 antiviral medicines need to start early.',
    readMinutes: 4,
    level: 'Basics',
    icon: 'flask-outline',
    callout: {
      kind: 'tip',
      text: "If you're 65 or older, pregnant, or have a condition like asthma, diabetes, heart disease, or a weakened immune system, contact your clinician as soon as symptoms start. Antiviral medicines for flu and COVID-19 work best when started early.",
    },
    sections: [
      {
        heading: 'Similar symptoms, different viruses',
        body: md(
          'Colds, flu (influenza), and COVID-19 are all contagious respiratory illnesses caused by different viruses. They spread in similar ways, mainly through droplets and tiny particles when people cough, sneeze, or talk, and they share many symptoms: cough, sore throat, runny or stuffy nose, headache, and tiredness.',
          '',
          "According to CDC, **you can't tell flu and COVID-19 apart by symptoms alone.** A test is needed to know which one you have. That matters because each has its own treatment, and knowing helps you protect the people around you.",
        ),
      },
      {
        heading: 'Typical patterns',
        body: md(
          '- **Cold:** comes on gradually and is usually mild. Mostly a runny or stuffy nose, sneezing, and sore throat. Fever is uncommon in adults.',
          '- **Flu:** usually starts suddenly, often 1 to 4 days after infection. Fever or chills, body aches, headache, cough, and exhaustion are common. Vomiting and diarrhea are more common in children.',
          '- **COVID-19:** symptoms appear 2 to 14 days after exposure and range from mild to severe. Fever, cough, tiredness, sore throat, congestion, and aches are common. A **new loss of taste or smell** is more common with COVID-19 than with flu.',
          '',
          'These are general patterns, not rules. Many people have mild or unusual symptoms.',
        ),
      },
      {
        heading: 'Testing: at home or at the clinic',
        body: md(
          'Home tests for COVID-19 are sold at pharmacies, and some home tests check for both flu and COVID-19. Clinics can run lab tests that are more sensitive, including tests that check for both viruses at once.',
          '',
          "Most home COVID-19 tests are antigen tests, often called rapid tests. They can miss an early infection. FDA advises that if you have symptoms and test negative, **test again 48 hours later**. A negative test doesn't rule out infection, especially early on.",
          '',
          "If you're at higher risk, don't wait for a home test before calling your clinician. For flu, clinicians may start treatment based on your symptoms, especially during flu season.",
        ),
      },
      {
        heading: 'Antiviral treatment: timing matters',
        body: md(
          '- **Flu:** prescription antivirals such as oseltamivir or baloxavir work best when started **within 2 days** of the first symptoms. They can shorten illness by about a day and help prevent complications. They are recommended for people at higher risk and people who are very sick. Most healthy people with mild flu do not need them.',
          '- **COVID-19:** for people at higher risk, nirmatrelvir with ritonavir (Paxlovid) or molnupiravir must start **within 5 days** of symptoms. Remdesivir, given by IV, must start within 7 days.',
          '- **Colds:** there is no antiviral. Treat the symptoms and rest.',
          '',
          'Nirmatrelvir with ritonavir interacts with many common medicines, so tell your clinician and pharmacist about everything you take. Antibiotics do not treat any of these viruses.',
        ),
      },
      {
        heading: 'Who is at higher risk',
        body: md(
          'Serious illness from flu or COVID-19 is more likely in:',
          '',
          '- Adults 65 and older (COVID-19 risk rises further after 75)',
          '- Young children (for flu), and people who are pregnant',
          '- People with chronic conditions such as asthma, COPD (a long-term lung disease such as emphysema), diabetes, heart disease, kidney or liver disease, or obesity',
          '- People with a weakened immune system',
          '- People who are not up to date on their vaccines',
          '',
          "If you're in one of these groups, plan ahead: know how to reach your clinician quickly or use telehealth, and keep a few home tests on hand.",
        ),
      },
      {
        heading: 'Warning signs and recovery',
        body: md(
          "**Call 911** for trouble breathing, chest pain or pressure that won't go away, new confusion, being unable to wake up or stay awake, or pale, gray, or blue skin, lips, or nail beds. In children, also watch for fast breathing, ribs pulling in with each breath, and a fever above 104°F.",
          '',
          'To recover, rest and drink fluids. Stay home until you have had at least 24 hours of improving symptoms and no fever without fever-reducing medicine, then take extra precautions for 5 days.',
          '',
          'A yearly flu vaccine is recommended for nearly everyone 6 months and older. Ask your clinician or pharmacist whether a COVID-19 vaccine is right for you.',
        ),
      },
    ],
    keyTakeaways: [
      "You can't reliably tell flu from COVID-19 by symptoms alone. Testing helps you get the right treatment.",
      'Flu antivirals work best within 2 days of symptoms. COVID-19 antiviral pills must start within 5 days.',
      'If you have symptoms and a negative rapid (antigen) home COVID-19 test, test again in 48 hours.',
      'If you are at higher risk, contact your clinician as soon as symptoms start.',
      'Antibiotics do not treat colds, flu, or COVID-19.',
    ],
    quiz: [
      {
        question: 'Prescription flu antivirals work best when started:',
        options: [
          'Within 2 days of the first symptoms',
          'After a week if you are not improving',
          'Only after you are admitted to a hospital',
          'Any time. Timing does not matter',
        ],
        answerIndex: 0,
        explanation:
          'CDC says flu antivirals work best when started within 2 days of symptoms, though starting later can still help people who are very sick or at higher risk.',
      },
      {
        question: 'You have symptoms and a negative rapid (antigen) home COVID-19 test. What does FDA advise?',
        options: [
          'You definitely do not have COVID-19',
          'Test again 48 hours later',
          'Start an antibiotic just in case',
          'Wait 2 weeks before testing again',
        ],
        answerIndex: 1,
        explanation:
          'Antigen tests can miss early infections. With symptoms, FDA recommends repeating the test 48 hours after the first negative result.',
      },
      {
        question: 'Which symptom is more common with COVID-19 than with flu?',
        options: ['A runny or stuffy nose', 'Cough and sore throat', 'New loss of taste or smell', 'Tiredness and body aches'],
        answerIndex: 2,
        explanation:
          'Both illnesses can cause cough, sore throat, congestion, tiredness, and aches, but a new loss of taste or smell is more common with COVID-19.',
      },
    ],
    sources: [
      {
        title: 'Similarities and Differences between Flu and COVID-19',
        publisher: 'CDC',
        url: 'https://www.cdc.gov/flu/about/flu-vs-covid19.html',
      },
      {
        title: 'Treatment of Flu',
        publisher: 'CDC',
        url: 'https://www.cdc.gov/flu/treatment/index.html',
      },
      {
        title: 'Types of COVID-19 Treatment',
        publisher: 'CDC',
        url: 'https://www.cdc.gov/covid/treatment/index.html',
      },
      {
        title: 'Understanding At-Home OTC COVID-19 Antigen Diagnostic Test Results',
        publisher: 'FDA',
        url: 'https://www.fda.gov/medical-devices/coronavirus-covid-19-and-medical-devices/understanding-home-otc-covid-19-antigen-diagnostic-test-results',
      },
      {
        title: 'Symptoms of COVID-19',
        publisher: 'CDC',
        url: 'https://www.cdc.gov/covid/signs-symptoms/index.html',
      },
    ],
    askBrianPrompts: [
      'Could any of my current medications interact with Paxlovid?',
      'Am I considered high risk for flu or COVID-19 complications?',
      'How accurate are home COVID-19 and flu tests?',
    ],
    tags: ['cold', 'flu', 'influenza', 'covid-19', 'coronavirus', 'testing', 'antivirals', 'paxlovid', 'oseltamivir', 'respiratory virus'],
  },

  // ───────────────────────────── 4. Fever in adults and kids ─────────────────────────────
  {
    id: 'fever-adults-and-children',
    categoryId: 'illness',
    title: 'Fever in Adults and Kids: When to Worry',
    summary:
      'What counts as a fever, how to care for it safely at home, and the age-specific signs that mean you should call a clinician or 911.',
    readMinutes: 4,
    level: 'Basics',
    icon: 'thermometer-outline',
    callout: {
      kind: 'emergency',
      text: "Call 911 if a fever comes with trouble breathing, a stiff neck, a severe headache, confusion, a seizure, blue lips or nails, or a person who is hard to wake. A baby 3 months or younger with a rectal temperature of 100.4°F (38°C) or higher needs to be seen right away: call their clinician now, or go to the emergency room if you can't reach them quickly.",
    },
    sections: [
      {
        heading: 'Fever is a sign, not an illness',
        body: md(
          "A fever is one way your body fights infection. Most fevers from common infections like colds and flu go away on their own within a few days. A fever by itself is rarely dangerous. According to MedlinePlus, brain damage from a fever generally won't happen unless it goes above 107.6°F (42°C), and fevers from infection rarely get that high.",
          '',
          "**How the person looks and acts matters more than the number.** A child with 102°F who is playing and drinking is often less worrying than a child with 100.5°F who is limp and won't drink. In older adults, a serious infection may cause only a low fever or none at all. New confusion, weakness, or a fall can be the main warning sign.",
        ),
      },
      {
        heading: 'What counts as a fever and how to measure it',
        body: md(
          'Normal body temperature varies from person to person and during the day. As a general rule, a temperature of **100.4°F (38°C) or higher** is a fever. For children, MedlinePlus lists these fever cutoffs by method:',
          '',
          '- **Rectal** (in the bottom): 100.4°F (38°C)',
          '- **Oral** (in the mouth): 99.5°F (37.5°C)',
          '- **Underarm**: 99°F (37.2°C)',
          '',
          'Use a digital thermometer. A rectal temperature is the most accurate for babies and young children. For an oral reading, wait about 20 to 30 minutes after eating or drinking something hot or cold. Write down the temperature, the time, and any medicine given.',
        ),
      },
      {
        heading: 'Safe home care',
        body: md(
          '- Offer plenty of fluids: water, soup, ice pops, or oral rehydration drinks.',
          '- Dress in light clothing and use a light blanket. A lukewarm bath can help. **Avoid ice baths, cold water, or rubbing alcohol**, which can cause shivering.',
          '- **Acetaminophen or ibuprofen** can make someone more comfortable. The goal is comfort, not a normal number.',
          "- Dose children's medicine by the label, using their weight or age, and measure with the device that comes with the product.",
          '- **Babies under 3 months:** call their clinician before giving any medicine. **Do not give ibuprofen to babies under 6 months.**',
          "- **Don't give aspirin to children or teens** unless their clinician says to. It has been linked to Reye syndrome, a rare but serious illness.",
          "- Check combination cold products for acetaminophen so you don't double up. If you think someone took too much, even by accident, call Poison Help at 1-800-222-1222 right away. Don't wait for symptoms, which may not show up for 12 hours or more.",
        ),
      },
      {
        heading: 'Babies and children: call the clinician if…',
        body: md(
          "- Your baby is **3 months or younger** and has a rectal temperature of 100.4°F (38°C) or higher. The baby needs to be seen right away: call now, or go to the emergency room if you can't reach the clinician quickly.",
          '- Your baby is **3 to 12 months** old and has a fever of 102.2°F (39°C) or higher.',
          '- A child **under 2** has had a fever for more than 24 to 48 hours, or an older child for more than 48 to 72 hours.',
          "- The fever is 105°F (40.6°C) or higher and doesn't come down quickly with treatment.",
          "- Your child seems very sick, is unusually sleepy or fussy, won't drink, or has few wet diapers.",
          '- There is a new rash or bruising, or pain when urinating.',
          '',
          'Some young children have a brief seizure with a fever (a febrile seizure). Most are over quickly and do not mean the child has epilepsy, but call 911 if your child has a seizure.',
        ),
      },
      {
        heading: 'Adults: call your clinician if…',
        body: md(
          'MedlinePlus advises adults to contact a clinician if they:',
          '',
          "- Have a fever of 105°F (40.6°C) or higher that doesn't come down readily with treatment",
          '- Have a fever that stays at or keeps rising above 103°F (39.4°C)',
          '- Have had a fever for longer than 48 to 72 hours',
          '- Have had fevers come and go for up to a week or more, even if they are mild',
          '- Have a serious chronic illness, such as heart disease, diabetes, COPD (a long-term lung disease), or sickle cell disease',
          '- Have a weakened immune system, for example from chemotherapy or an organ transplant',
          '- Have a new rash or bruises, or pain when urinating',
          '',
          'If you take medicine that weakens your immune system, ask your care team ahead of time what to do if you get a fever.',
        ),
      },
    ],
    keyTakeaways: [
      'A temperature of 100.4°F (38°C) or higher is generally a fever, but how the person looks and acts matters more than the number.',
      'A baby 3 months or younger with a rectal temperature of 100.4°F (38°C) or higher needs to be seen right away.',
      'Adults should call if a fever stays at 103°F or higher or lasts more than 2 to 3 days.',
      "Never give aspirin to children or teens, and dose children's fever medicine by the label.",
      'Call 911 for fever with trouble breathing, a stiff neck, confusion, a seizure, or blue lips.',
    ],
    quiz: [
      {
        question: 'A 2-month-old baby has a rectal temperature of 100.6°F. What should you do?',
        options: [
          'Give ibuprofen and wait to see if it goes down',
          "Call the baby's clinician right away",
          'Wait 3 days before calling anyone',
          'Give the baby a cold bath',
        ],
        answerIndex: 1,
        explanation:
          "Babies 3 months and younger with a rectal temperature of 100.4°F or higher need to be seen right away. Call the clinician now, or go to the emergency room if you can't reach them quickly. Ibuprofen should not be given to babies under 6 months.",
      },
      {
        question: 'Which fever reducer should children and teens NOT take unless their clinician says it is OK?',
        options: ['Acetaminophen', 'Ibuprofen', 'Aspirin', 'None of these are safe for children'],
        answerIndex: 2,
        explanation:
          'Aspirin has been linked to Reye syndrome in children and teens. Acetaminophen and ibuprofen are commonly used when dosed by the label (no ibuprofen under 6 months).',
      },
      {
        question: 'For an adult, which is a reason to call a clinician?',
        options: [
          'A temperature of 99.8°F for one evening',
          'A fever that stays at 103°F or higher',
          'Feeling warm right after a hard workout',
          'A mild fever that goes away in a day',
        ],
        answerIndex: 1,
        explanation:
          'MedlinePlus advises adults to call if a fever stays at or keeps rising above 103°F, lasts more than 48 to 72 hours, or reaches 105°F and does not come down.',
      },
    ],
    sources: [
      {
        title: 'Fever',
        publisher: 'NIH MedlinePlus',
        url: 'https://medlineplus.gov/ency/article/003090.htm',
      },
      {
        title: 'When your baby or infant has a fever',
        publisher: 'NIH MedlinePlus',
        url: 'https://medlineplus.gov/ency/patientinstructions/000319.htm',
      },
      {
        title: 'Temperature measurement',
        publisher: 'NIH MedlinePlus',
        url: 'https://medlineplus.gov/ency/article/003400.htm',
      },
      {
        title: 'Acetaminophen overdose',
        publisher: 'NIH MedlinePlus',
        url: 'https://medlineplus.gov/ency/article/002598.htm',
      },
      {
        title: 'Use Caution When Giving Cough and Cold Products to Kids',
        publisher: 'FDA',
        url: 'https://www.fda.gov/drugs/safe-use-over-counter-otc-medicines-children/use-caution-when-giving-cough-and-cold-products-kids',
      },
    ],
    askBrianPrompts: [
      "How do I take my child's temperature accurately?",
      'Is it safe to take acetaminophen or ibuprofen with my current medicines?',
      'When is a fever in an older adult a reason to worry?',
    ],
    tags: ['fever', 'temperature', 'thermometer', 'children', 'babies', 'infant', 'acetaminophen', 'ibuprofen', 'febrile seizure', 'when to call'],
  },

  // ───────────────────────────── 5. Sepsis ─────────────────────────────
  {
    id: 'sepsis-infection-emergency',
    categoryId: 'illness',
    title: 'Sepsis: When an Infection Becomes an Emergency',
    summary:
      'Almost any infection can lead to sepsis, a life-threatening emergency. Learn the warning signs, who is at higher risk, and why you should act fast.',
    readMinutes: 4,
    level: 'Basics',
    icon: 'alert-circle-outline',
    callout: {
      kind: 'emergency',
      text: 'Sepsis is a medical emergency. If someone with an infection gets worse and has signs like confusion, a racing heart or weak pulse, trouble breathing, extreme pain, or clammy skin, call 911 or go to the emergency room. Ask, "Could this infection be leading to sepsis?"',
    },
    sections: [
      {
        heading: 'What sepsis is',
        body: md(
          "Sepsis is the body's extreme response to an infection. The infection sets off a chain reaction throughout the body. Without quick treatment, sepsis can lead to tissue damage, organ failure, and death.",
          '',
          "Almost any infection can lead to sepsis. It often starts with an infection in the lungs, stomach, kidneys, or bladder. It can also begin with a small cut that gets infected, or an infection after surgery. Sometimes people don't even know they had an infection.",
          '',
          'Sepsis is common and serious. CDC estimates that about 1.7 million adults in the US develop sepsis each year, and at least 1 in 5 of them die in the hospital or leave the hospital for hospice care.',
        ),
      },
      {
        heading: 'Warning signs',
        body: md(
          'A person with sepsis may have one or more of these signs:',
          '',
          '- Confusion or disorientation',
          '- A fast heart rate or a weak pulse',
          '- Shortness of breath or fast breathing',
          '- Extreme pain or discomfort',
          '- Fever, shivering, or feeling very cold',
          '- Clammy or sweaty skin',
          '',
          'A change in how someone thinks or acts, and very fast breathing, may be the earliest signs. Because these signs can also come from other illnesses, sepsis can be hard to spot early. Be especially alert when **an infection is getting worse instead of better**.',
        ),
      },
      {
        heading: 'Act fast',
        body: md(
          'Sepsis can get worse quickly, and early treatment matters.',
          '',
          '1. **Get care right away.** Call 911 or go to the emergency room if someone with an infection is getting worse and has warning signs, especially confusion, trouble breathing, or being hard to wake.',
          '2. **Ask, "Could this infection be leading to sepsis?"** CDC encourages patients and families to ask a clinician this question.',
          '3. **Share the details.** Say what infection the person has or might have, when it started, and any recent surgery, hospital stay, or chronic condition.',
          "4. **Don't wait it out.** If you are already being treated for an infection and it isn't getting better, or is getting worse, get medical care right away.",
          '',
          'In the hospital, sepsis is usually treated with antibiotics, IV fluids, oxygen, and care for the source of the infection. Some people also need medicine to raise their blood pressure.',
        ),
      },
      {
        heading: 'Who is at higher risk',
        body: md(
          'Anyone with an infection can get sepsis. CDC says the risk is higher for:',
          '',
          '- Adults 65 and older, and babies younger than 1',
          '- People with chronic conditions such as diabetes, lung disease, cancer, or kidney disease',
          '- People with a weakened immune system',
          '- People who recently had a severe illness, surgery, or a hospital stay',
          '- People who are pregnant or recently gave birth',
          '- People who have had sepsis before',
          '',
          "If you or someone you care for is in one of these groups, learn the warning signs, and don't wait to get help for an infection that is getting worse.",
        ),
      },
      {
        heading: 'Lower your risk',
        body: md(
          'The best way to prevent sepsis is to prevent infections. CDC recommends that you:',
          '',
          '- **Get recommended vaccines.** They can prevent some infections or make them less severe.',
          '- **Keep your hands clean.**',
          '- **Keep cuts and wounds clean and covered** until they heal.',
          '- **Take good care of chronic conditions** such as diabetes, lung disease, cancer, and kidney disease.',
          '- **Consider wearing a mask** around people outside your home when many respiratory viruses are going around.',
          '',
          'Know the warning signs, and act fast if an infection is not getting better or is getting worse.',
        ),
      },
    ],
    keyTakeaways: [
      "Sepsis is the body's extreme response to an infection. It is a life-threatening medical emergency.",
      'Warning signs include confusion, a fast heartbeat or weak pulse, shortness of breath, extreme pain, shivering or feeling very cold, and clammy skin.',
      'If an infection is getting worse instead of better, act fast and ask, "Could this infection be leading to sepsis?"',
      'Older adults, babies, and people with chronic conditions or weakened immune systems are at higher risk.',
      'Vaccines, clean hands, and clean, covered wounds help prevent the infections that lead to sepsis.',
    ],
    quiz: [
      {
        question: 'Which of these could be a warning sign of sepsis in someone with an infection?',
        options: [
          'A stuffy nose and sneezing',
          'Mild tiredness after a busy day',
          'A slight sore throat for a day',
          'Confusion and a racing heart',
        ],
        answerIndex: 3,
        explanation:
          "Confusion, a fast heartbeat or weak pulse, shortness of breath, extreme pain, shivering, and clammy skin can all be signs of sepsis. If someone's infection is getting worse and they have these signs, get emergency care right away.",
      },
      {
        question:
          'Your father is being treated for a urinary tract infection. Today he is confused, shivering, and breathing fast. What should you do?',
        options: [
          'Let him sleep it off tonight',
          'Get emergency care right now',
          'Call his doctor next week',
          'Give him fluids and wait a day',
        ],
        answerIndex: 1,
        explanation:
          'An infection that is getting worse, with confusion, shivering, and fast breathing, can be sepsis. Call 911 or go to the emergency room, and ask, "Could this infection be leading to sepsis?"',
      },
      {
        question: 'Which of these can help lower your risk of sepsis?',
        options: [
          'Keeping cuts clean and covered',
          'Skipping recommended vaccines',
          'Waiting out a worsening infection',
          'Leaving a wound open to the air',
        ],
        answerIndex: 0,
        explanation:
          'Preventing infections lowers the risk of sepsis. Keep cuts clean and covered until they heal, keep your hands clean, get recommended vaccines, and get care fast for an infection that is getting worse.',
      },
    ],
    sources: [
      {
        title: 'About Sepsis',
        publisher: 'CDC',
        url: 'https://www.cdc.gov/sepsis/about/index.html',
      },
      {
        title: 'Risk Factors for Sepsis',
        publisher: 'CDC',
        url: 'https://www.cdc.gov/sepsis/risk-factors/index.html',
      },
      {
        title: 'Preventing Infections That Can Lead to Sepsis',
        publisher: 'CDC',
        url: 'https://www.cdc.gov/sepsis/prevention/index.html',
      },
      {
        title: 'Sepsis',
        publisher: 'NIH MedlinePlus',
        url: 'https://medlineplus.gov/sepsis.html',
      },
      {
        title: 'Sepsis',
        publisher: 'NIH MedlinePlus Medical Encyclopedia',
        url: 'https://medlineplus.gov/ency/article/000666.htm',
      },
    ],
    askBrianPrompts: [
      'Which infections are most likely to lead to sepsis?',
      'How do my health conditions affect my risk of sepsis?',
      'What should I watch for after surgery or a hospital stay?',
    ],
    tags: ['sepsis', 'septic shock', 'infection', 'blood infection', 'emergency', '911', 'warning signs', 'fever', 'confusion'],
  },

  // ───────────────────────────── 6. Silent conditions ─────────────────────────────
  {
    id: 'silent-conditions-blood-pressure-prediabetes',
    categoryId: 'illness',
    title: 'Silent Conditions: High Blood Pressure and Prediabetes',
    summary:
      'High blood pressure, prediabetes, and high cholesterol usually cause no symptoms. Learn your numbers, how to check them, and the steps that lower your risk.',
    readMinutes: 5,
    level: 'Intermediate',
    icon: 'pulse-outline',
    callout: {
      kind: 'emergency',
      text: 'If your blood pressure is higher than 180/120 and you have chest pain, shortness of breath, back pain, numbness, weakness, vision changes, or trouble speaking, call 911. If it is that high with no symptoms, wait a minute and recheck. If it is still that high, contact your clinician right away.',
    },
    sections: [
      {
        heading: "Why 'silent' conditions matter",
        body: md(
          'Some of the most common health problems cause **no symptoms for years** while quietly damaging your blood vessels, heart, kidneys, eyes, and brain.',
          '',
          '- **High blood pressure** usually has no warning signs. It is a major cause of heart attack and stroke.',
          "- **Prediabetes** usually has no symptoms. CDC estimates that about 8 in 10 adults who have it don't know it.",
          '- **High cholesterol** has no symptoms and is found only with a blood test.',
          '',
          'The only way to know is to get checked. The good news: when these conditions are caught early, they are very treatable, often starting with lifestyle changes.',
        ),
      },
      {
        heading: 'Blood pressure: know your numbers',
        body: md(
          "A reading like 128/82 has two numbers. The top (systolic) is the pressure when your heart beats. The bottom (diastolic) is the pressure between beats. The American Heart Association's categories for adults:",
          '',
          '- **Normal:** less than 120 and less than 80',
          '- **Elevated:** 120 to 129 and less than 80',
          '- **Stage 1 high blood pressure:** 130 to 139, or 80 to 89',
          '- **Stage 2 high blood pressure:** 140 or higher, or 90 or higher',
          '- **Severe:** higher than 180 and/or higher than 120',
          '',
          "One high reading doesn't mean you have high blood pressure. Only a clinician can diagnose it, usually after several readings. USPSTF recommends that all adults 18 and older be screened, with high office readings confirmed outside the clinic.",
        ),
      },
      {
        heading: 'Checking blood pressure at home',
        body: md(
          '1. Use an automatic, **upper-arm** cuff that has been validated for accuracy. Wrist and finger monitors are less reliable.',
          "2. Don't smoke, have caffeine, or exercise for 30 minutes before. Empty your bladder.",
          '3. Sit quietly for 5 minutes with your back supported, feet flat on the floor, and legs uncrossed.',
          '4. Rest your arm on a table at heart level, with the cuff on bare skin just above the elbow.',
          '5. Take **two readings, one minute apart**, at the same times each day.',
          '6. Write down every result, or save it in an app, and share it with your clinician.',
          '',
          'Bring your monitor to a visit once so your care team can check that it reads accurately for you.',
        ),
      },
      {
        heading: 'Prediabetes and early diabetes',
        body: md(
          "Prediabetes means your blood sugar is higher than normal but not high enough to be diabetes. NIDDK lists these prediabetes ranges:",
          '',
          '- **A1C** (a blood test that shows your average blood sugar over the past 3 months): 5.7% to 6.4%',
          '- **Fasting blood sugar** (checked after not eating overnight): 100 to 125 mg/dL',
          '- **Oral glucose tolerance test** (blood sugar checked 2 hours after a sweet drink): 140 to 199 mg/dL',
          '',
          'Type 2 diabetes can develop slowly, and many people notice nothing. Possible signs include feeling very thirsty, urinating often, feeling very hungry, blurry vision, tiredness, sores that heal slowly, and frequent infections.',
          '',
          'Risk rises with overweight, older age, a family history of diabetes, low physical activity, and a history of diabetes in pregnancy. USPSTF recommends screening adults 35 to 70 who have overweight or obesity.',
        ),
      },
      {
        heading: "Don't forget cholesterol",
        body: md(
          "High LDL (\"bad\") cholesterol builds up in artery walls without causing symptoms. A simple blood test called a lipid panel measures it.",
          '',
          'Your clinician looks at your cholesterol together with your other risk factors, such as age, blood pressure, diabetes, and smoking, to estimate your overall chance of a heart attack or stroke. That estimate helps decide whether lifestyle changes alone are enough or whether a medicine such as a statin makes sense. USPSTF recommends a statin for many adults 40 to 75 who have at least one risk factor and a higher estimated risk.',
          '',
          'Ask your clinician how often you should be checked. It depends on your age and health.',
        ),
      },
      {
        heading: 'Steps that lower your risk',
        body: md(
          '- **Move more:** aim for at least 150 minutes a week of moderate activity, like brisk walking.',
          '- **Lose a little weight if you need to:** in a major study, people with prediabetes who lost 5% to 7% of their body weight (10 to 14 pounds for someone who weighs 200) and stayed active cut their risk of type 2 diabetes by 58% (71% for those over 60).',
          '- **Eat less sodium:** keep it under 2,300 mg a day, and eat more vegetables, fruits, and whole foods.',
          "- **Limit alcohol and don't smoke.**",
          '- **Ask about a CDC-recognized lifestyle change program** for prediabetes.',
          '',
          "Many people also need medicine, and that's OK. Take it as prescribed and don't stop without talking to your clinician.",
        ),
      },
    ],
    keyTakeaways: [
      'High blood pressure, prediabetes, and high cholesterol usually have no symptoms. Testing is the only way to know.',
      'Normal blood pressure is below 120/80. Readings of 130/80 or higher are in the high range.',
      'Prediabetes means an A1C of 5.7% to 6.4% or a fasting blood sugar of 100 to 125 mg/dL.',
      'Losing 5% to 7% of body weight and staying active can cut type 2 diabetes risk by more than half.',
      'Check home blood pressure with a validated upper-arm cuff and share the readings with your clinician.',
    ],
    quiz: [
      {
        question: "A blood pressure reading of 134/84 falls in which American Heart Association category?",
        options: ['Normal', 'Elevated', 'Stage 1 high blood pressure', 'Severe high blood pressure'],
        answerIndex: 2,
        explanation:
          'Stage 1 is a top number of 130 to 139 or a bottom number of 80 to 89. A diagnosis is based on repeated readings, not just one.',
      },
      {
        question: 'Which A1C result is in the prediabetes range?',
        options: ['4.8%', '5.2%', '6.0%', '7.2%'],
        answerIndex: 2,
        explanation:
          'Prediabetes is an A1C of 5.7% to 6.4%. A result of 6.5% or higher is in the diabetes range.',
      },
      {
        question: 'What is the best way to check your blood pressure at home?',
        options: [
          'Upper-arm cuff, after 5 minutes of quiet rest',
          'Wrist cuff, right after a brisk walk',
          'One quick reading after your morning coffee',
          'Standing up, with your arm hanging down',
        ],
        answerIndex: 0,
        explanation:
          'The American Heart Association recommends a validated upper-arm monitor, 5 minutes of quiet rest, a supported arm at heart level, and two readings one minute apart.',
      },
    ],
    sources: [
      {
        title: 'Understanding Blood Pressure Readings',
        publisher: 'American Heart Association',
        url: 'https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings',
      },
      {
        title: 'Home Blood Pressure Monitoring',
        publisher: 'American Heart Association',
        url: 'https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings/monitoring-your-blood-pressure-at-home',
      },
      {
        title: 'About High Blood Pressure',
        publisher: 'CDC',
        url: 'https://www.cdc.gov/high-blood-pressure/about/index.html',
      },
      {
        title: 'Insulin Resistance & Prediabetes',
        publisher: 'NIDDK (NIH)',
        url: 'https://www.niddk.nih.gov/health-information/diabetes/overview/what-is-diabetes/prediabetes-insulin-resistance',
      },
      {
        title: 'Prediabetes – Your Chance to Prevent Type 2 Diabetes',
        publisher: 'CDC',
        url: 'https://www.cdc.gov/diabetes/prevention-type-2/prediabetes-prevent-type-2.html',
      },
    ],
    askBrianPrompts: [
      'What do my recent blood pressure readings mean?',
      'Can you explain my A1C result in plain language?',
      'Which lifestyle changes lower blood pressure the most?',
    ],
    tags: ['high blood pressure', 'hypertension', 'prediabetes', 'diabetes', 'A1C', 'blood sugar', 'cholesterol', 'blood pressure monitor', 'silent killer', 'screening'],
  },

  // ───────────────────────────── 7. Depression & anxiety ─────────────────────────────
  {
    id: 'depression-anxiety-getting-help',
    categoryId: 'illness',
    title: 'Depression and Anxiety: Getting Help',
    summary:
      "How to tell everyday ups and downs from depression or an anxiety disorder, what treatment looks like, and how to find care, including what to do in a crisis.",
    readMinutes: 4,
    level: 'Basics',
    icon: 'heart-circle-outline',
    callout: {
      kind: 'emergency',
      text: 'If you or someone you know is thinking about suicide or is in crisis, call or text 988 (Suicide & Crisis Lifeline) or chat at 988lifeline.org. It is free, confidential, and available 24/7. If someone is in immediate danger, call 911.',
    },
    sections: [
      {
        heading: 'Common, real, and treatable',
        body: md(
          "Depression and anxiety disorders are among the most common health conditions in the United States. NIMH estimates that about one-third of US teens and adults will have an anxiety disorder at some point.",
          '',
          "These are medical conditions, not a sign of weakness or something you can simply \"snap out of.\" They can affect anyone, at any age, and they often show up alongside other health problems like heart disease, diabetes, or chronic pain.",
          '',
          'Most important: **treatment works for most people**, and getting help early usually makes recovery easier.',
        ),
      },
      {
        heading: 'Signs of depression',
        body: md(
          'Depression is more than a bad day or a sad week. It is usually diagnosed when symptoms happen **most of the day, nearly every day, for at least 2 weeks**. Common signs include:',
          '',
          '- Feeling sad, anxious, empty, hopeless, or irritable',
          "- Losing interest or pleasure in things you usually enjoy",
          '- Low energy or feeling slowed down',
          '- Trouble concentrating, remembering, or making decisions',
          '- Sleeping too much or too little, and changes in appetite or weight',
          '- Aches or stomach problems without a clear cause',
          '- Thoughts of death or suicide',
          '',
          'Not everyone has every symptom. Some people mostly notice irritability, anger, or physical complaints.',
        ),
      },
      {
        heading: 'Signs of an anxiety disorder',
        body: md(
          "Everyone feels anxious sometimes. With an anxiety disorder, the worry or fear **doesn't go away**, shows up in many situations, can get worse over time, and gets in the way of work, school, or relationships.",
          '',
          '- **Generalized anxiety disorder:** hard-to-control worry on most days for at least 6 months, plus things like restlessness, tiredness, trouble concentrating, irritability, muscle tension, or poor sleep.',
          '- **Panic disorder:** repeated, sudden attacks of intense fear with a pounding heart, sweating, shaking, shortness of breath, or a sense of doom.',
          '- **Social anxiety disorder:** strong fear of being judged or embarrassed around others.',
          '',
          "Chest pain or trouble breathing can also be signs of a heart attack. If you're not sure, call 911.",
        ),
      },
      {
        heading: 'What treatment looks like',
        body: md(
          '- **Talk therapy (psychotherapy):** approaches like cognitive behavioral therapy (CBT) teach practical skills for changing thought and behavior patterns. Therapy can be in person or by video.',
          '- **Medicine:** antidepressants are used for both depression and anxiety. They often take **4 to 8 weeks** to work fully. Don\'t stop them suddenly without talking to your prescriber. FDA warns that people under 25 may have more suicidal thoughts early in treatment, so they should be watched closely, especially in the first weeks.',
          '- **Both together** often works best, especially for moderate to severe symptoms.',
          '',
          "Regular activity, a steady sleep schedule, time with people you trust, and avoiding alcohol and drugs all support recovery. If the first treatment doesn't help enough, tell your clinician. There are many other options.",
        ),
      },
      {
        heading: 'How to get started',
        body: md(
          "1. **Talk to your primary care clinician.** They can screen you with short questionnaires, check for physical causes like thyroid problems or medicine side effects, and start treatment or refer you. USPSTF recommends depression screening for all adults and anxiety screening for adults 64 and younger.",
          '2. **Call the number on your insurance card** and ask for in-network mental health providers.',
          '3. **Search FindTreatment.gov**, a federal locator for mental health and substance use care.',
          '4. **Call the SAMHSA National Helpline at 1-800-662-4357** (1-800-662-HELP) for free, confidential referrals, 24/7, in English and Spanish.',
          '',
          'Before your visit, write down your symptoms, how long they have lasted, and how they affect your daily life. Veterans can dial 988 and press 1 to reach the Veterans Crisis Line.',
        ),
      },
      {
        heading: "If you're worried about someone else",
        body: md(
          '- **Ask directly** how they are doing, and listen without judging or trying to fix everything.',
          '- If you are worried about suicide, it is OK to ask, "Are you thinking about killing yourself?" Asking does not put the idea in their head.',
          '- **Help them connect** with a clinician, therapist, or 988. Offer to make the call or sit with them while they do.',
          '- **Keep them safe:** if they are in immediate danger, stay with them and call 911.',
          '- **Follow up** in the days and weeks after.',
          '',
          'The 988 Lifeline also supports people who are worried about a friend or family member.',
        ),
      },
    ],
    keyTakeaways: [
      'Depression symptoms most days for 2 weeks or more, or anxiety that disrupts daily life, are reasons to get help.',
      'Therapy, medicine, or both work for most people. Antidepressants can take 4 to 8 weeks to work fully.',
      'Your primary care clinician is a good first stop, and SAMHSA (1-800-662-4357) can help you find care.',
      'In a crisis, call or text 988. If someone is in immediate danger, call 911.',
    ],
    quiz: [
      {
        question: 'Depression is usually diagnosed when symptoms happen most of the day, nearly every day, for at least:',
        options: ['2 days', '2 weeks', '6 months', '1 year'],
        answerIndex: 1,
        explanation:
          'NIMH describes depression symptoms lasting most of the day, nearly every day, for at least 2 weeks. If you notice this, talk with a clinician.',
      },
      {
        question: 'After starting an antidepressant, what is a realistic expectation?',
        options: [
          'It works fully within a day',
          'Stop it right away if you feel no change after one week',
          'It only works if prescribed by a psychiatrist',
          'It may take 4 to 8 weeks to feel the full effect',
        ],
        answerIndex: 3,
        explanation:
          "Antidepressants often take 4 to 8 weeks to work fully. Don't stop suddenly without talking to your prescriber.",
      },
      {
        question: 'A friend tells you they are thinking about suicide. Which number can they call or text for 24/7 crisis support?',
        options: ['988', '411', '311', '711'],
        answerIndex: 0,
        explanation:
          'The 988 Suicide & Crisis Lifeline is free and confidential by call, text, or chat. Call 911 if someone is in immediate danger.',
      },
    ],
    sources: [
      {
        title: 'Depression',
        publisher: 'National Institute of Mental Health (NIMH)',
        url: 'https://www.nimh.nih.gov/health/publications/depression',
      },
      {
        title: 'Generalized Anxiety Disorder: When Worry Gets Out of Control',
        publisher: 'National Institute of Mental Health (NIMH)',
        url: 'https://www.nimh.nih.gov/health/publications/generalized-anxiety-disorder-gad',
      },
      {
        title: 'Tips for Talking With a Health Care Provider About Your Mental Health',
        publisher: 'National Institute of Mental Health (NIMH)',
        url: 'https://www.nimh.nih.gov/health/publications/tips-for-talking-with-your-health-care-provider',
      },
      {
        title: '988 Suicide & Crisis Lifeline',
        publisher: '988 Lifeline (SAMHSA)',
        url: 'https://988lifeline.org/',
      },
      {
        title: 'National Helpline for Mental Health, Drug, Alcohol Issues',
        publisher: 'SAMHSA',
        url: 'https://www.samhsa.gov/find-help/helplines/national-helpline',
      },
    ],
    askBrianPrompts: [
      'How do I bring up anxiety or depression with my doctor?',
      'What is the difference between a therapist, a psychologist, and a psychiatrist?',
      'How can I find mental health care that my insurance covers?',
    ],
    tags: ['depression', 'anxiety', 'mental health', 'panic attack', 'therapy', 'antidepressants', '988', 'suicide prevention', 'crisis', 'SAMHSA'],
  },

  // ───────────────────────────── 8. Cancer warning signs & screening ─────────────────────────────
  {
    id: 'cancer-warning-signs-screening',
    categoryId: 'illness',
    title: 'Cancer Warning Signs and Screening Basics',
    summary:
      'Changes in your body worth getting checked, why screening can find cancer before symptoms start, and the screening tests recommended for many adults.',
    readMinutes: 4,
    level: 'Intermediate',
    icon: 'ribbon-outline',
    callout: {
      kind: 'warning',
      text: "Most of the symptoms in this lesson are caused by something other than cancer. Get checked if a change lasts more than a few weeks or keeps getting worse. Don't wait weeks for bleeding you can't explain: contact your clinician right away.",
    },
    sections: [
      {
        heading: 'Two ways cancer is found',
        body: md(
          'Cancer is usually found in one of two ways:',
          '',
          '- **Symptoms:** you notice a change and get it checked.',
          '- **Screening:** a test finds cancer, or changes that could become cancer, in someone who feels fine.',
          '',
          'Screening matters because many cancers are easier to treat when they are found early, before they cause symptoms. Some screening tests, such as colonoscopy and cervical cancer screening, can even **prevent** cancer by finding and removing abnormal growths or cells before they turn into cancer.',
        ),
      },
      {
        heading: 'Changes worth getting checked',
        body: md(
          'The National Cancer Institute lists these possible signs:',
          '',
          '- A new lump or swelling in the breast, neck, armpit, belly, or groin',
          '- Breast changes, such as dimpled skin or nipple discharge',
          '- Changes in bowel habits, or blood in your stool',
          '- Blood in your urine, or trouble urinating',
          '- Bleeding or bruising for no known reason',
          "- A cough or hoarseness that won't go away",
          '- Trouble swallowing, or ongoing indigestion or nausea',
          '- Unexplained weight loss, fever, or night sweats',
          "- Severe tiredness that doesn't get better with rest",
          "- A new mole, a mole that changes, or a sore that doesn't heal",
          '- Patches, sores, bleeding, or numbness in the mouth',
          '',
          "NCI advises seeing a doctor if symptoms don't get better after a few weeks.",
          '',
          "**Don't wait weeks for bleeding.** Contact your clinician right away for blood in your stool, black or tarry stools, or bleeding or bruising you can't explain. Get blood in your urine checked soon, too. Call 911 or go to the ER if you vomit blood, bleed heavily, or faint.",
        ),
      },
      {
        heading: 'Talking about a worrying symptom',
        body: md(
          "It's normal to feel scared, but waiting doesn't make a problem go away. At your visit:",
          '',
          '- Say how long the change has been going on and whether it is getting worse.',
          '- Mention any family history of cancer, and whether relatives were diagnosed young.',
          '- Ask, "What could be causing this, and what tests do I need?"',
          '- Ask how and when you will get your results.',
          '',
          "Always follow up on test results. Don't assume that no news is good news. If your symptom doesn't improve with the plan, go back, or ask about a referral or a second opinion.",
        ),
      },
      {
        heading: 'Screenings recommended for many adults',
        body: md(
          'For people at **average risk**, USPSTF recommends:',
          '',
          '- **Colorectal cancer:** ages 45 to 75. Options include home stool tests (every 1 to 3 years, depending on the test) or a colonoscopy every 10 years.',
          '- **Breast cancer:** a mammogram every 2 years for women 40 to 74.',
          '- **Cervical cancer:** women 21 to 65. A Pap test every 3 years in your 20s. From 30 to 65, an HPV test (for the virus that can cause cervical cancer) every 5 years, HPV plus Pap every 5 years, or a Pap test every 3 years.',
          '- **Lung cancer:** a yearly low-dose CT scan (a chest scan that uses little radiation) for adults 50 to 80 who have a 20 pack-year smoking history and still smoke or quit within the past 15 years. One pack-year is 1 pack a day for a year, so 1 pack a day for 20 years counts.',
          '- **Prostate cancer:** men 55 to 69 should decide with a clinician whether to have a PSA (prostate-specific antigen) blood test after weighing the benefits and harms.',
          '',
          'A strong family history or other risk factors may mean starting earlier. Ask your clinician.',
        ),
      },
      {
        heading: 'Benefits and trade-offs',
        body: md(
          'Screening saves lives, but no test is perfect. NCI notes possible harms, including:',
          '',
          '- **False positives:** a result that looks abnormal when there is no cancer, which can lead to more tests and worry',
          '- **False negatives:** a cancer that is missed',
          "- **Overdiagnosis:** finding a slow cancer that would never have caused problems, which can lead to treatment you didn't need",
          '- **Procedure risks**, such as bleeding from a colonoscopy',
          '',
          "That's why recommendations have specific age ranges and schedules. If a home stool test is positive, you need a follow-up colonoscopy to finish the screening. In the US, federal rules count that colonoscopy as part of screening, so most private health plans must cover it with no cost-sharing when you use an in-network provider. Medicare covers it too, though you may owe coinsurance if a polyp is removed. Other follow-up tests and treatment are usually billed as regular care, so check with your plan.",
        ),
      },
    ],
    keyTakeaways: [
      "See a clinician about any unexplained change that lasts more than a few weeks, and right away for bleeding you can't explain.",
      'Screening looks for cancer before symptoms start, when it is often easier to treat.',
      'Most adults start colorectal screening at 45. Women 40 to 74 should get a mammogram every 2 years.',
      'Screening has trade-offs, and your family history can change when and how you should be screened.',
      'If a home stool test is positive, get the follow-up colonoscopy. Most plans must cover it as part of screening.',
    ],
    quiz: [
      {
        question: 'At what age does USPSTF recommend that average-risk adults start colorectal cancer screening?',
        options: ['30', '45', '60', '75'],
        answerIndex: 1,
        explanation:
          'USPSTF recommends colorectal cancer screening from 45 to 75 for adults at average risk. Talk with your clinician about which test is right for you.',
      },
      {
        question: 'What does NCI advise about possible cancer symptoms, like a cough that will not go away?',
        options: [
          'They are almost always caused by cancer',
          'Wait until you have at least three symptoms',
          'Only see a doctor if the symptom is painful',
          'See a doctor if they last over a few weeks',
        ],
        answerIndex: 3,
        explanation:
          "These symptoms are most often caused by something else, but NCI advises seeing a doctor if they last more than a few weeks so any problem can be found early. Bleeding you can't explain should be checked right away.",
      },
      {
        question: 'Which of these is a real trade-off of cancer screening?',
        options: [
          'A false positive can lead to more tests',
          'Screening tests cause most cancers',
          'Screening only helps after symptoms start',
          'Screening results are always 100% accurate',
        ],
        answerIndex: 0,
        explanation:
          'False positives, missed cancers, and overdiagnosis are known trade-offs. Recommended schedules are designed so that the benefits outweigh the harms.',
      },
    ],
    sources: [
      {
        title: 'Symptoms of Cancer',
        publisher: 'National Cancer Institute (NCI)',
        url: 'https://www.cancer.gov/about-cancer/diagnosis-staging/symptoms',
      },
      {
        title: 'What Cancer Screening Tests Check for Cancer?',
        publisher: 'National Cancer Institute (NCI)',
        url: 'https://www.cancer.gov/about-cancer/screening/screening-tests',
      },
      {
        title: 'USPSTF A and B Recommendations',
        publisher: 'US Preventive Services Task Force',
        url: 'https://www.uspreventiveservicestaskforce.org/uspstf/recommendation-topics/uspstf-a-and-b-recommendations',
      },
      {
        title: 'Black or tarry stools',
        publisher: 'NIH MedlinePlus Medical Encyclopedia',
        url: 'https://medlineplus.gov/ency/article/003130.htm',
      },
      {
        title: 'FAQs About Affordable Care Act Implementation Part 51',
        publisher: 'US Department of Labor',
        url: 'https://www.dol.gov/sites/dolgov/files/EBSA/about-ebsa/our-activities/resource-center/faqs/aca-part-51.pdf',
      },
    ],
    askBrianPrompts: [
      'Which cancer screenings are right for my age and history?',
      'What is the difference between a colonoscopy and a home stool test?',
      'Should my family history change when I start screening?',
    ],
    tags: ['cancer', 'warning signs', 'screening', 'mammogram', 'colonoscopy', 'pap test', 'lung cancer', 'PSA', 'early detection', 'lump', 'blood in stool'],
  },
];
