import type { Lesson } from '../types';

// Content for category 'cosmetic' — see src/lessons/types.ts for the format.
//
// Section bodies use "markdown-lite": blocks separated by a blank line, "- " bullets,
// "1. " numbered steps, and **bold**. The small helpers below keep that formatting
// consistent and the content readable.
//
// Every source URL was checked to resolve (HTTP 200 or confirmed by fetching the page)
// and to match the topic. Cosmetic lessons are intentionally balanced: benefits,
// realistic expectations, risks, how to vet providers, and costs.

/** Joins blocks (paragraphs or lists) with a blank line. */
const md = (...blocks: string[]): string => blocks.join('\n\n');

/** Builds a "- " bullet list block. */
const bullets = (...items: string[]): string => items.map((item) => `- ${item}`).join('\n');

/** Builds a "1. " numbered list block. */
const steps = (...items: string[]): string => items.map((item, i) => `${i + 1}. ${item}`).join('\n');

export const lessons: Lesson[] = [
  // ---------------------------------------------------------------------------
  // 1. Thinking about plastic surgery
  // ---------------------------------------------------------------------------
  {
    id: 'plastic-surgery-before-you-decide',
    categoryId: 'cosmetic',
    title: 'Thinking About Plastic Surgery? Start Here',
    summary:
      "How to check a surgeon's training and a facility's safety, what recovery and results really look like, what it costs, and why surgery abroad carries extra risk.",
    readMinutes: 6,
    level: 'Basics',
    icon: 'body-outline',
    callout: {
      kind: 'tip',
      text: "Cosmetic surgery is real surgery. Take your time, meet with more than one qualified surgeon, and never let a discount or a 'book today' deadline rush your decision.",
    },
    sections: [
      {
        heading: 'Cosmetic or reconstructive?',
        body: md(
          "**Cosmetic surgery** reshapes a healthy part of the body to change how it looks, such as nose reshaping, breast augmentation, eyelid surgery, liposuction, or a tummy tuck. **Reconstructive surgery** restores how the body looks or works after an injury, an illness such as cancer, or a condition someone was born with, like a cleft lip.",
          'The difference matters for cost: health insurance often helps pay for reconstructive surgery but rarely pays for cosmetic surgery.',
          "It also helps to be honest about your reasons. Surgery tends to go best when you have a specific, realistic goal that is your own. Consider waiting if you feel pressure from someone else, are in the middle of a big life change like a breakup or a loss, or hope surgery will fix how you feel about yourself overall. If worry about a small flaw takes up hours of your day, talk with a doctor or mental health professional first.",
        ),
      },
      {
        heading: 'Check the surgeon, not just the website',
        body: md(
          "In the US, any licensed physician can legally perform cosmetic procedures, whatever specialty they trained in. The title 'cosmetic surgeon' does not tell you what training someone has. Doctors certified by the American Board of Plastic Surgery have completed at least six years of surgical training after medical school, including at least three years in plastic surgery, and passed written and oral exams.",
          steps(
            "Ask: 'Are you board certified, and by which board?' For some face and eye procedures, surgeons certified in related specialties, such as ear-nose-throat or eye surgery, may also be well trained.",
            "Verify the answer on the certifying board's website, and check your state medical board for license status and any discipline.",
            'Ask how often they perform your exact procedure, and look at before-and-after photos of their own patients.',
            "Ask whether they have privileges, meaning permission, to do this procedure at a nearby hospital. Hospitals review a surgeon's training before granting privileges.",
          ),
        ),
      },
      {
        heading: 'Make sure the facility is safe',
        body: md(
          "Many cosmetic operations happen in outpatient surgery centers or surgical suites inside a doctor's office rather than in a hospital. That can be safe, as long as the setting meets recognized standards. Before you book, ask:",
          bullets(
            'Is the facility accredited by a national accrediting organization, licensed by the state, or certified by Medicare? These settings are inspected regularly.',
            'Who will give the anesthesia, and what are their credentials?',
            'What happens in an emergency? Is there a plan to transfer me to a nearby hospital?',
            'Is it safe for me to combine several procedures in one operation? Longer operations can add risk.',
            'Who checks on me after surgery, and how do I reach the team at night or on weekends?',
          ),
        ),
      },
      {
        heading: 'Know the risks and how to lower them',
        body: md(
          'Every operation carries risk. Possible problems include bleeding, infection, slow wound healing, noticeable scars, numbness, fluid buildup, reactions to anesthesia, and blood clots in the legs that can travel to the lungs. Some people are unhappy with the result and need a second operation, called a revision.',
          'You can lower your risk:',
          bullets(
            'Share your full health history and every medicine and supplement you take. Some raise bleeding risk.',
            'Stop all nicotine, including smoking, vaping, gum, and patches, for as long as your surgeon advises, often several weeks before and after surgery. Nicotine slows healing.',
            'Follow instructions about eating, drinking, and medicines before surgery.',
          ),
          '**Call 911** for chest pain, trouble breathing, or coughing up blood. Call your surgeon right away for a fever, spreading redness, pus, worsening pain, or swelling in one leg.',
          "**Considering breast implants?** The FDA says they aren't lifetime devices, so plan for more surgery and cost later. They're linked to a rare immune-system cancer (BIA-ALCL), more often with textured implants, and some people report fatigue, joint pain, or 'brain fog.' Silicone implants need MRI or ultrasound checks for silent leaks. Ask for the FDA's patient decision checklist.",
        ),
      },
      {
        heading: 'Recovery and realistic results',
        body: md(
          'Recovery usually takes longer than people expect. Incisions take about six weeks to heal, and swelling can take weeks to months to go down, so your final result may not show for a while.',
          'Plan ahead:',
          bullets(
            'Arrange a ride home and someone to stay with you at first.',
            'Line up help with children, pets, meals, and anything that needs lifting.',
            'Take the time off work that your surgeon recommends.',
            'Walk gently as directed to help prevent blood clots, but skip workouts and heavy lifting until you are cleared.',
          ),
          "Feeling down in the first weeks, while you are swollen and sore, is common and often passes. Ask your surgeon what result is realistic for your body. Surgery can improve how something looks, but it can't make it perfect.",
        ),
      },
      {
        heading: 'What it really costs',
        body: md(
          'Health insurance almost never pays for cosmetic surgery, and quoted prices often leave things out. Ask for a written, itemized estimate that includes:',
          bullets(
            "The surgeon's fee",
            'Anesthesia and facility fees',
            'Lab tests, medicines, and compression garments',
            'Follow-up visits',
            'What you would pay if you have a complication or need a revision',
          ),
          "Treatment for complications of cosmetic surgery may not be covered by insurance either, so check with your plan before you commit. Be cautious with financing offers and 'limited-time' discounts.",
          "Reconstructive surgery is different. For example, a US federal law called the Women's Health and Cancer Rights Act requires group health plans and individual policies that cover mastectomy to also cover breast reconstruction. Details vary by plan, so call your insurer. This is general information, not legal or financial advice.",
        ),
      },
      {
        heading: 'Surgery abroad: extra risks',
        body: md(
          'Some people travel to another country for cheaper surgery, often called medical tourism. The CDC and plastic surgeons warn about extra risks: infections (including hard-to-treat, drug-resistant ones), licensing and safety standards that may be lower than in the US, possible counterfeit medicines, language barriers, and little or no follow-up care once you are home. Long flights soon after surgery also raise the risk of blood clots. Fixing complications back home can cost more than the original surgery and may not be covered by insurance.',
          'If you still plan to go:',
          steps(
            "Check the surgeon's training and the facility's accreditation.",
            'See a travel medicine provider at least 4 to 6 weeks before your trip.',
            'Arrange follow-up care with a doctor at home before you leave.',
            'Get copies of all your medical records, in English, before you fly home.',
            'Ask your surgeon how long to wait before flying.',
          ),
        ),
      },
    ],
    keyTakeaways: [
      'Verify board certification, state license, and hospital privileges before you book.',
      'Choose an accredited, state-licensed, or Medicare-certified surgical facility.',
      'Plan for weeks to months of recovery, and ask what result is realistic for you.',
      "Cosmetic surgery usually isn't covered by insurance, so get an itemized written quote.",
      'Surgery abroad adds risk; arrange follow-up care at home before you go.',
    ],
    quiz: [
      {
        question: 'Which statement about cosmetic surgery in the US is true?',
        options: [
          'Only board-certified plastic surgeons are legally allowed to do cosmetic surgery',
          "The title 'cosmetic surgeon' means the doctor passed plastic surgery board exams",
          'Any licensed physician can legally perform cosmetic procedures, so you need to check their training',
          "Surgery done in a doctor's office never needs accreditation",
        ],
        answerIndex: 2,
        explanation:
          'A medical license lets a doctor perform procedures outside their specialty. That is why it pays to ask which board certified your surgeon and to verify it yourself.',
      },
      {
        question: 'Your quote for a tummy tuck seems surprisingly low. What should you ask?',
        options: [
          'Whether it includes anesthesia, facility fees, follow-up visits, and complication costs',
          'Nothing, because a low price is always a good deal',
          "Whether your health insurance will pay for it since it's surgery",
          'Whether you can book today to lock in the discount',
        ],
        answerIndex: 0,
        explanation:
          'Quotes often leave out anesthesia, facility, and follow-up costs. Insurance rarely covers cosmetic surgery, and pressure to book fast is a red flag.',
      },
      {
        question: 'According to the CDC, what should you do before traveling abroad for surgery?',
        options: [
          'Book your flight home for the day after surgery',
          'Rely on the overseas clinic to keep your records',
          'Choose the clinic with the most social media followers',
          'See a travel medicine provider at least 4 to 6 weeks before the trip',
        ],
        answerIndex: 3,
        explanation:
          'The CDC recommends a travel medicine visit 4 to 6 weeks ahead, checking credentials, planning follow-up care at home, and bringing home copies of your records.',
      },
    ],
    sources: [
      {
        title: 'Any doctor will do, right? Why board certification matters for plastic surgery',
        publisher: 'American Society of Plastic Surgeons (ASPS)',
        url: 'https://www.plasticsurgery.org/news/articles/any-doctor-will-do-right-why-board-certification-matters-for-plastic-surgery',
      },
      {
        title: 'Things to Consider Before Getting Breast Implants',
        publisher: 'FDA',
        url: 'https://www.fda.gov/medical-devices/breast-implants/things-consider-getting-breast-implants',
      },
      {
        title: 'Bounce back, babe? Why your plastic surgery recovery takes time',
        publisher: 'American Society of Plastic Surgeons (ASPS)',
        url: 'https://www.plasticsurgery.org/news/articles/bounce-back-babe-why-your-plastic-surgery-recovery-takes-time',
      },
      {
        title: 'Medical Tourism: Travel to Another Country for Medical Care',
        publisher: 'CDC',
        url: 'https://wwwnc.cdc.gov/travel/page/medical-tourism',
      },
      {
        title: "Women's Health and Cancer Rights Act (WHCRA)",
        publisher: 'CMS',
        url: 'https://www.cms.gov/cciio/programs-and-initiatives/other-insurance-protections/whcra_factsheet',
      },
    ],
    askBrianPrompts: [
      'What questions should I ask at a plastic surgery consultation?',
      'How do I check whether a surgeon is board certified?',
      'What are the warning signs of a blood clot after surgery?',
    ],
    tags: [
      'plastic surgery',
      'cosmetic surgery',
      'board certification',
      'surgeon',
      'accredited facility',
      'recovery',
      'cost',
      'insurance',
      'medical tourism',
      'breast reconstruction',
      'breast implants',
    ],
  },

  // ---------------------------------------------------------------------------
  // 2. Teeth whitening
  // ---------------------------------------------------------------------------
  {
    id: 'teeth-whitening-options',
    categoryId: 'cosmetic',
    title: 'Teeth Whitening: Options, Side Effects, and Limits',
    summary:
      "Compare whitening toothpastes, store kits, dentist-provided trays, and in-office whitening, plus why sensitivity happens and what whitening can't change.",
    readMinutes: 4,
    level: 'Basics',
    icon: 'happy-outline',
    callout: {
      kind: 'tip',
      text: 'Get a dental checkup before you whiten. Your dentist can treat cavities or gum problems first and tell you whether whitening will work on your type of stain.',
    },
    sections: [
      {
        heading: 'Why teeth change color',
        body: md(
          'Tooth color changes for two main reasons:',
          bullets(
            '**Surface stains:** Coffee, tea, red wine, and tobacco leave pigments that stick to enamel, the hard outer layer of the tooth.',
            '**Deeper discoloration:** Over time enamel gets thinner, and more of the yellowish layer underneath, called dentin, shows through. A tooth injury, certain medicines, and some cancer treatments can also darken teeth from the inside.',
          ),
          "The type of stain affects your results. Yellowish teeth usually respond well to bleaching. Brownish teeth respond less, and grayish teeth may not lighten much at all. Discoloration from medicines or an injured tooth often doesn't respond to whitening, so a dentist may suggest other options.",
        ),
      },
      {
        heading: 'Your whitening options',
        body: md(
          bullets(
            "**Whitening toothpaste:** Contains mild polishing agents that remove surface stains. It doesn't change the natural color of your teeth.",
            '**Store-bought strips, gels, and trays:** Use a lower-strength peroxide bleach than dental products, so results come more slowly.',
            '**Take-home trays from your dentist:** Custom-fitted trays with a whitening gel you wear at home. Results usually take a few days to a few weeks.',
            '**In-office (chairside) whitening:** Your dentist protects your gums and applies a stronger bleach. It often takes a single visit.',
          ),
          'If you use a store product, look for the **ADA Seal of Acceptance**, which means it was tested for safety and effectiveness. Ask your dentist which option fits your teeth and your budget.',
        ),
      },
      {
        heading: "What whitening can't change",
        body: md(
          'Bleach only works on natural teeth. It will **not** change the color of crowns, caps, veneers, bonding, or tooth-colored fillings. If you have any of these on your front teeth, whitening the teeth around them can leave a visible mismatch. Some people whiten first and later replace older dental work to match, which adds cost, so talk with your dentist before you start.',
          "Whitening also isn't permanent. Stains build up again over time, faster if you drink coffee, tea, or red wine or use tobacco, so many people need touch-ups. Whitening is cosmetic, so dental insurance usually doesn't pay for it. Ask for the full price, including any touch-up products, before you begin.",
        ),
      },
      {
        heading: 'Sensitivity and gum irritation',
        body: md(
          "The most common side effects are **tooth sensitivity** and **gum irritation**. Sensitivity happens when peroxide passes through the enamel to the dentin and irritates the tooth's nerve. It often starts in the first few days and usually fades within days after you stop. Gum irritation usually comes from gel touching the gums or trays that don't fit well.",
          'To stay comfortable:',
          bullets(
            "Follow the directions exactly. Leaving products on longer or using them more often won't help, and overuse can damage enamel and gums.",
            'If your teeth hurt, take a break. You can usually try again later.',
            "Tell your dentist if sensitivity is strong or doesn't go away. They can adjust the product or schedule.",
            'Pediatric dentists discourage cosmetic bleaching for children who still have baby teeth.',
          ),
        ),
      },
      {
        heading: 'Skip risky DIY hacks',
        body: md(
          "Social media is full of 'natural' whitening tricks. Many can hurt your teeth:",
          bullets(
            '**Lemon juice, vinegar, and fruit** are acidic and can wear away enamel.',
            "**Gritty scrubs** can scrape enamel. There's no evidence that charcoal dental products are safe or effective.",
            '**Oil pulling and turmeric** have no reliable evidence that they whiten teeth.',
          ),
          "When enamel wears down, more yellow dentin shows through, so teeth can end up looking darker and feeling more sensitive. Enamel doesn't grow back.",
          'Instead, keep stains from building up: brush twice a day for two minutes with fluoride toothpaste, clean between your teeth daily, get regular dental cleanings, cut back on coffee, tea, and red wine, and avoid tobacco.',
        ),
      },
    ],
    keyTakeaways: [
      'See your dentist first; whitening works best on yellowish surface stains.',
      "Whitening won't change crowns, veneers, bonding, or fillings.",
      'Temporary sensitivity is common, so follow directions and take breaks.',
      'Skip acidic or gritty DIY hacks, and look for the ADA Seal on store products.',
    ],
    quiz: [
      {
        question: 'You have a crown on a front tooth and whiten your other teeth. What happens to the crown?',
        options: [
          'It whitens faster than natural teeth',
          'It stays the same color, so it may not match',
          'It turns gray',
          'It needs twice as much gel',
        ],
        answerIndex: 1,
        explanation:
          'Bleach only works on natural teeth. Crowns, veneers, bonding, and tooth-colored fillings keep their color, which can create a mismatch.',
      },
      {
        question: 'What is the most common side effect of peroxide whitening?',
        options: ['Permanent tooth loss', 'New cavities', 'Temporary tooth sensitivity', 'Changes in taste'],
        answerIndex: 2,
        explanation:
          "Peroxide can reach the dentin and irritate the tooth's nerve. The sensitivity is usually temporary, and taking a break often helps.",
      },
      {
        question: "Which 'natural' whitening hack can damage your enamel?",
        options: [
          'Rubbing lemon juice on your teeth',
          'Brushing twice a day with fluoride toothpaste',
          'Rinsing with water after coffee',
          'Getting regular dental cleanings',
        ],
        answerIndex: 0,
        explanation:
          'Lemon juice is acidic and can wear away enamel. Thinner enamel lets yellow dentin show through and can make teeth more sensitive.',
      },
    ],
    sources: [
      {
        title: 'Teeth Whitening',
        publisher: 'American Dental Association (MouthHealthy)',
        url: 'https://www.mouthhealthy.org/all-topics-a-z/teeth-whitening',
      },
      {
        title: 'Natural Teeth Whitening',
        publisher: 'American Dental Association (MouthHealthy)',
        url: 'https://www.mouthhealthy.org/all-topics-a-z/natural-teeth-whitening',
      },
      {
        title: 'Whitening',
        publisher: 'American Dental Association',
        url: 'https://www.ada.org/resources/ada-library/oral-health-topics/whitening',
      },
    ],
    askBrianPrompts: [
      'Which teeth whitening option makes sense for me?',
      'Why do my teeth hurt after using whitening strips?',
      'Will whitening work if I have crowns or veneers?',
    ],
    tags: [
      'teeth whitening',
      'whitening strips',
      'dentist',
      'tooth sensitivity',
      'stains',
      'crowns',
      'veneers',
      'ADA Seal',
      'dental',
      'smile',
    ],
  },

  // ---------------------------------------------------------------------------
  // 3. Acne / clear skin
  // ---------------------------------------------------------------------------
  {
    id: 'acne-clear-skin-treatments',
    categoryId: 'cosmetic',
    title: 'Clearer Skin: How to Treat Acne',
    summary:
      'How over-the-counter benzoyl peroxide, salicylic acid, and adapalene work, how long to give them, when to see a dermatologist, and why isotretinoin needs close medical supervision.',
    readMinutes: 5,
    level: 'Basics',
    icon: 'water-outline',
    callout: {
      kind: 'tip',
      text: 'Give an acne routine 6 to 8 weeks before judging it. Switching products every few days can irritate your skin and make breakouts worse.',
    },
    sections: [
      {
        heading: 'What causes acne',
        body: md(
          'Acne starts in the pores. Extra oil and dead skin cells clog a pore, bacteria grow inside, and the area can become red and swollen. Hormones play a big role, which is why acne often shows up in the teen years and can flare with periods or pregnancy. Family history and some medicines also matter.',
          'Knowing your type helps you pick a treatment:',
          bullets(
            '**Blackheads and whiteheads:** clogged pores without much redness.',
            '**Pimples:** red bumps, sometimes with a white or yellow center.',
            "**Nodules and cysts:** deep, painful lumps under the skin. These often leave scars and need a dermatologist's care.",
          ),
          'Squeezing or picking at acne can cause scars or dark spots, so keep your hands off.',
        ),
      },
      {
        heading: 'Over-the-counter options that work',
        body: md(
          'Three ingredients have good evidence behind them:',
          bullets(
            '**Benzoyl peroxide** (washes, gels, creams) kills acne-causing bacteria. It can bleach hair, towels, pillowcases, and clothes.',
            '**Salicylic acid** (washes, pads) helps unclog pores.',
            '**Adapalene gel** is a retinoid (a vitamin A-based medicine) sold without a prescription for ages 12 and up. It helps unclog pores and keeps new clogs from forming. It is usually applied once a day at bedtime.',
          ),
          "If you're pregnant, trying to get pregnant, or breastfeeding, ask a doctor before using adapalene, and call your doctor if you become pregnant while using it.",
          'Dermatologists often suggest adapalene for blackheads and whiteheads, along with a benzoyl peroxide wash. For pimples, washing twice a day with a benzoyl peroxide or salicylic acid cleanser is a good start.',
          'Be patient. Acne may look worse during the first few weeks of adapalene, and its full benefit can take 8 to 12 weeks or longer.',
        ),
      },
      {
        heading: 'Use them without irritating your skin',
        body: md(
          steps(
            'Start slowly. The first time you use benzoyl peroxide, try a small amount on one or two small areas for 3 days. Then use it once a day and build up if your skin handles it.',
            "Wash gently with a mild cleanser in the morning, at night, and after heavy sweating. Don't scrub.",
            "Choose oil-free moisturizers and makeup labeled 'noncomedogenic,' meaning less likely to clog pores.",
            'Wear sunscreen and avoid tanning. Acne treatments can make skin more sensitive to the sun.',
          ),
          'Mild dryness, redness, and peeling are common at first. **Stop and get emergency help** if you have hives with throat tightness, trouble breathing, feeling faint, or swelling of the eyes, face, lips, or tongue. These are signs of a rare but serious allergic reaction.',
        ),
      },
      {
        heading: 'When to see a dermatologist',
        body: md(
          'Make an appointment if:',
          bullets(
            "You've used an over-the-counter treatment consistently for 6 to 8 weeks with little improvement.",
            'You have deep, painful nodules or cysts.',
            'Acne is leaving scars or dark spots.',
            'Acne is hurting your mood or confidence.',
          ),
          'A dermatologist can prescribe stronger options, such as prescription retinoids, antibiotic creams or pills, and, for some women, hormone-based treatments like certain birth control pills. Procedures such as chemical peels or laser and light treatments may also help some people. Insurance often covers acne care as a medical condition, but coverage varies by plan.',
          "**Be careful with dark-spot and 'skin lightening' creams.** The FDA says no over-the-counter skin-lightening product is FDA-approved or legally sold in the US. Some of these creams, often imported or sold online, contain mercury, which can cause mercury poisoning, or hydroquinone, which can cause rashes, facial swelling, and skin darkening that may be permanent. Ask a dermatologist about safe ways to fade dark spots.",
        ),
      },
      {
        heading: 'Isotretinoin: powerful, but closely supervised',
        body: md(
          "Isotretinoin is a prescription pill for severe acne, especially deep cysts and nodules that haven't cleared with other treatments. A course lasts several months and often leads to long-lasting clearing. It also carries serious risks, so in the US it's only available through a safety program called **iPLEDGE**.",
          bullets(
            'It can cause severe birth defects and pregnancy loss. Anyone who can get pregnant must use two forms of birth control starting 1 month before, during, and for 1 month after treatment, and have regular pregnancy tests.',
            "You'll have regular check-ins with your prescriber, usually monthly.",
            "Never share your pills, and don't donate blood during treatment or for 1 month after.",
            'Never buy isotretinoin online without a prescription.',
          ),
        ),
      },
      {
        heading: 'Isotretinoin: side effects and warning signs',
        body: md(
          bullets(
            'Common side effects include very dry skin, lips, and eyes, and nosebleeds.',
            'Tell your prescriber right away about mood changes, depression, or thoughts of hurting yourself. In a crisis, call or text **988**.',
            '**Stop taking it and call your prescriber or get emergency care right away** for a headache with blurred vision, nausea, or vomiting; chest pain, trouble breathing, or fainting; severe stomach pain or yellow skin or eyes; or a rash with peeling or blisters. **Call 911** for a seizure or severe trouble breathing.',
            "Tell your prescriber about every medicine, vitamin, and supplement you take. Don't start vitamin A supplements or St. John's wort without asking first. St. John's wort can make hormonal birth control work less well.",
            'Avoid waxing, laser treatments, and dermabrasion during treatment and for 6 months after. Isotretinoin raises the risk of scarring from them.',
          ),
        ),
      },
    ],
    keyTakeaways: [
      'Benzoyl peroxide, salicylic acid, and adapalene are proven over-the-counter options.',
      "Start slowly, wash gently, wear sunscreen, and don't pick.",
      'Give treatment 6 to 8 weeks; see a dermatologist for deep, painful, or scarring acne.',
      'Isotretinoin requires a prescriber, the iPLEDGE program, and strict pregnancy prevention.',
    ],
    quiz: [
      {
        question: "How long should you usually try an over-the-counter acne treatment before deciding it isn't working?",
        options: ['2 to 3 days', 'About 1 week', '6 to 8 weeks', 'At least a year'],
        answerIndex: 2,
        explanation:
          "Acne treatments work slowly. Dermatologists suggest giving a treatment 6 to 8 weeks, and adapalene's full benefit can take 8 to 12 weeks.",
      },
      {
        question: 'Which acne ingredient can bleach towels, pillowcases, and hair?',
        options: ['Benzoyl peroxide', 'Salicylic acid', 'Adapalene', 'Sunscreen'],
        answerIndex: 0,
        explanation:
          'Benzoyl peroxide can bleach hair and colored fabrics, so keep it away from them and let it dry before it touches your pillowcase.',
      },
      {
        question: 'Why is isotretinoin only available through the iPLEDGE program in the US?',
        options: [
          "It's sold over the counter",
          'It only works for teenagers',
          "It's a type of antibiotic",
          'It can cause severe birth defects, so pregnancy must be prevented',
        ],
        answerIndex: 3,
        explanation:
          'Isotretinoin can seriously harm a developing baby. iPLEDGE requires birth control and pregnancy tests for anyone who can get pregnant, plus regular check-ins.',
      },
    ],
    sources: [
      {
        title: 'How to treat different types of acne',
        publisher: 'American Academy of Dermatology (AAD)',
        url: 'https://www.aad.org/public/diseases/acne/DIY/types-breakouts',
      },
      {
        title: 'FDA Warns Consumers of Skin Products Containing Mercury and/or Hydroquinone',
        publisher: 'FDA',
        url: 'https://www.fda.gov/consumers/health-fraud-scams/fda-warns-consumers-skin-products-containing-mercury-andor-hydroquinone',
      },
      {
        title: 'Adapalene',
        publisher: 'NIH MedlinePlus',
        url: 'https://medlineplus.gov/druginfo/meds/a604001.html',
      },
      {
        title: 'Benzoyl Peroxide Topical',
        publisher: 'NIH MedlinePlus',
        url: 'https://medlineplus.gov/druginfo/meds/a601026.html',
      },
      {
        title: 'Isotretinoin',
        publisher: 'NIH MedlinePlus',
        url: 'https://medlineplus.gov/druginfo/meds/a681043.html',
      },
    ],
    askBrianPrompts: [
      'Help me build a simple acne routine with benzoyl peroxide and adapalene.',
      'What should I ask a dermatologist about isotretinoin?',
      'Could any of my medications be making my acne worse?',
    ],
    tags: [
      'acne',
      'pimples',
      'benzoyl peroxide',
      'salicylic acid',
      'adapalene',
      'retinoid',
      'isotretinoin',
      'iPLEDGE',
      'dermatologist',
      'skin care',
      'dark spots',
      'skin lightening',
    ],
  },

  // ---------------------------------------------------------------------------
  // 4. Botox & fillers
  // ---------------------------------------------------------------------------
  {
    id: 'botox-fillers-injectables',
    categoryId: 'cosmetic',
    title: 'Botox and Fillers: Benefits, Risks, and Safe Choices',
    summary:
      "What wrinkle-relaxing injections and dermal fillers can and can't do, how long results last, the rare but serious risks, and how to avoid counterfeit products and untrained injectors.",
    readMinutes: 5,
    level: 'Intermediate',
    icon: 'eyedrop-outline',
    callout: {
      kind: 'warning',
      text: 'After any cosmetic injection, call 911 for vision changes, trouble breathing, swallowing, or speaking, new muscle weakness, or signs of a stroke. Get medical care right away for unusual pain or skin near the injection that turns white, gray, or blue.',
    },
    sections: [
      {
        heading: 'Two different treatments',
        body: md(
          'People often lump these together, but they work differently.',
          bullets(
            "**Botulinum toxin** is often called a 'wrinkle relaxer.' Botox is one well-known brand, and there are several FDA-approved products. Tiny doses temporarily relax specific muscles, softening lines caused by movement, like frown lines between the brows, forehead lines, and crow's feet. Results usually appear within days and last about 3 to 4 months, sometimes longer.",
            '**Dermal fillers** are FDA-regulated medical devices injected under the skin to add volume or smooth folds in areas like the lips, cheeks, lines around the mouth, and backs of the hands. Most are slowly absorbed by the body and last from several months to two years or more, depending on the product and area. A few are permanent.',
          ),
          'Neither stops aging. Keeping results means repeat visits, and the cost adds up.',
        ),
      },
      {
        heading: 'Common, usually mild side effects',
        body: md(
          'Most side effects are mild and short-lived.',
          bullets(
            '**Wrinkle relaxers:** swelling, redness, soreness, or bruising where the needle went in; an occasional mild headache; and rarely, a temporarily droopy eyelid or brow if the medicine affects a nearby muscle.',
            '**Fillers:** bruising, redness, swelling, pain, tenderness, itching, or rash, which usually clear within 1 to 2 weeks.',
          ),
          'Fillers can also cause firm lumps or bumps under the skin. These can show up weeks, months, or even years later and may need treatment, so tell your provider about any new lump.',
          "Follow your injector's aftercare instructions. For wrinkle relaxers, that often means not rubbing the treated area and waiting a couple of hours before hard exercise.",
        ),
      },
      {
        heading: 'Rare but serious risks',
        body: md(
          "**Filler in a blood vessel.** If filler is accidentally injected into a blood vessel, it can block blood flow. That can cause skin damage and scarring, vision problems including blindness, or a stroke. It's rare, and an injector's deep knowledge of facial anatomy lowers the risk. Hyaluronic acid fillers, the most common type, can often be dissolved with an enzyme called hyaluronidase, so ask whether your injector keeps it on hand and has an emergency plan.",
          "**Toxin spreading.** FDA-approved botulinum toxin products carry a boxed warning, the FDA's strongest, because the effect can spread beyond the injection site. Warning signs include blurry or double vision, drooping eyelids, trouble swallowing or breathing, and muscle weakness. They can appear hours to weeks after the shot. This is very rare with approved products used correctly and much more likely with counterfeit or mishandled products.",
        ),
      },
      {
        heading: 'Counterfeits and unsafe settings',
        body: md(
          'In 2023 and 2024, the CDC and FDA investigated harmful reactions in several states among people who got counterfeit or mishandled botulinum toxin, often from unlicensed or untrained people in homes or spas. Many were hospitalized. To protect yourself:',
          bullets(
            'Get injections only from a licensed, trained health professional in a healthcare setting, not at a party, home, or salon.',
            'Ask whether the product is FDA-approved and bought from a licensed source. Ask to see the labeled vial and watch the dose being drawn up.',
            'Never buy fillers or toxins online, and never inject yourself.',
            "Avoid needle-free 'hyaluron pens.' The FDA has not approved needle-free devices for injecting fillers.",
            'Injectable silicone and fillers for enlarging the buttocks or breasts are not FDA-approved.',
            "Treat a price far below everyone else's as a warning sign.",
          ),
        ),
      },
      {
        heading: 'Choosing an injector',
        body: md(
          'Ask before you book:',
          steps(
            "What is your license, and what training do you have in this procedure? Who supervises you? Rules on who may inject vary by state, and you can look up licenses on your state's licensing board website.",
            'How often do you do this treatment, and can I see photos of your own patients?',
            'Which product will you use, how long should it last in this area, and what will it cost per visit and per year?',
            "What are the risks for the area I want treated, and what will you do if there's a complication, including after hours?",
          ),
          "Share your full health history, including pregnancy or breastfeeding, nerve or muscle conditions, allergies, past fillers, and medicines or supplements that thin the blood. Cosmetic injections aren't covered by insurance. Some medical uses of botulinum toxin, such as treating heavy sweating, may be covered depending on your plan.",
        ),
      },
      {
        heading: 'If something feels wrong',
        body: md(
          'Know the warning signs before you leave the office.',
          bullets(
            '**Call 911** for trouble breathing, swallowing, or speaking; vision changes; new weakness; or signs of stroke, such as face drooping, arm weakness, or slurred speech.',
            '**Get medical care right away** for unusual or worsening pain, or skin near the injection that turns white, gray, or blue.',
            '**Call your injector** about new lumps, spreading redness, fever, or anything that worries you.',
          ),
          "You can also report problems to the FDA's MedWatch program at 1-800-FDA-1088.",
        ),
      },
    ],
    keyTakeaways: [
      'Wrinkle relaxers last about 3 to 4 months, and most fillers last months to a couple of years, so results need upkeep.',
      'Most side effects are mild, but filler in a blood vessel can cause blindness or stroke.',
      'Choose a licensed, trained injector using an FDA-approved product in a medical setting.',
      'Never buy injectables online, inject yourself, or use needle-free pens.',
      'Call 911 for vision changes, trouble breathing or swallowing, or stroke signs.',
    ],
    quiz: [
      {
        question: 'About how long do cosmetic botulinum toxin results usually last?',
        options: ['1 to 2 weeks', 'About 3 to 4 months', 'Permanently', 'About 5 years'],
        answerIndex: 1,
        explanation:
          'Results typically last about 3 to 4 months, sometimes longer, so people who want to keep the effect need repeat treatments.',
      },
      {
        question: 'Which is the safest choice?',
        options: [
          'A licensed, trained provider using an FDA-approved product from a labeled vial',
          "A discounted 'Botox party' at a friend's house",
          'Filler you buy online and inject yourself',
          'A needle-free hyaluron pen sold on social media',
        ],
        answerIndex: 0,
        explanation:
          'Counterfeit or mishandled products and untrained injectors have caused serious harm. A licensed provider using an FDA-approved product in a medical setting is the safest option.',
      },
      {
        question: 'After a filler injection, which symptom needs immediate medical attention?',
        options: [
          'Mild bruising',
          'Slight swelling for a day',
          'A little tenderness when touched',
          'Vision changes or skin near the injection turning white or blue',
        ],
        answerIndex: 3,
        explanation:
          'These can be signs that filler is blocking a blood vessel, which can lead to tissue damage, blindness, or stroke. Get emergency care right away.',
      },
    ],
    sources: [
      {
        title: 'Botulinum toxin therapy: FAQs',
        publisher: 'American Academy of Dermatology (AAD)',
        url: 'https://www.aad.org/public/cosmetic/wrinkles/botulinum-toxin-faqs',
      },
      {
        title: 'Fillers: FAQs',
        publisher: 'American Academy of Dermatology (AAD)',
        url: 'https://www.aad.org/public/cosmetic/wrinkles/fillers-faqs',
      },
      {
        title: 'Dermal Fillers (Soft Tissue Fillers)',
        publisher: 'FDA',
        url: 'https://www.fda.gov/medical-devices/aesthetic-cosmetic-devices/dermal-fillers-soft-tissue-fillers',
      },
      {
        title: 'How to Stay Safe When Getting Botulinum Toxin Injections',
        publisher: 'CDC',
        url: 'https://www.cdc.gov/botulism/prevention/botulinum-toxin-injections.html',
      },
      {
        title: 'Counterfeit Version of Botox Found in Multiple States',
        publisher: 'FDA',
        url: 'https://www.fda.gov/drugs/drug-alerts-and-statements/counterfeit-version-botox-found-multiple-states',
      },
    ],
    askBrianPrompts: [
      "What's the difference between Botox and fillers for my goals?",
      'What questions should I ask an injector before treatment?',
      'Which side effects are normal after filler, and which are emergencies?',
    ],
    tags: [
      'Botox',
      'botulinum toxin',
      'dermal fillers',
      'injectables',
      'wrinkles',
      'lip filler',
      'hyaluronic acid',
      'counterfeit',
      'injector',
      'cosmetic safety',
    ],
  },

  // ---------------------------------------------------------------------------
  // 5. Lasers & skin treatments
  // ---------------------------------------------------------------------------
  {
    id: 'laser-hair-removal-resurfacing',
    categoryId: 'cosmetic',
    title: 'Laser Treatments: Hair Removal and Skin Resurfacing',
    summary:
      'How cosmetic lasers work, what results to expect, how to prepare, extra precautions for darker skin tones, and the danger of high-strength numbing creams.',
    readMinutes: 5,
    level: 'Intermediate',
    icon: 'flash-outline',
    callout: {
      kind: 'warning',
      text: 'Numbing creams can be dangerous. The FDA warns against over-the-counter products with more than 4% lidocaine, and against spreading numbing cream over large areas, on broken skin, or under plastic wrap. Too much can cause an irregular heartbeat, seizures, and trouble breathing. Use only what your provider gives you or approves, and keep it away from children. Call 911 for a seizure, trouble breathing, fainting, or a racing or irregular heartbeat after using a numbing product. If you used too much or a child swallowed some, call Poison Help at 1-800-222-1222.',
    },
    sections: [
      {
        heading: 'How cosmetic lasers work',
        body: md(
          'Lasers send concentrated light into the skin. The light turns into heat that targets something specific, such as the dark pigment in a hair follicle, brown sun spots, tiny blood vessels, or layers of aging or scarred skin.',
          'Dermatologists use lasers for unwanted hair, wrinkles, sun damage, acne scars, redness and broken blood vessels, and tattoo removal. Most treatments take several sessions, and results build gradually.',
          'Lasers are real medical devices. Possible risks include pain, burns, blisters, infection, scarring, lasting changes in skin color, and results that fall short of what you hoped. The right laser, the right settings, and a skilled operator make a big difference.',
        ),
      },
      {
        heading: 'Laser hair removal',
        body: md(
          'The laser targets pigment in the hair, so it works best on dark hair. Light blond, red, gray, or white hair is harder to treat.',
          bullets(
            '**Sessions:** Most people need several treatments, often spaced 4 to 6 weeks apart.',
            '**Results:** Expect a large, long-lasting reduction in hair rather than guaranteed permanent removal. Hair that grows back is usually less noticeable, and touch-up sessions may be needed. Facial hair in women can return because of hormones.',
            "**Side effects:** Redness, swelling, and discomfort for 1 to 3 days are common. Blisters, infection, scarring, and permanent skin color changes are less common and more likely when treatment isn't done properly.",
            "**Cost:** It's considered cosmetic, so insurance doesn't cover it.",
          ),
        ),
      },
      {
        heading: 'Laser skin resurfacing',
        body: md(
          'Resurfacing lasers treat wrinkles, sun damage, uneven tone, and some scars.',
          bullets(
            '**Ablative lasers** remove thin outer layers of skin and heat the layers below, which prompts new collagen growth. They can give more noticeable results for deeper wrinkles and acne scars, but expect downtime: skin is often red and swollen for several days and can take up to about two weeks to heal as it peels.',
            "**Non-ablative lasers** heat deeper skin without removing the surface, so there's little or no downtime. They usually take a series of treatments, and changes are more gradual.",
          ),
          'During healing, follow your aftercare plan closely, including gentle cleansing, moisturizer, and strict sun protection. If you get cold sores, tell your provider. Treating skin around the mouth can trigger an outbreak, and your provider may suggest steps to prevent one.',
        ),
      },
      {
        heading: 'Extra care for darker skin tones',
        body: md(
          'People of every skin color can have laser treatments. But darker skin has more pigment that can absorb laser energy, so it is more prone to burns and to dark or light spots afterward.',
          'To lower your risk:',
          bullets(
            "Choose a provider with lots of experience treating your skin tone. Ask how many treatments they've done on people with skin like yours.",
            "Ask which laser they'll use and why. Some lasers and settings are better suited to darker skin.",
            'Expect a cautious, step-by-step approach, sometimes starting with a test spot, rather than the most aggressive settings.',
            'Be extra careful about sun protection before and after treatment.',
          ),
          "If a provider can't answer these questions clearly, look elsewhere.",
        ),
      },
      {
        heading: 'Before and after your treatment',
        body: steps(
          "Don't tan, indoors or outdoors, and skip self-tanners before treatment.",
          'Wear a broad-spectrum, water-resistant sunscreen with SPF 30 or higher every day.',
          'Tell your provider about every medicine and supplement you take, including aspirin and isotretinoin (now or in the past). Mention any history of keloids or other raised scars, or cold sores.',
          'Wear the protective eyewear you are given. Everyone in the room needs eye protection during laser treatment.',
          'Use numbing cream only as your provider directs, and keep it away from children.',
          'Afterward, follow your aftercare instructions and call your provider about blisters, oozing, severe pain, or signs of infection.',
        ),
      },
      {
        heading: 'Choosing where to go',
        body: md(
          'The American Academy of Dermatology recommends a board-certified dermatologist for laser treatments, and many plastic surgeons offer them too. Lasers are also common at medical spas. There, ask who will operate the laser, what training they have, and whether a physician supervises on site. State rules on who can use cosmetic lasers vary.',
          'Before you commit, ask:',
          bullets(
            'Is this the best treatment for my concern, and what results are realistic?',
            "How many sessions will I need, and what's the total cost?",
            "What's the recovery time?",
            'Which side effects are most likely for my skin type?',
          ),
          'Cosmetic laser treatments are usually paid out of pocket.',
        ),
      },
    ],
    keyTakeaways: [
      'Most laser treatments take several sessions, and results are gradual.',
      'Ablative resurfacing gives bigger changes with more downtime; non-ablative has little or none.',
      'Darker skin can be treated safely by experienced providers using the right laser and settings.',
      'Avoid tanning, wear SPF 30+ sunscreen, and share all your medicines, including isotretinoin.',
      'Skip high-strength numbing creams unless your provider directs their use.',
    ],
    quiz: [
      {
        question: 'Why is provider experience especially important for people with darker skin?',
        options: [
          "Lasers can't be used on darker skin",
          'Darker skin is more prone to burns and dark spots, so the right laser and settings matter',
          'Darker skin always needs fewer sessions',
          'Insurance requires a specialist',
        ],
        answerIndex: 1,
        explanation:
          'People of all skin colors can have laser treatments, but darker skin needs an experienced provider who chooses the right laser and settings to avoid burns and color changes.',
      },
      {
        question: 'What did the FDA warn consumers about in 2024?',
        options: [
          'Using sunscreen after laser treatments',
          'Wearing eye protection during laser treatments',
          'Numbing creams with more than 4% lidocaine, or used over large areas or under wraps',
          'Shaving before laser hair removal',
        ],
        answerIndex: 2,
        explanation:
          'Too much lidocaine absorbed through the skin can cause an irregular heartbeat, seizures, and trouble breathing. Use numbing products only as your provider directs.',
      },
      {
        question: 'Compared with non-ablative lasers, ablative resurfacing usually involves:',
        options: [
          'More downtime, often up to about two weeks of healing',
          'No downtime at all',
          'No risk of skin color changes',
          'A single quick session with no aftercare',
        ],
        answerIndex: 0,
        explanation:
          'Ablative lasers remove outer layers of skin, so results can be more dramatic but healing takes longer. Non-ablative lasers have little or no downtime.',
      },
    ],
    sources: [
      {
        title: 'Laser hair removal: FAQs',
        publisher: 'American Academy of Dermatology (AAD)',
        url: 'https://www.aad.org/public/cosmetic/hair-removal/laser-hair-removal-faqs',
      },
      {
        title: 'Laser hair removal: Preparation',
        publisher: 'American Academy of Dermatology (AAD)',
        url: 'https://www.aad.org/public/cosmetic/hair-removal/laser-hair-removal-preparation',
      },
      {
        title: 'Skin conditions that lasers can treat',
        publisher: 'American Academy of Dermatology (AAD)',
        url: 'https://www.aad.org/public/diseases/a-z/skin-conditions-lasers-treat',
      },
      {
        title: 'Why laser skin resurfacing is a powerful facial rejuvenation tool',
        publisher: 'American Society of Plastic Surgeons (ASPS)',
        url: 'https://www.plasticsurgery.org/news/blog/why-laser-skin-resurfacing-is-a-powerful-facial-rejuvenation-tool',
      },
      {
        title: 'FDA Warns Consumers to Avoid Certain Topical Pain Relief Products Due to Potential for Dangerous Health Effects',
        publisher: 'FDA',
        url: 'https://www.fda.gov/news-events/press-announcements/fda-warns-consumers-avoid-certain-topical-pain-relief-products-due-potential-dangerous-health',
      },
    ],
    askBrianPrompts: [
      'Is laser hair removal a good option for my skin and hair color?',
      "What's the difference between ablative and non-ablative laser resurfacing?",
      'What questions should I ask before a laser treatment?',
    ],
    tags: [
      'laser hair removal',
      'laser resurfacing',
      'lasers',
      'skin of color',
      'darker skin',
      'numbing cream',
      'lidocaine',
      'sun protection',
      'dermatologist',
      'wrinkles',
    ],
  },

  // ---------------------------------------------------------------------------
  // 6. Hair loss
  // ---------------------------------------------------------------------------
  {
    id: 'hair-loss-treatment-options',
    categoryId: 'cosmetic',
    title: 'Hair Loss: Causes and Treatment Options',
    summary:
      'Why hair thins or falls out, how over-the-counter minoxidil and prescription finasteride work, what results to expect, and why finding the cause comes first.',
    readMinutes: 5,
    level: 'Basics',
    icon: 'person-outline',
    callout: {
      kind: 'tip',
      text: 'Some hair loss is a sign of a treatable health problem, like thyroid disease or low iron. See a clinician or board-certified dermatologist to find the cause, especially if hair loss is sudden, patchy, or comes with other symptoms.',
    },
    sections: [
      {
        heading: 'Why hair falls out',
        body: md(
          'Losing some hair every day is normal. Noticeable thinning or shedding has many possible causes:',
          bullets(
            '**Hereditary hair loss** is very common. Men often notice a receding hairline or thinning on top; women usually see a widening part or thinning over the top of the head.',
            '**Shedding after a stressor:** A few months after childbirth, a high fever, surgery, a serious illness, or major stress, many hairs can fall out at once. This usually improves on its own.',
            '**Medical causes:** thyroid disease, low iron or other nutrients, scalp infections, and alopecia areata, which causes round bald patches.',
            '**Medicines and treatments,** including some cancer treatments.',
            '**Hair care:** tight braids, ponytails, or extensions and harsh chemical treatments. Over time, damage from constant pulling can become permanent.',
          ),
        ),
      },
      {
        heading: 'Get the cause checked',
        body: md(
          'See your doctor or a board-certified dermatologist if:',
          bullets(
            "Hair loss is sudden or patchy, or you're losing a lot.",
            'Your scalp is itchy, painful, red, scaly, or scarred.',
            'You have other symptoms, such as tiredness, weight changes, or irregular periods.',
            "It started after a new medicine. Don't stop a prescription on your own; ask your prescriber first.",
            "It's affecting how you feel.",
          ),
          'Expect questions about your health, family history, and hair care, plus a close look at your scalp. You may need blood tests, such as thyroid or iron levels, and sometimes a small scalp biopsy.',
          'For hereditary hair loss, timing matters: the earlier you start treatment, the better your chances of keeping hair and seeing regrowth.',
        ),
      },
      {
        heading: 'Minoxidil (over the counter)',
        body: md(
          "Minoxidil is a liquid or foam you apply to the scalp. It's sold without a prescription for hereditary hair loss in adults, with products labeled for men and for women. Follow the directions on the product meant for you.",
          bullets(
            '**Be patient:** It takes at least 4 months, and sometimes up to a year, to see results.',
            '**Keep going:** It only works while you use it. Most new hair falls out within a few months of stopping.',
            "**More isn't better:** Using extra won't speed results and can increase side effects.",
            "**Side effects:** Scalp itching, dryness, or flaking are most common. Don't apply it to a sunburned or irritated scalp.",
          ),
          'Stop using it and call your doctor right away if you have a racing heartbeat, lightheadedness, sudden weight gain, swelling in your hands, feet, face, or belly, or trouble breathing when lying down. **Call 911** for chest pain, severe trouble breathing, or fainting.',
        ),
      },
      {
        heading: 'Finasteride (prescription pill, mainly for men)',
        body: md(
          'Finasteride is a daily pill for male pattern hair loss. It blocks a hormone in the scalp that shrinks hair follicles, which can slow hair loss and help some hair regrow.',
          bullets(
            '**Timeline:** Improvement takes at least 3 months, and a full year shows whether it is working.',
            '**Keep going:** Hair gained is usually lost within 12 months of stopping.',
            '**Side effects:** Some men have lower sex drive or erection or ejaculation problems, which can continue after stopping. Report breast changes or lumps, and tell your prescriber right away about depression or thoughts of self-harm. In a crisis, call or text **988**.',
            '**Lab tests:** It lowers PSA test results used in prostate cancer screening, so tell your doctor you take it.',
            "**Women and pregnancy:** It's approved only for men, though dermatologists sometimes prescribe it for women who can't get pregnant. Anyone who is or may become pregnant shouldn't touch crushed or broken tablets, which can harm a developing baby.",
          ),
          'The FDA has also warned that compounded (custom-mixed by a pharmacy) finasteride sprays and solutions for the scalp are not FDA-approved and have been linked to similar side effects.',
        ),
      },
      {
        heading: 'Other options',
        body: md(
          bullets(
            '**Spironolactone:** a prescription pill some dermatologists use for female pattern hair loss. How well it works varies. It can cause birth defects, so you must not get pregnant while taking it.',
            "**Low-dose minoxidil pills:** prescribed by some dermatologists 'off-label,' meaning for a use not listed on the FDA label. They need a prescriber's monitoring because they can affect blood pressure and heart rate.",
            '**Corticosteroid shots:** often used to regrow hair in alopecia areata patches.',
            '**Platelet-rich plasma (PRP):** injections made from your own blood, usually monthly for 3 months and then every 3 to 6 months. Research is still limited.',
            '**Laser caps and combs, microneedling:** limited studies, and results vary.',
            '**Hair transplant surgery:** a lasting option for pattern baldness when done by a trained surgeon.',
          ),
          "Treatment for hereditary hair loss is usually considered cosmetic, so insurance often won't pay; coverage varies. Be skeptical of supplements that promise regrowth. They rarely help unless you're actually low in a nutrient.",
        ),
      },
    ],
    keyTakeaways: [
      'Find the cause first; some hair loss signals a treatable health problem.',
      'Minoxidil takes at least 4 months to work and only works while you keep using it.',
      'Finasteride is a prescription pill, mainly for men; sexual side effects can sometimes last after stopping, and mood changes need prompt attention.',
      'Starting treatment early gives you the best chance of keeping your hair.',
    ],
    quiz: [
      {
        question: 'How long does minoxidil applied to the scalp usually take before you see results?',
        options: ['About 1 week', 'At least 4 months, sometimes up to a year', 'Overnight', 'Only after you stop using it'],
        answerIndex: 1,
        explanation:
          'Minoxidil works slowly. You need at least 4 months of regular use, and sometimes up to a year, to judge whether it helps.',
      },
      {
        question: 'What usually happens if you stop minoxidil or finasteride?',
        options: [
          'The new hair stays forever',
          'Hair grows back faster',
          'Hair gained during treatment is usually lost within months',
          'Nothing changes',
        ],
        answerIndex: 2,
        explanation:
          'Both only work while you take them. Most regrown hair is lost within months after stopping, so think of them as long-term treatments.',
      },
      {
        question: 'Who should not touch crushed or broken finasteride tablets?',
        options: [
          'People who are pregnant or may become pregnant',
          'Anyone over 40',
          'People with a dry scalp',
          'Anyone who uses minoxidil',
        ],
        answerIndex: 0,
        explanation:
          'Finasteride can be absorbed through the skin and may harm a developing baby, so people who are or may become pregnant should avoid handling crushed or broken tablets.',
      },
    ],
    sources: [
      {
        title: 'Hair loss: Diagnosis and treatment',
        publisher: 'American Academy of Dermatology (AAD)',
        url: 'https://www.aad.org/public/diseases/hair-loss/treatment/diagnosis-treat',
      },
      {
        title: 'Hair loss: Who gets and causes',
        publisher: 'American Academy of Dermatology (AAD)',
        url: 'https://www.aad.org/public/diseases/hair-loss/causes/18-causes',
      },
      {
        title: 'Minoxidil Topical',
        publisher: 'NIH MedlinePlus',
        url: 'https://medlineplus.gov/druginfo/meds/a689003.html',
      },
      {
        title: 'Finasteride',
        publisher: 'NIH MedlinePlus',
        url: 'https://medlineplus.gov/druginfo/meds/a698016.html',
      },
      {
        title: 'FDA alerts health care providers, compounders and consumers of potential risks associated with compounded topical finasteride products',
        publisher: 'FDA',
        url: 'https://www.fda.gov/drugs/human-drug-compounding/fda-alerts-health-care-providers-compounders-and-consumers-potential-risks-associated-compounded',
      },
    ],
    askBrianPrompts: [
      'What could be causing my hair loss?',
      'What are the pros and cons of minoxidil versus finasteride?',
      'What should I ask a dermatologist about hair loss?',
    ],
    tags: [
      'hair loss',
      'thinning hair',
      'minoxidil',
      'finasteride',
      'alopecia',
      'pattern baldness',
      'dermatologist',
      'hair transplant',
      'PRP',
    ],
  },

  // ---------------------------------------------------------------------------
  // 7. Med spa safety checklist
  // ---------------------------------------------------------------------------
  {
    id: 'med-spa-safety-checklist',
    categoryId: 'cosmetic',
    title: 'Med Spa Safety Checklist',
    summary:
      'Before you book injections, lasers, peels, body contouring, or weight-loss shots at a medical spa, use this checklist to vet the people, the products, and the plan if something goes wrong.',
    readMinutes: 5,
    level: 'Basics',
    icon: 'checkbox-outline',
    callout: {
      kind: 'tip',
      text: "A med spa treatment is a medical procedure, even in a spa setting. If a place won't clearly tell you who is treating you and what product they're using, walk away.",
    },
    sections: [
      {
        heading: 'What a med spa is',
        body: md(
          'A medical spa, or med spa, combines a spa-like setting with medical treatments such as wrinkle-relaxer injections, fillers, lasers, chemical peels, microneedling, and sometimes weight-loss shots or IV drips.',
          'Because these are medical procedures, a med spa should be overseen by a licensed physician with deep training in the treatments offered, ideally a board-certified dermatologist, plastic surgeon, or facial plastic surgeon. But in many places the medical director can be a doctor from any specialty, and rules about who may perform each treatment and how closely a doctor must supervise vary by state.',
          "That's why it's up to you to ask questions. A good med spa will welcome them.",
        ),
      },
      {
        heading: 'Check the people',
        body: bullets(
          '**Who is the medical director?** Ask about their specialty and board certification, and how often they are on site.',
          "**Who will do my treatment?** Ask their license type, such as physician, physician assistant, nurse practitioner, or registered nurse, and look it up on your state's licensing board website.",
          '**How much experience do they have** with this exact treatment and with people who have my skin tone?',
          "**Will the person I meet at my consultation be the one who treats me?** You shouldn't be switched to someone else on the day of your appointment.",
          "**What happens if there's a complication?** Can the provider manage it, and which doctor or hospital would take over if needed?",
        ),
      },
      {
        heading: 'Check the products and the room',
        body: md(
          bullets(
            "**FDA-approved products only.** Ask what product you'll get and whether it's FDA-approved for this use. For injections, ask to see the labeled box or vial and watch the dose being drawn up.",
            '**Licensed sources.** Products should come from licensed US distributors, not online sellers.',
            "**Weight-loss shots.** GLP-1 medicines such as semaglutide (Ozempic, Wegovy) and tirzepatide (Mounjaro, Zepbound) need a real medical evaluation and a prescription. Ask whether you're getting an FDA-approved brand-name product. 'Compounded' versions, mixed by a pharmacy rather than made by the drug company, are not FDA-approved or reviewed for safety or quality, and the FDA has linked them to dosing errors and hospitalizations. Counterfeit versions also exist. Fill prescriptions only at a state-licensed pharmacy.",
            '**A clean, clinical space.** Look for fresh needles, hand washing or gloves, and eye protection during laser treatments.',
          ),
          "**Red flags:** unlabeled syringes, 'Botox parties' in homes, prices far below everyone else's, and pressure to buy a package today.",
        ),
      },
      {
        heading: 'What a good consultation looks like',
        body: md(
          'Before any treatment, a qualified provider should:',
          steps(
            'Ask about your health history, medicines and supplements, allergies, pregnancy, past cosmetic treatments, and problems like cold sores or raised scars.',
            'Examine the area and explain your options, including doing less or nothing.',
            'Explain realistic results, how long they last, the risks, and the recovery time.',
            'Give you the total cost in writing, including touch-ups or follow-up sessions.',
            'Have you sign a consent form only after answering all your questions.',
          ),
          'It also helps to ask yourself a few questions first: What do I want from this treatment? How much downtime and risk am I willing to accept? How much can I afford, including upkeep?',
        ),
      },
      {
        heading: 'Fat freezing and other body contouring',
        body: md(
          "Non-surgical body contouring uses cold, heat, light, sound waves, or magnetic fields to shrink small fat bulges, tone muscles, or smooth cellulite. The FDA notes that it doesn't treat obesity or cause weight loss, not everyone responds, results may be temporary, and you may need several sessions.",
          bullets(
            "**Fat freezing (cryolipolysis):** don't have it if you have a cold-sensitivity condition, such as Raynaud's disease or cold-induced hives. Rarely, the treated fat grows larger and hardens instead of shrinking, which may need surgery to fix.",
            "**Radiofrequency (heat), ultrasound, and magnetic devices:** these shouldn't be used if you have a pacemaker or implanted defibrillator, or metal under the skin from an implant or injury. If you have an IUD, ask your doctor first.",
            'Tell your provider about all your medicines, including isotretinoin in the past 6 months, and if you are pregnant or breastfeeding.',
          ),
          'Liposuction is surgery, not a med spa treatment. It belongs in an accredited surgical facility.',
        ),
      },
      {
        heading: 'If something goes wrong',
        body: md(
          'Before your treatment, ask who to call after hours and save the number.',
          bullets(
            '**Call 911** for trouble breathing or swallowing, vision changes, chest pain, a seizure, or signs of stroke, such as face drooping, arm weakness, or slurred speech.',
            '**Get medical care right away** for severe or worsening pain, or skin that turns white, gray, or blue.',
            '**Contact your provider the same day** about blisters, spreading redness, fever, pus, or new lumps.',
          ),
          "Keep a record of the product name, lot number, date, and who treated you. Report bad reactions to the FDA's MedWatch program at 1-800-FDA-1088. If you're worried about who treated you or how, you can also contact your state's medical or nursing board.",
        ),
      },
      {
        heading: 'Costs and the fine print',
        body: md(
          "Cosmetic treatments at med spas are almost always paid out of pocket; health insurance doesn't cover them. Before you pay:",
          bullets(
            "Get an itemized price, including how many sessions or units you'll likely need and what upkeep will cost each year.",
            'Read the refund and cancellation policy before buying packages or memberships.',
            "Read financing terms carefully, especially 'deferred interest' offers that can charge you back interest if you don't pay in full on time.",
            "Remember that a deal isn't a deal if it comes with an untrained injector or a questionable product.",
          ),
          "This checklist is general education, not medical or legal advice. If you're unsure whether a treatment is right for you, ask a clinician you trust.",
        ),
      },
    ],
    keyTakeaways: [
      'Med spa treatments are medical procedures, and supervision rules vary by state, so ask.',
      'Know who supervises and who treats you, and verify their licenses.',
      'Insist on FDA-approved products from labeled packaging in a clean, clinical setting.',
      'Get a real consultation, written costs, and an after-hours plan before treatment.',
      'Report bad reactions to FDA MedWatch, and call 911 for serious symptoms.',
    ],
    quiz: [
      {
        question: 'Which of these is a red flag at a med spa?',
        options: [
          'The injector shows you the labeled vial before treatment',
          "You can look up the provider's license on your state board website",
          "Injections offered at a party in someone's home at a steep discount",
          'You get a written estimate before treatment',
        ],
        answerIndex: 2,
        explanation:
          'Counterfeit or mishandled products given in homes and other non-medical settings have caused serious harm. The other choices are signs of a careful, transparent practice.',
      },
      {
        question: 'According to the American Society of Plastic Surgeons, who should oversee a med spa?',
        options: [
          'Anyone with a business license',
          'A licensed physician with specialized training in the treatments offered',
          'A product sales representative',
          "No one, because med spa treatments aren't medical",
        ],
        answerIndex: 1,
        explanation:
          'Ideally a board-certified dermatologist, plastic surgeon, or facial plastic surgeon. Rules vary by state, so ask who the medical director is and how involved they are.',
      },
      {
        question: 'Where can you report a bad reaction to a cosmetic injection or device?',
        options: [
          "The FDA's MedWatch program",
          "Only the med spa's online review page",
          'Your car insurance company',
          "The product's social media account",
        ],
        answerIndex: 0,
        explanation:
          'MedWatch (1-800-FDA-1088) collects reports of problems with drugs and medical devices, including fillers and botulinum toxin. Your state licensing board handles concerns about the provider.',
      },
    ],
    sources: [
      {
        title: 'How to Choose the Right Medical Spa for You',
        publisher: 'American Society of Plastic Surgeons (ASPS)',
        url: 'https://www.plasticsurgery.org/patient-safety/how-to-choose-the-right-medical-spa-for-you',
      },
      {
        title: 'Non-Invasive Body Contouring Technologies',
        publisher: 'FDA',
        url: 'https://www.fda.gov/medical-devices/aesthetic-cosmetic-devices/non-invasive-body-contouring-technologies',
      },
      {
        title: 'How to Stay Safe When Getting Botulinum Toxin Injections',
        publisher: 'CDC',
        url: 'https://www.cdc.gov/botulism/prevention/botulinum-toxin-injections.html',
      },
      {
        title: 'FDA’s Concerns with Unapproved GLP-1 Drugs Used for Weight Loss',
        publisher: 'FDA',
        url: 'https://www.fda.gov/drugs/drug-alerts-and-statements/fdas-concerns-unapproved-glp-1-drugs-used-weight-loss',
      },
      {
        title: 'MedWatch: The FDA Safety Information and Adverse Event Reporting Program',
        publisher: 'FDA',
        url: 'https://www.fda.gov/safety/medwatch-fda-safety-information-and-adverse-event-reporting-program',
      },
    ],
    askBrianPrompts: [
      'What questions should I ask a med spa before booking?',
      'How can I check whether an injector is licensed in my state?',
      'Are weight-loss shots from a med spa safe?',
    ],
    tags: [
      'med spa',
      'medical spa',
      'cosmetic safety',
      'checklist',
      'injector',
      'license',
      'counterfeit',
      'MedWatch',
      'weight-loss shots',
      'consultation',
      'GLP-1',
      'body contouring',
      'fat freezing',
      'CoolSculpting',
    ],
  },

  // ---------------------------------------------------------------------------
  // 8. LASIK & vision correction surgery
  // ---------------------------------------------------------------------------
  {
    id: 'lasik-vision-correction-surgery',
    categoryId: 'cosmetic',
    title: 'LASIK and Other Vision Correction Surgery',
    summary:
      'Who is a good candidate for laser eye surgery, the real risks like dry eye and night glare, how to choose a surgeon, and what recovery and costs look like.',
    readMinutes: 5,
    level: 'Intermediate',
    icon: 'eye-outline',
    callout: {
      kind: 'tip',
      text: "LASIK is elective and permanent. Take your time, get a full eye exam, and be wary of '20/20 or your money back' ads and package deals. As the FDA puts it, there are never any guarantees in medicine.",
    },
    sections: [
      {
        heading: 'What LASIK does',
        body: md(
          'LASIK is laser eye surgery that reshapes the cornea, the clear front window of the eye, so light focuses better. It treats nearsightedness, farsightedness, and astigmatism. The surgeon makes a thin flap in the cornea, uses a laser to reshape the tissue underneath, and lays the flap back down. Your eye is numbed with drops, and the surgery usually takes less than 30 minutes.',
          'Other laser surgeries work a bit differently. PRK reshapes the surface of the cornea without making a flap, so it may suit people with thin corneas or a very active job or lifestyle.',
          "The goal is to need glasses or contacts less, not perfect vision. About 9 in 10 people end up seeing between 20/20 and 20/40 without glasses. LASIK can't prevent the normal need for reading glasses that starts around age 40.",
        ),
      },
      {
        heading: 'Are you a good candidate?',
        body: md(
          'An eye surgeon (ophthalmologist) should examine your eyes and measure your corneas before you decide. You may be a good candidate if:',
          bullets(
            "You're at least 18. No lasers are approved for LASIK in anyone younger, and vision is more likely to be stable after 21.",
            "Your glasses or contact lens prescription hasn't changed in the past year.",
            'Your corneas are thick enough, and your eyes are otherwise healthy.',
          ),
          'LASIK may not be right for you if you:',
          bullets(
            'Are pregnant or breastfeeding, or have diabetes that is not well controlled. These can make your vision change.',
            'Have severe dry eye, thin or cone-shaped corneas (keratoconus), corneal scars, advanced glaucoma, or a cataract.',
            'Have an autoimmune disease or a weak immune system, or take medicines, such as steroids, that can slow healing.',
            "Play contact sports with blows to the face, or have a job that doesn't allow some eye surgeries. Check with your employer or military branch first.",
          ),
        ),
      },
      {
        heading: 'Know the risks',
        body: md(
          'Most people are happy with their results, and serious problems are rare. Still, know the risks before you decide:',
          bullets(
            '**Dry eyes and changing vision:** almost everyone has these at first. They usually fade within about a month, but for some people they last longer or become permanent.',
            '**Night vision problems:** glare, halos, or starbursts around lights, and trouble seeing in dim light or fog. People with large pupils may be at higher risk.',
            '**Under- or over-correction:** you may still need glasses or contacts, or a second surgery.',
            "**Rare but serious:** infection, problems with the flap, or vision loss that glasses or contacts can't fix, including, very rarely, blindness.",
          ),
          "If you're happy with your glasses or contacts, sticking with them is a perfectly good choice.",
        ),
      },
      {
        heading: 'Choosing a surgeon',
        body: md(
          "The FDA urges you to compare surgeons and not to choose based on price alone. Ask:",
          steps(
            'How many LASIK surgeries have you done with this laser, and what are your results, including complications?',
            'Is the laser FDA-approved for my type and amount of vision problem?',
            "Can I read the laser maker's patient information booklet?",
            'Who will handle my checkups before and after surgery?',
            'Should both eyes be done on the same day? It is convenient, but the FDA says it carries more risk than treating one eye at a time.',
          ),
          "Be wary of '20/20 or your money back' promises, package deals, and pressure to book fast. If you're considering monovision, where one eye is set for distance and the other for reading, try it with contact lenses first.",
        ),
      },
      {
        heading: 'Before and after surgery',
        body: md(
          steps(
            'Stop wearing contact lenses before your first exam, because they change the shape of your cornea: soft lenses for 2 weeks, toric soft or rigid gas permeable lenses for at least 3 weeks, and hard lenses for at least 4 weeks.',
            'Tell your surgeon about all your health conditions, eye problems, and medicines, including over-the-counter ones.',
            'Skip creams, lotions, makeup, and perfume the day before surgery. They can raise the risk of infection.',
            'Arrange a ride home, because your vision will be blurry.',
            "Afterward, wear your eye shield as directed and don't rub your eye. Plan to take a few days off work.",
            'Keep every follow-up visit, starting within 24 to 48 hours. Ask for a copy of your eye measurements, because you may need them for cataract surgery later.',
          ),
          "**Call your eye surgeon right away**, without waiting for your next visit, if you have severe pain or your vision or other symptoms get worse instead of better. If you can't reach them, go to an emergency room.",
        ),
      },
      {
        heading: 'Costs and insurance',
        body: md(
          "LASIK is elective, so most health insurance won't pay for it. Ask for a written price that covers the exam, surgery on each eye, follow-up visits, eye drops, and a touch-up surgery (called an enhancement) if your result falls short.",
          'Be cautious with financing offers and deals that sound too good to be true. The FDA notes they usually are. This is general information, not financial advice.',
        ),
      },
    ],
    keyTakeaways: [
      "LASIK reshapes the cornea to reduce the need for glasses or contacts, but it can't prevent needing reading glasses after about 40.",
      'Good candidates are 18 or older, with a stable prescription and healthy corneas and eyes.',
      'Dry eyes and night glare are common at first and can last for some people.',
      "Compare experienced surgeons, and be wary of '20/20 or your money back' deals.",
      "Most insurance won't pay, so get a written price that includes follow-up care and touch-ups.",
    ],
    quiz: [
      {
        question: 'Which person is most likely a good candidate for LASIK?',
        options: [
          'A 16-year-old who wants to stop wearing glasses',
          'A 30-year-old with healthy eyes whose prescription has been stable for over a year',
          'Someone whose prescription changed a lot in the past six months',
          'Someone with severe dry eye',
        ],
        answerIndex: 1,
        explanation:
          'No lasers are approved for LASIK in people under 18. A stable prescription and healthy eyes matter, while changing vision and severe dry eye can lead to poor results.',
      },
      {
        question: 'How long should you usually stop wearing soft contact lenses before your LASIK evaluation?',
        options: ['There is no need to stop', 'About 2 weeks', 'One day', 'Six months'],
        answerIndex: 1,
        explanation:
          'Contact lenses change the shape of the cornea. The FDA advises stopping soft lenses for 2 weeks, and rigid or hard lenses for 3 to 4 weeks or more, so the measurements are accurate.',
      },
      {
        question: "What's a realistic expectation after LASIK?",
        options: [
          'Guaranteed 20/20 vision for life',
          'Never needing reading glasses as you age',
          'Some dry eye and glare at first, which usually improve',
          'No follow-up visits',
        ],
        answerIndex: 2,
        explanation:
          'Dry eyes, glare, and halos are common early on and usually improve, though they can last for some people. No one can guarantee 20/20 vision, and most people need reading glasses after about 40.',
      },
    ],
    sources: [
      {
        title: 'When is LASIK not for me?',
        publisher: 'FDA',
        url: 'https://www.fda.gov/medical-devices/lasik/when-lasik-not-me',
      },
      {
        title: 'What are the risks and how can I find the right doctor for me?',
        publisher: 'FDA',
        url: 'https://www.fda.gov/medical-devices/lasik/what-are-risks-and-how-can-i-find-right-doctor-me',
      },
      {
        title: 'What should I expect before, during, and after surgery?',
        publisher: 'FDA',
        url: 'https://www.fda.gov/medical-devices/lasik/what-should-i-expect-during-and-after-surgery',
      },
      {
        title: 'LASIK — Laser Eye Surgery',
        publisher: 'American Academy of Ophthalmology',
        url: 'https://www.aao.org/eye-health/treatments/lasik',
      },
      {
        title: 'What Is Photorefractive Keratectomy (PRK)?',
        publisher: 'American Academy of Ophthalmology',
        url: 'https://www.aao.org/eye-health/treatments/photorefractive-keratectomy-prk',
      },
    ],
    askBrianPrompts: [
      'Am I likely to be a good candidate for LASIK?',
      "What's the difference between LASIK and PRK?",
      'What questions should I ask a LASIK surgeon?',
    ],
    tags: [
      'LASIK',
      'laser eye surgery',
      'vision correction',
      'refractive surgery',
      'PRK',
      'nearsighted',
      'dry eye',
      'ophthalmologist',
      'eye surgery',
      'contact lenses',
    ],
  },

  // ---------------------------------------------------------------------------
  // 9. Cosmetic dentistry: veneers, bonding, clear aligners
  // ---------------------------------------------------------------------------
  {
    id: 'cosmetic-dentistry-veneers-aligners',
    categoryId: 'cosmetic',
    title: 'Cosmetic Dentistry: Veneers, Bonding, and Clear Aligners',
    summary:
      "How bonding, veneers, crowns, and clear aligners can change your smile, which choices are permanent, the risks of mail-order aligners and unlicensed 'veneer technicians,' and what insurance may cover.",
    readMinutes: 4,
    level: 'Basics',
    icon: 'star-outline',
    callout: {
      kind: 'tip',
      text: 'Start with a dental checkup. A dentist should treat cavities or gum disease before any cosmetic work, because veneers placed over unhealthy teeth can make problems worse.',
    },
    sections: [
      {
        heading: 'Your options at a glance',
        body: md(
          bullets(
            '**Bonding:** the dentist attaches tooth-colored material directly to a tooth to repair chips, close small gaps, or cover stains. Unlike veneers, it usually needs little or no enamel removed.',
            '**Veneers:** thin, custom-made shells that cover the front of a tooth to hide chips, stains, gaps, or crooked or uneven shapes.',
            '**Crowns:** caps that cover the whole tooth. They are often used for teeth that are weak, broken, badly discolored, or badly shaped.',
            '**Braces or clear aligners:** slowly move teeth into better positions to fix crooked or crowded teeth and bite problems.',
          ),
          'Ask your dentist which option fits your teeth and your goals. Sometimes whitening, or doing less, is enough.',
        ),
      },
      {
        heading: 'Veneers: a permanent choice',
        body: md(
          '**Porcelain veneers** are strong, long-lasting, and natural-looking, and they usually cost more. **Composite veneers** are made of tooth-colored filling material. They may need less enamel removed and fewer visits, and they are easier to repair, but they stain and wear more easily.',
          'Before you commit:',
          bullets(
            "**It's not reversible.** Enamel is removed to place veneers, and enamel doesn't grow back.",
            'Veneers can chip, crack, wear down, or come loose over time and may need to be repaired or replaced.',
            'They may not be a good choice if you clench or grind your teeth or have a deep overbite.',
            'You can still get cavities under or around a veneer, so keep brushing twice a day with fluoride toothpaste and cleaning between your teeth.',
          ),
        ),
      },
      {
        heading: 'Only trust a licensed dentist',
        body: md(
          "Some people who call themselves 'veneer technicians' offer veneers without a dentist. The American Dental Association warns that veneers placed by unlicensed people can cause infection and nerve damage, and may be put over teeth that have decay or gum disease. Check that your provider is licensed to practice dentistry in your state before you commit.",
          'Wherever you go, ask:',
          steps(
            'Are my teeth and gums healthy enough for this?',
            'How much of my natural tooth will be removed?',
            'How long should this last, and what will repairs or replacements cost?',
            'Can I see before-and-after photos of your own patients?',
          ),
        ),
      },
      {
        heading: 'Clear aligners and braces',
        body: md(
          'Healthy teeth can be straightened at any age. Clear aligners are thin plastic trays custom-made for your mouth. Each set is usually worn for about a week, at least 22 hours a day, and moves your teeth a tiny bit at a time. You take them out to eat or drink and to brush and floss.',
          bullets(
            'Aligners are not right for every case. Some problems are treated more predictably with braces, or with both.',
            'Mild soreness is common for the first few days.',
            'Treatment with braces usually takes 1 to 3 years. Afterward, you wear a retainer to keep teeth from shifting back.',
            'Dental plans with orthodontic coverage usually cover braces and clear aligners the same way, but plans vary.',
          ),
        ),
      },
      {
        heading: 'Be careful with mail-order aligners',
        body: md(
          'Some companies sell aligners directly to consumers, with little or no in-person care from a dentist. The American Dental Association warns that moving teeth without a full exam can lead to bone loss, lost teeth, receding gums, bite problems, jaw pain, and other permanent damage. Fixing those problems can cost more than regular dental care.',
          bullets(
            "Get an in-person exam with X-rays from a dentist or orthodontist before any teeth straightening. X-rays can't be done at home.",
            'Choose treatment that includes regular in-person checkups.',
            'If a mail-order company shut down during your treatment, a local dentist or orthodontist can help you finish.',
          ),
        ),
      },
      {
        heading: 'Costs and insurance',
        body: md(
          "Veneers and bonding done to improve how teeth look are considered cosmetic, so dental insurance usually won't pay unless the work is medically necessary. Ask for a written estimate that lists every tooth, any temporary veneers, and likely repair or replacement costs over time.",
          'Be cautious about traveling abroad for cheaper veneers or crowns. As with surgery abroad, follow-up care is hard to arrange, and fixing problems back home can be costly and may not be covered. This is general information, not financial advice.',
        ),
      },
    ],
    keyTakeaways: [
      'See a dentist first. Cavities and gum disease need treatment before cosmetic work.',
      'Veneers are permanent because enamel is removed, and they may need repair or replacement over time.',
      "Only a licensed dentist should place veneers. Avoid unlicensed 'veneer technicians.'",
      'Clear aligners are worn at least 22 hours a day, and a retainer keeps results in place.',
      'Get an in-person exam with X-rays before any teeth straightening, including mail-order aligners.',
    ],
    quiz: [
      {
        question: 'Why is getting veneers a permanent decision?',
        options: [
          'Veneers can never chip or break',
          "Enamel is removed from your teeth to place them, and it doesn't grow back",
          'Veneers stop your teeth from growing',
          'Insurance requires you to keep them',
        ],
        answerIndex: 1,
        explanation:
          'Placing veneers removes some enamel, so the treatment is not reversible. Veneers can also chip, crack, or loosen and need repair or replacement over time.',
      },
      {
        question: 'How many hours a day are clear aligners usually worn?',
        options: ['Only at night', 'About 1 hour', 'At least 22 hours', 'Only on weekends'],
        answerIndex: 2,
        explanation:
          'Aligners work by applying steady, gentle pressure. They are typically worn at least 22 hours a day and taken out only to eat, drink, brush, and floss.',
      },
      {
        question: 'What should happen before you start straightening your teeth?',
        options: [
          'Order an at-home kit to save money',
          'An in-person exam with X-rays by a dentist or orthodontist',
          'Filing down your teeth',
          'Nothing, because aligners work for everyone',
        ],
        answerIndex: 1,
        explanation:
          "Moving teeth without a full exam can lead to bone loss, lost teeth, receding gums, bite problems, and jaw pain. X-rays can't be done at home.",
      },
    ],
    sources: [
      {
        title: 'Veneers',
        publisher: 'American Dental Association (MouthHealthy)',
        url: 'https://www.mouthhealthy.org/all-topics-a-z/veneers',
      },
      {
        title: '8 Great Ways to Improve Your Smile',
        publisher: 'American Dental Association (MouthHealthy)',
        url: 'https://www.mouthhealthy.org/ways-to-improve-smile',
      },
      {
        title: 'Do-it-yourself (DIY) Dentistry',
        publisher: 'American Dental Association (MouthHealthy)',
        url: 'https://www.mouthhealthy.org/all-topics-a-z/diy-dentistry',
      },
      {
        title: 'Braces',
        publisher: 'American Dental Association (MouthHealthy)',
        url: 'https://www.mouthhealthy.org/all-topics-a-z/braces',
      },
      {
        title: 'Clear Aligners',
        publisher: 'American Association of Orthodontists',
        url: 'https://aaoinfo.org/treatments/aligners/',
      },
    ],
    askBrianPrompts: [
      'Should I choose bonding, veneers, or a crown for a chipped front tooth?',
      'Are clear aligners or braces a better fit for my teeth?',
      'What should I ask a dentist before getting veneers?',
    ],
    tags: [
      'veneers',
      'bonding',
      'crowns',
      'clear aligners',
      'Invisalign',
      'braces',
      'orthodontist',
      'cosmetic dentistry',
      'mail-order aligners',
      'dentist',
    ],
  },
];
