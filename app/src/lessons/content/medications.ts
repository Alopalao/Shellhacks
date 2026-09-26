import type { Lesson } from '../types';

// Content for category 'medications'. See src/lessons/types.ts for the format.
// Generic drug names first; brand names appear only as familiar examples, never as endorsements.
// Nothing here replaces a prescriber's or pharmacist's advice. Every source URL was checked to resolve.

/** Joins lines with "\n" so markdown-lite bodies stay readable here ("" = blank line). */
const md = (...lines: string[]): string => lines.join('\n');

export const lessons: Lesson[] = [
  // ───────────────────────── Reading a prescription label ─────────────────────────
  {
    id: 'prescription-label-reading',
    categoryId: 'medications',
    title: 'How to Read a Prescription Label',
    summary:
      'What each part of your pharmacy label means, what the directions really say, and the questions to ask when you pick up a medicine.',
    readMinutes: 4,
    level: 'Basics',
    icon: 'document-text-outline',
    callout: {
      kind: 'tip',
      text: 'Check the label before you leave the pharmacy: your name, the medicine, and the directions should match what your prescriber told you. If anything seems off, ask the pharmacist right then.',
    },
    sections: [
      {
        heading: 'The parts of a typical label',
        body: md(
          'Label layouts differ by pharmacy and state, but most include:',
          '',
          "- **Your name.** Always check that it's you.",
          '- **Medicine name and strength,** for example “Lisinopril 10 mg.” A generic may also say which brand it replaces.',
          '- **Directions:** how much to take, how often, and how (by mouth, on the skin, in the eye).',
          '- **Quantity:** how many tablets, capsules, or milliliters (mL) are in the container.',
          '- **Refills:** how many are left, and sometimes the date they expire.',
          '- **Prescriber:** who wrote the prescription.',
          '- **Pharmacy name, phone number, and Rx number.** The Rx number is how the pharmacy finds your prescription for refills.',
          '- **Fill date and a “discard after” or expiration date.**',
          '- **A description of the pill,** such as color, shape, and the letters or numbers stamped on it.',
        ),
      },
      {
        heading: 'Reading the directions carefully',
        body: md(
          "Directions can be less clear than they look. Ask your pharmacist what they mean for your day if you're unsure:",
          '',
          '- **“Twice a day”:** About 12 hours apart, or with breakfast and dinner? Some medicines need even spacing; others are timed with meals.',
          "- **“Four times a day”:** Four times in 24 hours, or four times while you're awake?",
          '- **“As needed”:** For which symptom, how soon you can repeat a dose, and the most you can take in a day.',
          "- **“On an empty stomach”:** Generally at least 2 hours before or 2 hours after eating, but follow your pharmacist's advice for your medicine.",
          '- **“Take with food”:** With a meal or snack, often to protect your stomach or help your body absorb it.',
          '',
          'Prescriptions and visit notes may use shorthand like BID (twice a day), qd (every day), qhs (at bedtime), PO (by mouth), or PRN (as needed). BRIAN can translate these for you.',
        ),
      },
      {
        heading: 'Warning stickers and paper handouts',
        body: md(
          'Colored stickers on the bottle point out important cautions, such as:',
          '',
          '- May cause drowsiness; use care when driving',
          '- Avoid alcohol',
          '- Take with food, or take on an empty stomach',
          '- Do not crush or chew',
          '',
          "Many prescriptions also come with printed information. For some medicines with serious risks, the FDA requires a Medication Guide, a plain-language handout about the most important safety information. Read it, and keep it for as long as you take the medicine.",
          '',
          "Don't crush, split, or chew tablets unless the label or your pharmacist says it's OK. Some tablets are designed to release medicine slowly, and breaking them can release too much at once.",
        ),
      },
      {
        heading: 'Liquid medicines: measure in mL',
        body: md(
          'Liquid doses are easy to get wrong. Spoons from your kitchen drawer vary a lot in size, and mixing up a teaspoon (tsp) and a tablespoon (tbsp) means three times too much medicine.',
          '',
          '- Use the oral syringe, dosing cup, or dropper that comes with the medicine, or ask the pharmacy for one.',
          '- Check that the units on the device match the units on the label. Most now use milliliters (mL).',
          "- Don't use one product's dosing cup for a different medicine.",
          '- Remove and throw away small syringe caps, which young children can choke on.',
          '',
          "If you're not sure you gave the right amount, or someone took too much, call Poison Help at 1-800-222-1222. It's free, confidential, and open 24/7.",
        ),
      },
      {
        heading: 'Questions to ask at pickup',
        body: md(
          "You can always ask to talk with the pharmacist, and it's free. Good questions include:",
          '',
          "1. What is this medicine for, and how will I know it's working?",
          '2. When and how should I take it, and for how long?',
          '3. What should I do if I miss a dose?',
          '4. Which side effects are common, and which mean I should call right away?',
          '5. Does it interact with my other medicines, supplements, foods, or alcohol?',
          '6. How should I store it?',
          '',
          "If the label is hard to read, ask for larger print or a container that's easier to open. And if your pills look different from last time, ask before taking them. It's often just a different generic maker, but it's worth checking.",
        ),
      },
    ],
    keyTakeaways: [
      'Check your name, the medicine, the strength, and the directions before you leave the pharmacy.',
      'Ask what “twice a day” or “as needed” means for your specific medicine.',
      'Read warning stickers and any FDA Medication Guide that comes with your prescription.',
      'Measure liquid medicine in mL with the device made for it, never a kitchen spoon.',
      'If pills look different than usual, ask the pharmacist before taking them.',
    ],
    quiz: [
      {
        question: 'What is the Rx number on your label used for?',
        options: [
          'It is your insurance member ID',
          'It helps the pharmacy find your prescription, for example for refills',
          'It shows the strength of the pill',
          "It is your prescriber's phone number",
        ],
        answerIndex: 1,
        explanation:
          'The Rx number identifies your prescription at that pharmacy. Have it ready when you call or use an app to request a refill.',
      },
      {
        question: 'What is the safest way to measure a liquid medicine?',
        options: [
          'A spoon from the kitchen drawer',
          'Guessing by eye',
          'The syringe or dosing cup made for that medicine, in mL',
          'Any dosing cup left over from another medicine',
        ],
        answerIndex: 2,
        explanation:
          "Kitchen spoons vary in size and other products' cups may use different markings. Use the device that comes with the medicine and match the mL units.",
      },
      {
        question: "Your refill looks different from last month's pills. What should you do?",
        options: [
          'Throw them away',
          'Take a double dose to be safe',
          'Ask the pharmacist to confirm before taking them',
          'Stop taking the medicine',
        ],
        answerIndex: 2,
        explanation:
          "A new look often just means a different generic manufacturer, but the pharmacist can confirm it's the right medicine and strength.",
      },
    ],
    sources: [
      {
        title: 'Taking Medicines Safely as You Age',
        publisher: 'National Institute on Aging (NIH)',
        url: 'https://www.nia.nih.gov/health/medicines-and-medication-management/taking-medicines-safely-you-age',
      },
      { title: 'Medication Errors', publisher: 'NIH MedlinePlus', url: 'https://medlineplus.gov/medicationerrors.html' },
      {
        title: 'Liquid medication administration',
        publisher: 'NIH MedlinePlus',
        url: 'https://medlineplus.gov/ency/article/002209.htm',
      },
    ],
    askBrianPrompts: [
      'What does “take on an empty stomach” mean for my medicine?',
      'Can you explain the abbreviations on my prescription?',
      'What should I ask my pharmacist when I pick up a new prescription?',
    ],
    tags: [
      'prescription label',
      'pharmacy',
      'directions',
      'Rx number',
      'refills',
      'Medication Guide',
      'liquid medicine',
      'dosing',
      'abbreviations',
    ],
  },

  // ───────────────────────── Brand vs. generic ─────────────────────────
  {
    id: 'generic-vs-brand-drugs',
    categoryId: 'medications',
    title: 'Brand-Name vs. Generic Medicines',
    summary:
      'Why FDA-approved generics work the same as brand-name drugs, why they can look different, and what biosimilars are.',
    readMinutes: 4,
    level: 'Basics',
    icon: 'git-compare-outline',
    callout: {
      kind: 'tip',
      text: 'Ask “Is there a generic?” every time you get a new prescription. It is one of the easiest ways to save money.',
    },
    sections: [
      {
        heading: 'What a generic medicine is',
        body: md(
          'When a company develops a new drug, it sells it under a brand name, protected by patents for a period of time. Later, other companies can make generic versions.',
          '',
          'An FDA-approved generic must have:',
          '',
          '- The **same active ingredient** as the brand-name drug',
          '- The **same strength** and **dosage form** (tablet, capsule, liquid, patch)',
          '- The **same route,** meaning the way you take it, such as by mouth or by injection',
          '- The **same high manufacturing standards**',
          '',
          'Generics must also be **bioequivalent:** they deliver the same amount of active ingredient into your body at the same rate as the brand. For example, atorvastatin is the generic of the brand Lipitor, and lisinopril is the generic of brands such as Zestril and Prinivil.',
        ),
      },
      {
        heading: 'Do generics work as well?',
        body: md(
          'Yes. The FDA reviews generics before approval and expects them to have the same clinical effect and safety as the brand-name drug. Generic makers do not have to repeat the large clinical trials the brand company ran, because they prove their product works the same way in the body. That is a big reason generics cost less.',
          '',
          'The FDA also inspects drug factories around the world. All drugs sold in the US must meet the same quality standards, no matter where they are made.',
          '',
          'Generics usually cost much less than the brand, especially once several companies make the same medicine. Most prescription drugs sold in the US are generics.',
        ),
      },
      {
        heading: 'Why your pills might look different',
        body: md(
          'Generic pills often have a different color, shape, size, or flavor than the brand, and generics from different manufacturers can look different from each other. The FDA allows these minor differences, which come from inactive ingredients like dyes and fillers. They do not change how the medicine works.',
          '',
          'Still:',
          '',
          "- If your refill looks different, ask the pharmacist to confirm it's the right medicine.",
          '- If you are allergic to a dye or another inactive ingredient, tell your pharmacist so they can check.',
          "- If you notice a new side effect after a switch, tell your prescriber or pharmacist. You can also report it to the FDA's MedWatch program.",
          '',
          'For a few medicines where small changes in blood levels matter, such as warfarin or levothyroxine, your prescriber may want to know when your product changes.',
        ),
      },
      {
        heading: 'Switching and substitution',
        body: md(
          'In most states, your pharmacist can fill a brand-name prescription with an FDA-approved generic unless your prescriber indicates the brand is medically necessary. The exact rules vary by state.',
          '',
          'If you want to stay on the brand, talk with your prescriber and check with your insurance plan. Many plans charge much more for a brand when a generic is available, and some require prior authorization first.',
          '',
          "To find out whether a generic exists, ask your pharmacist or look up the drug in the FDA's Orange Book.",
        ),
      },
      {
        heading: 'Biologics and biosimilars',
        body: md(
          'Some medicines, including many treatments for arthritis, cancer, and diabetes (such as insulin), are biologics: large, complex products made from living sources like cells. Their close copies are called biosimilars rather than generics.',
          '',
          'A biosimilar is highly similar to the original biologic, with no clinically meaningful differences in safety or how well it works. The FDA can also approve a biosimilar as **interchangeable,** which means a pharmacist may substitute it for the original without checking with the prescriber, depending on state law.',
          '',
          'Biosimilars may cost less than the original product, but coverage depends on your insurance plan. Ask your prescriber or pharmacist whether a biosimilar is an option for you.',
        ),
      },
    ],
    keyTakeaways: [
      'FDA-approved generics have the same active ingredient, strength, and form as the brand and work the same way.',
      "Generics may look different because of inactive ingredients, which doesn't change how they work.",
      'Ask your pharmacist if a refill looks different or if you react to an inactive ingredient.',
      'Biosimilars are FDA-approved versions of biologic medicines with no clinically meaningful differences.',
    ],
    quiz: [
      {
        question: 'What must an FDA-approved generic have in common with the brand-name drug?',
        options: [
          'The same color and shape',
          'The same active ingredient, strength, and dosage form',
          'The same price',
          'The same company name',
        ],
        answerIndex: 1,
        explanation:
          "Generics must match the brand's active ingredient, strength, dosage form, and route, and be bioequivalent. Color and shape can differ.",
      },
      {
        question: 'Why do generic pills often look different from the brand?',
        options: [
          'They contain less medicine',
          "They use different inactive ingredients like dyes, which don't change how they work",
          'They are counterfeit',
          'They are expired',
        ],
        answerIndex: 1,
        explanation:
          'The FDA allows minor differences in appearance, such as color, that come from inactive ingredients and do not affect how the medicine works.',
      },
      {
        question: 'What is a biosimilar?',
        options: [
          'A generic vitamin',
          'A version of a biologic medicine with no clinically meaningful differences from the original',
          'A homeopathic remedy',
          'A brand-name pill in a new color',
        ],
        answerIndex: 1,
        explanation:
          'Biosimilars are FDA-approved versions of biologic medicines. They are as safe and effective as the original biologic.',
      },
    ],
    sources: [
      { title: 'Generic Drug Facts', publisher: 'FDA', url: 'https://www.fda.gov/drugs/generic-drugs/generic-drug-facts' },
      {
        title: 'Generic Drugs: Questions & Answers',
        publisher: 'FDA',
        url: 'https://www.fda.gov/drugs/generic-drugs/generic-drugs-questions-answers',
      },
      {
        title: 'Biosimilars Basics for Patients',
        publisher: 'FDA',
        url: 'https://www.fda.gov/drugs/biosimilars/biosimilars-basics-patients',
      },
    ],
    askBrianPrompts: [
      'Is there a generic version of my medicine?',
      'My refill looks different. How can I check it is the right pill?',
      'What is the difference between a generic and a biosimilar?',
    ],
    tags: [
      'generic drugs',
      'brand name',
      'biosimilar',
      'bioequivalent',
      'Orange Book',
      'substitution',
      'inactive ingredients',
      'save money',
    ],
  },

  // ───────────────────────── Saving money ─────────────────────────
  {
    id: 'prescription-cost-savings',
    categoryId: 'medications',
    title: 'Saving Money on Prescriptions',
    summary:
      'Practical ways to lower what you pay, from generics and 90-day supplies to price shopping, Medicare protections, and assistance programs.',
    readMinutes: 4,
    level: 'Basics',
    icon: 'wallet-outline',
    callout: {
      kind: 'warning',
      text: "Don't skip doses, cut pills, or stretch a prescription to save money without talking to your prescriber or pharmacist first. Tell them if cost is a problem; there are usually safer options.",
    },
    sections: [
      {
        heading: 'Start with a cost conversation',
        body: md(
          "Prescribers often don't know what a medicine will cost you. Say so when a new prescription is written: “Cost is a concern for me. Is there a less expensive option that would work as well?”",
          '',
          'Ask about:',
          '',
          '- A **generic** or a lower-cost medicine in the same drug class',
          "- A medicine on a **lower tier** of your plan's formulary (its list of covered drugs)",
          '- Whether each medicine is still needed. A regular medication review can sometimes safely reduce what you take.',
          '',
          "Your pharmacist can check your insurance price and suggest options, too. You can find your plan's formulary on your insurer's website or by calling the number on your card.",
        ),
      },
      {
        heading: 'Shop around and use longer supplies',
        body: md(
          'The price of the same medicine can vary a lot from one pharmacy to another, especially if you pay cash.',
          '',
          '- **Compare prices** at a few local pharmacies, mail-order services, and legitimate online pharmacies.',
          '- **Ask about a 90-day supply.** It often costs less per dose than three 30-day fills and means fewer trips.',
          "- **Check your plan's preferred pharmacies,** which may have lower copays.",
          '- **Look at discount programs** from pharmacies, drug makers, and nonprofits. Sometimes a discount price is lower than your insurance copay.',
          '',
          "If you use a discount card instead of your insurance, the purchase often won't count toward your deductible or out-of-pocket maximum. Ask the pharmacist to compare both prices.",
        ),
      },
      {
        heading: 'If you have Medicare',
        body: md(
          'Medicare drug coverage (Part D, including most Medicare Advantage plans) has protections that can lower your costs:',
          '',
          '- **Yearly out-of-pocket cap:** Once your spending on covered drugs reaches the cap ($2,100 in 2026 and $2,400 in 2027), you pay nothing more for covered drugs that year.',
          '- **Insulin:** You pay no more than $35 for a one-month supply of each covered insulin product.',
          "- **Medicare Prescription Payment Plan:** Spreads your drug costs into monthly payments over the year. It doesn't lower costs, but it can make them easier to manage.",
          '- **Extra Help:** A program for people with limited income and resources that lowers premiums, deductibles, and copays. You can apply through Social Security.',
          '',
          'Compare drug plans every fall during open enrollment, because formularies and prices change each year. Your State Health Insurance Assistance Program (SHIP) offers free counseling.',
        ),
      },
      {
        heading: 'Help from programs and clinics',
        body: md(
          "If you still can't afford a medicine, help may be available:",
          '',
          "- **Manufacturer patient assistance programs** can provide some brand-name drugs free or at low cost to people who qualify by income. Your prescriber's office can often help with the application.",
          '- **Copay cards** from drug makers can lower costs for people with private insurance, but they usually cannot be used with Medicare or Medicaid.',
          '- **Community health centers** charge for care on a sliding scale based on income, and many offer lower-cost medicines.',
          '- **State programs:** Some states have drug assistance programs, and Medicaid covers prescriptions for people who qualify.',
          '',
          'Be wary of anyone who charges a fee to help you apply for free programs.',
        ),
      },
      {
        heading: 'Buying medicine online safely',
        body: md(
          'Online and mail-order pharmacies can save money, but fake pharmacy websites are common. They may sell medicines that are counterfeit, contaminated, or the wrong strength.',
          '',
          'A safe online pharmacy:',
          '',
          '- Requires a valid prescription from your prescriber',
          '- Is licensed by the board of pharmacy in your state',
          '- Has a US address and phone number',
          '- Has a licensed pharmacist available to answer your questions',
          '',
          "Warning signs include selling prescription drugs without a prescription, prices that seem too good to be true, and spam emails or social media ads. The FDA's BeSafeRx program has tools to check whether an online pharmacy is licensed. Ordering prescription drugs from other countries is risky and, in most cases, not legal.",
        ),
      },
    ],
    keyTakeaways: [
      'Tell your prescriber when cost is a concern and ask about generics or lower-tier options.',
      'Compare pharmacy prices and ask about 90-day supplies.',
      'Medicare drug plans cap yearly out-of-pocket costs for covered drugs ($2,100 in 2026) and insulin at $35 a month.',
      'Patient assistance programs, community health centers, and Extra Help can lower costs for people who qualify.',
      'Only buy online from licensed pharmacies that require a prescription.',
    ],
    quiz: [
      {
        question: 'Which is a safe way to lower your prescription costs?',
        options: [
          'Skipping every other dose',
          'Asking your prescriber about a generic or lower-cost option',
          "Buying from a website that doesn't require a prescription",
          'Sharing pills with a family member',
        ],
        answerIndex: 1,
        explanation:
          'Your prescriber and pharmacist can often switch you to a generic or lower-tier medicine that works as well. Skipping or sharing doses is unsafe.',
      },
      {
        question: 'What is a possible downside of using a discount card instead of your insurance?',
        options: [
          'It is illegal',
          'The purchase may not count toward your deductible or out-of-pocket maximum',
          'Your pharmacist must report you',
          'The medicine will be weaker',
        ],
        answerIndex: 1,
        explanation:
          'Discount card purchases often bypass your insurance, so they may not count toward your deductible or out-of-pocket limit. Compare both prices.',
      },
      {
        question: 'Which is a warning sign of an unsafe online pharmacy?',
        options: [
          'It requires a valid prescription',
          'It is licensed in your state',
          'It sells prescription drugs without a prescription',
          'A pharmacist is available to answer questions',
        ],
        answerIndex: 2,
        explanation:
          'Legitimate pharmacies always require a valid prescription for prescription drugs. Selling without one is a major red flag.',
      },
    ],
    sources: [
      {
        title: 'Taking Medicines Safely as You Age',
        publisher: 'National Institute on Aging (NIH)',
        url: 'https://www.nia.nih.gov/health/medicines-and-medication-management/taking-medicines-safely-you-age',
      },
      {
        title: 'How much does Medicare drug coverage cost?',
        publisher: 'Medicare.gov',
        url: 'https://www.medicare.gov/health-drug-plans/part-d/basics/costs',
      },
      { title: 'Help with drug costs', publisher: 'Medicare.gov', url: 'https://www.medicare.gov/basics/costs/help/drug-costs' },
      { title: 'Insulin', publisher: 'Medicare.gov', url: 'https://www.medicare.gov/coverage/insulin' },
      {
        title: 'BeSafeRx: Your Source for Online Pharmacy Information',
        publisher: 'FDA',
        url: 'https://www.fda.gov/drugs/buying-using-medicine-safely/besaferx-your-source-online-pharmacy-information',
      },
    ],
    askBrianPrompts: [
      'What should I ask my doctor about lowering my medication costs?',
      'How does the Medicare drug out-of-pocket cap work?',
      'How can I tell if an online pharmacy is safe?',
    ],
    tags: [
      'save money',
      'prescription costs',
      'generic',
      '90-day supply',
      'Medicare Part D',
      'Extra Help',
      'patient assistance',
      'online pharmacy',
      'discount card',
      'insulin',
    ],
  },

  // ───────────────────────── Interactions & OTC safety ─────────────────────────
  {
    id: 'drug-interactions-otc-safety',
    categoryId: 'medications',
    title: 'Drug Interactions & Over-the-Counter Safety',
    summary:
      'How medicines, supplements, food, and alcohol can interact, plus how to use acetaminophen and NSAID pain relievers safely.',
    readMinutes: 5,
    level: 'Intermediate',
    icon: 'warning-outline',
    callout: {
      kind: 'warning',
      text: "If someone took too much of a medicine, call Poison Help at 1-800-222-1222 right away, even if they seem fine. Call 911 if they collapse, have a seizure, have trouble breathing, or can't be woken up.",
    },
    sections: [
      {
        heading: 'Types of interactions',
        body: md(
          'An interaction happens when something changes how a medicine works, making it weaker, stronger, or more likely to cause side effects. There are three main kinds:',
          '',
          '- **Drug with drug:** Two medicines affect each other. For example, a sleep aid plus an allergy medicine that causes drowsiness can slow your reactions and make driving dangerous.',
          '- **Drug with food or drink:** Alcohol, grapefruit juice, and some foods can change how a medicine works.',
          '- **Drug with a health condition:** A health problem can make a medicine risky. For example, some nasal decongestants can raise blood pressure, which matters if you have high blood pressure.',
          '',
          "Over-the-counter (OTC) medicines, vitamins, and herbal supplements can interact too. They aren't automatically safe just because you don't need a prescription.",
        ),
      },
      {
        heading: 'Read the Drug Facts label',
        body: md(
          "Every OTC medicine has a Drug Facts label. Read it every time, even for products you've used before, because ingredients can change. Key parts:",
          '',
          '- **Active ingredients:** What does the work, and how much is in each dose. Check this so you never take the same ingredient twice.',
          '- **Uses:** The symptoms it treats.',
          '- **Warnings:** When not to use it, when to ask a doctor or pharmacist first, side effects, and when to stop.',
          '- **Directions:** How much to take, how often, and the most you can take in a day.',
          '',
          'Be especially careful with multi-symptom cold, flu, and nighttime products. They often contain several active ingredients, which makes accidental doubling easy.',
        ),
      },
      {
        heading: 'Acetaminophen: watch the total',
        body: md(
          'Acetaminophen (the active ingredient in Tylenol and many other products) is safe at the right dose, but too much can seriously damage the liver. It is in more than 600 prescription and OTC medicines, including many cold, flu, sleep, and prescription pain products. Labels may shorten it to “APAP” or “acetam.”',
          '',
          '- For adults, the FDA maximum is 4,000 mg in 24 hours from **all** sources combined. Many product labels set a lower daily limit, so follow your label.',
          '- Take only one product that contains acetaminophen at a time.',
          '- Talk with your clinician first if you have liver disease or drink three or more alcoholic drinks a day.',
          '',
          'Overdose signs, such as nausea, vomiting, stomach pain, confusion, or yellow skin or eyes, may take days to appear. Call Poison Help right away if you think you took too much, even if you feel fine.',
        ),
      },
      {
        heading: 'NSAIDs: ibuprofen, naproxen, and aspirin',
        body: md(
          'NSAIDs (nonsteroidal anti-inflammatory drugs) such as ibuprofen (Advil, Motrin) and naproxen (Aleve) ease pain, fever, and swelling. They carry real risks:',
          '',
          '- **Stomach ulcers and bleeding,** especially if you are older, take a blood thinner or steroid, have had ulcers, smoke, or drink a lot of alcohol',
          '- **Heart attack and stroke** with non-aspirin NSAIDs. This can happen at any time during treatment, and the risk is higher with long-term use or higher doses.',
          '- **Kidney problems** and **higher blood pressure**',
          '',
          'Ask a clinician before using NSAIDs if you have heart, kidney, or liver disease, high blood pressure, or past ulcers, or if you take a blood thinner. Avoid them from about 20 weeks of pregnancy on unless your clinician says otherwise. For OTC use, stop and call a clinician if pain lasts more than 10 days or fever lasts more than 3 days. Aspirin is also an NSAID; do not give it to children or teens unless a doctor says to.',
        ),
      },
      {
        heading: 'Supplements and food',
        body: md(
          "Herbal and dietary supplements can interact with medicines, and many people forget to mention them. Some well-known examples:",
          '',
          "- **St. John's wort** can make many medicines less effective, including birth control pills, the blood thinner warfarin, and some heart, seizure, HIV, and transplant medicines. With some antidepressants, it can cause serious serotonin-related side effects.",
          '- **Grapefruit juice** can raise blood levels of some medicines, including certain statins (such as simvastatin and atorvastatin) and some blood pressure drugs. Seville oranges, pomelos, and tangelos can do the same.',
          '- **Vitamin K** in leafy greens affects warfarin. The goal is to keep your intake steady, not to avoid these foods.',
          '- **Alcohol** adds to drowsiness from many medicines and raises liver and stomach risks.',
          '',
          'Ask your pharmacist before starting any supplement.',
        ),
      },
      {
        heading: 'Your personal safety net',
        body: md(
          "You don't have to memorize interactions. You just need a system:",
          '',
          '1. **Keep one up-to-date list** of every prescription, OTC medicine, vitamin, and supplement you take, with doses. Bring it to every appointment and hospital visit.',
          '2. **Use one pharmacy** when you can, so its system can check for interactions across all your prescriptions.',
          '3. **Ask before adding anything new:** “Is this safe with what I already take?”',
          '4. **Tell every clinician,** including dentists and urgent care staff, what you take.',
          '',
          "BRIAN's Meds tab can hold your prescriptions plus the OTC medicines and supplements you add yourself, so your list is always with you.",
        ),
      },
    ],
    keyTakeaways: [
      'Interactions can happen between medicines, supplements, food, alcohol, and health conditions.',
      'Read the Drug Facts label every time and check active ingredients so you never double up.',
      'Adults should not exceed 4,000 mg of acetaminophen a day from all sources, and many labels set a lower limit.',
      'NSAIDs can cause stomach bleeding and kidney problems and raise heart attack and stroke risk, so ask first if you have risk factors.',
      'Keep one complete medicine list and ask your pharmacist before adding anything new.',
    ],
    quiz: [
      {
        question: "You're taking a cold medicine that contains acetaminophen. What should you avoid?",
        options: [
          'Drinking water',
          'Taking another product that also contains acetaminophen',
          'Reading the Drug Facts label',
          'Resting',
        ],
        answerIndex: 1,
        explanation:
          'Acetaminophen is in hundreds of products. Taking two at once is a common way people accidentally go over the safe daily limit.',
      },
      {
        question: 'Which herbal supplement is well known for making many medicines, including birth control pills, less effective?',
        options: ["St. John's wort", 'Peppermint tea', 'Chamomile tea', 'Vitamin C'],
        answerIndex: 0,
        explanation:
          "St. John's wort can weaken many medicines, including birth control pills, warfarin, and some HIV and transplant drugs.",
      },
      {
        question: 'Who should ask a clinician before taking ibuprofen or naproxen?',
        options: [
          'Only people under 30',
          'People with heart or kidney disease or past ulcers, or who take a blood thinner',
          'Anyone who takes a multivitamin',
          'No one, because OTC medicines are always safe',
        ],
        answerIndex: 1,
        explanation:
          'NSAIDs can cause bleeding, kidney problems, and heart risks. People with these conditions or on blood thinners should ask before using them.',
      },
    ],
    sources: [
      {
        title: 'Drug Interactions: What You Should Know',
        publisher: 'FDA',
        url: 'https://www.fda.gov/drugs/resources-drugs/drug-interactions-what-you-should-know',
      },
      {
        title: "Don't Overuse Acetaminophen",
        publisher: 'FDA',
        url: 'https://www.fda.gov/consumers/consumer-updates/dont-overuse-acetaminophen',
      },
      {
        title: 'Ibuprofen: MedlinePlus Drug Information',
        publisher: 'NIH MedlinePlus',
        url: 'https://medlineplus.gov/druginfo/meds/a682159.html',
      },
      {
        title: "St. John's Wort",
        publisher: 'National Center for Complementary and Integrative Health (NIH)',
        url: 'https://www.nccih.nih.gov/health/st-johns-wort',
      },
      {
        title: "Grapefruit Juice and Some Drugs Don't Mix",
        publisher: 'FDA',
        url: 'https://www.fda.gov/consumers/consumer-updates/grapefruit-juice-and-some-drugs-dont-mix',
      },
    ],
    askBrianPrompts: [
      'Can I take ibuprofen with my blood pressure medicine?',
      'Does grapefruit interact with atorvastatin?',
      'How much acetaminophen is safe for me in a day?',
    ],
    tags: [
      'drug interactions',
      'over-the-counter',
      'OTC',
      'acetaminophen',
      'ibuprofen',
      'naproxen',
      'NSAIDs',
      'supplements',
      'grapefruit',
      "St. John's wort",
    ],
  },

  // ───────────────────────── Antibiotics ─────────────────────────
  {
    id: 'antibiotics-when-needed',
    categoryId: 'medications',
    title: "Antibiotics: When They Help (and When They Don't)",
    summary:
      'Antibiotics fight certain bacteria, not viruses. Learn when you need them, how to take them safely, and why using them wisely matters.',
    readMinutes: 4,
    level: 'Basics',
    icon: 'bug-outline',
    callout: {
      kind: 'warning',
      text: 'Call 911 if you have trouble breathing, swelling of the face, lips, tongue, or throat, or hives spreading over your body after taking an antibiotic. These can be signs of a severe allergic reaction.',
    },
    sections: [
      {
        heading: 'Bacteria vs. viruses',
        body: md(
          'Antibiotics are medicines that kill bacteria or stop them from growing. They save lives when used for the right infections, but they do nothing against viruses.',
          '',
          "Antibiotics **don't** help with:",
          '',
          '- Colds and runny noses, even when mucus is thick, yellow, or green',
          '- The flu or COVID-19 (these have their own antiviral medicines)',
          '- Most sore throats',
          '- Bronchitis (chest colds)',
          '',
          'Antibiotics **are** needed for certain bacterial infections, such as strep throat, whooping cough, and urinary tract infections (UTIs). Even some bacterial infections, including many sinus infections and some ear infections, get better without antibiotics.',
        ),
      },
      {
        heading: 'Why not take them just in case?',
        body: md(
          "An antibiotic you don't need won't help you get better, and it can hurt you:",
          '',
          '- **Side effects** are common, including rash, nausea, diarrhea, dizziness, and yeast infections.',
          '- **Serious reactions** can happen, including severe allergic reactions and **C. diff,** a gut infection that causes severe diarrhea and can be life-threatening.',
          "- **Antimicrobial resistance:** Each time antibiotics are used, bacteria get a chance to adapt so the drugs stop working on them. It's the germs that become resistant, not your body. In the US, more than 2.8 million antimicrobial-resistant infections happen each year, and more than 35,000 people die from them.",
          '',
          'So it is reasonable, and smart, to ask: “Do I really need an antibiotic for this?”',
        ),
      },
      {
        heading: 'Taking antibiotics the right way',
        body: md(
          'If you are prescribed an antibiotic:',
          '',
          "- **Take it exactly as prescribed:** the right dose, at the right times, for as long as directed. Don't stop early or skip doses unless your clinician tells you to.",
          '- **Follow food instructions.** Some antibiotics work best with food and others on an empty stomach. Some should not be taken at the same time as dairy, antacids, or supplements with calcium, iron, or magnesium. Ask your pharmacist.',
          "- **Don't save leftovers** or take someone else's antibiotic. The wrong drug can delay proper treatment.",
          "- **Don't share yours.**",
          '- **Dispose of unused antibiotics** safely, such as at a drug take-back location.',
          '',
          "If you have side effects, call your clinician or pharmacist instead of just stopping.",
        ),
      },
      {
        heading: 'Feeling better without antibiotics',
        body: md(
          'For viral illnesses like colds, the goal is to ease symptoms while your body fights the infection:',
          '',
          '- Rest and drink plenty of fluids.',
          '- Use a humidifier, or saline nose drops or spray.',
          '- Honey can soothe a cough in adults and children 1 year and older. Never give honey to babies under 1.',
          '- Ask your pharmacist which OTC pain relievers or fever reducers are safe for you.',
          '',
          'Contact a clinician if you have trouble breathing or fast breathing, signs of dehydration, a fever lasting more than 4 days, symptoms lasting more than 10 days without getting better, symptoms that improve and then come back or get worse, or a long-term health problem that is getting worse.',
        ),
      },
      {
        heading: 'Talking with your clinician',
        body: md(
          "You don't need to ask for antibiotics, and it's fine to ask questions if they're offered:",
          '',
          '1. Is this infection caused by bacteria or a virus?',
          '2. Do I need a test, like a strep test or urine test, to be sure?',
          '3. What happens if I wait and watch?',
          '4. What side effects should I look for, and what should I do if they happen?',
          '',
          "For some conditions, like certain ear or sinus infections, your clinician may suggest watchful waiting, or a prescription to fill only if you don't improve. Tell every clinician about any antibiotic allergy and the reaction you had, so they can choose safely.",
        ),
      },
    ],
    keyTakeaways: [
      "Antibiotics treat certain bacterial infections; they don't work on colds, flu, or most sore throats.",
      'Unneeded antibiotics can cause side effects like diarrhea, allergic reactions, and C. diff.',
      'Take antibiotics exactly as prescribed, and never save or share them.',
      'Resistance means germs stop responding to antibiotics, so using them wisely protects everyone.',
    ],
    quiz: [
      {
        question: 'Which illness is an antibiotic most likely to help?',
        options: ['A common cold', 'The flu', 'Strep throat', 'A runny nose with green mucus'],
        answerIndex: 2,
        explanation:
          'Strep throat is caused by bacteria. Colds, the flu, and runny noses are caused by viruses, which antibiotics cannot treat.',
      },
      {
        question: 'What does antibiotic resistance mean?',
        options: [
          'Your body becomes allergic to antibiotics',
          'Germs change so antibiotics no longer work against them',
          'Antibiotics expire faster',
          'You need a bigger dose every year',
        ],
        answerIndex: 1,
        explanation:
          "Resistance happens when bacteria adapt and survive the drugs meant to kill them. It's the germs that change, not your body.",
      },
      {
        question: 'You have leftover antibiotic pills from last year. What should you do?',
        options: [
          'Take them the next time you feel sick',
          'Give them to a sick friend',
          'Dispose of them safely, such as at a drug take-back site',
          'Keep them in your car just in case',
        ],
        answerIndex: 2,
        explanation:
          'Leftover antibiotics may be the wrong drug or dose for a new illness. Dispose of them safely and see a clinician when you are sick.',
      },
    ],
    sources: [
      {
        title: "Healthy Habits: Antibiotic Do's and Don'ts",
        publisher: 'CDC',
        url: 'https://www.cdc.gov/antibiotic-use/about/index.html',
      },
      {
        title: 'About Antimicrobial Resistance',
        publisher: 'CDC',
        url: 'https://www.cdc.gov/antimicrobial-resistance/about/index.html',
      },
      { title: 'Manage Common Cold', publisher: 'CDC', url: 'https://www.cdc.gov/common-cold/treatment/index.html' },
      { title: 'Antibiotics', publisher: 'NIH MedlinePlus', url: 'https://medlineplus.gov/antibiotics.html' },
    ],
    askBrianPrompts: [
      'How can I tell if my sore throat needs an antibiotic?',
      'What should I do if my antibiotic gives me diarrhea?',
      "Why won't an antibiotic help my cold?",
    ],
    tags: [
      'antibiotics',
      'bacteria',
      'virus',
      'antibiotic resistance',
      'C. diff',
      'cold',
      'strep throat',
      'side effects',
      'UTI',
    ],
  },

  // ───────────────────────── Storage & disposal ─────────────────────────
  {
    id: 'medicine-storage-disposal',
    categoryId: 'medications',
    title: 'Safe Medicine Storage & Disposal',
    summary:
      'Keep medicines working and out of the wrong hands, and get rid of old ones the safe way.',
    readMinutes: 4,
    level: 'Basics',
    icon: 'archive-outline',
    callout: {
      kind: 'warning',
      text: "If a child or anyone else may have swallowed a medicine by accident, call Poison Help at 1-800-222-1222 right away, even if they seem fine. Call 911 if they collapse, have a seizure, have trouble breathing, or can't be woken up.",
    },
    sections: [
      {
        heading: 'Store medicines the right way',
        body: md(
          'How you store medicine affects how well it works:',
          '',
          '- **Follow the label.** Most medicines do best in a cool, dry place away from heat and direct sunlight. A steamy bathroom or a hot car is usually a poor choice.',
          "- **Refrigerate only if the label says so.** Some liquids and injectable medicines, including unopened insulin, need it. Ask your pharmacist how long they're good at room temperature.",
          '- **Keep medicines in their original containers** with the label, so you always know what they are and how to take them.',
          "- **Check expiration dates.** Expired medicine may not work as well or may not be safe, even if it looks fine.",
          '',
          "When you travel, keep medicines in your carry-on bag, bring a few extra days' worth in case of delays, and carry a current medicine list.",
        ),
      },
      {
        heading: 'Keep them away from kids, pets, and visitors',
        body: md(
          'Young children end up in emergency rooms every day after getting into medicines left within reach. Many medicines and vitamins, especially gummies, look like candy.',
          '',
          '- Put medicines and supplements **up, away, and out of sight** every time, even between doses.',
          "- Relock child-resistant caps until you hear the click. They help, but they aren't childproof.",
          '- Never call medicine “candy.”',
          '- Ask visitors to keep purses and bags that hold medicines out of reach.',
          '- **Lock up** opioid pain medicines and other drugs that can be misused, and keep track of how many are left.',
          '',
          'Save Poison Help, 1-800-222-1222, in your phone and share it with babysitters and other caregivers.',
        ),
      },
      {
        heading: 'Best option for old medicine: take-back',
        body: md(
          'Unused medicines at home can be taken by accident or misused. Clean out your medicine cabinet at least once a year.',
          '',
          'Drug take-back options are the best choice for most medicines:',
          '',
          '- **Year-round drop-off kiosks** at many pharmacies, hospitals, and police stations',
          '- **Prepaid mail-back envelopes,** available at some pharmacies and online, sometimes free',
          '- **National Prescription Drug Take Back Day** events run by the Drug Enforcement Administration (DEA), usually held in spring and fall',
          '',
          'To find a location, ask your pharmacist, search the DEA list of year-round drop-off locations, or call the DEA Diversion Control Division at 1-800-882-9539. Before dropping off, scratch out your name and other personal information on the label.',
        ),
      },
      {
        heading: 'No take-back nearby? Use the trash method',
        body: md(
          "If you can't get to a take-back option, most medicines can go in household trash if you do it safely:",
          '',
          '1. Take the medicine out of its original container.',
          '2. Mix it with something unappealing, like used coffee grounds, dirt, or cat litter.',
          '3. Put the mixture in a sealed plastic bag or other container that closes.',
          '4. Throw the container in your household trash.',
          '5. Scratch out your personal information on the empty bottle or package before you throw it away or recycle it.',
          '',
          'This makes the medicine less appealing to children, pets, and anyone who might go through the trash.',
        ),
      },
      {
        heading: 'The flush list and special items',
        body: md(
          "Flushing is **not** recommended for most medicines. But the FDA keeps a short flush list of medicines, mostly opioids like fentanyl, oxycodone, morphine, and methadone, that are so dangerous to someone they weren't prescribed for that flushing is safer than keeping them around. Flush them only if a take-back option isn't readily available.",
          '',
          'Other items need special handling:',
          '',
          '- **Fentanyl patches:** Even used patches hold enough medicine to harm a child or pet. Follow the disposal directions on the label, which usually say to fold the patch in half with the sticky sides together and flush it.',
          "- **Inhalers:** Don't puncture them or throw them into a fire. Check with your local trash or recycling program.",
          '- **Needles and other sharps:** Put them in a sharps container, never loose in the trash, and follow your local disposal rules.',
        ),
      },
    ],
    keyTakeaways: [
      'Store medicines in a cool, dry place in their original containers, and check expiration dates.',
      'Keep all medicines and vitamins up and away from children, and lock up opioids.',
      'Take-back sites and mail-back envelopes are the best way to get rid of most medicines.',
      'No take-back option? Mix medicine with coffee grounds or cat litter, seal it, and put it in the trash.',
      "Only flush medicines that are on the FDA's flush list.",
    ],
    quiz: [
      {
        question: 'What is the best way to get rid of most unused medicines?',
        options: [
          'Flush them down the toilet',
          'Use a drug take-back site or mail-back envelope',
          'Leave them in the cabinet',
          'Give them to a neighbor',
        ],
        answerIndex: 1,
        explanation:
          'Take-back sites and mail-back envelopes safely destroy medicines. Flushing is only for the short list of medicines the FDA names.',
      },
      {
        question: "There's no take-back option for your old allergy pills. What should you do?",
        options: [
          'Throw the full bottle in the trash as it is',
          'Mix the pills with coffee grounds or cat litter, seal them in a bag, and put it in the trash',
          'Flush them down the toilet',
          'Burn them',
        ],
        answerIndex: 1,
        explanation:
          "Mixing with something unappealing and sealing it keeps the pills away from kids, pets, and people going through trash. Allergy pills aren't on the flush list.",
      },
      {
        question: 'Where is the best place to store most medicines?',
        options: [
          'In a steamy bathroom cabinet',
          'In a hot car',
          "In a cool, dry place out of children's reach and sight",
          'On the kitchen counter for easy access',
        ],
        answerIndex: 2,
        explanation:
          'Heat and moisture can damage medicines, and anything left out can be found by children. Store them cool, dry, up, and away.',
      },
    ],
    sources: [
      {
        title: 'Where and How to Dispose of Unused Medicines',
        publisher: 'FDA',
        url: 'https://www.fda.gov/consumers/consumer-updates/where-and-how-dispose-unused-medicines',
      },
      {
        title: "Drug Disposal: FDA's Flush List for Certain Medicines",
        publisher: 'FDA',
        url: 'https://www.fda.gov/drugs/disposal-unused-medicines-what-you-should-know/drug-disposal-fdas-flush-list-certain-medicines',
      },
      {
        title: 'Drug Disposal: Drug Take-Back Options',
        publisher: 'FDA',
        url: 'https://www.fda.gov/drugs/disposal-unused-medicines-what-you-should-know/drug-disposal-drug-take-back-options',
      },
      {
        title: 'About the PROTECT Initiative',
        publisher: 'CDC',
        url: 'https://www.cdc.gov/medication-safety/protect/index.html',
      },
    ],
    askBrianPrompts: [
      'How do I find a drug take-back location near me?',
      'Is it safe to take a medicine after its expiration date?',
      'How should I store my medicines when I travel?',
    ],
    tags: [
      'storage',
      'disposal',
      'take-back',
      'expired medicine',
      'flush list',
      'child safety',
      'poison prevention',
      'opioids',
      'sharps',
    ],
  },

  // ───────────────────────── Adherence ─────────────────────────
  {
    id: 'medication-adherence-tips',
    categoryId: 'medications',
    title: 'Sticking to Your Medicines',
    summary:
      'Simple routines, reminders, and refill habits that make it easier to take medicines as prescribed, and what to do when you miss a dose.',
    readMinutes: 4,
    level: 'Basics',
    icon: 'alarm-outline',
    callout: {
      kind: 'tip',
      text: "Don't stop a prescribed medicine on your own because of side effects or cost. Call your prescriber or pharmacist first. Some medicines are dangerous to stop suddenly, and there is usually a better option.",
    },
    sections: [
      {
        heading: 'Why it matters',
        body: md(
          'Medicines only work if they are taken as prescribed. Many treatments for long-term conditions, like high blood pressure, diabetes, and high cholesterol, work quietly. You may feel the same whether you take them or not, but missed doses let the condition do damage over time.',
          '',
          'People miss doses for understandable reasons:',
          '',
          '- Forgetting, or a busy or changing schedule',
          '- Side effects',
          '- Cost',
          "- Feeling fine, or not being sure the medicine is working",
          '- A complicated schedule with many pills',
          '',
          "Knowing your reason helps you pick the right fix. Being honest with your care team about missed doses also helps them make good decisions, like not raising the dose of a medicine you haven't actually been taking.",
        ),
      },
      {
        heading: 'Build a routine',
        body: md(
          'The easiest way to remember a medicine is to tie it to something you already do every day:',
          '',
          '- Take morning medicines when you brush your teeth or make coffee.',
          '- Take medicines that go with meals at breakfast and dinner, if your label allows.',
          "- Keep bedtime medicines where you'll see them at night, but out of children's reach.",
          '',
          'Tools can help:',
          '',
          "- A **weekly pill organizer** shows at a glance whether you took today's dose.",
          '- **Phone alarms** or a reminder app can prompt you at the right times.',
          "- A **check-off chart** on the fridge, or the dose checklist on BRIAN's Home screen, lets you log each dose.",
          '- A family member or friend can be your reminder buddy.',
        ),
      },
      {
        heading: 'Never run out: refill habits',
        body: md(
          'Running out is one of the most common reasons people miss doses.',
          '',
          "- **Check your refills** each time you pick up a prescription. If it shows zero refills, contact your prescriber's office a week or more before you run out.",
          '- **Ask about 90-day supplies** and automatic refills.',
          '- **Ask about refill synchronization.** Many pharmacies can line up your refills so everything is ready on the same day.',
          '- **Plan ahead for travel and holidays,** and pack extra doses in your carry-on.',
          '',
          'In BRIAN, you can request a refill from the Meds tab, and your doctor sees the request right away.',
        ),
      },
      {
        heading: 'If you miss a dose',
        body: md(
          'It happens. What to do depends on the medicine:',
          '',
          '1. **Check the label or handout.** Many list what to do about a missed dose.',
          "2. **If you're not sure, call your pharmacist.** A common rule is to take it when you remember unless it's almost time for the next dose, but that isn't right for every medicine.",
          "3. **Don't double up** to make up for a missed dose unless your prescriber or pharmacist tells you to.",
          '4. **Write it down** so you can mention it at your next visit.',
          '',
          'Some medicines, like birth control pills, blood thinners, seizure medicines, and HIV medicines, have specific missed-dose instructions that are important to follow exactly. Ask about them when you start.',
        ),
      },
      {
        heading: 'Side effects, cost, and feeling better',
        body: md(
          'The three big reasons people stop medicines on their own all have better solutions:',
          '',
          "- **Side effects:** Tell your prescriber. They may change the dose, the timing, or the medicine. Some side effects fade after the first few weeks. Don't stop suddenly, because some medicines, including certain blood pressure, seizure, and antidepressant medicines, can cause problems if stopped abruptly.",
          '- **Cost:** Ask about generics, 90-day supplies, and assistance programs. See the lesson on saving money on prescriptions.',
          '- **Feeling better:** For many conditions, you feel better because the medicine is working. Ask your prescriber before stopping.',
          '',
          'At least once a year, bring all your medicines, including OTC products and supplements, to a visit for a full review. Ask: “Do I still need all of these?”',
        ),
      },
    ],
    keyTakeaways: [
      "Tie each medicine to a daily habit and use reminders like alarms, pill organizers, or BRIAN's dose checklist.",
      'Request refills early and ask about 90-day supplies or refill synchronization.',
      "If you miss a dose, check the label or call your pharmacist, and don't double up unless told to.",
      'Talk to your prescriber about side effects or cost instead of stopping on your own.',
    ],
    quiz: [
      {
        question: "You realize you missed this morning's dose. What's the safest first step?",
        options: [
          'Take two doses at your next dose time',
          'Check the label or ask your pharmacist what to do',
          'Skip the medicine for the rest of the week',
          'Stop the medicine for good',
        ],
        answerIndex: 1,
        explanation:
          "Missed-dose advice depends on the medicine. The label or your pharmacist can tell you whether to take it now or wait, and doubling up can be unsafe.",
      },
      {
        question: 'A medicine gives you an unpleasant side effect. What should you do?',
        options: [
          'Stop it right away without telling anyone',
          'Tell your prescriber so they can adjust the dose or switch medicines',
          'Take half doses without asking',
          'Ignore it',
        ],
        answerIndex: 1,
        explanation:
          'Your prescriber can often fix side effects by changing the dose, timing, or medicine. Stopping some medicines suddenly can be dangerous.',
      },
      {
        question: 'Which is a good way to avoid running out of a medicine?',
        options: [
          'Wait until the bottle is empty to call',
          'Ask about refill synchronization or 90-day supplies',
          'Borrow pills from a friend',
          'Skip doses to stretch your supply',
        ],
        answerIndex: 1,
        explanation:
          'Refill synchronization and 90-day supplies mean fewer trips and fewer gaps. Request refills well before you run out.',
      },
    ],
    sources: [
      {
        title: 'Taking medicine at home - create a routine',
        publisher: 'NIH MedlinePlus',
        url: 'https://medlineplus.gov/ency/patientinstructions/000613.htm',
      },
      {
        title: 'Taking multiple medicines safely',
        publisher: 'NIH MedlinePlus',
        url: 'https://medlineplus.gov/ency/patientinstructions/000883.htm',
      },
      {
        title: 'Taking Medicines Safely as You Age',
        publisher: 'National Institute on Aging (NIH)',
        url: 'https://www.nia.nih.gov/health/medicines-and-medication-management/taking-medicines-safely-you-age',
      },
    ],
    askBrianPrompts: [
      'Help me build a daily schedule for my medicines.',
      'What should I do if I miss a dose of metformin?',
      'Which kinds of medicines are risky to stop suddenly?',
    ],
    tags: [
      'adherence',
      'missed dose',
      'reminders',
      'pill organizer',
      'refills',
      'routine',
      'side effects',
      'medication review',
    ],
  },
];
