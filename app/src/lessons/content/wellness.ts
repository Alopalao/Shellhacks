import type { Lesson } from '../types';

// Content for category 'wellness' ("Wellness & Prevention").
// Format: see src/lessons/types.ts (markdown-lite). Every source URL was checked to resolve to the
// named page. Facts reflect USPSTF / CDC / NIH / FDA / HHS / Medicare guidance as published through
// September 2026. Educational content only — not a substitute for a clinician's advice.

/** Joins lines with "\n". Use "" for a blank line (paragraph break). */
const md = (...lines: string[]): string => lines.join('\n');

export const lessons: Lesson[] = [
  // ───────────────────────────── 1. Preventive screenings by age ─────────────────────────────
  {
    id: 'preventive-screenings-by-age',
    categoryId: 'wellness',
    title: 'Preventive Screenings by Age',
    summary:
      'The checkups and tests the US Preventive Services Task Force recommends for most adults, when to start them, and how insurance usually covers them.',
    readMinutes: 4,
    level: 'Basics',
    icon: 'clipboard-outline',
    callout: {
      kind: 'tip',
      text: 'These are general recommendations for people at average risk. Your family history, health conditions, and past results can change what you need, so review your list with your clinician each year.',
    },
    sections: [
      {
        heading: 'Why screening matters',
        body: md(
          'Screening tests look for health problems **before you have symptoms**, when they are usually easier to treat. Some screenings can even prevent disease, for example by finding and removing growths in the colon before they become cancer.',
          '',
          'In the US, the **US Preventive Services Task Force (USPSTF)**, an independent panel of experts, reviews the evidence for each screening and gives it a grade. Services graded **A or B** are recommended. Recommendations are reviewed over time and can change as new evidence comes in, so the list below reflects the current ones.',
        ),
      },
      {
        heading: 'For all adults',
        body: md(
          '- **Blood pressure:** all adults 18 and older',
          '- **Depression:** all adults, including during and after pregnancy',
          '- **Anxiety:** adults 64 and younger',
          '- **Hepatitis C:** at least once for adults 18 to 79',
          '- **HIV:** at least once for everyone 15 to 65, and more often if you are at higher risk',
          '- **Unhealthy alcohol use:** screening and brief counseling for adults',
          '- **Tobacco use:** clinicians should ask and offer help to quit',
          '- **Hepatitis B:** for adults at higher risk',
          '',
          'Many of these are simple questionnaires or a single blood test that can be done at a routine visit.',
        ),
      },
      {
        heading: 'Screenings that start in your 20s to 40s',
        body: md(
          '- **Cervical cancer (women 21 to 65):** a Pap test every 3 years from 21 to 29. From 30 to 65, an HPV test every 5 years, HPV plus Pap every 5 years, or a Pap test every 3 years.',
          '- **Prediabetes and type 2 diabetes (35 to 70):** for adults who have overweight or obesity.',
          '- **Heart disease prevention (40 to 75):** your clinician checks cholesterol and other risk factors, and a statin may be recommended if your risk is higher.',
          '- **Breast cancer (women 40 to 74):** a mammogram every 2 years.',
          '- **Colorectal cancer (45 to 75):** a home stool test or colonoscopy, among other options. Adults 76 to 85 should decide with their clinician.',
        ),
      },
      {
        heading: 'Screenings in your 50s and beyond',
        body: md(
          '- **Lung cancer (50 to 80):** a yearly low-dose CT scan if you have a 20 pack-year smoking history and still smoke or quit within the past 15 years. (One pack a day for 20 years equals 20 pack-years.)',
          '- **Prostate cancer (men 55 to 69):** decide with your clinician whether a PSA test is right for you after talking about benefits and harms.',
          '- **Osteoporosis:** a bone density test for women 65 and older, and for younger women past menopause who are at higher risk.',
          '- **Abdominal aortic aneurysm:** a one-time ultrasound for men 65 to 75 who have ever smoked.',
          '- **Fall prevention (65 and older):** exercise programs for people at higher risk of falling.',
        ),
      },
      {
        heading: 'How coverage usually works (US)',
        body: md(
          'Under the Affordable Care Act, most private health plans cover USPSTF A and B services **at no cost to you**, with no copay or coinsurance, even before you meet your deductible, when you see an **in-network** provider. Medicare covers many preventive services too, including a yearly wellness visit.',
          '',
          "A few things can still lead to a bill:",
          '',
          '- The visit also covers a new problem or a chronic condition.',
          '- You use an out-of-network provider.',
          '- You have an older "grandfathered" plan.',
          '- Follow-up tests after an abnormal result are billed differently.',
          '',
          'Call the number on your insurance card before scheduling if you are unsure. Coverage details vary by plan.',
        ),
      },
      {
        heading: 'Make your screening plan',
        body: md(
          '1. Write down your age, your health conditions, whether you have ever smoked, and your family history of cancer, heart disease, and diabetes.',
          '2. Use the free MyHealthfinder tool from the US Department of Health and Human Services to get a personalized list.',
          '3. At your yearly visit, ask, "Which screenings am I due for, and which can I skip?"',
          '4. Keep a record of each test, its date, and when the next one is due.',
          '5. Follow up on every result, including normal ones, so you know what happens next.',
        ),
      },
    ],
    keyTakeaways: [
      'Screenings find problems early, often before any symptoms appear.',
      'All adults should have their blood pressure checked and be screened for depression. Most adults need a one-time hepatitis C test and HIV test.',
      'Colorectal screening starts at 45. Women 40 to 74 should get a mammogram every 2 years.',
      'Most US plans cover USPSTF A and B screenings with no cost-sharing in network. Confirm with your plan.',
    ],
    quiz: [
      {
        question: 'Who should get screened for hepatitis C at least once, according to USPSTF?',
        options: [
          'Only people with symptoms',
          'Adults 18 to 79',
          'Only adults over 65',
          'Only health care workers',
        ],
        answerIndex: 1,
        explanation:
          'USPSTF recommends that all adults 18 to 79 be screened for hepatitis C at least once, because many people with it have no symptoms.',
      },
      {
        question: 'Who is yearly lung cancer screening recommended for?',
        options: [
          'Everyone over 50',
          'Anyone who has ever tried a cigarette',
          'Adults 50 to 80 with a 20 pack-year smoking history who smoke now or quit within the past 15 years',
          'Only people who have a cough',
        ],
        answerIndex: 2,
        explanation:
          'USPSTF recommends a yearly low-dose CT scan for adults 50 to 80 who have a 20 pack-year history and currently smoke or quit within the past 15 years.',
      },
      {
        question: 'Under the ACA, how do most private plans cover recommended preventive screenings?',
        options: [
          'Only after you meet your deductible',
          'With no cost-sharing when you use an in-network provider',
          'They are never covered',
          'Only if you already have symptoms',
        ],
        answerIndex: 1,
        explanation:
          'Most plans must cover USPSTF A and B services with no copay, coinsurance, or deductible when you see an in-network provider. Some situations can still lead to a bill, so check with your plan.',
      },
    ],
    sources: [
      {
        title: 'USPSTF A and B Recommendations',
        publisher: 'US Preventive Services Task Force',
        url: 'https://www.uspreventiveservicestaskforce.org/uspstf/recommendation-topics/uspstf-a-and-b-recommendations',
      },
      {
        title: 'Preventive care benefits for adults',
        publisher: 'HealthCare.gov',
        url: 'https://www.healthcare.gov/preventive-care-adults/',
      },
      {
        title: 'Preventive and screening services',
        publisher: 'Medicare.gov',
        url: 'https://www.medicare.gov/coverage/preventive-screening-services',
      },
      {
        title: 'MyHealthfinder',
        publisher: 'Office of Disease Prevention and Health Promotion (HHS)',
        url: 'https://odphp.health.gov/myhealthfinder',
      },
    ],
    askBrianPrompts: [
      'Which screenings am I due for based on my age and health conditions?',
      'How often should I get my cholesterol checked?',
      'Will my insurance cover a screening colonoscopy?',
    ],
    tags: ['screening', 'prevention', 'USPSTF', 'checkup', 'mammogram', 'colonoscopy', 'blood pressure', 'hepatitis C', 'preventive care', 'insurance coverage'],
  },

  // ───────────────────────────── 2. Adult vaccines ─────────────────────────────
  {
    id: 'adult-vaccines-guide',
    categoryId: 'wellness',
    title: 'Adult Vaccines: What You May Need',
    summary:
      'Which vaccines adults commonly need at different ages, why some recommendations have been changing, and how to get vaccinated and covered.',
    readMinutes: 4,
    level: 'Basics',
    icon: 'shield-checkmark-outline',
    callout: {
      kind: 'warning',
      text: 'US vaccine recommendations have changed several times since 2025, and some changes are being challenged in court. Check the current CDC adult schedule and ask your clinician or pharmacist what is right for you.',
    },
    sections: [
      {
        heading: 'Why adults still need vaccines',
        body: md(
          'Vaccines are not just for kids. Adults need them because:',
          '',
          '- Protection from some vaccines fades over time and needs a booster.',
          '- Some vaccines are recommended only for adults, like those for shingles and RSV.',
          '- Age and conditions like diabetes, heart or lung disease, or a weakened immune system raise the risk of serious illness.',
          '- Being vaccinated also helps protect the people around you, including newborns and older relatives.',
          '',
          "Which vaccines you need depends on your age, health, job, travel, and past vaccines. Keep a copy of your vaccine record. Your clinician or your state's immunization registry may have it.",
        ),
      },
      {
        heading: 'Every year: flu',
        body: md(
          'CDC recommends a flu vaccine every year for nearly everyone 6 months and older. You need one yearly because protection fades and flu viruses change from season to season.',
          '',
          '- **Best timing:** September or October, ideally by the end of October. For most adults, getting it in July or August is too early, because protection may fade before the season ends.',
          '- **It takes about 2 weeks** after the shot for protection to build.',
          '- **Adults 65 and older** may be offered a flu vaccine made for older adults, such as a high-dose or adjuvanted (immune-boosting) vaccine. Ask which one is available.',
          '',
          'It is still worth getting vaccinated later in the season if you missed the fall window.',
        ),
      },
      {
        heading: 'Every 10 years: tetanus',
        body: md(
          'Tetanus, diphtheria, and whooping cough (pertussis) are prevented by **Td** or **Tdap** vaccines.',
          '',
          "- Adults need a tetanus booster (Td or Tdap) **every 10 years**. If you never got Tdap as an adult, get one dose.",
          '- Tdap is recommended **during each pregnancy** to help protect the newborn from whooping cough.',
          '- After a deep or dirty wound, you may need a booster sooner. Tell the clinician treating the wound when you had your last tetanus shot.',
        ),
      },
      {
        heading: 'Vaccines based on age and health',
        body: md(
          '- **Shingles:** 2 doses of the recombinant vaccine, 2 to 6 months apart, for adults 50 and older, and for adults 19 and older with a weakened immune system. Get it even if you have had shingles or chickenpox.',
          '- **Pneumococcal (pneumonia):** for all adults 50 and older, and younger adults with certain health conditions.',
          '- **RSV:** a single dose for adults 75 and older, and adults 50 to 74 at higher risk, such as those with chronic heart or lung disease, a weakened immune system, or who live in a nursing home. It is not a yearly shot. Late summer or early fall is the best time.',
          '- **Hepatitis B:** for adults 19 to 59, and adults 60 and older with risk factors or who want it.',
          '- **HPV:** recommended through age 26. Adults 27 to 45 can decide with their clinician.',
          '- **MMR and chickenpox:** if you have no proof of immunity.',
        ),
      },
      {
        heading: 'COVID-19 vaccines: ask about your situation',
        body: md(
          'COVID-19 vaccine guidance has changed several times since 2025. The updated 2026–2027 vaccines are FDA-approved for **adults 65 and older** and for **younger people with at least one condition** that raises their risk of severe COVID-19, such as diabetes or chronic heart or lung disease.',
          '',
          'Federal recommendations are being reviewed and challenged in court, and pharmacy rules and insurance coverage can vary by state and plan. The most reliable step is to ask your clinician or pharmacist:',
          '',
          '- Am I eligible for an updated COVID-19 vaccine this season?',
          '- Given my health, would it benefit me?',
          '- Will my plan cover it at no cost?',
        ),
      },
      {
        heading: 'Where to get vaccinated and how to pay (US)',
        body: md(
          "You can usually get vaccinated at your clinician's office, a pharmacy, or your local health department. Pharmacists can give many adult vaccines, but the rules vary by state. Vaccines.gov can help you find locations.",
          '',
          '- **Most private plans** cover recommended vaccines at no cost when you use an in-network provider.',
          '- **Medicare Part B** covers flu, pneumococcal, and COVID-19 shots.',
          '- **Medicare Part D** covers other recommended vaccines, such as shingles, Tdap, and RSV, generally at no cost to you.',
          '- **Medicaid** covers recommended vaccines for adults.',
          '',
          'Ask before your appointment if you are unsure, and bring your insurance card.',
        ),
      },
    ],
    keyTakeaways: [
      'Get a flu vaccine every year, ideally in September or October.',
      'Get a tetanus booster (Td or Tdap) every 10 years, and Tdap during each pregnancy.',
      'At 50 and older, ask about shingles and pneumococcal vaccines. Ask about RSV at 75, or from 50 if you are at higher risk.',
      'COVID-19 vaccine guidance has been changing, so ask your clinician or pharmacist what fits you.',
    ],
    quiz: [
      {
        question: 'How often should adults get a flu vaccine?',
        options: ['Once in a lifetime', 'Every year', 'Every 10 years', 'Only if they had the flu last year'],
        answerIndex: 1,
        explanation:
          'Flu vaccine protection fades and the viruses change, so CDC recommends a flu vaccine every year for nearly everyone 6 months and older.',
      },
      {
        question: 'What is the shingles vaccine schedule for healthy adults 50 and older?',
        options: [
          'Two doses given 2 to 6 months apart',
          'One dose',
          'One dose every year',
          'Only for people who never had chickenpox',
        ],
        answerIndex: 0,
        explanation:
          'The recombinant shingles vaccine is a 2-dose series given 2 to 6 months apart. It is recommended even if you have had shingles or chickenpox.',
      },
      {
        question: 'Which statement about RSV vaccines for adults is correct?',
        options: [
          'It is a yearly shot, like the flu vaccine',
          'It is only for children',
          'It is a single dose for adults 75 and older and adults 50 to 74 at higher risk',
          'It is needed every 10 years',
        ],
        answerIndex: 2,
        explanation:
          'CDC recommends a single RSV vaccine dose for adults 75 and older and for adults 50 to 74 at increased risk. It is not currently a yearly vaccine.',
      },
    ],
    sources: [
      {
        title: 'Adult Immunization Schedule by Age',
        publisher: 'CDC',
        url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-age.html',
      },
      {
        title: 'Key Facts About Seasonal Flu Vaccine',
        publisher: 'CDC',
        url: 'https://www.cdc.gov/flu/vaccines/keyfacts.html',
      },
      {
        title: 'Shingles Vaccination',
        publisher: 'CDC',
        url: 'https://www.cdc.gov/shingles/vaccines/index.html',
      },
      {
        title: 'Vaccines for Adults (RSV)',
        publisher: 'CDC',
        url: 'https://www.cdc.gov/rsv/vaccines/adults.html',
      },
      {
        title: 'Shingles Shots',
        publisher: 'Medicare.gov',
        url: 'https://www.medicare.gov/coverage/shingles-shot',
      },
    ],
    askBrianPrompts: [
      'Which vaccines am I due for at my age and with my conditions?',
      'Can I get more than one vaccine on the same day?',
      'Does Medicare cover the shingles and RSV vaccines?',
    ],
    tags: ['vaccines', 'immunization', 'flu shot', 'shingles', 'tetanus', 'Tdap', 'RSV', 'pneumonia vaccine', 'COVID-19 vaccine', 'hepatitis B'],
  },

  // ───────────────────────────── 3. Sleep ─────────────────────────────
  {
    id: 'sleep-health-basics',
    categoryId: 'wellness',
    title: 'Sleep: How Much You Need and How to Get It',
    summary:
      'How many hours of sleep people need at each age, habits that help, and signs of sleep problems like insomnia and sleep apnea.',
    readMinutes: 4,
    level: 'Basics',
    icon: 'moon-outline',
    callout: {
      kind: 'warning',
      text: "Drowsy driving is dangerous. Being short on sleep can hurt your driving as much as being drunk. If you're yawning, drifting from your lane, or can't remember the last few miles, pull over somewhere safe and rest.",
    },
    sections: [
      {
        heading: 'Why sleep matters',
        body: md(
          'Sleep is when your body and brain recover. It supports memory, mood, your immune system, blood sugar control, and heart health.',
          '',
          'According to NHLBI, not getting enough sleep over time is linked to a higher risk of heart disease, high blood pressure, obesity, stroke, and depression, and it raises blood sugar levels. It also slows your reactions and leads to more mistakes. After just a few nights of losing 1 to 2 hours of sleep, you may function as if you had not slept at all for a day or two.',
          '',
          'Good sleep is not a luxury. It is as important to your health as eating well and staying active.',
        ),
      },
      {
        heading: 'How much sleep do you need?',
        body: md(
          'CDC recommends these amounts:',
          '',
          '- **Adults 18 to 60:** 7 or more hours a night',
          '- **Adults 61 to 64:** 7 to 9 hours',
          '- **Adults 65 and older:** 7 to 8 hours',
          '- **Teens 13 to 17:** 8 to 10 hours',
          '- **Children 6 to 12:** 9 to 12 hours',
          '- **Children 3 to 5:** 10 to 13 hours, including naps',
          '',
          "Quality counts too. If you often wake up during the night, snore loudly, or still feel tired after a full night in bed, that's worth mentioning to your clinician.",
        ),
      },
      {
        heading: 'Habits that help',
        body: md(
          '- **Keep a steady schedule.** Go to bed and wake up at the same times every day, including weekends.',
          '- **Make your bedroom dark, quiet, and cool.**',
          '- **Put screens away** at least 30 minutes before bed.',
          '- **Limit caffeine** in the afternoon and evening, and avoid alcohol and large meals close to bedtime.',
          '- **Be active during the day**, but try not to exercise hard right before bed.',
          '- **Create a wind-down routine**, like reading, a warm shower, or gentle stretching.',
          "- **If you can't fall asleep** after a while, get up and do something calm in dim light until you feel sleepy.",
          '- **Keep naps short** and earlier in the day.',
        ),
      },
      {
        heading: "Insomnia: when sleep won't come",
        body: md(
          'Insomnia means regularly having trouble falling asleep, staying asleep, or waking too early, and feeling the effects during the day. Short bouts often follow stress and get better on their own.',
          '',
          'For insomnia that keeps going, **cognitive behavioral therapy for insomnia (CBT-I)** is a proven, drug-free treatment. It is usually a 6- to 8-week program that teaches you how to fall asleep faster and stay asleep longer. It is offered in person, by video, and through some online programs.',
          '',
          "Sleep medicines can help some people for short periods, but they have side effects and some can be habit-forming. NHLBI notes that research has not proven melatonin is effective for insomnia. Talk with your clinician or pharmacist before using any sleep aid regularly, including over-the-counter ones, especially if you're an older adult.",
        ),
      },
      {
        heading: 'Sleep apnea and other warning signs',
        body: md(
          'In **obstructive sleep apnea**, your airway repeatedly narrows or closes during sleep, so breathing stops and starts. Signs include:',
          '',
          '- Loud snoring',
          '- Gasping or choking during sleep, or pauses in breathing that a partner notices',
          '- Being very sleepy during the day, even after a full night in bed',
          '',
          'Untreated sleep apnea raises the risk of stroke, heart attack, and other serious problems. It is often diagnosed with a sleep study, which may be done at home. Treatments include breathing devices such as CPAP, oral devices, lifestyle changes, and sometimes surgery.',
          '',
          'Also tell your clinician about restless or uncomfortable legs at night, or if you have ever fallen asleep while driving.',
        ),
      },
      {
        heading: 'Talking to your clinician',
        body: md(
          'If sleep problems last more than a few weeks or affect your day, bring it up. A **sleep diary** kept for 1 to 2 weeks is very helpful. Each day, write down:',
          '',
          '- When you went to bed and when you got up',
          '- About how long it took to fall asleep, and how often you woke up',
          '- Naps, caffeine, alcohol, exercise, and medicines',
          '- How rested you felt the next day',
          '',
          'Some medicines, pain, heartburn, needing to urinate at night, depression, and anxiety can all disrupt sleep. Treating the cause often helps.',
        ),
      },
    ],
    keyTakeaways: [
      'Most adults need at least 7 hours of sleep a night. Teens need 8 to 10.',
      'A steady schedule and a dark, quiet, cool bedroom are the foundation of good sleep.',
      'CBT-I is an effective, drug-free treatment for long-lasting insomnia.',
      'Loud snoring with gasping, or heavy daytime sleepiness, can signal sleep apnea. Get checked.',
      'Never drive drowsy. Pull over and rest.',
    ],
    quiz: [
      {
        question: 'How much sleep does CDC recommend for adults ages 18 to 60?',
        options: ['5 or more hours', '7 or more hours', 'Exactly 6 hours', '10 to 12 hours'],
        answerIndex: 1,
        explanation:
          'CDC recommends 7 or more hours a night for adults 18 to 60. Teens need 8 to 10 hours.',
      },
      {
        question: 'What is a recommended first treatment for long-lasting insomnia?',
        options: [
          'Melatonin every night',
          'Cognitive behavioral therapy for insomnia (CBT-I)',
          'A glass of wine before bed',
          'Sleeping in late on weekends',
        ],
        answerIndex: 1,
        explanation:
          'CBT-I is a structured, drug-free program that teaches skills to fall asleep and stay asleep. Alcohol disrupts sleep, and research has not proven melatonin works for insomnia.',
      },
      {
        question: 'Which of these could be a sign of sleep apnea?',
        options: [
          'Loud snoring with gasping or choking during sleep',
          'Dreaming often',
          'Waking once to use the bathroom',
          'Falling asleep within 15 minutes',
        ],
        answerIndex: 0,
        explanation:
          'Loud snoring, gasping, pauses in breathing, and heavy daytime sleepiness are common signs of sleep apnea. Talk with your clinician about a sleep study.',
      },
    ],
    sources: [
      {
        title: 'About Sleep',
        publisher: 'CDC',
        url: 'https://www.cdc.gov/sleep/about/index.html',
      },
      {
        title: 'Sleep Deprivation and Deficiency: How Sleep Affects Your Health',
        publisher: 'National Heart, Lung, and Blood Institute (NIH)',
        url: 'https://www.nhlbi.nih.gov/health/sleep-deprivation/health-effects',
      },
      {
        title: 'Insomnia: Treatment',
        publisher: 'National Heart, Lung, and Blood Institute (NIH)',
        url: 'https://www.nhlbi.nih.gov/health/insomnia/treatment',
      },
      {
        title: 'What Is Sleep Apnea?',
        publisher: 'National Heart, Lung, and Blood Institute (NIH)',
        url: 'https://www.nhlbi.nih.gov/health/sleep-apnea',
      },
      {
        title: 'Healthy Sleep',
        publisher: 'NIH MedlinePlus',
        url: 'https://medlineplus.gov/healthysleep.html',
      },
    ],
    askBrianPrompts: [
      'Could any of my medications be affecting my sleep?',
      'How do I know if I should be tested for sleep apnea?',
      'What is CBT-I, and how can I find it?',
    ],
    tags: ['sleep', 'insomnia', 'sleep apnea', 'snoring', 'tired', 'fatigue', 'melatonin', 'CBT-I', 'drowsy driving', 'sleep hygiene'],
  },

  // ───────────────────────────── 4. Physical activity ─────────────────────────────
  {
    id: 'physical-activity-guidelines',
    categoryId: 'wellness',
    title: 'Physical Activity: How Much Is Enough?',
    summary:
      'The US physical activity guidelines in plain language (150 minutes a week, muscle strengthening, and balance) plus simple ways to start safely.',
    readMinutes: 4,
    level: 'Basics',
    icon: 'walk-outline',
    callout: {
      kind: 'tip',
      text: "Some activity is better than none. Every bit counts, even a few minutes of brisk walking. You don't have to do it all at once.",
    },
    sections: [
      {
        heading: 'Why move?',
        body: md(
          'Regular physical activity is one of the best things you can do for your health. Over time, it lowers the risk of heart disease, stroke, type 2 diabetes, high blood pressure, several cancers, and depression. It also strengthens bones and muscles, improves balance, and helps you manage your weight.',
          '',
          'Some benefits start right away. After a single session, many people sleep better, feel less anxious, and think more clearly.',
          '',
          "You don't need a gym or special equipment. Walking, dancing, gardening, taking the stairs, and playing with your kids all count.",
        ),
      },
      {
        heading: 'The weekly targets for adults',
        body: md(
          'The Physical Activity Guidelines for Americans recommend:',
          '',
          '- **Aerobic activity:** at least **150 minutes** (2½ hours) a week of moderate activity, like brisk walking, **or** 75 minutes of vigorous activity, like jogging, or a mix of the two. Going up to 300 minutes of moderate activity brings even more benefits.',
          '- **Muscle strengthening:** activities that work all the major muscle groups (legs, hips, back, belly, chest, shoulders, and arms) on **2 or more days** a week.',
          '',
          'Spread it out in whatever way fits your life, for example 30 minutes on 5 days, or shorter bouts throughout the day. Sitting less helps too.',
        ),
      },
      {
        heading: "How hard is 'moderate'? Try the talk test",
        body: md(
          '- **Moderate:** you can talk, but not sing. Examples include brisk walking, recreational swimming, biking under 10 mph, doubles tennis, and water aerobics.',
          "- **Vigorous:** you can't say more than a few words without pausing for a breath. Examples include jogging or running, swimming laps, singles tennis, biking 10 mph or faster, and jumping rope.",
          '',
          'For strength, try body-weight moves like squats, wall push-ups, and standing up from a chair, or use resistance bands, weights, or heavy gardening. Everyday tasks like carrying groceries also count.',
        ),
      },
      {
        heading: 'Older adults, kids, and pregnancy',
        body: md(
          '- **Adults 65 and older:** the same aerobic and strength targets, plus **balance activities**, such as walking heel-to-toe or standing up from a chair. If a health condition limits you, be as active as your abilities allow.',
          '- **Children and teens 6 to 17:** at least **60 minutes a day** of moderate to vigorous activity, with vigorous activity and muscle- and bone-strengthening activities (like climbing or jumping) on at least 3 days a week.',
          '- **Children 3 to 5:** active throughout the day.',
          '- **During pregnancy and after birth:** at least 150 minutes of moderate activity a week, if your clinician agrees.',
        ),
      },
      {
        heading: 'Starting safely',
        body: md(
          '- **Start low and go slow.** If you are inactive now, begin with a few minutes a day and add a little each week.',
          '- **Warm up and cool down** with a few minutes of easy movement.',
          '- **Wear supportive shoes**, drink water, and dress for the weather.',
          '- **Check with your clinician** about which activities are right for you if you have heart disease, diabetes, arthritis, or another chronic condition, or if you have had symptoms like chest pain with exertion.',
          '',
          '**Stop right away** if you feel chest pain or pressure, faintness, or severe shortness of breath. Call 911 if chest pain or pressure lasts more than a few minutes or keeps coming back.',
        ),
      },
      {
        heading: 'Make it stick',
        body: md(
          "- Choose activities you enjoy. You're more likely to keep doing them.",
          '- Put activity on your calendar like any other appointment.',
          '- Find a walking buddy, a class, or a team.',
          '- Break it up: a 10-minute walk after each meal adds up to 30 minutes.',
          '- Track your minutes or steps with a notebook, an app, or a step counter.',
          '- Mix it up to work different muscles and avoid boredom.',
          '- Set small, specific goals, like "walk 15 minutes after lunch on weekdays."',
          '',
          'If you miss a day, just pick up again tomorrow.',
        ),
      },
    ],
    keyTakeaways: [
      'Aim for at least 150 minutes of moderate activity a week, plus muscle strengthening on 2 or more days.',
      'Moderate activity means you can talk but not sing.',
      'Older adults should add balance activities. Kids need at least 60 minutes of activity a day.',
      'Start slowly, and stop and get help for chest pain, fainting, or severe breathlessness.',
    ],
    quiz: [
      {
        question: 'What is the minimum weekly aerobic activity recommended for adults?',
        options: [
          '60 minutes of moderate activity',
          '150 minutes of moderate activity or 75 minutes of vigorous activity',
          '300 minutes of vigorous activity only',
          '30 minutes total',
        ],
        answerIndex: 1,
        explanation:
          'Adults should get at least 150 minutes of moderate or 75 minutes of vigorous aerobic activity a week, or a mix. More brings extra benefits.',
      },
      {
        question: 'Using the talk test, moderate-intensity activity means you can:',
        options: [
          'Talk, but not sing',
          'Sing easily',
          'Say only a few words before pausing for breath',
          'Not talk at all',
        ],
        answerIndex: 0,
        explanation:
          "During moderate activity you can talk but not sing. If you can't say more than a few words without pausing for breath, you are working at a vigorous level.",
      },
      {
        question: 'How often should adults do muscle-strengthening activities?',
        options: ['Never, walking is enough', 'Once a month', 'Only after age 65', 'On 2 or more days a week'],
        answerIndex: 3,
        explanation:
          'The guidelines recommend muscle-strengthening activities that work all the major muscle groups on 2 or more days a week.',
      },
    ],
    sources: [
      {
        title: 'Adult Activity: An Overview',
        publisher: 'CDC',
        url: 'https://www.cdc.gov/physical-activity-basics/guidelines/adults.html',
      },
      {
        title: 'How to Measure Physical Activity Intensity',
        publisher: 'CDC',
        url: 'https://www.cdc.gov/physical-activity-basics/measuring/index.html',
      },
      {
        title: 'Older Adult Activity: An Overview',
        publisher: 'CDC',
        url: 'https://www.cdc.gov/physical-activity-basics/guidelines/older-adults.html',
      },
      {
        title: 'Physical Activity Guidelines for Americans: Current Guidelines',
        publisher: 'Office of Disease Prevention and Health Promotion (HHS)',
        url: 'https://odphp.health.gov/our-work/nutrition-physical-activity/physical-activity-guidelines/current-guidelines',
      },
      {
        title: 'Exercise and physical activity',
        publisher: 'National Institute on Aging (NIH)',
        url: 'https://www.nia.nih.gov/health/exercise-and-physical-activity',
      },
    ],
    askBrianPrompts: [
      'How can I safely start exercising with my health conditions?',
      'What are some easy strength exercises I can do at home?',
      'Does walking count as exercise, and how fast should I go?',
    ],
    tags: ['exercise', 'physical activity', 'fitness', 'walking', '150 minutes', 'strength training', 'balance', 'talk test', 'older adults', 'kids activity'],
  },

  // ───────────────────────────── 5. Healthy eating ─────────────────────────────
  {
    id: 'healthy-eating-basics',
    categoryId: 'wellness',
    title: 'Healthy Eating Basics',
    summary:
      'Simple, evidence-based ways to build healthier meals, read a Nutrition Facts label, and cut back on sodium, added sugars, and highly processed foods.',
    readMinutes: 4,
    level: 'Basics',
    icon: 'nutrition-outline',
    callout: {
      kind: 'warning',
      text: 'If you have diabetes, kidney disease, heart failure, food allergies, or take medicines affected by food (such as warfarin), ask your clinician or a registered dietitian for advice tailored to you.',
    },
    sections: [
      {
        heading: 'Build meals around whole foods',
        body: md(
          'The Dietary Guidelines for Americans, 2025–2030, released by USDA and HHS in January 2026, emphasize whole, nutrient-dense foods and eating fewer highly processed foods. Build most meals from:',
          '',
          '- **Vegetables and fruits:** fresh, frozen, or canned without added sugar or much salt, in a variety of colors',
          '- **Protein foods:** beans, lentils, eggs, fish and seafood, poultry, meat, nuts, and seeds',
          '- **Dairy:** such as milk, yogurt, and cheese without added sugar, or fortified alternatives',
          '- **Whole grains:** such as oats, brown rice, and whole-wheat bread, in place of refined grains',
          '',
          'Choose water or other unsweetened drinks with meals and snacks.',
        ),
      },
      {
        heading: 'Foods and nutrients to limit',
        body: md(
          '- **Highly processed foods and sugary drinks:** sodas, fruit drinks, energy drinks, sweets, and many packaged snacks.',
          '- **Added sugars:** the new guidelines say added sugars are not recommended. On food labels, the Daily Value for added sugars is 50 grams, based on 2,000 calories a day. For most Americans, the biggest sources are sugary drinks, baked goods, desserts, and sweets.',
          '- **Sodium:** less than **2,300 mg a day** (about 1 teaspoon of salt) for ages 14 and up. The average American gets about 3,400 mg.',
          '- **Saturated fat:** the guidelines still advise keeping it under 10% of daily calories.',
          '- **Alcohol:** if you drink, less is better for your health. Some people should not drink at all, including anyone who is pregnant or taking medicines that interact with alcohol.',
        ),
      },
      {
        heading: 'How to read a Nutrition Facts label',
        body: md(
          '1. **Check the serving size** and the servings per container. Every number on the label is for one serving. If you eat two servings, double them.',
          '2. **Look at the calories** per serving.',
          '3. **Use the % Daily Value (%DV):** 5% or less of a nutrient is **low**, and 20% or more is **high**.',
          '4. **Aim low** for saturated fat, sodium, and added sugars.',
          '5. **Aim high** for fiber, vitamin D, calcium, iron, and potassium.',
          '6. **Compare similar products** side by side and pick the better one.',
          '',
          'The %DV is based on 2,000 calories a day, which is a general guide. Your needs depend on your age, sex, size, and activity level.',
        ),
      },
      {
        heading: 'Cut sodium without losing flavor',
        body: md(
          "More than 70% of the sodium Americans eat comes from packaged and prepared foods, not the salt shaker. FDA's tips:",
          '',
          '- **Cook at home more often**, so you control the salt.',
          '- **Flavor with herbs, spices, garlic, citrus, or vinegar** instead of salt.',
          '- **Choose fresh meat, poultry, and seafood** over processed meats like deli meat, bacon, and sausage.',
          '- **Rinse canned beans and vegetables** to wash off some sodium.',
          '- **Compare labels** for soups, breads, sauces, and frozen meals, which can be surprisingly high.',
          '- **When eating out**, ask for lower-sodium options or sauces and dressings on the side.',
        ),
      },
      {
        heading: 'Eating well on a budget',
        body: md(
          "Healthy eating doesn't have to be expensive:",
          '',
          '- **Frozen and canned produce** is nutritious and lasts longer. Look for no-salt-added and no-sugar-added options.',
          '- **Beans, lentils, eggs, and oats** are low-cost sources of protein and fiber.',
          '- **Plan meals** for the week, shop with a list, and use leftovers.',
          '- **Buy fruits and vegetables in season** and compare unit prices, including store brands.',
          '',
          'If money for food is tight, federal programs like SNAP and WIC may help. A clinician, social worker, or local food bank can help you apply. If you have a condition like diabetes or kidney disease, ask whether your plan covers visits with a registered dietitian.',
        ),
      },
    ],
    keyTakeaways: [
      'Build meals mostly from whole or minimally processed foods: vegetables, fruits, protein foods, dairy, and whole grains.',
      'Keep sodium under 2,300 mg a day. Most of it comes from packaged and restaurant foods.',
      'Cut back on added sugars, especially sugary drinks.',
      'On a Nutrition Facts label, 5% DV or less is low and 20% DV or more is high.',
    ],
    quiz: [
      {
        question: 'A soup label lists sodium at 22% Daily Value per serving. That is:',
        options: ['Low', 'High', 'Moderate', 'Not meaningful'],
        answerIndex: 1,
        explanation:
          'FDA says 20% DV or more of a nutrient per serving is high, and 5% DV or less is low. Also check how many servings you actually eat.',
      },
      {
        question: 'Where does most of the sodium in the typical American diet come from?',
        options: [
          'Packaged and restaurant foods',
          'The salt shaker at home',
          'Fresh vegetables',
          'Tap water',
        ],
        answerIndex: 0,
        explanation:
          'More than 70% of sodium comes from packaged and prepared foods, so reading labels and cooking at home make a big difference.',
      },
      {
        question: 'What are the main sources of added sugars for most Americans?',
        options: [
          'Fresh fruit',
          'Plain milk',
          'Sugary drinks, baked goods, desserts, and sweets',
          'Vegetables',
        ],
        answerIndex: 2,
        explanation:
          'The natural sugars in fruit and plain milk are not added sugars. Sugary drinks and sweets are the biggest sources of added sugar.',
      },
    ],
    sources: [
      {
        title: 'Eat Real Food: Dietary Guidelines for Americans, 2025–2030',
        publisher: 'USDA & HHS',
        url: 'https://realfood.gov/',
      },
      {
        title: 'How to Understand and Use the Nutrition Facts Label',
        publisher: 'FDA',
        url: 'https://www.fda.gov/food/nutrition-facts-label/how-understand-and-use-nutrition-facts-label',
      },
      {
        title: 'Sodium in Your Diet',
        publisher: 'FDA',
        url: 'https://www.fda.gov/food/nutrition-education-resources-materials/sodium-your-diet',
      },
      {
        title: 'Added Sugars on the Nutrition Facts Label',
        publisher: 'FDA',
        url: 'https://www.fda.gov/food/nutrition-facts-label/added-sugars-nutrition-facts-label',
      },
      {
        title: 'Nutrition',
        publisher: 'NIH MedlinePlus',
        url: 'https://medlineplus.gov/nutrition.html',
      },
    ],
    askBrianPrompts: [
      'What should I eat to help lower my blood pressure?',
      'How do I read a Nutrition Facts label if I have diabetes?',
      'What are some healthy snacks with little added sugar?',
    ],
    tags: ['nutrition', 'healthy eating', 'diet', 'sodium', 'salt', 'added sugar', 'nutrition facts label', 'processed food', 'dietary guidelines', 'budget meals'],
  },

  // ───────────────────────────── 6. Stress & mental well-being ─────────────────────────────
  {
    id: 'stress-mental-wellbeing',
    categoryId: 'wellness',
    title: 'Stress and Mental Well-Being',
    summary:
      'What stress does to your body and mind, everyday ways to cope, and the signs that it is time to get support.',
    readMinutes: 3,
    level: 'Basics',
    icon: 'flower-outline',
    callout: {
      kind: 'emergency',
      text: "If you're thinking about suicide or feel you can't stay safe, call or text 988 (Suicide & Crisis Lifeline) or chat at 988lifeline.org, any time, day or night. If someone is in immediate danger, call 911.",
    },
    sections: [
      {
        heading: 'What stress is',
        body: md(
          'Stress is your body\'s physical and mental response to a demand or challenge, like a deadline, money worries, caring for a loved one, or an illness. In short bursts, stress can help you focus and act.',
          '',
          'When stress goes on for a long time, it can wear you down. NIMH explains the difference between stress and anxiety this way: **stress** is usually a response to an outside cause and eases once the situation passes, while **anxiety** can continue even when there is no clear threat. Both are normal in small doses, but either one can become a problem when it starts to get in the way of daily life.',
        ),
      },
      {
        heading: 'How long-term stress shows up',
        body: md(
          'Stress can affect your feelings, body, and habits:',
          '',
          '- Feeling worried, angry, sad, numb, or overwhelmed',
          '- Headaches, tight muscles, or an upset stomach',
          '- Trouble sleeping or concentrating',
          '- Changes in appetite',
          '- Drinking more alcohol, smoking, or using other substances to cope',
          '',
          'According to CDC, long-lasting stress can also make existing health problems worse. That is one more reason to take it seriously and find healthy ways to manage it.',
        ),
      },
      {
        heading: 'Everyday ways to cope',
        body: md(
          '- **Move your body.** Just 30 minutes of walking a day can boost your mood.',
          '- **Protect your sleep** with a regular schedule and 7 or more hours a night.',
          '- **Eat regular, balanced meals**, drink water, and limit caffeine and alcohol.',
          '- **Relax on purpose** with slow breathing, meditation, stretching, or journaling.',
          "- **Set priorities.** Decide what must get done now, what can wait, and when it's OK to say no.",
          "- **Take breaks from the news and social media** if they're upsetting you.",
          '- **Connect with people you trust**, or with a community or faith group.',
          '- **Notice the good.** Writing down a few things you are grateful for each day can help.',
        ),
      },
      {
        heading: 'A 2-minute reset',
        body: md(
          'When stress spikes, try this simple breathing exercise:',
          '',
          '1. Sit comfortably with both feet on the floor, and relax your shoulders.',
          '2. Breathe in slowly through your nose for a count of 4.',
          '3. Breathe out slowly through your mouth for a count of 6.',
          '4. Repeat for 1 to 2 minutes, letting your breath settle.',
          '5. Then pick one small next step you can take on the problem, and write it down.',
          '',
          'Slow breathing will not solve the problem, but it can calm your body enough to think clearly.',
        ),
      },
      {
        heading: 'When to get support',
        body: md(
          'NIMH suggests reaching out to a health professional if you have signs like these for **2 weeks or longer**:',
          '',
          '- Trouble sleeping, or changes in appetite or weight',
          '- Struggling to get out of bed because of your mood',
          '- Trouble concentrating',
          '- Losing interest in things you usually enjoy',
          '- Being unable to do your usual daily tasks',
          '',
          "Also reach out if you're relying on alcohol or drugs to cope. Start with your primary care clinician, a therapist, or your employer's assistance program if you have one. SAMHSA's National Helpline (1-800-662-4357) offers free, confidential referrals 24/7.",
        ),
      },
    ],
    keyTakeaways: [
      'Stress is a normal response, but long-lasting stress can affect your sleep, mood, and physical health.',
      'Regular activity, steady sleep, relaxation techniques, and staying connected all help.',
      'Get support if problems last 2 weeks or more or get in the way of daily life.',
      'In a crisis, call or text 988. If someone is in immediate danger, call 911.',
    ],
    quiz: [
      {
        question: 'How does NIMH describe the difference between stress and anxiety?',
        options: [
          'Stress usually responds to an outside cause and eases when it passes. Anxiety can continue without a clear threat.',
          'They are exactly the same thing',
          'Anxiety always goes away faster than stress',
          'Stress is always a mental illness',
        ],
        answerIndex: 0,
        explanation:
          'Stress is usually tied to an outside situation, while anxiety can persist even without an obvious trigger. Either can become a problem if it disrupts daily life.',
      },
      {
        question: 'Which of these is a healthy way to cope with stress?',
        options: [
          'Drinking more alcohol to relax',
          'Regular physical activity',
          'Cutting back on sleep to get more done',
          'Avoiding friends and family',
        ],
        answerIndex: 1,
        explanation:
          'Physical activity, sleep, relaxation techniques, and social connection all help. Alcohol and isolation tend to make stress worse over time.',
      },
      {
        question: 'When should you reach out to a health professional about stress or low mood?',
        options: [
          'Only if you are in a crisis',
          'Never, because stress always goes away on its own',
          'When signs like trouble sleeping or losing interest in things last 2 weeks or more',
          'Only after it has lasted a full year',
        ],
        answerIndex: 2,
        explanation:
          'NIMH suggests getting help when symptoms last 2 weeks or longer or make it hard to function. You can reach out sooner, too.',
      },
    ],
    sources: [
      {
        title: "I'm So Stressed Out! Fact Sheet",
        publisher: 'National Institute of Mental Health (NIMH)',
        url: 'https://www.nimh.nih.gov/health/publications/so-stressed-out-fact-sheet',
      },
      {
        title: 'Caring for Your Mental Health',
        publisher: 'National Institute of Mental Health (NIMH)',
        url: 'https://www.nimh.nih.gov/health/topics/caring-for-your-mental-health',
      },
      {
        title: 'Managing Stress',
        publisher: 'CDC',
        url: 'https://www.cdc.gov/mental-health/living-with/index.html',
      },
      {
        title: '988 Suicide & Crisis Lifeline',
        publisher: '988 Lifeline (SAMHSA)',
        url: 'https://988lifeline.org/',
      },
    ],
    askBrianPrompts: [
      'What are some quick ways to calm down when I feel overwhelmed?',
      'How can stress affect my blood pressure?',
      'How do I find a therapist who takes my insurance?',
    ],
    tags: ['stress', 'mental health', 'well-being', 'coping', 'relaxation', 'breathing exercise', 'burnout', 'anxiety', '988', 'self-care'],
  },

  // ───────────────────────────── 7. Quitting smoking & vaping ─────────────────────────────
  {
    id: 'quit-smoking-vaping',
    categoryId: 'wellness',
    title: 'Quitting Smoking and Vaping',
    summary:
      'Why quitting helps at any age, the FDA-approved medicines and free coaching that improve your chances, and how to build a quit plan.',
    readMinutes: 4,
    level: 'Basics',
    icon: 'ban-outline',
    callout: {
      kind: 'tip',
      text: 'Free help is available. Call 1-800-QUIT-NOW (1-800-784-8669) to talk with a quit coach and make a plan.',
    },
    sections: [
      {
        heading: 'Quitting helps at any age',
        body: md(
          'Smoking harms nearly every organ in the body and causes heart disease, stroke, lung disease, and many cancers. Quitting lowers those risks, and it is never too late.',
          '',
          '- Within hours to weeks, your heart rate and blood pressure drop, carbon monoxide levels in your blood fall, and circulation improves.',
          '- According to NCI, people who quit before age 40 lower their chance of dying early from smoking-related disease by about 90%.',
          '- Quitting at 25 to 34 adds about 10 years of life, at 35 to 44 about 9 years, at 45 to 54 about 6 years, and at 55 to 64 about 4 years, compared with continuing to smoke.',
        ),
      },
      {
        heading: 'Medicines that help',
        body: md(
          'CDC lists seven FDA-approved quit-smoking medicines:',
          '',
          '- **Nicotine replacement you can buy over the counter:** patch, gum, and lozenge',
          '- **Nicotine replacement by prescription:** nasal spray and inhaler',
          '- **Prescription pills:** varenicline and bupropion',
          '',
          'CDC notes that combining a long-acting patch with a fast-acting form, like gum or a lozenge, works better than one alone, and that **using counseling and medicine together gives you the best chance of quitting for good.**',
          '',
          'Talk with your clinician or pharmacist about which option fits you, especially if you are pregnant, have heart disease, or take other medicines. Many health plans cover quit-smoking medicines and counseling, so ask yours.',
        ),
      },
      {
        heading: 'Free coaching and support',
        body: md(
          '- **1-800-QUIT-NOW (1-800-784-8669)** connects you with free, confidential coaching from your state quitline. What else is offered, such as free nicotine patches, varies by state.',
          '- **Smokefree.gov**, from the National Cancer Institute, has free quit plans, text-message programs, and apps, including programs for quitting vaping.',
          '- **NCI Smoking Quitline: 1-877-44U-QUIT (1-877-448-7848)** offers one-on-one counseling, printed information, and referrals.',
          '',
          'Support from friends, family, and your clinician makes a real difference. Tell people you are quitting and how they can help.',
        ),
      },
      {
        heading: 'Make a quit plan',
        body: md(
          '1. **Pick a quit date** in the next couple of weeks, and put it on your calendar.',
          '2. **Know your triggers**, like coffee, alcohol, stress, driving, or being around other smokers, and plan what you will do instead.',
          '3. **Get your medicine ready** before quit day, so you can start on time.',
          '4. **Clear it out:** get rid of cigarettes, vapes, lighters, and ashtrays at home, at work, and in your car.',
          '5. **Plan for cravings.** They come and go. Take a walk, drink water, chew sugar-free gum, or text a friend until the urge passes.',
          '6. **Line up support**, such as a quitline coach, a text program, or a friend you can call.',
        ),
      },
      {
        heading: 'About vaping and e-cigarettes',
        body: md(
          'Most e-cigarettes contain nicotine, which is highly addictive. CDC says:',
          '',
          '- **No e-cigarette has been approved by FDA** as a quit-smoking aid.',
          "- E-cigarettes are not safe for young people, young adults, or pregnant people, or for adults who don't already use tobacco.",
          '- There are no safe tobacco products.',
          '',
          'If you are thinking about using e-cigarettes to quit smoking, talk with your clinician about FDA-approved medicines first. Using both cigarettes and e-cigarettes does not give you the health benefits of quitting smoking completely.',
          '',
          'If you vape and want to stop, the same kinds of support, like coaching, text programs, and a quit plan, can help.',
        ),
      },
      {
        heading: 'If you slip',
        body: md(
          'Most people try to quit several times before they quit for good. A slip is not a failure. It is information you can use.',
          '',
          '- Think about what triggered the slip, and plan a different response next time.',
          "- Don't give up your quit plan. Get back on track right away.",
          '- Check that you are using your medicine correctly and for long enough. Your pharmacist can help.',
          '',
          'Withdrawal symptoms like irritability, restlessness, trouble concentrating, and cravings are usually strongest in the first days and weeks, then fade over time.',
        ),
      },
    ],
    keyTakeaways: [
      'Quitting at any age adds years to your life. Quitting before 40 lowers the extra risk of dying early by about 90%.',
      'Counseling and medicine together give you the best chance of quitting for good.',
      'Call 1-800-QUIT-NOW for free coaching, or visit Smokefree.gov.',
      'E-cigarettes are not FDA-approved quit aids, and a slip is a reason to try again, not to give up.',
    ],
    quiz: [
      {
        question: 'What gives you the best chance of quitting smoking for good?',
        options: [
          'Willpower alone',
          'Switching to light cigarettes',
          'Cutting down slowly without a plan',
          'Using counseling and medicine together',
        ],
        answerIndex: 3,
        explanation:
          'CDC says counseling plus medicine gives you the best chance. Light cigarettes are not safer.',
      },
      {
        question: 'Which number connects you to free quit-smoking coaching from your state quitline?',
        options: ['988', '1-800-QUIT-NOW', '911', '1-800-222-1222'],
        answerIndex: 1,
        explanation:
          '1-800-QUIT-NOW (1-800-784-8669) connects you to your state quitline. 988 is for mental-health crises, and 1-800-222-1222 is Poison Help.',
      },
      {
        question: 'Which of these is an FDA-approved quit-smoking aid?',
        options: ['E-cigarettes', 'Herbal cigarettes', 'The nicotine patch', 'Hookah'],
        answerIndex: 2,
        explanation:
          'The nicotine patch is one of several FDA-approved quit-smoking medicines. No e-cigarette has been approved by FDA as a quit aid.',
      },
    ],
    sources: [
      {
        title: 'How to Quit Smoking',
        publisher: 'CDC',
        url: 'https://www.cdc.gov/tobacco/about/how-to-quit.html',
      },
      {
        title: 'Harms of Cigarette Smoking and Health Benefits of Quitting',
        publisher: 'National Cancer Institute (NCI)',
        url: 'https://www.cancer.gov/about-cancer/causes-prevention/risk/tobacco/cessation-fact-sheet',
      },
      {
        title: 'Want to Quit Smoking? FDA-Approved and FDA-Cleared Cessation Products Can Help',
        publisher: 'FDA',
        url: 'https://www.fda.gov/consumers/consumer-updates/want-quit-smoking-fda-approved-and-fda-cleared-cessation-products-can-help',
      },
      {
        title: 'E-Cigarettes (Vapes)',
        publisher: 'CDC',
        url: 'https://www.cdc.gov/tobacco/e-cigarettes/index.html',
      },
      {
        title: 'Quit Smoking or Vaping Today – We Can Help',
        publisher: 'Smokefree.gov (NCI)',
        url: 'https://smokefree.gov/',
      },
    ],
    askBrianPrompts: [
      'Which quit-smoking medicine would be safe with my prescriptions?',
      'How can I handle cravings during my first week without cigarettes?',
      'Does my insurance cover nicotine patches or varenicline?',
    ],
    tags: ['quit smoking', 'smoking', 'vaping', 'e-cigarettes', 'nicotine', 'tobacco', 'nicotine patch', 'varenicline', 'quitline', 'cravings'],
  },
];
