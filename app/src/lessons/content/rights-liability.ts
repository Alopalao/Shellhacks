import type { Lesson } from '../types';

// Content for category 'rights-liability'. See src/lessons/types.ts for the format.
// US-centric general information — every lesson says so and none of it is legal advice.
// Every source URL was checked to resolve and to match the topic.

/** Joins lines with "\n" so markdown-lite bodies stay readable here ("" = blank line). */
const md = (...lines: string[]): string => lines.join('\n');

export const lessons: Lesson[] = [
  // ───────────────────────── Patient rights & informed consent ─────────────────────────
  {
    id: 'patient-rights-informed-consent',
    categoryId: 'rights-liability',
    title: 'Your Rights as a Patient & Informed Consent',
    summary:
      "What you can expect from doctors and hospitals in the US: respect, clear information, language help, and the final say over your own treatment.",
    readMinutes: 5,
    level: 'Basics',
    icon: 'hand-left-outline',
    callout: {
      kind: 'tip',
      text: "This lesson describes common patient rights under US federal law. Many states and hospitals add more protections. It is general information, not legal advice.",
    },
    sections: [
      {
        heading: 'Rights you have almost everywhere',
        body: md(
          "In the US, some patient rights come from federal law and others from state law or a hospital's own policies. The details vary, but these basics apply in most places you get care:",
          '',
          '- **Respect and fair treatment.** You should not be treated differently because of your race, color, national origin, sex, age, or disability.',
          '- **Clear information.** You can ask what is wrong, what your options are, and what things will cost.',
          '- **Privacy.** Your health information is protected, and you can get a copy of your records.',
          '- **Informed consent.** You decide about tests and treatments after they are explained to you.',
          '- **The right to say no.** You can refuse or stop a treatment, even one your doctor recommends.',
          '- **A way to raise concerns.** Hospitals must have a process for complaints.',
          '',
          "Hospitals usually give you a written notice of your rights when you are admitted. Ask for a copy if you don't get one.",
        ),
      },
      {
        heading: 'What informed consent means',
        body: md(
          'Informed consent is a conversation, not just a signature. Before a test, procedure, or treatment, your care team should explain in words you understand:',
          '',
          '- What your health problem is and why they recommend this treatment',
          '- What will happen during it and what recovery looks like',
          '- The main risks and how likely they are',
          '- The expected benefits and how well it tends to work',
          '- Other options, including waiting or doing nothing',
          '',
          "For surgery, many procedures, cancer treatment, and some tests, you'll usually be asked to sign a consent form. Read it before you sign. If something on the form doesn't match what you were told, stop and ask. Signing doesn't lock you in: you have the right to change your mind later.",
        ),
      },
      {
        heading: 'Questions that help you decide',
        body: md(
          "It's normal to feel rushed or nervous. These questions slow things down and help you understand your choices:",
          '',
          '1. What are the benefits of this for me?',
          '2. What are the risks, and which ones are most common?',
          '3. What are my other options?',
          '4. What happens if I wait or do nothing?',
          '5. How much will it cost, and will my insurance cover it?',
          '',
          'Try the “teach-back” method: repeat the plan in your own words and ask, “Did I get that right?” Bring a friend or family member to listen and take notes. Before a planned (non-emergency) procedure, you can also ask for written information, time to think, or a second opinion.',
        ),
      },
      {
        heading: 'Your right to refuse, and when someone else decides',
        body: md(
          "Adults who can understand their situation and their choices have the right to refuse any treatment, even if the doctor disagrees. The team should explain what could happen if you refuse, and they may ask you to sign a form saying you understood. Refusing one treatment doesn't mean you give up your right to other care.",
          '',
          "Sometimes a person can't make decisions, for example because of a coma, a severe stroke, or advanced dementia. Then a substitute decision-maker steps in. That's usually the health care proxy named in an advance directive or, if there isn't one, a family member chosen according to state law.",
          '',
          "In a true emergency, when waiting would be dangerous and you can't respond, doctors can give needed care without your consent.",
        ),
      },
      {
        heading: 'Language help and accessibility',
        body: md(
          "You can't make an informed choice if you can't understand what's being said. Under federal civil rights law, health programs that receive federal funding, which includes most hospitals, must offer free language help to people with limited English. That can be a qualified interpreter in person, by phone, or by video, and translated written materials. They must also communicate effectively with people with disabilities, for example with sign language interpreters or large-print materials.",
          '',
          '- Ask for an interpreter when you book the appointment and again when you arrive.',
          "- You shouldn't be required to bring your own interpreter, and children shouldn't be asked to interpret except in an emergency.",
          '- Ask for important papers, like consent forms and discharge instructions, in your language.',
        ),
      },
      {
        heading: 'Emergency care, even if you cannot pay',
        body: md(
          'A federal law called EMTALA protects you in an emergency. Hospitals that take Medicare and have an emergency department must:',
          '',
          '- Give a medical screening exam to anyone who comes asking for emergency care, including people in labor',
          "- Provide treatment to stabilize an emergency condition, or arrange an appropriate transfer if they can't",
          '- Do this no matter whether you have insurance or can pay',
          '',
          "You may still get a bill later, but you can't be turned away from emergency screening because you can't pay. If you feel your rights aren't being respected at a hospital, ask for the patient advocate (sometimes called patient relations).",
        ),
      },
    ],
    keyTakeaways: [
      'Informed consent means your care team explains benefits, risks, and options, including doing nothing, before you decide.',
      'Adults who can understand their choices can refuse or stop treatment and can change their minds.',
      'Most hospitals and clinics must provide a free, qualified interpreter if you need one.',
      "Hospitals with emergency departments that take Medicare must screen and stabilize you in an emergency, even if you can't pay.",
      "Ask for the patient advocate if you feel your rights aren't being respected.",
    ],
    quiz: [
      {
        question: 'Which of these is part of true informed consent?',
        options: [
          'Signing the form as quickly as possible',
          'Hearing the benefits, risks, and other options, including doing nothing',
          'Letting the doctor decide without asking questions',
          'Being told only about the risks',
        ],
        answerIndex: 1,
        explanation:
          'Informed consent is a conversation. You should learn about the benefits, risks, and alternatives, including waiting or doing nothing, before you agree.',
      },
      {
        question: 'You need an interpreter at a hospital. What should happen?',
        options: [
          'You must bring a family member to interpret',
          'Your 10-year-old child can interpret for you',
          'The hospital should provide a qualified interpreter at no cost to you',
          'You will be charged a fee for the interpreter',
        ],
        answerIndex: 2,
        explanation:
          "Health programs that receive federal funds, including most hospitals, must provide free language help and shouldn't rely on children to interpret except in an emergency.",
      },
      {
        question: 'You signed a consent form for a planned procedure but now have doubts. What can you do?',
        options: [
          'Nothing, because signing locks you in',
          'Tell your care team you have questions or want to stop; you can change your mind',
          'Leave the hospital without telling anyone',
          'You can only change your mind with a lawyer',
        ],
        answerIndex: 1,
        explanation:
          'Consent can be withdrawn. Tell your care team about your doubts so they can answer your questions or stop the plan.',
      },
    ],
    sources: [
      { title: 'Patient Rights', publisher: 'NIH MedlinePlus', url: 'https://medlineplus.gov/patientrights.html' },
      {
        title: 'Informed consent - adults',
        publisher: 'NIH MedlinePlus',
        url: 'https://medlineplus.gov/ency/patientinstructions/000445.htm',
      },
      {
        title: 'Emergency Medical Treatment & Labor Act (EMTALA)',
        publisher: 'CMS',
        url: 'https://www.cms.gov/medicare/regulations-guidance/legislation/emergency-medical-treatment-labor-act',
      },
      {
        title: '45 CFR 92.201: Meaningful access for individuals with limited English proficiency',
        publisher: 'eCFR (National Archives)',
        url: 'https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-A/part-92/subpart-C/section-92.201',
      },
    ],
    askBrianPrompts: [
      'What questions should I ask before agreeing to a procedure?',
      'Can you explain the risks my doctor mentioned in plain language?',
      'How do I ask for an interpreter at my next appointment?',
    ],
    tags: [
      'patient rights',
      'informed consent',
      'consent form',
      'refuse treatment',
      'interpreter',
      'language access',
      'EMTALA',
      'emergency care',
      'discrimination',
      'teach-back',
    ],
  },

  // ───────────────────────── Privacy & HIPAA ─────────────────────────
  {
    id: 'health-privacy-hipaa',
    categoryId: 'rights-liability',
    title: 'Health Privacy & HIPAA: Who Can See Your Information',
    summary:
      "What HIPAA protects, who has to follow it (and who doesn't), your privacy rights, and how to file a complaint.",
    readMinutes: 4,
    level: 'Basics',
    icon: 'lock-closed-outline',
    callout: {
      kind: 'tip',
      text: "Health apps, fitness trackers, and most websites usually aren't covered by HIPAA. Check an app's privacy settings and policy before you enter health details. HIPAA is a US federal law; some states have stronger privacy laws.",
    },
    sections: [
      {
        heading: 'What HIPAA does',
        body: md(
          'HIPAA is a federal law that sets national rules for protecting health information. Its Privacy Rule controls who can see and share details about your health, like diagnoses, test results, prescriptions, and bills, and gives you rights over that information.',
          '',
          "HIPAA doesn't stop your care team from doing their jobs. Without your written permission, doctors, hospitals, pharmacies, and health plans can generally use and share your information to:",
          '',
          '- Treat you and coordinate care with your other providers',
          '- Get paid for your care',
          '- Run their operations, like quality checks',
          '',
          'For most other purposes, such as marketing or selling your information, they need your written permission. There are some legal exceptions, such as certain public health reports and court orders.',
        ),
      },
      {
        heading: "Who has to follow HIPAA, and who doesn't",
        body: md(
          'HIPAA applies to “covered entities”: most doctors, clinics, hospitals, pharmacies, dentists, psychologists, nursing homes, and health insurance plans. It also applies to companies that handle health data for them, such as billing services.',
          '',
          'Many organizations that hold health information are **not** covered by HIPAA, including:',
          '',
          '- Most health, fitness, diet, and period-tracking apps and devices you choose on your own',
          '- Your employer (your employer-sponsored health plan is covered, though)',
          '- Life insurance companies',
          "- Auto insurance and workers' compensation insurers",
          '- Social media and most websites',
          '',
          'Other laws may still apply. For example, the Federal Trade Commission can act when companies mislead people about how they use health data. But protections are often weaker, so think before you share.',
        ),
      },
      {
        heading: 'Your privacy rights',
        body: md(
          'Under HIPAA, you have the right to:',
          '',
          '- **Get a copy of your records.** Providers and plans must respond within 30 days, with one possible 30-day extension if they explain the delay in writing. They may charge a reasonable, cost-based fee.',
          '- **Ask for corrections** if something in your record is wrong or missing.',
          '- **Get a notice of privacy practices** explaining how your information is used.',
          '- **Get a list of certain disclosures,** showing who received your information for reasons other than treatment, payment, and operations.',
          '- **Ask for limits on sharing.** If you pay for a service in full out of pocket, you can ask the provider not to share it with your health plan, and they must agree.',
          '- **Ask for private communication,** such as calls to a different phone number or mail to another address.',
        ),
      },
      {
        heading: 'Family, friends, and caregivers',
        body: md(
          'Your providers can talk with family members or friends who are involved in your care or help pay for it, such as explaining discharge instructions to the person driving you home, unless you object. When you are able to, they should give you a chance to agree or say no.',
          '',
          "If you want someone to have full access, fill out your provider's authorization form or name them as your personal representative, for example through a health care power of attorney. Parents are usually the personal representatives for minor children, but state law can give teens privacy for some kinds of care.",
          '',
          "If you don't want a certain person to get your information, say so clearly and ask staff to note it in your record.",
        ),
      },
      {
        heading: 'If you think your privacy was violated',
        body: md(
          'Start by contacting the privacy officer at the clinic, hospital, pharmacy, or health plan. Their contact information is in the notice of privacy practices. Many problems get fixed quickly this way.',
          '',
          'You can also file a complaint with the US Department of Health and Human Services Office for Civil Rights (OCR):',
          '',
          '1. Write down what happened, when, and who was involved.',
          '2. File online or in writing within 180 days of when you learned about the problem. OCR can extend this deadline for good cause.',
          '3. Keep copies of everything you send.',
          '',
          "It's illegal for a provider or plan to retaliate against you for filing a complaint. HIPAA itself doesn't let you sue for money, but a lawyer can tell you whether your state's laws give you other options.",
        ),
      },
    ],
    keyTakeaways: [
      'HIPAA covers most doctors, hospitals, pharmacies, and health plans, but not most health apps, employers, or life insurers.',
      'You can get a copy of your records, generally within 30 days.',
      'Your care team can share information for treatment and billing without extra permission; most other uses need your OK.',
      "Complaints go to the provider's privacy officer or to the HHS Office for Civil Rights within 180 days.",
    ],
    quiz: [
      {
        question: 'Which of these is usually NOT covered by HIPAA?',
        options: ['Your hospital', 'Your pharmacy', 'A fitness app you downloaded on your own', 'Your health insurance plan'],
        answerIndex: 2,
        explanation:
          "HIPAA covers health care providers, health plans, and their business partners. Most consumer health and fitness apps aren't covered, so read their privacy policies.",
      },
      {
        question: 'How long does a provider generally have to respond to your request for a copy of your records?',
        options: ['24 hours', '30 days, with one possible 30-day extension', 'One year', "They don't have to respond"],
        answerIndex: 1,
        explanation:
          'Under HIPAA, providers and plans must act within 30 days. They can take up to 30 more days only if they tell you why in writing.',
      },
      {
        question:
          "You paid in full, out of pocket, for a visit and don't want your health plan to know about it. What can you do?",
        options: [
          'Nothing, because providers must always tell your plan',
          'Ask the provider not to share it with your plan; they must agree',
          'File a lawsuit first',
          'Ask the pharmacy to delete your records',
        ],
        answerIndex: 1,
        explanation:
          'When you pay in full out of pocket, HIPAA requires the provider to honor your request not to share that care with your health plan.',
      },
    ],
    sources: [
      {
        title: 'Your Rights Under HIPAA',
        publisher: 'HHS Office for Civil Rights',
        url: 'https://www.hhs.gov/hipaa/for-individuals/guidance-materials-for-consumers/index.html',
      },
      {
        title: 'Filing a Health Information Privacy Complaint',
        publisher: 'HHS Office for Civil Rights',
        url: 'https://www.hhs.gov/hipaa/filing-a-complaint/index.html',
      },
      {
        title: 'Does your health app protect your sensitive info?',
        publisher: 'Federal Trade Commission',
        url: 'https://consumer.ftc.gov/consumer-alerts/2021/01/does-your-health-app-protect-your-sensitive-info',
      },
      { title: 'Patient Rights', publisher: 'NIH MedlinePlus', url: 'https://medlineplus.gov/patientrights.html' },
    ],
    askBrianPrompts: [
      'Is my health app covered by HIPAA?',
      "How do I ask my doctor's office for a copy of my records?",
      'Can my doctor share my health information with my family?',
    ],
    tags: [
      'HIPAA',
      'privacy',
      'medical records',
      'health apps',
      'confidentiality',
      'Office for Civil Rights',
      'notice of privacy practices',
      'personal representative',
    ],
  },

  // ───────────────────────── Malpractice basics ─────────────────────────
  {
    id: 'medical-malpractice-basics',
    categoryId: 'rights-liability',
    title: 'Medical Malpractice Basics',
    summary:
      "What counts as malpractice (and what doesn't), the four things a claim must show, and practical steps if you think your care went wrong.",
    readMinutes: 4,
    level: 'Intermediate',
    icon: 'scale-outline',
    callout: {
      kind: 'warning',
      text: 'This is general information about US law, not legal advice. Malpractice rules and filing deadlines vary by state and can be short. If you think you have a claim, talk with a lawyer licensed in your state soon.',
    },
    sections: [
      {
        heading: "What malpractice is, and what it isn't",
        body: md(
          'Medical malpractice happens when a health care professional or facility gives care that falls below the accepted standard, meaning what a reasonably careful professional with similar training would do in the same situation, and that failure injures the patient.',
          '',
          "A bad outcome is not automatically malpractice. Every treatment has risks, and complications can happen even with excellent care. A known side effect that was explained to you, or a treatment that simply didn't work, usually isn't malpractice.",
          '',
          'Examples that may be malpractice include:',
          '',
          '- A missed or badly delayed diagnosis that a careful doctor would have caught',
          '- Surgery on the wrong body part, or an object left inside the body',
          '- A medication error, like the wrong drug or a dangerous dose',
          '- Treating you without your informed consent',
        ),
      },
      {
        heading: 'The four things a claim must show',
        body: md(
          'In most states, a malpractice case has to prove four elements:',
          '',
          '1. **Duty.** There was a patient-provider relationship, so the provider owed you proper care.',
          '2. **Breach.** The provider fell short of the standard of care.',
          '3. **Causation.** That failure actually caused your injury, rather than your illness or a known, unavoidable risk.',
          '4. **Damages.** You were harmed in ways the law recognizes, such as extra medical bills, lost wages, pain, or disability.',
          '',
          "All four are needed. A clear mistake that caused no harm usually isn't a case, and serious harm that no one could have prevented isn't either. Because the standard of care is technical, most cases need medical experts to explain what should have happened.",
        ),
      },
      {
        heading: 'Deadlines matter',
        body: md(
          'Every state sets a deadline, called a statute of limitations, for filing a malpractice lawsuit. It is often only a few years and can be as short as one year. Depending on the state, the clock may start on the date of treatment or when you discovered (or should have discovered) the injury. Special rules often apply to children, and some states have a final cutoff no matter when you found out.',
          '',
          'Claims against government-run facilities, such as some public hospitals, can require a formal written notice within months.',
          '',
          "Many states also require extra steps, like a medical expert reviewing the case before it is filed, and some limit how much money can be awarded for certain damages. Talk to a lawyer early, because waiting too long can end a valid claim.",
        ),
      },
      {
        heading: 'If you think something went wrong',
        body: md(
          'First, take care of your health. Get the treatment you need now, even if that means seeing a different doctor for a second opinion. Then protect the facts:',
          '',
          '1. **Request copies of your medical records.** You have a right to them.',
          '2. **Write a timeline** while it is fresh: dates, names, what was said, and your symptoms.',
          '3. **Keep every bill, receipt, and insurance statement,** plus records of missed work.',
          '4. **Save evidence,** like photos of injuries, medicine bottles, and discharge papers.',
          '5. **Avoid posting details on social media.**',
          '',
          "You can also ask to speak with the hospital's patient safety or risk management team. Some hospitals have programs that openly review what happened, apologize, and sometimes offer compensation without a lawsuit.",
        ),
      },
      {
        heading: 'Complaints vs. lawsuits',
        body: md(
          'There are two different paths, and you can use both:',
          '',
          "- **A complaint** to your state medical board (or the nursing, pharmacy, or other licensing board) asks regulators to review a professional's conduct. Boards can investigate and discipline, but they don't get you money. Problems with a hospital or other facility can go to your state health department.",
          '- **A claim or lawsuit** asks for money to cover your losses. It is usually handled by a malpractice lawyer.',
          '',
          'Many malpractice lawyers offer a free first meeting and work on contingency, meaning they are paid a percentage only if you win or settle. Ask up front about fees and costs, how strong your case seems, and how long it may take. Your state or local bar association can refer you to licensed lawyers.',
        ),
      },
    ],
    keyTakeaways: [
      'Malpractice means care fell below the accepted standard and that failure caused harm, not just that the outcome was bad.',
      'A claim must show duty, breach, causation, and damages.',
      'Filing deadlines vary by state and can be as short as one year, so get advice early.',
      'Get the care you need first, then request your records and write a timeline.',
      'A licensing board complaint can lead to discipline; only a claim or lawsuit can lead to compensation.',
    ],
    quiz: [
      {
        question: 'Which situation is most likely to be malpractice?',
        options: [
          'A known side effect that was explained to you before surgery',
          'A treatment that was done correctly but did not work',
          'A surgeon operating on the wrong knee',
          'Feeling sore after a procedure',
        ],
        answerIndex: 2,
        explanation:
          'Wrong-site surgery falls below the standard of care. Known risks, expected soreness, and treatments that fail despite good care are usually not malpractice.',
      },
      {
        question: 'What four elements does a malpractice claim usually have to prove?',
        options: [
          'Duty, breach, causation, and damages',
          'Pain, anger, cost, and time',
          'Diagnosis, treatment, recovery, and billing',
          'Consent, privacy, access, and appeal',
        ],
        answerIndex: 0,
        explanation:
          'A claim must show the provider owed you care (duty), fell short (breach), caused your injury (causation), and that you were harmed (damages).',
      },
      {
        question: 'What does a complaint to a state medical board usually do?',
        options: [
          'Gets you paid for your injuries',
          'Asks regulators to review and possibly discipline the professional',
          'Automatically starts a lawsuit',
          'Cancels your medical bill',
        ],
        answerIndex: 1,
        explanation:
          "Licensing boards can investigate and discipline clinicians, but they don't award money. Compensation requires a separate claim or lawsuit.",
      },
    ],
    sources: [
      {
        title: 'Medical Malpractice (StatPearls)',
        publisher: 'NIH National Library of Medicine',
        url: 'https://www.ncbi.nlm.nih.gov/books/NBK470573/',
      },
      {
        title: 'Contact a State Medical Board',
        publisher: 'Federation of State Medical Boards',
        url: 'https://www.fsmb.org/contact-a-state-medical-board/',
      },
      { title: 'Patient Safety', publisher: 'NIH MedlinePlus', url: 'https://medlineplus.gov/patientsafety.html' },
    ],
    askBrianPrompts: [
      'What is the difference between a complication and a medical error?',
      'How do I request my medical records after a bad outcome?',
      'What questions should I ask a malpractice lawyer at a first meeting?',
    ],
    tags: [
      'malpractice',
      'medical error',
      'negligence',
      'standard of care',
      'statute of limitations',
      'lawsuit',
      'medical board',
      'patient safety',
    ],
  },

  // ───────────────────────── Advance directives ─────────────────────────
  {
    id: 'advance-directives-health-care-proxy',
    categoryId: 'rights-liability',
    title: 'Advance Directives & Choosing a Health Care Proxy',
    summary:
      "How to put your care wishes in writing and choose someone to speak for you if you can't, at any age.",
    readMinutes: 4,
    level: 'Basics',
    icon: 'reader-outline',
    callout: {
      kind: 'tip',
      text: "Advance directive laws and forms vary by state. You usually don't need a lawyer, and free state forms are widely available. This is general information, not legal advice.",
    },
    sections: [
      {
        heading: 'Why plan ahead, at any age',
        body: md(
          'A sudden accident, stroke, or serious illness can leave anyone unable to speak for themselves. Advance care planning means thinking about the care you would want in that situation, talking about it with the people close to you, and putting it in writing.',
          '',
          'People who plan ahead are more likely to get the care they want. Planning also spares loved ones from guessing under stress, and family members often guess wrong about what someone would want.',
          '',
          "If you have no advance directive and can't decide for yourself, your state's law decides who speaks for you, usually a spouse, adult child, or parent. An unmarried partner or close friend may be left out unless you name them.",
        ),
      },
      {
        heading: 'The two main documents',
        body: md(
          "Advance directives are legal documents that only take effect if you can't communicate your own decisions.",
          '',
          "- **Living will:** Describes which treatments you would or wouldn't want in certain situations, such as CPR, a breathing machine, tube feeding, or comfort-focused care at the end of life.",
          "- **Durable power of attorney for health care:** Names your health care proxy (also called an agent, representative, or surrogate), the person who makes medical decisions for you if you can't. This covers situations a living will can't predict.",
          '',
          'You can have one or both, and many state forms combine them.',
          '',
          "An advance directive is legally recognized, but it isn't a guarantee that every wish can be followed exactly. That's why talking with your proxy about your values matters as much as the paperwork.",
        ),
      },
      {
        heading: 'Medical orders for serious illness',
        body: md(
          'Some decisions work best as medical orders that emergency and hospital staff can act on right away. Talk with your clinician about these if you are seriously ill or frail:',
          '',
          '- **DNR (do not resuscitate):** No CPR if your heart or breathing stops. Without a DNR order, staff will attempt CPR. An out-of-hospital DNR tells paramedics your wishes.',
          '- **DNI (do not intubate):** No breathing tube or ventilator.',
          '- **POLST or MOLST:** A portable medical order form describing the treatments you want in an emergency. It is usually for people who are seriously ill or near the end of life.',
          '',
          'Names and forms differ by state. You can also record your wishes about organ and tissue donation.',
        ),
      },
      {
        heading: 'Choosing your health care proxy',
        body: md(
          "Pick someone you trust to follow your wishes, even if they would choose differently for themselves. Ask yourself:",
          '',
          '- Can I talk openly with this person about what I want?',
          '- Will they speak up for me if family or doctors disagree?',
          '- Do they live nearby, or would they travel to be with me?',
          '- Are they willing to take on this role?',
          '',
          "In most states a proxy must be at least 18 (19 in a few states). Many states don't allow your own health care provider or their employees to serve as your proxy. Consider naming a backup in case your first choice isn't available.",
          '',
          "Then have the conversation: what matters most to you, what you fear, and which treatments you would or wouldn't want.",
        ),
      },
      {
        heading: 'How to make it official',
        body: md(
          "1. **Get your state's form.** Free forms are available from your state attorney general or health department, your local Area Agency on Aging, hospitals, and national nonprofit groups. Veterans can get forms through the VA.",
          '2. **Complete and sign it** the way your state requires. Some states need witnesses, a notary, or both.',
          "3. **Share copies** with your proxy, your doctors, and close family. Keep the original somewhere easy to find, not locked away where no one can reach it in an emergency.",
          '4. **Review it every year** and after big life events, like a new diagnosis, marriage or divorce, or a move to another state.',
          '',
          "If you spend a lot of time in more than one state, consider completing each state's form. People with Medicare pay nothing to talk about advance care planning during their yearly wellness visit when their provider accepts Medicare assignment (agrees to take Medicare's approved amount as full payment).",
        ),
      },
    ],
    keyTakeaways: [
      'A living will records your treatment wishes; a durable power of attorney for health care names your proxy.',
      "Without a directive, your state's law decides who makes decisions for you.",
      'Choose a proxy who will honor your wishes, talk with them, and name a backup.',
      "Use your state's form, sign it as required, and give copies to your proxy and doctors.",
      'Review your documents every year and after major life changes.',
    ],
    quiz: [
      {
        question: 'What does a durable power of attorney for health care do?',
        options: [
          'Lets someone manage your bank account',
          "Names a person to make medical decisions for you if you can't",
          'Lists your current medicines',
          'Replaces your health insurance',
        ],
        answerIndex: 1,
        explanation:
          'It names your health care proxy, who makes medical decisions only when you are unable to make or communicate them yourself.',
      },
      {
        question: "If you don't have an advance directive and can't make decisions, who decides?",
        options: [
          'Your doctor always decides alone',
          'No one, so all treatment stops',
          "Someone chosen under your state's law, often a spouse or close relative",
          'Your employer',
        ],
        answerIndex: 2,
        explanation:
          'State law sets the order of who can decide, usually a spouse, adult child, or parent. Naming a proxy lets you choose instead.',
      },
      {
        question: 'Where should you keep your completed advance directive?',
        options: [
          'Hidden where no one can find it',
          'Somewhere easy to reach, with copies given to your proxy and doctors',
          "Only in a lawyer's office",
          'Nowhere; just tell one person',
        ],
        answerIndex: 1,
        explanation:
          'Your directive only helps if people can find it quickly. Give copies to your proxy and care team and keep the original accessible.',
      },
    ],
    sources: [
      {
        title: 'Advance Care Planning: Advance Directives for Health Care',
        publisher: 'National Institute on Aging (NIH)',
        url: 'https://www.nia.nih.gov/health/advance-care-planning/advance-care-planning-advance-directives-health-care',
      },
      {
        title: 'Choosing A Health Care Proxy',
        publisher: 'National Institute on Aging (NIH)',
        url: 'https://www.nia.nih.gov/health/advance-care-planning/choosing-health-care-proxy',
      },
      { title: 'Advance Directives', publisher: 'NIH MedlinePlus', url: 'https://medlineplus.gov/advancedirectives.html' },
      {
        title: 'Advance care planning coverage',
        publisher: 'Medicare.gov',
        url: 'https://www.medicare.gov/coverage/advance-care-planning',
      },
    ],
    askBrianPrompts: [
      'What should I talk about with my health care proxy?',
      'What is the difference between a living will and a POLST form?',
      'What does a DNR order mean in the hospital?',
    ],
    tags: [
      'advance directive',
      'living will',
      'health care proxy',
      'power of attorney',
      'DNR',
      'POLST',
      'end of life',
      'advance care planning',
    ],
  },

  // ───────────────────────── After an accident: who pays ─────────────────────────
  {
    id: 'accident-medical-bills-who-pays',
    categoryId: 'rights-liability',
    title: 'After an Accident: Who Pays Your Medical Bills?',
    summary:
      "How auto insurance, health insurance, workers' comp, and liability coverage fit together after an injury, and the records that protect you.",
    readMinutes: 5,
    level: 'Intermediate',
    icon: 'car-outline',
    callout: {
      kind: 'emergency',
      text: "If anyone is hurt, call 911 first. Get medical care right away and don't let worries about cost or blame delay treatment. Some injuries, like concussions and internal bleeding, may not cause symptoms at first.",
    },
    sections: [
      {
        heading: 'Care first, paperwork second',
        body: md(
          'After a crash, fall, or work injury, your health comes first. Get checked promptly, even if you feel okay. Adrenaline can hide pain, and injuries like whiplash or concussion can show up hours or days later. Prompt care also creates a medical record that links your injury to the accident, which insurers will want to see.',
          '',
          'At every visit, tell the front desk:',
          '',
          "- How and where you were hurt (car crash, at work, on someone else's property)",
          '- Every insurance you have, including health and auto, plus any claim numbers',
          '',
          "Emergency departments that take Medicare must screen and stabilize you whether or not you can pay, so don't skip care because you're unsure who will cover it.",
        ),
      },
      {
        heading: 'Car accidents: your own auto coverage',
        body: md(
          'Who pays first after a car crash depends on your state and your policy. The main coverages for injuries are:',
          '',
          '- **Personal injury protection (PIP):** Used in “no-fault” states. Your own insurer pays medical bills, and often lost wages, for you and your passengers no matter who caused the crash, up to your limit.',
          '- **Medical payments coverage (MedPay):** Available in many states. Pays medical bills for you and your passengers regardless of fault, up to a set limit.',
          "- **Bodily injury liability:** The at-fault driver's coverage for injuries they cause to others. It usually pays later, often as part of a settlement.",
          '- **Uninsured/underinsured motorist coverage:** Helps if the at-fault driver has no insurance or not enough.',
          '',
          'Report the accident to your own insurer quickly, because policies have notice deadlines.',
        ),
      },
      {
        heading: 'Health insurance and paying it back',
        body: md(
          "Your health insurance can usually pay for accident-related care, sometimes first and sometimes after PIP or MedPay runs out. Using it is better than letting bills go unpaid. You'll still owe your usual deductible, copays, and coinsurance.",
          '',
          "Ground ambulance rides usually aren't covered by the federal No Surprises Act, so an out-of-network ambulance can bill you more than your plan pays. Send the bill to your auto and health insurers. Some states limit these bills, and you can ask the ambulance company for a lower bill or a payment plan.",
          '',
          'If someone else is found responsible and you receive a settlement, your health plan may have the right to be paid back from it. This is called subrogation.',
          '',
          'Medicare works the same way. When no-fault or liability insurance is involved, that insurance pays first. If Medicare pays in the meantime (a “conditional payment”), it must be repaid from any settlement.',
          '',
          'Answer letters from your health plan asking whether an injury was caused by an accident. Ignoring them can delay or deny your claims.',
        ),
      },
      {
        heading: "Injured at work or on someone's property",
        body: md(
          "**At work:** Workers' compensation usually pays for medical care and part of your lost wages for job-related injuries and illnesses, no matter who was at fault. Tell your employer in writing right away, because reporting deadlines vary by state and can be short. Most workers file through their state's program; federal employees file through the US Department of Labor. Workers' comp is generally your main remedy against your employer, but you may still have a claim against someone else, like a driver who hit you.",
          '',
          "**On someone else's property:** A homeowner's or business's liability insurance may cover your injuries, and many policies include medical payments coverage for guests regardless of fault. Report the injury to the owner or manager and ask for their insurance information.",
        ),
      },
      {
        heading: 'Build your paper trail',
        body: md(
          'Good records make every claim easier:',
          '',
          '- The police or incident report number, and names of officers or managers',
          '- Photos of the scene, vehicles, hazards, and your injuries',
          '- Names and contact details for witnesses and other drivers, plus their insurance information',
          '- Every medical record, bill, receipt, and Explanation of Benefits (EOB)',
          '- Mileage to appointments and dates of missed work',
          '- A short daily journal of pain, limits, and activities you missed',
          '',
          "Keep everything in one folder or one phone album. Each time you talk with an insurer, write down the date, the person's name, and the claim number.",
        ),
      },
      {
        heading: 'Before you sign anything',
        body: md(
          "Be careful with the other driver's insurance company. You usually don't have to give them a recorded statement, and what you say may be used to limit your claim. Don't sign a release or accept a settlement until you know the full extent of your injuries. Once you settle, you generally can't ask for more later.",
          '',
          "Consider talking with a personal injury or workers' compensation lawyer if you were seriously hurt, fault is disputed, or a claim is denied. Many offer free consultations. Deadlines to file claims and lawsuits vary by state.",
          '',
          "This lesson is general information about US insurance, not legal advice. Your policy and your state's rules decide what is covered.",
        ),
      },
    ],
    keyTakeaways: [
      'Get medical care first, and tell every provider how you were hurt and what insurance you have.',
      'PIP or MedPay on your own auto policy can pay medical bills regardless of fault.',
      'Your health plan or Medicare may pay now and be repaid later from a settlement.',
      "Work injuries usually go through workers' comp, so report them to your employer in writing right away.",
      "Keep records of everything, and don't settle until you know the full extent of your injuries.",
    ],
    quiz: [
      {
        question: 'In a no-fault state, what usually pays your medical bills first after a car crash?',
        options: [
          "The other driver's insurer, after a lawsuit",
          "Your own auto policy's personal injury protection (PIP)",
          'The police department',
          'No one until fault is decided',
        ],
        answerIndex: 1,
        explanation:
          'In no-fault states, your own PIP coverage pays medical bills for you and your passengers regardless of who caused the crash, up to your limit.',
      },
      {
        question: 'You get hurt at work. What should you do right away?',
        options: [
          'Wait to see if it gets better before telling anyone',
          'Get medical care and tell your employer in writing',
          'Tell only a coworker',
          'Pay all your bills yourself and hope to be paid back',
        ],
        answerIndex: 1,
        explanation:
          "Workers' comp reporting deadlines vary by state and can be short. Written notice and prompt care protect your health and your claim.",
      },
      {
        question: 'Why should you avoid rushing to accept a settlement?',
        options: [
          'Settlements are always illegal',
          "Once you settle, you generally can't ask for more if your injuries turn out worse",
          'Insurers must wait five years to pay',
          'Settling cancels your health insurance',
        ],
        answerIndex: 1,
        explanation:
          "Some injuries take time to show their full effect. A settlement usually ends your claim, so wait until you understand your injuries and costs.",
      },
    ],
    sources: [
      {
        title: 'What Does Auto Insurance Cover?',
        publisher: 'National Association of Insurance Commissioners (NAIC)',
        url: 'https://content.naic.org/article/what-does-auto-insurance-cover',
      },
      {
        title: 'Who pays first?',
        publisher: 'Medicare.gov',
        url: 'https://www.medicare.gov/health-drug-plans/coordination/who-pays-first',
      },
      {
        title: "Workers' compensation",
        publisher: 'USAGov',
        url: 'https://www.usa.gov/workers-compensation',
      },
      {
        title: 'Know your Medical Bill of Rights',
        publisher: 'CMS',
        url: 'https://www.cms.gov/initiatives/your-patient-rights/medical-bill-rights/know-your-medical-bill-rights',
      },
    ],
    askBrianPrompts: [
      'Should I use my health insurance for car accident injuries?',
      'What is the difference between PIP and MedPay?',
      'What records should I keep after an accident?',
    ],
    tags: [
      'car accident',
      'PIP',
      'MedPay',
      'no-fault',
      "workers' compensation",
      'liability',
      'subrogation',
      'settlement',
      'injury',
    ],
  },

  // ───────────────────────── Medical debt ─────────────────────────
  {
    id: 'medical-debt-rights',
    categoryId: 'rights-liability',
    title: 'Medical Debt: Know Your Rights',
    summary:
      'How to check a medical bill, ask for financial help, deal with debt collectors, and protect your credit.',
    readMinutes: 4,
    level: 'Intermediate',
    icon: 'cash-outline',
    callout: {
      kind: 'tip',
      text: "Don't ignore a medical bill, but don't rush to pay one you don't understand either. Ask questions first. This is general US information, not legal or financial advice.",
    },
    sections: [
      {
        heading: 'Before you pay: check the bill',
        body: md(
          'Mistakes on medical bills are common, so check before you pay:',
          '',
          '1. **Ask for an itemized bill** that lists every service, test, and supply.',
          "2. **Compare it with your insurer's Explanation of Benefits (EOB).** What you owe should match what the EOB says is your share.",
          "3. **Look for errors,** such as services you didn't get, duplicate charges, or a claim that was never sent to your insurance.",
          '4. **Call the billing office** with questions, and write down who you spoke with and when.',
          '',
          "The federal No Surprises Act may protect you if you have health insurance and got a surprise out-of-network bill for emergency care, for care from an out-of-network clinician at an in-network hospital or surgery center (like an anesthesiologist you didn't choose), or for an air ambulance. If you don't have or don't use insurance and your bill is at least $400 more than your good faith estimate, you may be able to dispute it. Start within 120 days of the date on your first bill. Ground ambulance bills usually aren't covered by the federal law. The No Surprises Help Desk is 1-800-985-3059.",
        ),
      },
      {
        heading: 'Ask about financial assistance and payment plans',
        body: md(
          'Nonprofit hospitals must have a written financial assistance policy that covers emergency and other medically necessary care. Depending on your income, you may qualify for free or discounted care. Many other hospitals and clinics have similar programs.',
          '',
          '- Ask for the financial assistance application, even if the bill is old or already with a collector.',
          '- Ask whether they offer an interest-free payment plan you can afford.',
          "- If you are uninsured and might qualify for Medicaid, apply right away. Medicaid can sometimes pay bills from shortly before you applied, but that window is short (starting in 2027, as little as one month for many adults), so don't wait.",
          '- For future care, community health centers charge on a sliding scale based on income.',
          '',
          'Be cautious about putting medical bills on a credit card or a medical credit card. High interest, or deferred interest charged back to the start date if you miss the payoff deadline, can make the debt grow, and it may lose protections that apply to medical debt.',
        ),
      },
      {
        heading: 'If a debt collector contacts you',
        body: md(
          'A federal law, the Fair Debt Collection Practices Act, gives you rights when a collection agency contacts you:',
          '',
          '- The collector must give you validation information (who they are, how much they say you owe, and to whom) when they first contact you or within five days.',
          '- You have 30 days to dispute the debt in writing. Once they get your dispute, they must stop collecting until they send verification, like a copy of the bill.',
          "- They can't call before 8 a.m. or after 9 p.m. unless you agree, harass or threaten you, or lie about what you owe.",
          "- They can't collect charges above what the No Surprises Act allows.",
          "- You can tell them in writing to stop contacting you. That stops the contact, but it doesn't erase the debt.",
          '',
          'Send letters by certified mail with a return receipt, and keep copies.',
        ),
      },
      {
        heading: 'Medical debt and your credit report',
        body: md(
          "Rules about medical debt on credit reports have changed several times in recent years. Under the three national credit bureaus' own policies:",
          '',
          '- Paid medical collections should not appear on your credit report.',
          '- Medical collections under $500 should not appear.',
          "- Unpaid medical collections generally shouldn't appear until they are at least a year old.",
          '',
          "Some states have passed laws that go further. These protections don't cover medical bills you paid with a credit card.",
          '',
          "You can check your reports from all three bureaus for free every week at AnnualCreditReport.com. If you see medical debt that shouldn't be there, or any other error, dispute it with the credit bureau and with the company that reported it.",
        ),
      },
      {
        heading: 'Where to get help',
        body: md(
          "You don't have to handle it alone:",
          '',
          "- **Your hospital's financial counselor or patient advocate** can explain charges and assistance programs.",
          '- **The Consumer Financial Protection Bureau (CFPB)** takes complaints about debt collectors and credit reporting online or at 855-411-2372.',
          '- **Your state attorney general** and the **Federal Trade Commission** also accept debt collection complaints.',
          '- **Legal aid** offices help people with low incomes for free, and nonprofit credit counselors can help you build a budget.',
          '',
          'Be wary of companies that charge upfront fees and promise to make medical debt disappear.',
          '',
          'If you are sued over a debt, respond by the deadline on the court papers. Ignoring a lawsuit can lead to a default judgment (the court rules against you automatically). In many states, that can let the creditor take part of your paycheck, called wage garnishment. Rules vary by state.',
        ),
      },
    ],
    keyTakeaways: [
      'Ask for an itemized bill and compare it with your EOB before paying.',
      'Nonprofit hospitals must have financial assistance policies; ask for an application, even for older bills.',
      'Collectors must validate a debt, and you have 30 days to dispute it in writing.',
      "Paid medical collections and those under $500 shouldn't appear on your credit report.",
      'Never ignore a lawsuit about a debt; respond by the deadline.',
    ],
    quiz: [
      {
        question: "A collector calls about a medical bill you don't recognize. What is a good first step?",
        options: [
          'Pay right away to stop the calls',
          'Dispute it in writing within 30 days and ask for verification',
          'Ignore every letter',
          'Give them your bank login so they can check',
        ],
        answerIndex: 1,
        explanation:
          'A written dispute within 30 days requires the collector to pause and send verification before continuing to collect.',
      },
      {
        question: "Under the credit bureaus' policies, which medical collections should NOT appear on your credit report?",
        options: [
          'Only debts over $5,000',
          'Paid medical collections and those under $500',
          'None; all medical debt is reported right away',
          'Only bills from dental offices',
        ],
        answerIndex: 1,
        explanation:
          'The three national credit bureaus remove paid medical collections and those under $500, and generally wait a year before reporting unpaid medical collections.',
      },
      {
        question: 'Why can paying a large medical bill with a regular credit card be risky?',
        options: [
          "Hospitals don't accept cards",
          'It becomes credit card debt with interest and fewer medical-debt protections',
          'It raises your insurance deductible',
          'It is illegal',
        ],
        answerIndex: 1,
        explanation:
          'Once a medical bill is on a credit card, it is treated like any other card debt, with interest, and medical-debt credit reporting protections no longer apply.',
      },
    ],
    sources: [
      {
        title:
          'What should I know about debt collection and credit reporting if my medical bill was sent to collections?',
        publisher: 'Consumer Financial Protection Bureau',
        url: 'https://www.consumerfinance.gov/ask-cfpb/what-should-i-know-about-debt-collection-and-credit-reporting-if-my-medical-bill-was-sent-to-collections-en-2122/',
      },
      {
        title: 'Have medical debt? Anything already paid or under $500 should no longer be on your credit report',
        publisher: 'Consumer Financial Protection Bureau',
        url: 'https://www.consumerfinance.gov/archive/blog/medical-debt-anything-already-paid-or-under-500-should-no-longer-be-on-your-credit-report/',
      },
      { title: 'Debt Collection FAQs', publisher: 'Federal Trade Commission', url: 'https://consumer.ftc.gov/articles/debt-collection-faqs' },
      {
        title: 'Financial assistance policies (FAPs)',
        publisher: 'Internal Revenue Service',
        url: 'https://www.irs.gov/charities-non-profits/financial-assistance-policies-faps',
      },
      {
        title: 'Know your Medical Bill of Rights',
        publisher: 'CMS',
        url: 'https://www.cms.gov/initiatives/your-patient-rights/medical-bill-rights/know-your-medical-bill-rights',
      },
    ],
    askBrianPrompts: [
      'How do I ask a hospital for financial assistance?',
      'What should I include in a letter disputing a medical debt?',
      'Can you help me understand the charges on my itemized bill?',
    ],
    tags: [
      'medical debt',
      'medical bills',
      'debt collection',
      'credit report',
      'financial assistance',
      'charity care',
      'itemized bill',
      'No Surprises Act',
      'payment plan',
    ],
  },

  // ───────────────────────── Complaints & appeals ─────────────────────────
  {
    id: 'health-care-complaints-appeals',
    categoryId: 'rights-liability',
    title: 'Speaking Up: Complaints, Appeals & Patient Advocates',
    summary:
      "Where to turn when care, safety, or respect falls short, from the hospital's patient advocate to state boards and Medicare fast appeals.",
    readMinutes: 4,
    level: 'Intermediate',
    icon: 'megaphone-outline',
    callout: {
      kind: 'tip',
      text: 'Speaking up is your right, and it often helps the next patient too. Write things down as they happen, because dates, names, and details make complaints much stronger. If someone is in immediate danger, call 911.',
    },
    sections: [
      {
        heading: 'Start close to the problem',
        body: md(
          'Many problems are fixed fastest by the people right there:',
          '',
          '1. **Talk to the person involved** or their supervisor, like the charge nurse or clinic manager. Be calm and specific: what happened, when, and what you want done.',
          '2. **Ask for the patient advocate** (sometimes called patient relations). Many hospitals have one. They can help with communication problems, safety worries, billing confusion, and discharge concerns.',
          '3. **File a formal grievance.** Hospitals that take Medicare must have a grievance process and give you a written response. Ask how to file and how long a response usually takes.',
          '',
          "If you or a loved one is in the hospital right now, you can ask for help immediately. You don't have to wait until you go home.",
        ),
      },
      {
        heading: 'Complaints about a clinician or facility',
        body: md(
          "If the problem isn't resolved, or it is serious, outside agencies can look into it:",
          '',
          "- **State medical board:** Complaints about a doctor's conduct, competence, or license. Nurses, pharmacists, dentists, and other professionals have their own state boards. Boards can investigate and discipline, but they don't award money.",
          '- **The state agency that inspects health facilities** (often the state health department): Problems at hospitals, surgery centers, home health agencies, and nursing homes, such as unsafe conditions or abuse.',
          '- **Long-term care ombudsman:** A free advocate for people living in nursing homes and assisted living. Every state has this program.',
          '- **Accrediting organizations,** groups like The Joint Commission that inspect and approve many hospitals, also accept safety complaints.',
          '',
          "The Federation of State Medical Boards keeps a directory of every state medical board, including how to file a complaint and check a doctor's license.",
        ),
      },
      {
        heading: 'If you have Medicare',
        body: md(
          'People with Medicare have extra protections:',
          '',
          '- **Quality-of-care complaints** go to a Beneficiary and Family Centered Care Quality Improvement Organization (BFCC-QIO). Call 1-800-MEDICARE (1-800-633-4227) for the number in your area.',
          "- **Leaving the hospital too soon?** Within 2 days of admission you should get a notice called “An Important Message from Medicare about Your Rights.” If you think you're being discharged too early, ask the BFCC-QIO for a fast appeal no later than your planned discharge day. If you meet that deadline, you generally won't pay for the extra days while you wait for a decision, other than your usual coinsurance or deductibles.",
          '- **Skilled nursing, home health, or hospice care ending?** You should get a notice at least 2 days before services end. To get a fast appeal, contact the BFCC-QIO no later than noon the day before your services are set to end.',
          '- **Problems with a Medicare plan** can be filed as a grievance with the plan.',
        ),
      },
      {
        heading: 'Privacy, discrimination, and billing problems',
        body: md(
          'Some problems have their own complaint routes:',
          '',
          '- **Privacy violations or discrimination** based on race, color, national origin, sex, age, or disability can be reported to the HHS Office for Civil Rights. Privacy complaints generally must be filed within 180 days.',
          "- **Insurance denials** go through your plan's appeal process first. If the plan still says no, you can usually ask for an independent external review.",
          '- **Surprise medical bills** and good faith estimate problems: call the No Surprises Help Desk at 1-800-985-3059.',
          '- **Debt collectors or credit report errors:** the Consumer Financial Protection Bureau.',
          '',
          'Look for deadlines on every denial letter and notice. Missing them can end your options.',
        ),
      },
      {
        heading: 'How to write a complaint that gets results',
        body: md(
          'A clear, calm complaint is easier to act on:',
          '',
          '- Stick to facts: dates, times, places, and names or job titles.',
          '- Describe what happened and how it affected you.',
          '- Say what you want, such as an explanation, an apology, a corrected bill, or a policy change.',
          '- Attach copies (never originals) of records, bills, photos, and letters.',
          '- Keep a log of every call: the date, who you spoke with, and what they said.',
          '- Ask for a written response and a reference number.',
          '',
          "Health care organizations shouldn't punish you for speaking up, and retaliation for filing a privacy or civil rights complaint is illegal. This is general information about US systems, not legal advice. Complaint deadlines are separate from lawsuit deadlines.",
        ),
      },
    ],
    keyTakeaways: [
      "Start with the staff involved or the hospital's patient advocate, and ask for a written grievance response.",
      'State medical boards handle clinician conduct; state health departments handle facility problems.',
      'Medicare patients can ask for a fast appeal if they think they are being discharged too soon.',
      'Privacy and discrimination complaints go to the HHS Office for Civil Rights.',
      'Keep complaints factual, include dates and names, and save copies.',
    ],
    quiz: [
      {
        question: "You think a hospital is discharging your parent, who has Medicare, too soon. What can you do?",
        options: [
          'Nothing, because discharge decisions are final',
          "Ask Medicare's quality improvement organization (BFCC-QIO) for a fast appeal by the planned discharge day",
          'Wait and complain after they get home',
          'Call the police',
        ],
        answerIndex: 1,
        explanation:
          'Medicare patients can request a fast appeal from the BFCC-QIO. Asking by the planned discharge day generally protects them from paying for the extra days while they wait.',
      },
      {
        question: "Where do complaints about a doctor's professional conduct usually go?",
        options: ['The state medical board', 'The FDA', 'The post office', 'Your car insurance company'],
        answerIndex: 0,
        explanation:
          'State medical boards license doctors and can investigate and discipline them. Other professions have their own boards.',
      },
      {
        question: 'What makes a written complaint most effective?',
        options: [
          'Strong language and all capital letters',
          'Clear facts, dates, names, what you want, and copies of documents',
          'Sending your only original documents',
          'Leaving out what you want done',
        ],
        answerIndex: 1,
        explanation:
          'Specific, factual complaints with a clear request and supporting copies are the easiest for reviewers to investigate and resolve.',
      },
    ],
    sources: [
      {
        title: 'Filing a complaint',
        publisher: 'Medicare.gov',
        url: 'https://www.medicare.gov/providers-services/claims-appeals-complaints/complaints',
      },
      {
        title: 'Fast appeals',
        publisher: 'Medicare.gov',
        url: 'https://www.medicare.gov/providers-services/claims-appeals-complaints/appeals/fast-appeals',
      },
      {
        title: 'Contact a State Medical Board',
        publisher: 'Federation of State Medical Boards',
        url: 'https://www.fsmb.org/contact-a-state-medical-board/',
      },
      {
        title: 'Long-Term Care Ombudsman Program',
        publisher: 'Administration for Community Living (HHS)',
        url: 'https://acl.gov/programs/Protecting-Rights-and-Preventing-Abuse/Long-term-Care-Ombudsman-Program',
      },
      { title: 'Patient Rights', publisher: 'NIH MedlinePlus', url: 'https://medlineplus.gov/patientrights.html' },
    ],
    askBrianPrompts: [
      'Help me write a clear complaint about a problem with my care.',
      'How does a Medicare fast appeal work?',
      'Who should I contact about a problem at a nursing home?',
    ],
    tags: [
      'complaint',
      'grievance',
      'patient advocate',
      'medical board',
      'Medicare appeal',
      'hospital discharge',
      'ombudsman',
      'Office for Civil Rights',
      'quality of care',
    ],
  },
];
