import type { Lesson } from '../types';

// Content for category 'insurance' — see src/lessons/types.ts for the format.
// US-only, general information (not legal, tax, or financial advice). Dollar amounts and dates are
// time-sensitive: they reflect figures published by HealthCare.gov, Medicare.gov, CMS, and IRS as of
// September 2026 and must be reviewed each plan year. Every source URL was checked to resolve.

/** Joins markdown-lite blocks (paragraphs and lists) with a blank line. */
const md = (...blocks: string[]): string => blocks.join('\n\n');
/** Builds a "- " bullet list (one bullet per line). */
const bullets = (...items: string[]): string => items.map((item) => `- ${item}`).join('\n');
/** Builds a "1. " numbered list (one step per line). */
const steps = (...items: string[]): string => items.map((item, i) => `${i + 1}. ${item}`).join('\n');

export const lessons: Lesson[] = [
  // ---------------------------------------------------------------------------
  {
    id: 'insurance-vocabulary',
    categoryId: 'insurance',
    title: 'Health Insurance Words, Decoded',
    summary:
      'Premium, deductible, copay, coinsurance, and out-of-pocket maximum — what they mean and how they add up to what you actually pay.',
    readMinutes: 4,
    level: 'Basics',
    icon: 'book-outline',
    callout: {
      kind: 'tip',
      text: "This lesson covers US health insurance. Exact amounts depend on your plan — check your plan's Summary of Benefits and Coverage (a standard plan summary your insurer or employer must give you on request).",
    },
    sections: [
      {
        heading: 'Premium: the price of having insurance',
        body: md(
          "Your **premium** is what you pay to have your plan, usually every month. You pay it whether or not you use any care. With job-based insurance, it's often taken out of your paycheck.",
          'Missing premium payments can cause you to lose coverage, so set up reminders or automatic payments.',
          'In general, plans with **lower premiums** have **higher costs when you get care**, and plans with higher premiums have lower costs when you get care. The best choice depends on how much care you expect to need.',
        ),
      },
      {
        heading: 'Deductible: what you pay first',
        body: md(
          'Your **deductible** is how much you pay for covered care each year before your plan starts sharing the cost. With a $2,000 deductible, you pay the first $2,000 of covered services yourself.',
          'Important exceptions:',
          bullets(
            'Most plans cover many **preventive services** — like certain screenings and vaccines — at no cost when you use an in-network provider, even before you meet your deductible.',
            'Many plans cover some services, like office visits, with just a copay before the deductible.',
            'Some plans have a separate deductible for prescription drugs.',
            'Family plans often have both an individual and a family deductible.',
          ),
        ),
      },
      {
        heading: 'Copays and coinsurance: your share of each bill',
        body: md(
          'After you meet your deductible (and sometimes before), you share costs with your plan:',
          bullets(
            'A **copayment (copay)** is a fixed amount, like $30 for a doctor visit.',
            '**Coinsurance** is a percentage of the cost, like 20%.',
          ),
          "Coinsurance is based on the plan's **allowed amount** — the price your plan has agreed to pay for a service. If the allowed amount for a visit is $100 and your coinsurance is 20%, you pay $20 once you've met your deductible. Before you meet it, you'd pay the full $100.",
        ),
      },
      {
        heading: 'Out-of-pocket maximum: your safety net',
        body: md(
          "The **out-of-pocket maximum** (or limit) is the most you'll pay for covered, in-network care in a plan year. Your deductible, copays, and coinsurance all count toward it. Once you reach it, your plan pays 100% of covered in-network services for the rest of the plan year.",
          "It does **not** include your premiums, care your plan doesn't cover, or out-of-network charges above the allowed amount.",
          'For Marketplace plans, the limit can be no more than **$10,600 for one person or $21,200 for a family in 2026**. It rises to $12,000 and $24,000 in 2027. Many plans set lower limits.',
        ),
      },
      {
        heading: 'Putting it all together: an example',
        body: md(
          'Say your plan has a $2,000 deductible, 20% coinsurance, and a $5,000 out-of-pocket maximum. You need surgery with an allowed amount of $10,000.',
          steps(
            'You pay the first **$2,000** (your deductible).',
            'You pay 20% of the remaining $8,000, which is **$1,600** (your coinsurance).',
            'Your total is **$3,600**. Your plan pays the other $6,400.',
          ),
          "If you needed more care later that year, you'd pay at most $1,400 more before hitting your $5,000 maximum. After that, covered in-network care costs you nothing more that plan year. Your monthly premiums are separate and still due.",
        ),
      },
      {
        heading: "Other words you'll see",
        body: bullets(
          '**In-network / out-of-network:** Providers with (or without) a contract with your plan. In-network care usually costs much less.',
          '**Allowed amount:** The most your plan will pay for a covered service. Also called the negotiated rate.',
          '**Balance billing:** When an out-of-network provider bills you for the difference between their charge and the allowed amount.',
          '**Prior authorization:** Approval your plan may require before certain services or drugs.',
          "**Formulary:** Your plan's list of covered prescription drugs.",
          '**Explanation of Benefits (EOB):** A summary from your plan showing what was billed, what the plan paid, and what you may owe. It is not a bill.',
        ),
      },
    ],
    keyTakeaways: [
      "Premiums are what you pay to have insurance, whether or not you use care.",
      'The deductible is what you pay first each year; many preventive services are free even before you meet it.',
      'Copays are flat fees; coinsurance is a percentage of the allowed amount.',
      "The out-of-pocket maximum caps your yearly costs for covered in-network care — premiums don't count toward it.",
    ],
    quiz: [
      {
        question:
          "You've met your deductible, your coinsurance is 20%, and the allowed amount for a test is $300. What do you pay?",
        options: ['$20', '$60', '$240', '$300'],
        answerIndex: 1,
        explanation: '20% of $300 is $60. Your plan pays the remaining $240.',
      },
      {
        question: 'Which of these counts toward your out-of-pocket maximum?',
        options: [
          'Your monthly premiums',
          "Services your plan doesn't cover",
          'Your deductible, copays, and coinsurance for covered in-network care',
          'Out-of-network charges above the allowed amount',
        ],
        answerIndex: 2,
        explanation:
          "Deductibles, copays, and coinsurance for covered in-network care count. Premiums, non-covered services, and balance bills don't.",
      },
      {
        question: 'Before you meet your deductible, which care is often covered at no cost in-network?',
        options: ['Many preventive screenings and vaccines', 'An MRI', 'Surgery', 'A hospital stay'],
        answerIndex: 0,
        explanation:
          "Most plans must cover a set of preventive services at no cost in-network, even before the deductible. Check your plan's list, since $0 isn't guaranteed for every service.",
      },
    ],
    sources: [
      {
        title: 'Deductible - Glossary',
        publisher: 'HealthCare.gov',
        url: 'https://www.healthcare.gov/glossary/deductible/',
      },
      {
        title: 'Coinsurance - Glossary',
        publisher: 'HealthCare.gov',
        url: 'https://www.healthcare.gov/glossary/co-insurance/',
      },
      {
        title: 'Out-of-pocket maximum/limit - Glossary',
        publisher: 'HealthCare.gov',
        url: 'https://www.healthcare.gov/glossary/out-of-pocket-maximum-limit/',
      },
      {
        title: 'Preventive health services',
        publisher: 'HealthCare.gov',
        url: 'https://www.healthcare.gov/coverage/preventive-care-benefits/',
      },
      {
        title: 'Health insurance terms you should know',
        publisher: 'CMS',
        url: 'https://www.cms.gov/initiatives/your-patient-rights/medical-bill-rights/get-help/medical-bill-guides-resources/health-insurance-terms-you-should-know',
      },
    ],
    askBrianPrompts: [
      'Can you explain how my deductible and coinsurance work with an example?',
      "What's the difference between a copay and coinsurance?",
      "Why don't my premiums count toward my out-of-pocket maximum?",
    ],
    tags: [
      'premium',
      'deductible',
      'copay',
      'coinsurance',
      'out-of-pocket maximum',
      'allowed amount',
      'insurance terms',
      'EOB',
      'preventive care',
      'formulary',
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'insurance-plan-types',
    categoryId: 'insurance',
    title: 'HMO, PPO, EPO, POS, and HDHP Explained',
    summary:
      'Plan types set the rules for which doctors you can see, whether you need referrals, and how you share costs. Here is how to compare them.',
    readMinutes: 3,
    level: 'Intermediate',
    icon: 'layers-outline',
    callout: {
      kind: 'tip',
      text: "Plan labels don't tell the whole story, and rules vary by insurer and state. Before you enroll, check the plan's provider directory, drug list, and Summary of Benefits and Coverage.",
    },
    sections: [
      {
        heading: 'Why plan type matters',
        body: md(
          "A plan's type mostly describes its **network rules**: which doctors and hospitals you can use, whether you need a referral to see a specialist, and whether any out-of-network care is covered.",
          'In general, plans with tighter networks tend to have lower premiums, while plans with more freedom to choose tend to cost more.',
          "Whatever the plan type, if your plan covers emergency care (Marketplace plans must), it can't require prior approval or charge you a higher copay or coinsurance for using an out-of-network ER.",
        ),
      },
      {
        heading: 'HMO and EPO: stay in the network',
        body: md(
          '**HMO (Health Maintenance Organization)**',
          bullets(
            'Usually covers care only from doctors and hospitals in its network, except in emergencies.',
            'You typically choose a primary care provider who coordinates your care and gives referrals to specialists.',
            'May require you to live or work in its service area.',
          ),
          '**EPO (Exclusive Provider Organization)**',
          bullets(
            'Covers services only from in-network providers, except in emergencies.',
            'Many EPOs let you see in-network specialists without a referral, but check your plan.',
          ),
          'Both tend to have lower premiums. They work best when your preferred doctors are in the network.',
        ),
      },
      {
        heading: 'PPO and POS: more flexibility',
        body: md(
          '**PPO (Preferred Provider Organization)**',
          bullets(
            'You pay less when you use in-network providers.',
            "You can see out-of-network providers without a referral, but you'll pay more and may be balance billed.",
          ),
          '**POS (Point of Service)**',
          bullets(
            'You pay less when you use in-network providers.',
            'You need a referral from your primary care doctor to see a specialist.',
            'Some out-of-network care may be covered, at a higher cost.',
          ),
          'These plans often have higher premiums in exchange for more choice.',
        ),
      },
      {
        heading: 'HDHP: high deductible, tax-free savings',
        body: md(
          "A **high-deductible health plan (HDHP)** isn't really a network type — it can be an HMO, PPO, or another type. What sets it apart is the cost structure: a lower monthly premium with a higher deductible.",
          'HDHPs that meet IRS rules are called **HSA-eligible**, because they let you put pre-tax money in a Health Savings Account. For 2026, an HSA-eligible plan must have a deductible of at least **$1,700 for one person or $3,400 for a family**. Preventive care is still covered before the deductible.',
          'On the Marketplace, all Bronze and Catastrophic plans work with HSAs.',
        ),
      },
      {
        heading: 'How to choose: a step-by-step check',
        body: steps(
          "**List your doctors, hospitals, and medicines.** Check each plan's provider directory and drug list (formulary).",
          '**Think about how much care you expect.** Ongoing conditions, a planned surgery, or a pregnancy often point to a plan with lower out-of-pocket costs.',
          "**Estimate your total yearly cost:** 12 months of premiums plus what you'd likely pay in deductibles, copays, and coinsurance. Treat the out-of-pocket maximum as your worst case.",
          '**Check referral rules.** Do you want to see specialists without asking your primary care provider first?',
          '**Consider travel.** If you spend time in another state, see how the plan covers care there.',
          '**Look for extras,** like telehealth, nurse lines, or programs for chronic conditions.',
        ),
      },
    ],
    keyTakeaways: [
      'HMOs and EPOs generally cover only in-network care, except emergencies.',
      'PPOs cover some out-of-network care at a higher cost; POS plans require referrals for specialists.',
      'An HDHP has lower premiums and a higher deductible, and can be paired with an HSA.',
      'Compare total yearly cost — premiums plus expected out-of-pocket costs — not just the premium.',
    ],
    quiz: [
      {
        question: 'Which plan type usually lets you see out-of-network doctors without a referral, at a higher cost?',
        options: ['HMO', 'EPO', 'PPO', 'None of them'],
        answerIndex: 2,
        explanation:
          'PPOs cover out-of-network care at a higher cost and usually do not require referrals. HMOs and EPOs generally cover only in-network care except emergencies.',
      },
      {
        question: 'You have an HMO and want to see a cardiologist. What do you usually need?',
        options: [
          'Nothing — just book the visit',
          'A referral from your primary care provider',
          'A letter from your employer',
          'A second insurance plan',
        ],
        answerIndex: 1,
        explanation:
          "Most HMOs require a referral from your primary care provider before specialist visits. Without it, the plan may not pay.",
      },
      {
        question: "What's the main feature of an HSA-eligible high-deductible health plan?",
        options: [
          'A lower premium and a higher deductible, with the option to open a Health Savings Account',
          'No monthly premium at all',
          'It covers only emergencies',
          'It has no deductible',
        ],
        answerIndex: 0,
        explanation:
          'HDHPs trade a lower premium for a higher deductible. Preventive care is still covered, and you can save pre-tax money in an HSA.',
      },
    ],
    sources: [
      {
        title: 'Health insurance plan & network types: HMOs, PPOs, and more',
        publisher: 'HealthCare.gov',
        url: 'https://www.healthcare.gov/choose-a-plan/plan-types/',
      },
      {
        title: 'What are Health Savings Account-eligible plans?',
        publisher: 'HealthCare.gov',
        url: 'https://www.healthcare.gov/high-deductible-health-plan/',
      },
      {
        title: 'Your total costs for health care: Premium, deductible, and out-of-pocket costs',
        publisher: 'HealthCare.gov',
        url: 'https://www.healthcare.gov/choose-a-plan/your-total-costs/',
      },
      {
        title: 'Doctor Choice & Emergency Room Access',
        publisher: 'HealthCare.gov',
        url: 'https://www.healthcare.gov/health-care-law-protections/doctor-choice-emergency-room-access/',
      },
    ],
    askBrianPrompts: [
      'Should I pick an HMO or a PPO if I see several specialists?',
      'How do I estimate my total yearly cost for a health plan?',
      'Is a high-deductible plan a good idea if I have a chronic condition?',
    ],
    tags: ['HMO', 'PPO', 'EPO', 'POS', 'HDHP', 'plan types', 'network', 'referral', 'choosing a plan', 'high deductible'],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'hsa-vs-fsa-accounts',
    categoryId: 'insurance',
    title: 'HSA vs. FSA: Tax-Free Money for Health Costs',
    summary:
      'Both accounts let you pay medical costs with pre-tax money, but they work very differently. Learn which one fits you.',
    readMinutes: 4,
    level: 'Intermediate',
    icon: 'wallet-outline',
    callout: {
      kind: 'tip',
      text: 'Limits change every year. This lesson uses IRS figures published for 2026 (and 2027 HSA limits). It is general information, not tax advice — see IRS Publication 969 or a tax professional for your situation.',
    },
    sections: [
      {
        heading: 'What both accounts do',
        body: md(
          "Health Savings Accounts (HSAs) and health Flexible Spending Accounts (FSAs) let you set aside money **before taxes** to pay for qualified medical costs. Because you don't pay income tax on that money, you effectively get a discount on care.",
          'You can typically use either account for:',
          bullets(
            'Deductibles, copays, and coinsurance',
            'Prescription drugs, and over-the-counter medicines and menstrual care products',
            'Many dental and vision costs, like cleanings, glasses, and contacts',
            'Medical supplies and equipment, like bandages, crutches, and blood sugar test kits',
          ),
          'Neither account can generally be used to pay your regular health insurance premiums.',
        ),
      },
      {
        heading: 'Health Savings Account (HSA)',
        body: md(
          "To put money into an HSA, you must be covered by an **HSA-eligible plan** (a qualifying high-deductible health plan) and generally have no other disqualifying coverage. You can't contribute once you're enrolled in Medicare.",
          'Key features:',
          bullets(
            "**You own it.** The money stays yours if you change jobs or plans.",
            "**It rolls over.** There's no “use it or lose it” — unused money carries over every year.",
            '**It can grow.** Balances can earn interest or investment returns, tax-free.',
            '**Tax-free withdrawals** when you use the money for qualified medical costs.',
          ),
          'You can open an HSA through an employer or on your own at many banks and other financial institutions. Employers may contribute, too.',
        ),
      },
      {
        heading: 'HSA limits and rules',
        body: md(
          'Contribution limits are set each year, and money your employer adds counts toward them:',
          bullets(
            '**2026:** up to $4,400 for self-only coverage, or $8,750 for family coverage',
            '**2027:** up to $4,500 for self-only coverage, or $9,000 for family coverage',
            "If you're 55 or older, you can add an extra $1,000 a year.",
          ),
          "If you withdraw HSA money for something that isn't a qualified medical cost, you'll owe income tax on it, plus an **extra 20% tax** unless you're 65 or older or disabled.",
          'Keep receipts for HSA purchases in case the IRS asks.',
        ),
      },
      {
        heading: 'Flexible Spending Account (FSA)',
        body: md(
          "A health FSA is offered **through an employer**. You choose how much to put in, usually during open enrollment, and it's taken from your paychecks before taxes.",
          'Key features:',
          bullets(
            '**Limit:** up to $3,400 per employer for 2026. A spouse with their own job can have a separate FSA.',
            "**Money is available early.** You can use your full yearly amount at any point in the plan year, even before it's all been taken from your pay.",
            '**Use it or lose it.** Money left at the end of the plan year is generally lost. Your employer may offer either a grace period of up to 2½ months or a carryover (up to $680 for 2026 plans) — not both, and they don’t have to offer either.',
            "You usually can't keep your FSA if you leave your job.",
          ),
        ),
      },
      {
        heading: 'Side by side',
        body: md(
          bullets(
            '**Who offers it:** HSA — you or your employer, only with an HSA-eligible plan. FSA — employers only.',
            '**Who owns it:** HSA — you, even if you change jobs. FSA — tied to your employer.',
            '**Unused money:** HSA — rolls over every year. FSA — mostly use it or lose it.',
            '**Can it be invested:** HSA — often yes. FSA — no.',
            '**2026 limit:** HSA — $4,400 self-only or $8,750 family. FSA — $3,400.',
            '**Changing your contribution:** HSA — usually any time. FSA — usually only at open enrollment or after a qualifying life event.',
          ),
          'Note: a **dependent care FSA** is a different account for child care or adult day care, not medical bills.',
        ),
      },
      {
        heading: 'Which one fits you?',
        body: md(
          "An **HSA** may make sense if you're fairly healthy, can afford a higher deductible, and want to save for future medical costs, including in retirement.",
          'An **FSA** may make sense if your employer offers one and you have predictable costs, like regular prescriptions, glasses, or a planned procedure.',
          'Tips for either account:',
          steps(
            "Estimate next year's costs carefully — especially for an FSA, so you don't lose money.",
            'Save receipts and Explanation of Benefits statements.',
            'Use the account debit card for eligible purchases, if you have one.',
            'Ask HR or the account administrator about claim deadlines.',
          ),
          "Some employers offer a “limited-purpose” FSA for dental and vision costs that you can use alongside an HSA. Ask your benefits office.",
        ),
      },
    ],
    keyTakeaways: [
      'HSAs and FSAs let you pay for qualified medical costs with pre-tax money.',
      'You need an HSA-eligible high-deductible plan to contribute to an HSA.',
      'HSA money is yours to keep and rolls over; FSA money is mostly use it or lose it.',
      '2026 limits: HSA $4,400 self-only or $8,750 family; health FSA $3,400.',
    ],
    quiz: [
      {
        question: 'What happens to unused HSA money at the end of the year?',
        options: [
          "It's lost",
          'It rolls over and stays yours',
          'It goes back to your employer',
          "It's automatically paid out as taxable income",
        ],
        answerIndex: 1,
        explanation:
          "HSAs aren't use it or lose it. The balance rolls over each year and stays yours, even if you change jobs.",
      },
      {
        question: 'What do you need in order to contribute to an HSA?',
        options: [
          'Any kind of health plan',
          'Medicare Part B',
          'A job with more than 50 employees',
          'Coverage under an HSA-eligible high-deductible health plan',
        ],
        answerIndex: 3,
        explanation:
          "Only people covered by an HSA-eligible plan (and without other disqualifying coverage, like Medicare) can contribute to an HSA.",
      },
      {
        question:
          'Your FSA has $400 left in December, and your employer offers no grace period or carryover. What happens?',
        options: [
          'It rolls into next year',
          'You can spend it on anything',
          'You generally lose it at the end of the plan year',
          'It moves into an HSA',
        ],
        answerIndex: 2,
        explanation:
          "FSAs are generally use it or lose it. That's why it's smart to estimate your costs carefully when you choose how much to put in.",
      },
    ],
    sources: [
      {
        title: 'What are Health Savings Account-eligible plans?',
        publisher: 'HealthCare.gov',
        url: 'https://www.healthcare.gov/high-deductible-health-plan/',
      },
      {
        title: 'Publication 969, Health Savings Accounts and Other Tax-Favored Health Plans',
        publisher: 'IRS',
        url: 'https://www.irs.gov/publications/p969',
      },
      {
        title: 'IRS releases tax inflation adjustments for tax year 2026, including amendments from the One, Big, Beautiful Bill',
        publisher: 'IRS',
        url: 'https://www.irs.gov/newsroom/irs-releases-tax-inflation-adjustments-for-tax-year-2026-including-amendments-from-the-one-big-beautiful-bill',
      },
    ],
    askBrianPrompts: [
      "Should I choose an HSA or an FSA with my employer's plans?",
      'What can I buy with my HSA or FSA money?',
      'How much should I put in my FSA for next year?',
    ],
    tags: [
      'HSA',
      'FSA',
      'health savings account',
      'flexible spending account',
      'pre-tax',
      'high deductible',
      'taxes',
      'use it or lose it',
      'IRS',
      'HDHP',
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'medicare-medicaid-basics',
    categoryId: 'insurance',
    title: 'Medicare and Medicaid: The Basics',
    summary:
      'Two public programs with similar names but different purposes. Learn who qualifies, what each covers, and the deadlines that matter.',
    readMinutes: 5,
    level: 'Basics',
    icon: 'umbrella-outline',
    callout: {
      kind: 'tip',
      text: 'Medicare and Medicaid rules are complex and change often. For free, unbiased help, call 1-800-MEDICARE (1-800-633-4227), contact your State Health Insurance Assistance Program (SHIP), or call your state Medicaid office.',
    },
    sections: [
      {
        heading: 'Two programs, two purposes',
        body: md(
          '**Medicare** is federal health insurance for people **65 and older**, and for some younger people with certain disabilities or conditions, like end-stage kidney disease or ALS.',
          "**Medicaid** is a joint federal and state program that gives free or low-cost coverage to certain people with **limited income**, including families and children, pregnant women, older adults, and people with disabilities. Each state runs its own program, so rules and benefits vary.",
          "The **Children's Health Insurance Program (CHIP)** covers children, and in some states pregnant women, in families that earn too much for Medicaid.",
          'Some people qualify for both. Medicaid can then help pay Medicare costs.',
        ),
      },
      {
        heading: 'The parts of Medicare',
        body: md(
          bullets(
            '**Part A (hospital insurance):** Inpatient hospital stays, skilled nursing facility care, hospice, and some home health care. Most people pay no premium for Part A.',
            '**Part B (medical insurance):** Doctor visits, outpatient care, medical equipment, and many preventive services. Most people pay a monthly premium.',
            '**Part C (Medicare Advantage):** Medicare-approved private plans that bundle Parts A and B, and usually D. They often use networks and prior authorization, have a yearly out-of-pocket limit, and may add extras like dental, vision, or hearing.',
            '**Part D (drug coverage):** Prescription drug plans run by private insurers.',
          ),
          '**Original Medicare** means Parts A and B. Many people add a Part D plan and a Medigap (Medicare Supplement) policy to help with costs.',
        ),
      },
      {
        heading: 'When to sign up for Medicare',
        body: md(
          'Your **Initial Enrollment Period** lasts 7 months. It starts 3 months before the month you turn 65, includes your birthday month, and ends 3 months after.',
          bullets(
            "If you already get Social Security benefits, you're usually enrolled in Parts A and B automatically, and your card arrives in the mail.",
            "If you don't, you sign up through Social Security.",
            'If you or your spouse are still working and have job-based coverage, you may be able to delay Part B without a penalty. Check the rules before you decide.',
          ),
          "Missing your window can mean a **late enrollment penalty** that lasts as long as you have Part B, plus a wait for coverage. Part D has its own late penalty.",
        ),
      },
      {
        heading: 'What Medicare costs in 2026',
        body: md(
          'Costs change every year. For 2026, in Original Medicare:',
          bullets(
            '**Part B premium:** $202.90 a month for most people (more if your income is higher)',
            '**Part B deductible:** $283 a year. After that, you usually pay **20%** of the Medicare-approved amount.',
            '**Part A hospital deductible:** $1,736 for each benefit period',
          ),
          'Original Medicare has **no yearly out-of-pocket limit**, which is why many people add a Medigap policy or choose Medicare Advantage.',
          'In Part D drug plans, your out-of-pocket costs for covered drugs are capped at **$2,100 in 2026** ($2,400 in 2027).',
          'If your income and savings are limited, Medicare Savings Programs and **Extra Help** can lower your premiums and drug costs.',
        ),
      },
      {
        heading: 'Medicaid: it depends on your state',
        body: md(
          "Medicaid must follow federal rules, but each state sets its own income limits and benefits. Some states have **expanded** Medicaid to cover most adults under a certain income; others haven't.",
          bullets(
            'You can apply **any time of year**, through your state Medicaid agency or HealthCare.gov.',
            "Even if you think your income is too high, apply anyway — especially if you're pregnant, have children, or have a disability.",
            'Coverage is free or very low cost.',
          ),
          "**Changes starting by January 2027:** Many adults ages 19 to 64 covered through Medicaid expansion will need to show 80 hours a month of work, school, job training, or community service, unless they're exempt (for example, if they're pregnant, disabled or medically frail, or caring for a child 13 or younger). Some states may start sooner. Watch for letters from your state and keep your contact information up to date.",
        ),
      },
      {
        heading: 'Enrollment windows and free help',
        body: md(
          'Once you have Medicare, you can change plans during set windows:',
          bullets(
            '**October 15 to December 7:** Medicare Open Enrollment. Join, switch, or drop a Medicare Advantage or Part D plan for the next year.',
            "**January 1 to March 31:** If you're in Medicare Advantage, you can switch to another Advantage plan or return to Original Medicare.",
          ),
          "Plans change their costs, networks, and drug lists every year, so read your plan's Annual Notice of Change each fall.",
          'Free, unbiased help: 1-800-MEDICARE (1-800-633-4227), your State Health Insurance Assistance Program (SHIP), or your state Medicaid agency. Be wary of anyone who calls you out of the blue to sell a Medicare plan.',
        ),
      },
    ],
    keyTakeaways: [
      'Medicare is mainly for people 65 and older and some younger people with disabilities; Medicaid is for people with limited income.',
      'Your Medicare Initial Enrollment Period is 7 months around your 65th birthday — missing it can mean lasting penalties.',
      'Original Medicare has no yearly out-of-pocket cap; Part D drug costs are capped at $2,100 in 2026.',
      'You can apply for Medicaid any time; rules vary by state, and work requirements begin for many expansion adults by 2027.',
      'Get free help from 1-800-MEDICARE, your SHIP, or your state Medicaid office.',
    ],
    quiz: [
      {
        question: 'Which part of Medicare mainly covers prescription drugs?',
        options: ['Part A', 'Part B', 'Part C', 'Part D'],
        answerIndex: 3,
        explanation:
          'Part D covers prescription drugs. Medicare Advantage (Part C) plans usually include drug coverage too.',
      },
      {
        question: 'When does your Medicare Initial Enrollment Period begin?',
        options: [
          'On your 65th birthday',
          '3 months before the month you turn 65',
          'January 1 of the year you turn 65',
          'Only after you retire',
        ],
        answerIndex: 1,
        explanation:
          'It starts 3 months before your 65th birthday month and lasts 7 months in total. Signing up late can lead to lasting penalties.',
      },
      {
        question: 'Which statement about Medicaid is true?',
        options: [
          "It's exactly the same in every state",
          'You can only apply in November and December',
          'You can apply any time, and rules vary by state',
          "It's only for people over 65",
        ],
        answerIndex: 2,
        explanation:
          'Medicaid accepts applications year-round. Each state sets its own eligibility rules and benefits within federal guidelines.',
      },
    ],
    sources: [
      {
        title: 'Parts of Medicare',
        publisher: 'Medicare.gov',
        url: 'https://www.medicare.gov/basics/get-started-with-medicare/medicare-basics/parts-of-medicare',
      },
      {
        title: 'When does Medicare coverage start?',
        publisher: 'Medicare.gov',
        url: 'https://www.medicare.gov/basics/get-started-with-medicare/sign-up/when-does-medicare-coverage-start',
      },
      {
        title: 'Costs',
        publisher: 'Medicare.gov',
        url: 'https://www.medicare.gov/basics/costs/medicare-costs',
      },
      {
        title: 'How much does Medicare drug coverage cost?',
        publisher: 'Medicare.gov',
        url: 'https://www.medicare.gov/health-drug-plans/part-d/basics/costs',
      },
      {
        title: 'Medicaid Community Engagement Requirement for Certain Individuals Interim Final Rule with Comment Period (CMS-2454-IFC)',
        publisher: 'CMS',
        url: 'https://www.cms.gov/newsroom/fact-sheets/medicaid-community-engagement-requirement-certain-individuals-interim-final-rule-comment-period-cms',
      },
    ],
    askBrianPrompts: [
      "I'm turning 65 soon. What should I do to sign up for Medicare?",
      "What's the difference between Original Medicare and Medicare Advantage?",
      'How do I know if I qualify for Medicaid in my state?',
    ],
    tags: [
      'Medicare',
      'Medicaid',
      'CHIP',
      'Medicare Advantage',
      'Part D',
      'Medigap',
      'enrollment',
      'SHIP',
      'Extra Help',
      'work requirements',
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'aca-marketplace-enrollment',
    categoryId: 'insurance',
    title: 'The ACA Marketplace: When and How to Enroll',
    summary:
      "How to shop for your own health plan on HealthCare.gov or your state's marketplace, key deadlines, and how to lower your costs.",
    readMinutes: 4,
    level: 'Basics',
    icon: 'calendar-outline',
    callout: {
      kind: 'tip',
      text: "On HealthCare.gov, Open Enrollment runs November 1 to January 15. States that run their own marketplace may use different dates, so check your state's site.",
    },
    sections: [
      {
        heading: 'What the Marketplace is',
        body: md(
          "The Health Insurance Marketplace (sometimes called the exchange) is where you can shop for your own health plan if you don't get coverage through a job, Medicare, or Medicaid. Most states use **HealthCare.gov**; some run their own website.",
          'All Marketplace plans:',
          bullets(
            'Cover the same 10 **essential health benefits**, like doctor visits, hospital care, prescription drugs, maternity care, and mental health care',
            "Can't turn you down or charge you more because of a **pre-existing condition**",
            'Cover many preventive services at no cost in-network',
          ),
          'Be careful with plans sold outside the Marketplace, like short-term plans. They may not follow these rules.',
        ),
      },
      {
        heading: 'Metal levels: Bronze, Silver, Gold, Platinum',
        body: md(
          'Marketplace plans are grouped into “metal” levels. These have **nothing to do with quality of care** — they show how you and the plan split costs, on average:',
          bullets(
            '**Bronze:** lowest premiums, highest costs when you get care (plan pays about 60%)',
            '**Silver:** moderate premiums and costs (about 70%)',
            '**Gold:** higher premiums, lower costs when you get care (about 80%)',
            '**Platinum:** highest premiums, lowest costs when you get care (about 90%)',
          ),
          '**Catastrophic** plans are for people under 30 or those who qualify for a hardship or affordability exemption. They have low premiums and very high deductibles, and cover at least 3 primary care visits a year before the deductible.',
        ),
      },
      {
        heading: 'Open Enrollment: the main window',
        body: md(
          'On HealthCare.gov, **Open Enrollment** runs each year from **November 1 to January 15**:',
          bullets(
            'Enroll by **December 15** for coverage starting January 1.',
            'Enroll December 16 to January 15 for coverage starting February 1.',
          ),
          "If you already have a Marketplace plan, log in each fall to update your income and household details and compare plans again. Prices, networks, and drug lists change every year. If you do nothing, you may be automatically re-enrolled — possibly in a plan that no longer fits.",
        ),
      },
      {
        heading: 'Special Enrollment Periods',
        body: md(
          'Outside Open Enrollment, you can sign up only if you have a qualifying **life event**. You usually have **60 days** from the event to enroll. Examples:',
          bullets(
            "Losing other health coverage, such as a job-based plan or a parent's plan",
            'Getting married',
            'Having or adopting a baby, or placing a child in foster care',
            'Moving to a new ZIP code or county',
            'Losing Medicaid or CHIP (you may have up to 90 days)',
          ),
          'You may need to send documents to prove the event, so act quickly and keep your paperwork. **Medicaid and CHIP** accept applications any time of year.',
        ),
      },
      {
        heading: 'Lowering your costs',
        body: md(
          'Savings are based on your household size and your expected income for the year you want coverage:',
          bullets(
            "**Premium tax credits** lower your monthly premium. You generally qualify if your household income is between 100% and 400% of the federal poverty level and you can't get affordable coverage through a job. You can use the credit in advance or claim it at tax time.",
            '**Cost-sharing reductions** lower your deductible, copays, and out-of-pocket maximum — but **only if you choose a Silver plan**.',
          ),
          'If your income or household changes during the year, update your application. If you take more tax credit in advance than you qualify for, you may have to pay some back when you file your taxes.',
        ),
      },
      {
        heading: 'How to apply, step by step',
        body: md(
          steps(
            '**Gather information:** Social Security numbers, income estimates (like pay stubs or tax forms), and details about any job-based coverage your household is offered.',
            "**Preview plans** on HealthCare.gov or your state's site to see prices and savings.",
            "**Check your doctors and drugs** in each plan's provider directory and drug list.",
            '**Compare total costs:** premiums plus deductibles, copays, and the out-of-pocket maximum.',
            "**Enroll and pay your first premium.** Coverage doesn't start until you pay.",
          ),
          "Free help is available from trained local assisters (see “Find local help” on HealthCare.gov) or the Marketplace Call Center at **1-800-318-2596**. Don't share your login or personal details with anyone who contacts you out of the blue.",
        ),
      },
    ],
    keyTakeaways: [
      'Open Enrollment on HealthCare.gov runs November 1 to January 15; enroll by December 15 for January 1 coverage.',
      'Life events like losing coverage, marriage, a new baby, or moving usually give you 60 days to enroll.',
      'Premium tax credits lower premiums; cost-sharing reductions require a Silver plan.',
      "Marketplace plans can't turn you down or charge you more for a pre-existing condition.",
    ],
    quiz: [
      {
        question: 'You want coverage to start January 1. What is the usual HealthCare.gov deadline to enroll?',
        options: ['December 15', 'October 31', 'January 15', 'March 31'],
        answerIndex: 0,
        explanation:
          'Enroll by December 15 for coverage starting January 1. Open Enrollment continues until January 15, with coverage starting February 1.',
      },
      {
        question: 'You lost your job-based health coverage in July. What can you do?',
        options: [
          'Wait until November to apply',
          "Nothing — you can't get coverage until next year",
          'Apply within 60 days using a Special Enrollment Period',
          'Only buy a short-term plan',
        ],
        answerIndex: 2,
        explanation:
          'Losing coverage is a qualifying life event. You usually have 60 days to pick a Marketplace plan.',
      },
      {
        question: 'To get cost-sharing reductions (lower deductibles and copays), which plan level must you choose?',
        options: ['Bronze', 'Silver', 'Gold', 'Platinum'],
        answerIndex: 1,
        explanation:
          'Cost-sharing reductions are only available with Silver plans. Premium tax credits can be used with any metal level.',
      },
    ],
    sources: [
      {
        title: 'When can you get health insurance?',
        publisher: 'HealthCare.gov',
        url: 'https://www.healthcare.gov/quick-guide/dates-and-deadlines/',
      },
      {
        title: 'Getting health coverage outside Open Enrollment',
        publisher: 'HealthCare.gov',
        url: 'https://www.healthcare.gov/coverage-outside-open-enrollment/special-enrollment-period/',
      },
      {
        title: 'Health plan categories: Bronze, Silver, Gold & Platinum',
        publisher: 'HealthCare.gov',
        url: 'https://www.healthcare.gov/choose-a-plan/plans-categories/',
      },
      {
        title: 'Premium tax credit - Glossary',
        publisher: 'HealthCare.gov',
        url: 'https://www.healthcare.gov/glossary/premium-tax-credit/',
      },
      {
        title: 'Marketplace health plans cover pre-existing conditions',
        publisher: 'HealthCare.gov',
        url: 'https://www.healthcare.gov/coverage/pre-existing-conditions/',
      },
    ],
    askBrianPrompts: [
      'Do I qualify for a Special Enrollment Period if I move to a new state?',
      'How do premium tax credits work if my income changes during the year?',
      'Should I choose a Bronze or a Silver plan?',
    ],
    tags: [
      'ACA',
      'Affordable Care Act',
      'Marketplace',
      'HealthCare.gov',
      'open enrollment',
      'special enrollment period',
      'premium tax credit',
      'cost-sharing reductions',
      'metal levels',
      'pre-existing conditions',
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'medical-bills-eob-disputes',
    categoryId: 'insurance',
    title: 'Reading Your EOB and Fighting a Wrong Medical Bill',
    summary:
      'How to match your Explanation of Benefits to your bill, spot errors, use your No Surprises Act rights, and ask for financial help.',
    readMinutes: 4,
    level: 'Intermediate',
    icon: 'receipt-outline',
    callout: {
      kind: 'tip',
      text: "Don't pay a medical bill until you've checked it against your insurer's Explanation of Benefits (EOB). This lesson covers US federal protections; your state may add more. It isn't legal advice.",
    },
    sections: [
      {
        heading: 'An EOB is not a bill',
        body: md(
          'After you get care, your health plan usually sends an **Explanation of Benefits (EOB)** by mail or in your online account. It shows how the plan handled the claim. It is **not a bill**.',
          'An EOB usually lists:',
          bullets(
            'The provider, the date, and the services you received',
            'The amount the provider billed',
            'The **allowed amount** (the price your plan agreed to)',
            'What the plan paid',
            'What you may owe, and why (deductible, copay, coinsurance, or not covered)',
            'Codes or notes explaining any denial',
          ),
          "Save your EOBs. They're your best tool for checking bills.",
        ),
      },
      {
        heading: 'Match the bill to the EOB',
        body: md(
          'When a bill arrives from a doctor or hospital:',
          steps(
            'Find the EOB for the same date and service.',
            'Check that the amount due on the bill matches what the EOB says you may owe.',
            "If the bill is higher, call the provider's billing office. Ask whether they billed your insurance and applied the plan's payment and discount.",
            "If the claim was denied, call your insurer and ask why. It may be a coding or paperwork error your provider can fix and resubmit.",
          ),
          'For every call, write down the date, the name of the person you spoke with, and any reference number.',
        ),
      },
      {
        heading: 'Ask for an itemized bill',
        body: md(
          'A summary bill might just say “hospital services: $4,800.” Ask the billing office for an **itemized bill** that lists every charge with its billing code. Then look for:',
          bullets(
            'Duplicate charges for the same item or service',
            "Services, tests, or medicines you didn't receive",
            "Wrong dates, or charges for days you weren't there",
            'Your name, insurance ID, or policy number entered incorrectly',
            'A charge from an out-of-network provider you never chose',
          ),
          'If something looks wrong, ask the billing office to explain or correct it, and get the answer in writing. You can also compare charges with your medical record.',
        ),
      },
      {
        heading: 'Surprise bills: your No Surprises Act rights',
        body: md(
          'Since 2022, a federal law called the **No Surprises Act** has protected most people with health insurance from surprise out-of-network bills for:',
          bullets(
            'Emergency care, including at out-of-network ERs',
            "Non-emergency care from out-of-network providers at an in-network hospital, hospital outpatient department, or surgery center — like an anesthesiologist you didn't choose",
            'Air ambulance services',
          ),
          "In these cases, you should owe no more than your in-network cost-sharing. Ground ambulances generally **aren't** covered by the federal law, though some states protect you.",
          "Watch out: for some planned care, a provider may ask you to sign a “notice and consent” form that gives up these protections. Signing is your choice. If you don't sign, you may need to reschedule with an in-network provider.",
        ),
      },
      {
        heading: 'No insurance? Get a Good Faith Estimate',
        body: md(
          "If you're uninsured or not using insurance (self-pay), providers usually must give you a **Good Faith Estimate** of costs when you schedule care at least 3 business days ahead, or when you ask for one.",
          'If your bill is **at least $400 more** than a provider’s estimate, you may be able to dispute it through a federal process:',
          bullets(
            'Start within **120 calendar days** of the date on your first bill.',
            "There's a $25 fee, which is taken off what you owe if the decision goes your way.",
            'While the dispute is open, the provider must pause collection efforts.',
          ),
          'For questions or complaints, call the No Surprises Help Desk at **1-800-985-3059**.',
        ),
      },
      {
        heading: "Can't afford the bill? Ask for help",
        body: md(
          "Don't ignore a bill you can't pay — and don't rush to put it on a credit card. First:",
          bullets(
            "**Ask about financial assistance** (sometimes called charity care). Nonprofit hospitals must have a written financial assistance policy. Search the hospital's name plus “financial assistance,” or ask the billing office.",
            '**Check Medicaid.** If you might qualify, apply. Medicaid can sometimes help with recent bills.',
            "**Ask for a discount,** especially if you're uninsured or can pay part of the bill now.",
            '**Set up a payment plan** you can afford, and get the terms in writing.',
          ),
          'If a bill is sent to collections, ask the collector to verify the debt in writing, and keep copies of everything.',
        ),
      },
    ],
    keyTakeaways: [
      'An EOB is not a bill — use it to check what you really owe.',
      "Ask for an itemized bill and look for duplicates, errors, and services you didn't get.",
      'The No Surprises Act limits most surprise out-of-network bills for emergencies, care at in-network facilities, and air ambulances.',
      'Uninsured? Get a Good Faith Estimate; you may dispute a bill $400 or more above it within 120 days.',
      'Nonprofit hospitals must have financial assistance policies — ask about them.',
    ],
    quiz: [
      {
        question: 'What is an Explanation of Benefits (EOB)?',
        options: [
          'A bill you must pay right away',
          'A summary from your health plan of how a claim was processed — not a bill',
          "A note from your doctor about your diagnosis",
          'A notice from a collection agency',
        ],
        answerIndex: 1,
        explanation:
          'An EOB shows what was billed, what your plan paid, and what you may owe. Compare it with the bill from your provider before paying.',
      },
      {
        question:
          "You had surgery at an in-network hospital and got a surprise bill from an out-of-network anesthesiologist you didn't choose. What protects you?",
        options: [
          'Nothing — you must pay the full bill',
          'Medicare Part D',
          'Your car insurance',
          'The No Surprises Act, which generally limits you to in-network cost-sharing',
        ],
        answerIndex: 3,
        explanation:
          'The No Surprises Act covers out-of-network providers at in-network facilities for most people with health insurance, unless you gave up those protections by signing a notice and consent form.',
      },
      {
        question: "You're uninsured, and your bill is $600 more than the provider's Good Faith Estimate. What can you do?",
        options: [
          'Start a patient-provider dispute within 120 days of the bill date',
          'Nothing — estimates are never binding',
          'Wait a year, then dispute it',
          'Only negotiate if the bill is over $5,000',
        ],
        answerIndex: 0,
        explanation:
          'If a bill is at least $400 over the estimate, you may use the federal dispute process. Start within 120 calendar days of the first bill.',
      },
    ],
    sources: [
      {
        title: 'Health insurance terms you should know',
        publisher: 'CMS',
        url: 'https://www.cms.gov/initiatives/your-patient-rights/medical-bill-rights/get-help/medical-bill-guides-resources/health-insurance-terms-you-should-know',
      },
      {
        title: 'Know your rights with insurance',
        publisher: 'CMS',
        url: 'https://www.cms.gov/initiatives/your-patient-rights/medical-bill-rights/know-your-medical-bill-rights/know-your-rights-insurance',
      },
      {
        title: 'Dispute a medical bill',
        publisher: 'CMS',
        url: 'https://www.cms.gov/initiatives/your-patient-rights/medical-bill-rights/get-help/dispute-bill',
      },
      {
        title: 'Apply for medical bill financial assistance',
        publisher: 'CMS',
        url: 'https://www.cms.gov/initiatives/your-patient-rights/medical-bill-rights/get-help/medical-bill-guides-resources/apply-medical-bill-financial-assistance',
      },
      {
        title: 'Financial assistance policies (FAPs)',
        publisher: 'IRS',
        url: 'https://www.irs.gov/charities-non-profits/financial-assistance-policies-faps',
      },
    ],
    askBrianPrompts: [
      'Can you help me understand the codes on my Explanation of Benefits?',
      'How do I ask a hospital for financial assistance?',
      'Is my surprise bill covered by the No Surprises Act?',
    ],
    tags: [
      'EOB',
      'explanation of benefits',
      'medical bill',
      'itemized bill',
      'No Surprises Act',
      'surprise billing',
      'good faith estimate',
      'financial assistance',
      'charity care',
      'billing errors',
    ],
  },

  // ---------------------------------------------------------------------------
  {
    id: 'prior-authorization-appeals',
    categoryId: 'insurance',
    title: 'Prior Authorization, Denials, and Appeals',
    summary:
      'What to do when your plan needs approval first — or says no. Step-by-step help with appeals and independent external review.',
    readMinutes: 4,
    level: 'Intermediate',
    icon: 'checkmark-done-outline',
    callout: {
      kind: 'tip',
      text: 'Deadlines matter: you generally have 180 days from a denial to file an internal appeal. This lesson covers most US private and Marketplace plans. Medicare, Medicaid, and some job-based plans have their own steps, which your denial letter must explain. Not legal advice.',
    },
    sections: [
      {
        heading: 'What prior authorization means',
        body: md(
          "**Prior authorization** (also called preauthorization or precertification) is approval your health plan may require **before** you get certain services, procedures, equipment, or prescription drugs. It's the plan's check that the care is medically necessary.",
          'Common examples include MRIs and CT scans, planned surgeries, specialty drugs, and some medical equipment.',
          bullets(
            'Your doctor’s office usually submits the request, but if it gets missed, you could end up with a denied claim.',
            "Approval isn't a promise to pay. Other rules, like network status, still apply.",
            "Emergency care doesn't need prior approval.",
          ),
        ),
      },
      {
        heading: 'Keep a prior authorization moving',
        body: md(
          steps(
            "**Ask early:** “Does this need prior authorization?” Check your plan documents or call the number on your card.",
            "**Confirm it was sent.** Ask your doctor's office when they submitted it, and get a reference number.",
            "**Follow up** with your plan if you haven't heard back.",
            '**Ask for an expedited (urgent) review** if waiting could seriously harm your health.',
            '**Get the approval in writing,** and check the dates and number of visits it covers.',
          ),
          "For drugs, if your plan wants you to try a different medicine first or doesn't cover the one prescribed, your prescriber can ask the plan for an exception.",
        ),
      },
      {
        heading: 'Deadlines for decisions',
        body: md(
          'Most private plans generally must decide a prior authorization request within **15 days**, or within **72 hours** if it’s urgent.',
          'Federal rules that took effect in **2026** also set deadlines for **Medicare Advantage plans and Medicaid and CHIP programs and plans**: generally **72 hours** for urgent requests and **7 calendar days** for standard ones. These plans, and Marketplace plans on HealthCare.gov, must also give a **specific reason** when they deny a request.',
          "These newer rules don't apply to prescription drugs.",
        ),
      },
      {
        heading: 'If you are denied: file an internal appeal',
        body: md(
          'Your plan must tell you **in writing** why it denied a claim or request, and how to appeal. Then:',
          steps(
            'Read the denial letter carefully. Note the reason and the deadline.',
            'Call your plan with questions, and ask for a copy of your claim file and the rules they used.',
            'Ask your doctor for help, like a letter explaining why the care is medically necessary, with supporting records.',
            'File the internal appeal within **180 days** of the denial notice. Use the plan’s form, or write a letter with your name, claim number, and member ID.',
            'Keep copies of everything, plus notes from every call.',
          ),
          "The plan must decide within **30 days** for care you haven't received yet, or **60 days** for care you already got.",
        ),
      },
      {
        heading: 'External review: an independent decision',
        body: md(
          'If your plan still says no, you can ask for an **external review**. An independent reviewer — not your insurance company — makes the decision, and your insurer must accept it.',
          bullets(
            'File within **4 months** of the final denial.',
            'A standard review is decided within **45 days**. An expedited review is decided within **72 hours**, or sooner if needed.',
            "It's free or costs no more than $25.",
            'Denials based on medical judgment, “experimental” treatment decisions, or cancelled coverage can generally be reviewed.',
          ),
          "Your plan's final denial letter must tell you how to request an external review.",
        ),
      },
      {
        heading: 'Urgent situations and getting help',
        body: md(
          'If waiting could seriously jeopardize your life, health, or ability to regain full function, ask for an **expedited appeal**. You can request an internal appeal and an external review **at the same time**, and a decision must come as fast as your condition requires.',
          'Where to get help:',
          bullets(
            "Your doctor's office, which often helps with appeals",
            "Your state's Consumer Assistance Program or insurance department, which may be able to file an appeal for you",
            'The Marketplace Call Center at 1-800-318-2596, for HealthCare.gov plans',
            '1-800-MEDICARE (1-800-633-4227), for Medicare appeals, which follow their own process',
          ),
          "Don't give up after the first “no.”",
        ),
      },
    ],
    keyTakeaways: [
      'Ask early whether care or a drug needs prior authorization, and get approvals in writing.',
      'You generally have 180 days from a denial to file an internal appeal.',
      'If the internal appeal fails, you can request an independent external review within 4 months.',
      'Urgent cases can get expedited decisions — as fast as your condition requires.',
    ],
    quiz: [
      {
        question: 'What is prior authorization?',
        options: [
          'A bill from your doctor',
          'Approval your plan may require before you get certain care or drugs',
          'A type of health savings account',
          'A referral to the emergency room',
        ],
        answerIndex: 1,
        explanation:
          "Prior authorization is your plan's advance approval for certain services or drugs. Approval isn't a guarantee of payment, but skipping it can lead to a denied claim.",
      },
      {
        question: 'How long do you generally have to file an internal appeal after a denial?',
        options: ['10 days', '30 days', '180 days', '2 years'],
        answerIndex: 2,
        explanation:
          'You generally have 180 days (6 months) from the denial notice. Check your denial letter for your exact deadline.',
      },
      {
        question: 'Who makes the decision in an external review?',
        options: [
          'An independent third-party reviewer',
          "Your insurance company's billing department",
          "Your employer's HR office",
          'Your primary care doctor',
        ],
        answerIndex: 0,
        explanation:
          "In an external review, an independent reviewer decides, and your insurer is required by law to accept that decision.",
      },
    ],
    sources: [
      {
        title: 'Preauthorization - Glossary',
        publisher: 'HealthCare.gov',
        url: 'https://www.healthcare.gov/glossary/preauthorization/',
      },
      {
        title: 'Internal appeals',
        publisher: 'HealthCare.gov',
        url: 'https://www.healthcare.gov/appeal-insurance-company-decision/internal-appeals/',
      },
      {
        title: 'External Review',
        publisher: 'HealthCare.gov',
        url: 'https://www.healthcare.gov/appeal-insurance-company-decision/external-review/',
      },
      {
        title: 'CMS Interoperability and Prior Authorization Final Rule CMS-0057-F',
        publisher: 'CMS',
        url: 'https://www.cms.gov/newsroom/fact-sheets/cms-interoperability-prior-authorization-final-rule-cms-0057-f',
      },
      {
        title: 'Filing an appeal',
        publisher: 'Medicare.gov',
        url: 'https://www.medicare.gov/providers-services/claims-appeals-complaints/appeals',
      },
    ],
    askBrianPrompts: [
      'Help me write an appeal letter for a denied insurance claim.',
      'What should my doctor include in a letter of medical necessity?',
      'How do I ask for an expedited appeal?',
    ],
    tags: [
      'prior authorization',
      'preauthorization',
      'denial',
      'appeal',
      'internal appeal',
      'external review',
      'claim denied',
      'medical necessity',
      'expedited appeal',
      'insurance',
    ],
  },
];
