import type { Lesson } from '../types';

// Content for category 'emergencies'. See src/lessons/types.ts for the format.
//
// Every lesson here is emergency-related, so each one leads with an 'emergency'
// callout that points to 911 (and 988 / Poison Help where relevant). Facts were
// checked against the linked sources (AHA/ASA, CDC, NIH MedlinePlus/NIMH/NIDA,
// FDA, American Red Cross, NHTSA, NAIC, SAMHSA/988, Poison Control) in Sept 2026.

// Markdown-lite helpers: keep section bodies readable and consistently formatted.
const md = (...blocks: string[]): string => blocks.join('\n\n');
const bullets = (...items: string[]): string => items.map((item) => `- ${item}`).join('\n');
const steps = (...items: string[]): string => items.map((item, i) => `${i + 1}. ${item}`).join('\n');

const strokeBeFast: Lesson = {
  id: 'stroke-be-fast',
  categoryId: 'emergencies',
  title: 'Stroke: Spot It With BE FAST and Call 911',
  summary:
    "Learn the sudden warning signs of a stroke, why every minute counts, and exactly what to do while you wait for the ambulance.",
  readMinutes: 4,
  level: 'Basics',
  icon: 'timer-outline',
  callout: {
    kind: 'emergency',
    text: "If you notice any sign of a stroke, call 911 right away, even if the signs go away. Note the time they started. Don't drive the person (or yourself) to the hospital; wait for the ambulance.",
  },
  sections: [
    {
      heading: 'What is a stroke?',
      body: md(
        "A stroke happens when blood stops flowing to part of the brain. Most strokes are caused by a clot that blocks an artery. Others happen when a blood vessel in the brain breaks and bleeds.",
        "Without blood, brain cells start to die within minutes. The American Stroke Association estimates that, on average, about 1.9 million brain cells die every minute a stroke goes untreated. That is why fast treatment can mean the difference between recovering well and living with lasting problems, like trouble walking, talking, or thinking.",
        "Stroke can happen at any age, including in young adults. Knowing the warning signs helps you act quickly for yourself, a family member, or a stranger.",
      ),
    },
    {
      heading: 'BE FAST: the warning signs',
      body: md(
        "Stroke signs come on **suddenly**. The American Stroke Association uses the letters BE FAST to help you remember them:",
        bullets(
          "**B, Balance:** sudden loss of balance, dizziness, or trouble walking.",
          "**E, Eyes:** sudden trouble seeing out of one or both eyes.",
          "**F, Face:** one side of the face droops or feels numb. Ask the person to smile. Is the smile uneven?",
          "**A, Arms:** one arm is weak or numb. Ask them to raise both arms. Does one drift down?",
          "**S, Speech:** slurred speech, or trouble speaking or understanding. Ask them to repeat a simple sentence.",
          "**T, Time to call 911:** call right away, even if the signs seem to get better.",
        ),
        "Other sudden signs include numbness or weakness in a leg (especially on one side of the body), confusion, and a severe headache with no known cause.",
      ),
    },
    {
      heading: 'Why every minute counts',
      body: md(
        "Treatments for strokes caused by a clot work best when they start fast. A clot-busting medicine generally has to be started within about 4.5 hours of the first symptom, and sooner is better. Some people can also have a procedure to pull the clot out. Doctors choose a safe treatment based on brain scans and on **when the symptoms started**.",
        "That is why the time matters so much. As soon as you notice a sign, check the clock. If the person woke up with symptoms, or you don't know when they began, tell responders the last time the person was seen acting normal. Doctors call this the time the person was **last known well**.",
        "Calling 911 is the fastest way to get this care, because ambulance crews can begin lifesaving treatment on the way to the hospital.",
      ),
    },
    {
      heading: 'What to do while you wait for help',
      body: md(
        steps(
          "**Call 911.** Say, “I think this person is having a stroke.”",
          "**Note the time** the first symptom appeared, or when the person was last known well.",
          "**Don't drive.** Don't drive yourself or let someone else drive you. Wait for the ambulance.",
          "**Don't give aspirin, food, or drink.** Some strokes are caused by bleeding, and aspirin could make them worse. A stroke can also make swallowing unsafe.",
          "**Stay with the person.** If they are drowsy, drooling, or having trouble swallowing, help them lie on their side.",
          "**Be ready to start CPR** if they stop responding and aren't breathing normally.",
        ),
        "If you can, grab a list of the person's medicines, especially any blood thinners. It helps the hospital team choose a safe treatment.",
      ),
    },
    {
      heading: 'Signs that go away still need 911',
      body: md(
        "Sometimes stroke signs last only a few minutes and then disappear. This may be a **transient ischemic attack (TIA)**, sometimes called a mini-stroke. A TIA is a temporary blockage of blood flow to the brain.",
        "A TIA is a warning. The American Stroke Association says nearly 1 in 5 people who have a suspected TIA will have a stroke within 90 days. And some people who think they had a TIA learn from a brain scan that they actually had a stroke.",
        "So treat any BE FAST sign as an emergency, even if it's gone by the time you reach the phone. Getting checked quickly lets doctors find the cause and start treatment to help prevent a bigger stroke.",
      ),
    },
  ],
  keyTakeaways: [
    'BE FAST: Balance, Eyes, Face, Arms, Speech, Time to call 911.',
    'Call 911 even if the signs fade. A TIA is a warning that a stroke may follow.',
    'Check the clock. Treatment choices depend on when symptoms started or when the person was last known well.',
    "Take an ambulance, not a car, and don't give aspirin, food, or drink.",
  ],
  quiz: [
    {
      question: "What does the 'E' in BE FAST stand for?",
      options: [
        'Energy: feeling suddenly very tired',
        'Eyes: sudden trouble seeing',
        'Ears: ringing in the ears',
        'Emotions: sudden mood swings',
      ],
      answerIndex: 1,
      explanation:
        "E stands for Eyes. Sudden trouble seeing out of one or both eyes can be a stroke sign, along with Balance, Face, Arms, and Speech changes.",
    },
    {
      question:
        "Your father's face suddenly droops on one side, but it looks normal again after 10 minutes. What should you do?",
      options: [
        'Wait and see if it happens again',
        'Give him an aspirin and let him rest',
        'Call 911 now, because signs that go away still need emergency care',
        'Drive him to his regular doctor tomorrow',
      ],
      answerIndex: 2,
      explanation:
        "Signs that go away may be a TIA (mini-stroke), which is a warning that a stroke may follow. It needs emergency care right away. Don't give aspirin, since some strokes are caused by bleeding.",
    },
    {
      question: 'Why is it important to note the time stroke symptoms started?',
      options: [
        'Some treatments only work if they are started within a few hours of the first symptom',
        'So you know when it is safe to give aspirin',
        'Insurance companies require it before paying',
        "It isn't important once 911 has been called",
      ],
      answerIndex: 0,
      explanation:
        'Clot-busting medicine generally must start within about 4.5 hours, so doctors need to know when symptoms began (or when the person was last known well) to choose a safe treatment.',
    },
  ],
  sources: [
    {
      title: 'Stroke Symptoms and Warning Signs',
      publisher: 'American Stroke Association',
      url: 'https://www.stroke.org/en/about-stroke/stroke-symptoms',
    },
    {
      title: 'Signs and Symptoms of Stroke',
      publisher: 'CDC',
      url: 'https://www.cdc.gov/stroke/signs-symptoms/index.html',
    },
    {
      title: 'Stroke',
      publisher: 'NIH MedlinePlus Medical Encyclopedia',
      url: 'https://medlineplus.gov/ency/article/000726.htm',
    },
    {
      title: 'Transient Ischemic Attack (TIA)',
      publisher: 'American Stroke Association',
      url: 'https://www.stroke.org/en/about-stroke/types-of-stroke/tia-transient-ischemic-attack',
    },
    {
      title: 'Aspirin and Stroke',
      publisher: 'American Stroke Association',
      url: 'https://www.stroke.org/en/life-after-stroke/preventing-another-stroke/aspirin-and-stroke',
    },
  ],
  askBrianPrompts: [
    'What is the difference between a stroke and a TIA?',
    'How can I lower my stroke risk if I have high blood pressure?',
    'What happens at the hospital when someone arrives with stroke symptoms?',
  ],
  tags: ['stroke', 'BE FAST', 'TIA', 'mini-stroke', 'brain', 'face drooping', 'slurred speech', '911', 'emergency'],
};

const heartAttackWarningSigns: Lesson = {
  id: 'heart-attack-warning-signs',
  categoryId: 'emergencies',
  title: 'Heart Attack: Warning Signs for Everyone (Including Women)',
  summary:
    "Chest pain isn't the only sign. Learn the common and easy-to-miss symptoms of a heart attack, what to do first, and why calling 911 beats driving to the ER.",
  readMinutes: 4,
  level: 'Basics',
  icon: 'heart-outline',
  callout: {
    kind: 'emergency',
    text: "If you think you or someone else is having a heart attack, call 911 right away, even if you're not sure. Don't wait to see if it passes, and don't drive yourself to the hospital.",
  },
  sections: [
    {
      heading: 'What happens during a heart attack',
      body: md(
        "A heart attack happens when blood flow to part of the heart muscle is blocked, most often by a clot in a narrowed artery. The longer the muscle goes without blood, the more of it is damaged. Hospitals can reopen the artery with medicine or a procedure, and it works best when done quickly. With a heart attack, **minutes matter**.",
        "A heart attack is not the same as **cardiac arrest**:",
        bullets(
          "**Heart attack** is a circulation problem. Blood flow to the heart is blocked, but the heart usually keeps beating and the person is usually awake.",
          "**Cardiac arrest** is an electrical problem. The heart suddenly stops pumping. The person collapses, doesn't respond, and isn't breathing normally.",
        ),
        'A heart attack can lead to cardiac arrest, which is one more reason to call 911 early.',
      ),
    },
    {
      heading: 'Common warning signs',
      body: md(
        'Some heart attacks are sudden and intense. Others start slowly, with mild pain or discomfort that comes and goes. Watch for:',
        bullets(
          '**Chest discomfort:** pressure, squeezing, fullness, or pain, usually in the center of the chest. It may last more than a few minutes, or go away and come back.',
          '**Discomfort in other areas:** one or both arms, the back, neck, jaw, or stomach.',
          '**Shortness of breath,** with or without chest discomfort.',
          '**Other signs:** a cold sweat, nausea or vomiting, lightheadedness, or a fast or irregular heartbeat.',
        ),
        'Some people, especially older adults, have mild symptoms or mostly shortness of breath. Some heart attacks cause no clear symptoms at all.',
      ),
    },
    {
      heading: 'Signs that are easy to miss, especially in women',
      body: md(
        'Chest pain or discomfort is the most common heart attack symptom for women, too. But women are more likely than men to also have other symptoms, such as:',
        bullets(
          'Shortness of breath',
          'Nausea, vomiting, or an upset stomach',
          'Pain in the back, jaw, neck, shoulder, or arm',
          'Unusual tiredness or weakness, sometimes for days',
          'Anxiety or lightheadedness',
        ),
        "Because these signs can feel like the flu, heartburn, stress, or just being worn out, people often wait too long to get help. If something feels wrong, especially if you have high blood pressure, diabetes, high cholesterol, or smoke, don't talk yourself out of calling. It's better to be checked and told it isn't your heart.",
      ),
    },
    {
      heading: 'What to do right now',
      body: steps(
        "**Call 911.** Do this first, even if you aren't sure it's a heart attack.",
        '**Stop and rest.** Sit down, stay calm, and loosen tight clothing.',
        "**Ask about aspirin.** The 911 dispatcher may tell you to chew an aspirin if you aren't allergic and it's safe for you. Don't delay calling 911 to take aspirin, and don't take it and wait to see if the pain goes away.",
        '**Use your own heart medicine as prescribed.** If a clinician has prescribed nitroglycerin for chest pain, take it as directed.',
        '**Get ready for help.** Unlock the door and grab your medicine list if you can.',
        "**If the person collapses** and isn't breathing normally, start Hands-Only CPR: push hard and fast in the center of the chest, and use an AED as soon as one is available.",
      ),
    },
    {
      heading: 'Why an ambulance beats driving',
      body: md(
        "It can feel faster to drive to the emergency room, but calling 911 is almost always the quickest way to get lifesaving treatment. Here's why:",
        bullets(
          'Emergency crews can check your heart and start tests and medicines right away, before you reach the hospital.',
          'They are trained to revive someone whose heart stops on the way.',
          'People with chest pain who arrive by ambulance may get faster treatment at the hospital.',
          'If you drive yourself, you could pass out at the wheel and hurt yourself or others.',
        ),
        "If you're with someone who has symptoms, don't let them talk you out of calling. Stay with them until help arrives.",
      ),
    },
  ],
  keyTakeaways: [
    'Chest pressure or discomfort is the most common sign, but arm, back, neck, jaw, or stomach pain and shortness of breath matter too.',
    'Women are more likely to also have nausea, shortness of breath, back or jaw pain, and unusual tiredness.',
    "Call 911 first. Only chew aspirin if the dispatcher or your clinician says it's safe for you.",
    "If someone collapses and isn't breathing normally, start Hands-Only CPR and use an AED.",
  ],
  quiz: [
    {
      question: 'Which of these can be a heart attack symptom?',
      options: [
        'Pain or discomfort in the jaw, back, or arm',
        'Shortness of breath without chest pain',
        'Nausea and a cold sweat',
        'All of the above',
      ],
      answerIndex: 3,
      explanation:
        "Heart attacks don't always cause crushing chest pain. Discomfort in the arms, back, neck, jaw, or stomach, shortness of breath, nausea, and a cold sweat can all be signs.",
    },
    {
      question: 'Someone suddenly feels heavy pressure in their chest. What should they do first?',
      options: [
        'Take an aspirin and wait 20 minutes',
        'Call 911',
        'Drive to the nearest emergency room',
        'Lie down and see if it passes',
      ],
      answerIndex: 1,
      explanation:
        "Call 911 first. Emergency crews can start treatment on the way. Aspirin should only be taken if the dispatcher or a clinician says it's safe, and never instead of calling.",
    },
    {
      question: 'How is a heart attack different from cardiac arrest?',
      options: [
        'They are the same thing',
        'A heart attack only happens to men',
        'Cardiac arrest is always less serious',
        'In cardiac arrest the heart stops pumping and the person collapses; in a heart attack, blood flow to the heart is blocked',
      ],
      answerIndex: 3,
      explanation:
        "A heart attack is a blocked-blood-flow problem, and the person is usually awake. Cardiac arrest means the heart has stopped pumping. It needs CPR and an AED right away.",
    },
  ],
  sources: [
    {
      title: 'Warning Signs of a Heart Attack',
      publisher: 'American Heart Association',
      url: 'https://www.heart.org/en/health-topics/heart-attack/warning-signs-of-a-heart-attack',
    },
    {
      title: 'Heart Attack Symptoms in Women',
      publisher: 'American Heart Association',
      url: 'https://www.heart.org/en/health-topics/heart-attack/warning-signs-of-a-heart-attack/heart-attack-symptoms-in-women',
    },
    {
      title: 'Heart Attack - Symptoms',
      publisher: 'NIH National Heart, Lung, and Blood Institute',
      url: 'https://www.nhlbi.nih.gov/health/heart-attack/symptoms',
    },
    {
      title: 'Aspirin and Dual Antiplatelet Therapy',
      publisher: 'American Heart Association',
      url: 'https://www.heart.org/en/health-topics/heart-attack/treatment-of-a-heart-attack/aspirin-and-heart-disease',
    },
    {
      title: 'Heart attack first aid',
      publisher: 'NIH MedlinePlus Medical Encyclopedia',
      url: 'https://medlineplus.gov/ency/article/000063.htm',
    },
  ],
  askBrianPrompts: [
    'How is a heart attack different from cardiac arrest?',
    'What are my personal risk factors for heart disease?',
    'Should I keep aspirin at home in case of a heart attack?',
  ],
  tags: ['heart attack', 'chest pain', 'women', 'cardiac arrest', 'aspirin', 'CPR', 'AED', '911', 'emergency'],
};

const carAccidentWhatToDo: Lesson = {
  id: 'car-accident-what-to-do',
  categoryId: 'emergencies',
  title: 'After a Car Accident: What to Do, Step by Step',
  summary:
    'A calm checklist for the minutes, hours, and days after a crash: staying safe, getting help, collecting information, and getting checked for injuries that show up later.',
  readMinutes: 5,
  level: 'Basics',
  icon: 'car-outline',
  callout: {
    kind: 'emergency',
    text: "If anyone is hurt, trapped, or unconscious, or if there's fire, smoke, leaking fuel, or dangerous traffic, call 911 right away.",
  },
  sections: [
    {
      heading: 'First, make the scene safe',
      body: md(
        'Right after a crash, your heart may be racing. Take a breath and focus on safety first.',
        bullets(
          "**Stop.** Never leave the scene of a crash you're involved in. Leaving can be a crime, especially if someone is hurt.",
          '**Turn on your hazard lights** so other drivers can see you.',
          '**Move out of traffic if you can.** If your car can be driven and no one is badly hurt, move it to the shoulder or a safe spot nearby.',
          "**If the car can't be moved,** decide whether it's safer to stay buckled in or to get yourself and passengers well away from traffic.",
          '**Watch for fire, smoke, or leaking fuel.** If you see any, get everyone away from the vehicles.',
        ),
      ),
    },
    {
      heading: 'Check for injuries and get help',
      body: md(
        'Check yourself first, then your passengers, then people in other vehicles.',
        steps(
          '**Call 911 if anyone is injured.** Tell the dispatcher where you are, how many people are hurt, and about any dangers like fire or blocked lanes.',
          "**Don't move someone who may have a head, neck, or back injury** unless they're in danger, such as from fire, or you need to move them to give CPR. Ask them to stay still.",
          "**Leave a rider's helmet on** unless it must come off for CPR. Keep babies and young children in their car seats unless you need to move them for CPR.",
          "**Give first aid if you can.** Press firmly on heavy bleeding. Start CPR if someone isn't breathing normally.",
        ),
        "Even if no one is hurt, you may need to report the crash to the police or your state's motor vehicle agency. The rules vary by state, so ask the officer or check your state's website.",
      ),
    },
    {
      heading: 'Collect information and take photos',
      body: md(
        "Stay calm and polite. Stick to the facts, and don't argue about who caused the crash. Collect:",
        bullets(
          "The other driver's name, address, and phone number",
          'Their insurance company and policy number (from their proof-of-insurance card)',
          "Their driver's license number and license plate number",
          'The make, model, and year of each vehicle',
          'Names and phone numbers of any witnesses',
          "The officer's name and badge number, and how to get the crash report and its number",
          'The date, time, and exact location, plus notes on weather and road conditions',
        ),
        "Take photos of all the vehicles, the damage, license plates, the whole scene, road signs, and any injuries. If you can't take photos, sketch a simple diagram.",
      ),
    },
    {
      heading: 'Get checked, even if you feel fine',
      body: md(
        "Some crash injuries don't show up right away. Concussion symptoms can take hours or days to appear. Neck injuries such as whiplash (a neck sprain or strain) are also common after crashes. Seeing a clinician soon after a crash can catch problems early and creates a record of your injuries.",
        'Get emergency care right away for:',
        bullets(
          'A headache that gets worse, repeated vomiting, confusion, slurred speech, or unusual sleepiness',
          'Weakness, numbness, or tingling in the arms or legs',
          'Trouble breathing, chest pain, or severe belly pain',
          'Any hit to the head in someone who takes blood thinners, even if they feel fine',
        ),
        'Keep copies of every visit summary, test result, and bill.',
      ),
    },
    {
      heading: 'Tell your insurer and keep records',
      body: md(
        'Call your insurance company as soon as you can, using the number on your insurance card or its app. Then stay organized:',
        bullets(
          'Keep one folder for the police report, photos, medical records, bills, and receipts for things like towing or a rental car.',
          'Write down the date, time, and name of everyone you talk to about the claim, and what they said.',
          "If you don't think a settlement offer is fair, you don't have to accept it. Ask the adjuster to explain the decision in writing. Your state insurance department can help if you still disagree.",
        ),
        "Who pays medical bills after a crash depends on your state and your coverage. It may be your auto policy (such as personal injury protection or medical payments coverage), the other driver's insurer, or your health insurance. This is general information for the US, not legal advice. If someone was seriously hurt or fault is disputed, consider talking with a lawyer.",
      ),
    },
    {
      heading: 'If children were in car seats',
      body: md(
        'Have children checked for injuries just like adults. The National Highway Traffic Safety Administration (NHTSA) recommends replacing a car seat after a **moderate or severe crash**.',
        'A car seat may not need to be replaced only if the crash was minor, meaning **all** of these are true:',
        bullets(
          'The vehicle could be driven away from the crash.',
          'The door nearest the car seat was not damaged.',
          'No one in the vehicle was injured.',
          'The air bags (if any) did not go off.',
          'There is no visible damage to the car seat.',
        ),
        "If you're unsure, follow the car seat maker's instructions, and ask your insurer whether it covers a replacement.",
      ),
    },
  ],
  keyTakeaways: [
    'Safety first: stop, turn on your hazards, get out of traffic, and call 911 if anyone is hurt.',
    "Don't move someone who may have a head, neck, or back injury unless they're in danger or need CPR.",
    'Collect names, insurance details, plates, witnesses, and photos, and stick to the facts.',
    'Get checked even if you feel fine. Some injuries show up hours or days later.',
    'Report the claim to your insurer quickly and keep every record.',
  ],
  quiz: [
    {
      question: 'You were just in a crash and feel fine. What is the best plan?',
      options: [
        'Skip the doctor, since nothing hurts',
        'Wait a month and see how you feel',
        'Get checked by a clinician, because some injuries like concussion show up later',
        "Only see a doctor if the other driver's insurer agrees to pay",
      ],
      answerIndex: 2,
      explanation:
        'Concussion and neck injuries can take hours or days to cause symptoms. Getting checked early catches problems and documents your injuries.',
    },
    {
      question: 'Which information should you collect from the other driver?',
      options: [
        'Their insurance company and policy number',
        "Their license plate and driver's license number",
        'Their name and phone number',
        'All of the above',
      ],
      answerIndex: 3,
      explanation:
        "Get the other driver's contact details, insurance information, driver's license number, and plate number, plus witness names and the police report number.",
    },
    {
      question: "A child's car seat was in a car whose air bags went off in a crash. What does NHTSA recommend?",
      options: [
        'Replace the car seat',
        'Keep using it if it looks fine',
        'Wash it and keep using it',
        'Replace it only if the child was hurt',
      ],
      answerIndex: 0,
      explanation:
        "If the air bags deployed, the crash doesn't count as minor. NHTSA recommends replacing car seats after moderate or severe crashes.",
    },
  ],
  sources: [
    {
      title: 'What You Should Know About Filing an Auto Claim',
      publisher: 'National Association of Insurance Commissioners (NAIC)',
      url: 'https://content.naic.org/article/what-you-should-know-about-filing-auto-claim',
    },
    {
      title: 'Car Seat Use After a Crash',
      publisher: 'NHTSA',
      url: 'https://www.nhtsa.gov/car-seats-and-booster-seats/car-seat-use-after-crash',
    },
    {
      title: 'Head, Neck, and Spinal Injury',
      publisher: 'American Red Cross',
      url: 'https://www.redcross.org/take-a-class/resources/learn-first-aid/head-neck-spinal-injury',
    },
    {
      title: 'Symptoms of Mild TBI and Concussion',
      publisher: 'CDC',
      url: 'https://www.cdc.gov/traumatic-brain-injury/signs-symptoms/index.html',
    },
    {
      title: 'Neck Injuries and Disorders',
      publisher: 'NIH MedlinePlus',
      url: 'https://medlineplus.gov/neckinjuriesanddisorders.html',
    },
  ],
  askBrianPrompts: [
    'What symptoms should I watch for in the days after a car accident?',
    'Who pays my medical bills after a car accident?',
    'How can I tell if I might have whiplash or a concussion?',
  ],
  tags: [
    'car accident',
    'car crash',
    'collision',
    'whiplash',
    'concussion',
    'insurance claim',
    'police report',
    'car seat',
    '911',
  ],
};

const firstAidBasics: Lesson = {
  id: 'first-aid-basics',
  categoryId: 'emergencies',
  title: 'First Aid Basics: Bleeding, Burns, Choking, and CPR',
  summary:
    'Simple, current steps that can save a life before help arrives: stopping heavy bleeding, cooling burns, helping someone who is choking, and Hands-Only CPR with an AED.',
  readMinutes: 5,
  level: 'Basics',
  icon: 'bandage-outline',
  callout: {
    kind: 'emergency',
    text: "For heavy bleeding, a serious burn, choking that won't clear, or someone who collapses and isn't breathing normally, call 911 right away (or have someone call), then start first aid. Put the phone on speaker so the dispatcher can coach you.",
  },
  sections: [
    {
      heading: 'Before you help',
      body: md(
        'A few seconds of planning keeps you and the person safe:',
        steps(
          "**Check the scene.** Make sure there's no traffic, fire, live electricity, or other danger to you.",
          '**Call 911 or send someone.** Point to one person: “You, call 911 and bring back an AED.”',
          '**Ask first** if the person is awake: “I know first aid. Can I help?”',
          '**Protect yourself.** Use gloves if you have them, or a clean cloth or plastic bag as a barrier.',
        ),
        "Don't let fear of doing it wrong stop you. In an emergency, doing something is usually far better than doing nothing. Many states have Good Samaritan laws that protect people who help in good faith, but details vary by state. A first aid and CPR class from the American Red Cross or American Heart Association can build your confidence.",
      ),
    },
    {
      heading: 'Stop heavy bleeding',
      body: md(
        'Heavy bleeding can become life-threatening within minutes. After calling 911:',
        steps(
          '**Press hard.** Put a clean cloth, gauze, or even a piece of clothing on the wound and press firmly and steadily.',
          "**Keep pressing.** Don't lift the cloth to check. Hold pressure until the bleeding stops or help takes over.",
          "**Add, don't remove.** If blood soaks through, leave the first cloth in place and press another on top.",
          "**Use a tourniquet if needed.** For life-threatening bleeding from an arm or leg that pressure can't control, use a tourniquet if one is available and you know how. Place it 2 to 3 inches above the wound, tighten until the bleeding stops, and note the time.",
          "**Leave stuck objects in place.** Don't pull out a knife or stick. Pad around it and press around it.",
        ),
      ),
    },
    {
      heading: 'Cool a burn the right way',
      body: md(
        'For a burn from heat, like a hot pan, steam, or fire:',
        steps(
          "**Remove jewelry and clothing** near the burn, unless it's stuck to the skin.",
          "**Cool it with water.** Hold the burn under clean, cool running water for 5 to 20 minutes. Don't use ice, which can damage the skin more.",
          '**Skip home remedies.** Butter, oil, and other greasy products can trap heat and make the burn worse.',
          '**Leave blisters alone,** and cover the burn loosely with a clean, non-stick dressing.',
        ),
        "**Get medical care** if the burn is larger than the person's palm; is on the face, hands, feet, genitals, or a joint; blisters; looks white, brown, black, or leathery; was caused by chemicals or electricity; or happened to a child. Call 911 for large or deep burns, trouble breathing, or signs of shock.",
      ),
    },
    {
      heading: 'Help someone who is choking',
      body: md(
        "A person who is choking may grab their throat, be unable to talk or cough, make high-pitched sounds, or turn pale or blue. If they can cough hard or speak, encourage them to keep coughing and stay close.",
        "If they can't cough, speak, or breathe (adults and children over 1 year old):",
        steps(
          'Have someone call 911.',
          '**Give 5 back blows.** Stand to the side and slightly behind them, support their chest with one arm, and lean them forward. Strike firmly between the shoulder blades with the heel of your hand.',
          '**Give 5 abdominal thrusts.** Stand behind them, put a fist just above the belly button, grab it with your other hand, and pull sharply in and up.',
          '**Keep alternating** 5 back blows and 5 thrusts until the object comes out or they stop responding. If they stop responding, lower them to the ground and start CPR.',
        ),
        'For someone who is pregnant or too large to reach around, use chest thrusts instead of abdominal thrusts. Babies under 1 need a different technique, so consider an infant CPR class.',
      ),
    },
    {
      heading: 'Hands-Only CPR and AEDs',
      body: md(
        'If a teen or adult suddenly collapses and is not responding and not breathing, or only gasping:',
        steps(
          '**Call 911** and send someone to get an AED (automated external defibrillator).',
          "**Push hard and fast** in the center of the chest, at least 2 inches deep, 100 to 120 times a minute. The beat of the song “Stayin' Alive” is about the right pace. Let the chest rise all the way back up between pushes.",
          "**Use the AED as soon as it arrives.** Turn it on and follow its voice prompts. You don't need training. Make sure no one touches the person during a shock.",
          '**Keep going** until help takes over, the person starts to breathe or move, or you are too exhausted. Trade off with another helper every couple of minutes if you can.',
        ),
        "Immediate CPR can double or triple a person's chance of surviving cardiac arrest. For babies, children, and people who drowned or overdosed, CPR with rescue breaths is recommended if you're trained, but any CPR is better than none.",
      ),
    },
  ],
  keyTakeaways: [
    'Call 911 first (or send someone), then help. The dispatcher can coach you.',
    'For heavy bleeding, press hard and keep pressing. Add cloths on top instead of removing them.',
    'Cool heat burns under cool running water for 5 to 20 minutes. No ice or butter.',
    'For choking, alternate 5 back blows and 5 abdominal thrusts.',
    'For a sudden collapse, push hard and fast in the center of the chest and use an AED.',
  ],
  quiz: [
    {
      question: "Blood is soaking through the cloth you're pressing on a wound. What should you do?",
      options: [
        'Remove the cloth so you can check the wound',
        'Stop pressing so the blood can clot',
        'Keep pressing and add another cloth on top',
        'Rinse the wound with water',
      ],
      answerIndex: 2,
      explanation:
        'Leave the first cloth in place, add another on top, and keep firm, steady pressure. Removing it can disturb clotting.',
    },
    {
      question: 'What is the best first step for a burn from a hot pan?',
      options: [
        'Hold it under cool running water',
        'Put ice on it',
        'Rub butter or oil on it',
        'Pop any blisters',
      ],
      answerIndex: 0,
      explanation:
        'Cool, clean running water for 5 to 20 minutes cools the burn and eases pain. Ice can damage skin, and greasy remedies can trap heat.',
    },
    {
      question: "An adult is choking and can't cough or speak. What does current guidance recommend?",
      options: [
        'Give them water to drink',
        'Wait for them to cough it out',
        'Sweep your finger through their mouth without looking',
        'Alternate 5 back blows and 5 abdominal thrusts',
      ],
      answerIndex: 3,
      explanation:
        'The American Red Cross and the 2025 American Heart Association guidelines both recommend alternating 5 back blows and 5 abdominal thrusts until the object comes out or the person stops responding.',
    },
  ],
  sources: [
    {
      title: 'What is CPR',
      publisher: 'American Heart Association',
      url: 'https://cpr.heart.org/en/resources/what-is-cpr',
    },
    {
      title: 'Updated CPR guidelines tackle choking response, opioid-related emergencies and revised chain of survival',
      publisher: 'American Heart Association',
      url: 'https://newsroom.heart.org/news/updated-cpr-guidelines-tackle-choking-response-opioid-related-emergencies-and-a-revised-chain-of-survival',
    },
    {
      title: 'Adult & Child Choking: Symptoms and First Aid',
      publisher: 'American Red Cross',
      url: 'https://www.redcross.org/take-a-class/resources/learn-first-aid/adult-child-choking',
    },
    {
      title: 'Burns: Types, Symptoms, and How To Help',
      publisher: 'American Red Cross',
      url: 'https://www.redcross.org/take-a-class/resources/learn-first-aid/burns',
    },
    {
      title: 'Bleeding',
      publisher: 'NIH MedlinePlus Medical Encyclopedia',
      url: 'https://medlineplus.gov/ency/article/000045.htm',
    },
  ],
  askBrianPrompts: [
    'When does a cut need stitches?',
    'How is CPR different for babies and children?',
    'What should I keep in a home first aid kit?',
  ],
  tags: [
    'first aid',
    'bleeding',
    'tourniquet',
    'burns',
    'choking',
    'back blows',
    'abdominal thrusts',
    'Heimlich',
    'CPR',
    'AED',
  ],
};

const anaphylaxisEpinephrine: Lesson = {
  id: 'anaphylaxis-epinephrine',
  categoryId: 'emergencies',
  title: 'Severe Allergic Reactions (Anaphylaxis) and Epinephrine',
  summary:
    'How to recognize anaphylaxis, why epinephrine always comes first, and what to do before and after using an auto-injector or nasal spray.',
  readMinutes: 5,
  level: 'Intermediate',
  icon: 'warning-outline',
  callout: {
    kind: 'emergency',
    text: 'Anaphylaxis can be deadly within minutes. If someone has trouble breathing, swelling of the tongue or throat, or feels faint after a possible trigger, use their epinephrine right away and call 911.',
  },
  sections: [
    {
      heading: 'What anaphylaxis is',
      body: md(
        'Anaphylaxis is a severe allergic reaction that affects the whole body. It usually starts within seconds or minutes of contact with a trigger, though some reactions start hours later. It can get worse very quickly.',
        'Common triggers include:',
        bullets(
          '**Foods,** such as peanuts, tree nuts, shellfish, fish, milk, and eggs',
          '**Medicines,** such as some antibiotics',
          '**Insect stings,** from bees, wasps, and similar insects',
        ),
        'People who have had allergic reactions before are at higher risk, and sometimes anaphylaxis happens with no known cause. If you have a severe allergy, your clinician may prescribe epinephrine for you to carry and give you a written anaphylaxis action plan.',
      ),
    },
    {
      heading: 'Warning signs',
      body: md(
        'Anaphylaxis often affects more than one part of the body at once. Watch for:',
        bullets(
          '**Breathing:** trouble breathing, wheezing, coughing, or high-pitched breathing sounds',
          '**Throat and mouth:** swelling of the lips, tongue, or throat; trouble swallowing; a hoarse or whispery voice',
          '**Skin:** hives, itching, flushing, or swelling',
          '**Circulation:** dizziness, fainting, a weak or fast pulse, or pale or bluish skin',
          '**Stomach:** belly pain, vomiting, or diarrhea',
          '**Mind:** anxiety or a feeling that something is very wrong',
        ),
        "Skin signs aren't always present. A few hives alone may be a milder reaction, but hives plus any breathing, throat, or dizziness symptoms is an emergency.",
      ),
    },
    {
      heading: 'Use epinephrine first, then call 911',
      body: md(
        "Epinephrine is the only medicine that can stop anaphylaxis. Give it at the first sign of a severe reaction. Don't wait to see if things get worse. If you're not sure whether it's anaphylaxis, allergy experts advise using the epinephrine anyway.",
        steps(
          '**Give epinephrine.** For an auto-injector, press it firmly into the middle of the outer thigh and hold it as the label directs. It can go through clothing. For a nasal spray, spray into one nostril. Follow the instructions on your device.',
          "**Call 911.** Say that it's anaphylaxis and that epinephrine was given.",
          "**Position the person.** Have them lie on their back with legs raised, unless that makes breathing harder or they're vomiting. Then let them sit up or lie on their side.",
          "**Give a second dose** with a new device if symptoms don't improve, or come back, after 5 to 10 minutes and help hasn't arrived.",
          '**Hand the used device to responders** when they arrive.',
        ),
      ),
    },
    {
      heading: "Why allergy pills aren't enough",
      body: md(
        "Antihistamine pills, such as diphenhydramine or cetirizine, can ease mild itching or a few hives. But they don't open a closing airway or raise dangerously low blood pressure, and they work too slowly for anaphylaxis. An asthma inhaler may ease wheezing, but it won't stop the reaction either. Never use them in place of epinephrine.",
        "Don't give anything by mouth to someone who is having trouble breathing or swallowing.",
        'Epinephrine is considered safe to use in a severe allergic reaction. Common side effects, like a racing heart, shakiness, or feeling anxious, usually pass quickly. The danger of not using it during anaphylaxis is far greater.',
      ),
    },
    {
      heading: 'After the reaction',
      body: md(
        'Even if the person feels better after epinephrine, they should be checked by emergency medical staff. Symptoms can come back hours later without another exposure. This is called a biphasic reaction, and it can happen as long as 12 to 24 hours after the first reaction.',
        'After any episode:',
        bullets(
          'Replace the epinephrine you used right away.',
          'See your clinician or an allergist to confirm what caused the reaction.',
          'Ask for a written anaphylaxis action plan, and share it with family, school, or work.',
          'Watch for symptoms coming back over the next day, and call 911 if they do.',
        ),
      ),
    },
    {
      heading: 'Be prepared every day',
      body: md(
        'If you or your child has a severe allergy:',
        bullets(
          '**Carry two doses** of epinephrine at all times. Some reactions need a second dose.',
          '**Know your device.** Epinephrine comes as auto-injectors and, since 2024, as a nasal spray approved for some people. Practice with a trainer device if one is available.',
          "**Check expiration dates,** and store epinephrine as the label says. Don't leave it in a very hot or very cold car.",
          '**Wear a medical ID** bracelet or necklace.',
          '**Read food labels,** and ask about ingredients when eating out.',
          '**Teach others** where your epinephrine is and how to use it.',
        ),
        'If cost is a problem, ask your pharmacist about lower-cost generic options.',
      ),
    },
  ],
  keyTakeaways: [
    'Signs of anaphylaxis include trouble breathing, throat or tongue swelling, hives, vomiting, dizziness, or fainting.',
    'Epinephrine is the only medicine that stops anaphylaxis. Use it right away, then call 911.',
    "If symptoms don't improve in 5 to 10 minutes, a second dose may be needed.",
    'Get checked even if you feel better, because symptoms can return hours later.',
    'Carry two doses, wear a medical ID, and keep a written action plan.',
  ],
  quiz: [
    {
      question:
        "After eating shrimp, a friend's lips swell and she starts wheezing. She has an epinephrine auto-injector. What should happen first?",
      options: [
        'Give her an allergy pill and wait',
        'Use the epinephrine now and call 911',
        'Have her walk around outside for fresh air',
        'Wait 15 minutes to see if it gets worse',
      ],
      answerIndex: 1,
      explanation:
        "Swelling plus wheezing points to anaphylaxis. Epinephrine should be given right away, then call 911. Allergy pills work too slowly and don't treat the airway.",
    },
    {
      question: 'Where is an epinephrine auto-injector usually given?',
      options: ['The upper arm', 'The belly', 'The middle of the outer thigh', 'The buttock'],
      answerIndex: 2,
      explanation:
        'Auto-injectors are pressed into the middle of the outer thigh, and they can go through clothing. Always follow the instructions on your device.',
    },
    {
      question: 'Why should someone get emergency care even if they feel better after epinephrine?',
      options: [
        'Symptoms can come back hours later',
        'Epinephrine has to be removed from the body at a hospital',
        'It is required by law',
        "They shouldn't. It is better to go home and rest",
      ],
      answerIndex: 0,
      explanation:
        'A second wave of symptoms (a biphasic reaction) can happen hours later without another exposure, so medical staff should check and watch the person.',
    },
  ],
  sources: [
    {
      title: 'Anaphylaxis',
      publisher: 'NIH MedlinePlus Medical Encyclopedia',
      url: 'https://medlineplus.gov/ency/article/000844.htm',
    },
    {
      title: 'Allergic reactions',
      publisher: 'NIH MedlinePlus Medical Encyclopedia',
      url: 'https://medlineplus.gov/ency/article/000005.htm',
    },
    {
      title: 'Allergic Reaction/Anaphylaxis: Causes, Symptoms, How To Help',
      publisher: 'American Red Cross',
      url: 'https://www.redcross.org/take-a-class/resources/learn-first-aid/allergic-reaction-anaphylaxis',
    },
    {
      title: 'FDA Approves First Nasal Spray for Treatment of Anaphylaxis',
      publisher: 'FDA',
      url: 'https://www.fda.gov/news-events/press-announcements/fda-approves-first-nasal-spray-treatment-anaphylaxis',
    },
    {
      title: 'Anaphylaxis',
      publisher: 'American College of Allergy, Asthma & Immunology',
      url: 'https://acaai.org/allergies/symptoms/anaphylaxis/',
    },
  ],
  askBrianPrompts: [
    'How do I use an epinephrine auto-injector step by step?',
    'How can I tell a mild allergic reaction from anaphylaxis?',
    "What should be in an anaphylaxis action plan for my child's school?",
  ],
  tags: [
    'anaphylaxis',
    'allergic reaction',
    'allergy',
    'epinephrine',
    'auto-injector',
    'food allergy',
    'bee sting',
    'hives',
    '911',
  ],
};

const poisoningOverdoseNaloxone: Lesson = {
  id: 'poisoning-overdose-naloxone',
  categoryId: 'emergencies',
  title: 'Poisoning and Overdose: Poison Help, 911, and Naloxone',
  summary:
    'Know when to call Poison Help (1-800-222-1222) and when to call 911, how to spot an opioid overdose, and how to use naloxone to reverse it.',
  readMinutes: 5,
  level: 'Basics',
  icon: 'flask-outline',
  callout: {
    kind: 'emergency',
    text: "Call 911 if the person has collapsed, is having a seizure, has trouble breathing, or can't be woken up. For any other poisoning question in the US, call Poison Help at 1-800-222-1222. It's free, confidential, and open 24/7.",
  },
  sections: [
    {
      heading: '911 or Poison Help?',
      body: md(
        'In the US, there are two numbers to know:',
        bullets(
          '**Call 911** if the person is unconscious or hard to wake up, is having a seizure, or has trouble breathing.',
          '**Call Poison Help at 1-800-222-1222** for everything else. It connects you to your local poison center, where poison experts answer 24 hours a day, 7 days a week. The call is free and confidential, and help is available in many languages.',
        ),
        "You don't have to be sure it's a poisoning, or that it's serious, to call. The experts will tell you whether it's safe to watch the person at home or whether they need to be seen. You can also get guidance online with the free webPOISONCONTROL tool at poison.org.",
        "Save 1-800-222-1222 in your phone now so it's there when you need it.",
      ),
    },
    {
      heading: 'First steps for a possible poisoning',
      body: md(
        'While you call for help:',
        bullets(
          "**Swallowed something:** Don't make the person throw up unless poison control or a clinician tells you to. Never give anything by mouth to someone who is unconscious or very drowsy.",
          '**On the skin:** Take off any clothing the substance touched and rinse the skin with water.',
          '**In the eyes:** Rinse with clean, lukewarm water, and ask Poison Help how long to keep rinsing.',
          "**Breathed in fumes:** Get to fresh air if it's safe to do so. If a carbon monoxide alarm goes off, or several people suddenly feel sick with headache, dizziness, or nausea, get everyone outside and call 911.",
        ),
        "Keep the product container with you. The label helps experts know what was involved. Be ready to share the person's age and weight, what they took, how much, and when.",
      ),
    },
    {
      heading: 'Signs of an opioid overdose',
      body: md(
        "Opioids include prescription pain medicines, heroin, and fentanyl. Illegally made fentanyl is often mixed into other drugs and fake pills, so an overdose can happen to someone who didn't know they took an opioid.",
        'Watch for:',
        bullets(
          'Very small, pinpoint pupils',
          "Falling asleep, passing out, or not waking up when you shout or shake them",
          'Slow, weak, or stopped breathing',
          'Choking, gurgling, or snoring sounds',
          'A limp body',
          'Cold or clammy skin',
          'Blue, gray, or pale lips and fingernails',
        ),
        "An opioid overdose can stop a person's breathing, so act fast.",
      ),
    },
    {
      heading: 'How to use naloxone',
      body: md(
        'Naloxone is a medicine that can quickly reverse an opioid overdose. It can restore normal breathing within 2 to 3 minutes.',
        steps(
          '**Try to wake them.** Shout their name and rub your knuckles hard on the center of their chest.',
          '**Call 911.**',
          '**Give naloxone.** For the nasal spray, lay them on their back, tip the head back, put the nozzle in one nostril, and press the plunger.',
          "**Support breathing.** If they aren't breathing normally, start CPR if you know how. If they are breathing, roll them onto their side so they don't choke.",
          "**Give another dose** in the other nostril with a new device if they don't respond in 2 to 3 minutes.",
          '**Stay with them** until help arrives.',
        ),
        "Naloxone won't harm someone who isn't overdosing on opioids. It wears off in 30 to 90 minutes, and the overdose can come back, so the person still needs medical care. Someone who depends on opioids may have withdrawal symptoms after naloxone. That's unpleasant but usually not life-threatening.",
      ),
    },
    {
      heading: 'Get naloxone and prevent poisonings',
      body: md(
        "Naloxone nasal spray has been approved for sale without a prescription since 2023. Look for it at pharmacies and some other stores, and ask your health department about free programs. Keep it on hand if you or someone you live with takes prescription opioids or uses drugs, and tell others where it is.",
        "Most states have Good Samaritan laws that may protect a person who is overdosing, and the person who calls for help, from certain criminal charges. Details vary by state. Don't let fear stop you from calling 911.",
        'To prevent poisonings at home:',
        bullets(
          "Keep medicines and chemicals locked up and out of children's sight and reach.",
          'Keep products in their original containers. Never store chemicals in food or drink containers.',
          "Get rid of medicines you don't need through a drug take-back program.",
          "Don't mix medicines, alcohol, or other drugs without checking with a pharmacist or clinician.",
        ),
      ),
    },
  ],
  keyTakeaways: [
    "Call 911 for collapse, seizures, trouble breathing, or someone who can't be woken up.",
    "For other poison questions, call Poison Help at 1-800-222-1222. It's free, confidential, and open 24/7.",
    "Don't make someone throw up unless an expert tells you to.",
    "Naloxone reverses opioid overdoses, is sold without a prescription, and won't harm someone who isn't overdosing.",
    'Naloxone wears off in 30 to 90 minutes, so stay with the person and make sure they get medical care.',
  ],
  quiz: [
    {
      question: 'A toddler swallowed some of your pills but is awake and acting normal. What should you do?',
      options: [
        'Make them throw up',
        'Wait to see if symptoms develop',
        'Give milk and put them down for a nap',
        'Call Poison Help at 1-800-222-1222 right away',
      ],
      answerIndex: 3,
      explanation:
        "Don't wait for symptoms, since some poisonings take time to show. Poison experts can tell you exactly what to do. Don't make a child vomit unless an expert tells you to.",
    },
    {
      question: 'Which of these is a sign of an opioid overdose?',
      options: [
        'Pinpoint pupils and slow or stopped breathing',
        'Fast talking and trouble sitting still',
        'Large pupils and laughing',
        'Sneezing and a runny nose',
      ],
      answerIndex: 0,
      explanation:
        'Pinpoint pupils, slow or stopped breathing, gurgling or snoring sounds, and not waking up are key signs of an opioid overdose.',
    },
    {
      question: 'You gave naloxone and the person woke up. What should you do next?',
      options: [
        'Let them sleep it off alone',
        'Stay with them and make sure they get medical care, because naloxone can wear off',
        'Give them coffee and send them home',
        'Nothing else is needed',
      ],
      answerIndex: 1,
      explanation:
        'Naloxone lasts only 30 to 90 minutes, and many opioids last longer, so the overdose can return. Stay with the person until emergency help takes over.',
    },
  ],
  sources: [
    {
      title: 'Poison Control',
      publisher: 'Poison Control (National Capital Poison Center)',
      url: 'https://www.poison.org/',
    },
    {
      title: 'Poisoning first aid',
      publisher: 'NIH MedlinePlus Medical Encyclopedia',
      url: 'https://medlineplus.gov/ency/article/007579.htm',
    },
    {
      title: 'What to Do If You Think Someone Is Overdosing',
      publisher: 'CDC',
      url: 'https://www.cdc.gov/stop-overdose/response/index.html',
    },
    {
      title: 'Naloxone DrugFacts',
      publisher: 'NIH National Institute on Drug Abuse',
      url: 'https://nida.nih.gov/publications/drugfacts/naloxone',
    },
    {
      title: 'FDA Approves First Over-the-Counter Naloxone Nasal Spray',
      publisher: 'FDA',
      url: 'https://www.fda.gov/news-events/press-announcements/fda-approves-first-over-counter-naloxone-nasal-spray',
    },
  ],
  askBrianPrompts: [
    'Where can I get naloxone, and how should I store it?',
    'How do I childproof medicines and cleaning products at home?',
    'How do I safely get rid of leftover prescription opioids?',
  ],
  tags: [
    'poisoning',
    'Poison Control',
    'Poison Help',
    '1-800-222-1222',
    'overdose',
    'opioids',
    'fentanyl',
    'naloxone',
    'carbon monoxide',
    '911',
  ],
};

const concussionHeadInjury: Lesson = {
  id: 'concussion-head-injury',
  categoryId: 'emergencies',
  title: 'Head Injuries and Concussion: Danger Signs and Recovery',
  summary:
    'Most concussions get better with time, but some head injuries are emergencies. Learn the danger signs, who needs to be checked right away, and how to recover safely.',
  readMinutes: 4,
  level: 'Intermediate',
  icon: 'body-outline',
  callout: {
    kind: 'emergency',
    text: "Call 911 or go to the ER right away after a head injury if the person has a headache that gets worse, repeated vomiting, a seizure, slurred speech, weakness or numbness, one pupil larger than the other, growing confusion, or can't be woken up.",
  },
  sections: [
    {
      heading: 'What a concussion is',
      body: md(
        'A concussion is a type of mild traumatic brain injury (TBI). It happens when a bump, blow, or jolt to the head, or a hit to the body, makes the head move quickly back and forth. This can make the brain bounce or twist inside the skull.',
        'Common causes include falls, car crashes, sports, and being hit by or against an object.',
        "You don't have to be knocked out to have a concussion. In fact, most concussions happen without passing out. Doctors may call a concussion “mild” because it usually isn't life-threatening, but its effects can be serious and deserve care.",
      ),
    },
    {
      heading: 'Danger signs: get emergency care',
      body: md(
        'Rarely, a head injury causes bleeding that presses on the brain. Call 911 or go to the emergency room right away for any of these signs:',
        bullets(
          'One pupil (the black center of the eye) larger than the other',
          "Drowsiness, or can't be woken up",
          "A headache that gets worse and doesn't go away",
          'Slurred speech, weakness, numbness, or poor coordination',
          'Repeated vomiting or nausea',
          'Seizures or convulsions',
          'Unusual behavior, growing confusion, restlessness, or agitation',
          'Passing out, even briefly',
        ),
        "In babies and toddlers, also watch for crying that can't be soothed and refusing to nurse or eat.",
      ),
    },
    {
      heading: 'Who should get checked right away',
      body: md(
        'Anyone with a possible concussion should be seen by a healthcare provider, even if the symptoms seem mild. Take extra care with:',
        bullets(
          '**Older adults.** Falls are a common cause of head injury, and signs of a brain injury can be missed because they overlap with other health problems.',
          '**People who take blood thinners,** such as warfarin, apixaban, rivaroxaban, clopidogrel, or aspirin. These medicines raise the risk of bleeding in the brain after a head injury. Get checked right away, even if you feel fine.',
          "**Young children,** who may not be able to tell you how they feel.",
        ),
        "Tell the clinician how the injury happened and what symptoms you've noticed since.",
      ),
    },
    {
      heading: 'Common concussion symptoms',
      body: md(
        'Symptoms can show up right away or not until hours or days later. They often fall into four groups:',
        bullets(
          '**Physical:** headache, dizziness, nausea, blurry vision, feeling tired, or being bothered by light or noise',
          '**Thinking:** feeling foggy or slowed down, or trouble concentrating or remembering',
          '**Emotions:** feeling more irritable, sad, anxious, or emotional than usual',
          '**Sleep:** sleeping more or less than usual, or trouble falling asleep',
        ),
        'Most people feel better within a few days to a few weeks. Recovery may take longer for older adults, young children, and people who have had a concussion before.',
      ),
    },
    {
      heading: 'Recovering well',
      body: md(
        "Follow your clinician's advice. The CDC offers these general tips:",
        bullets(
          '**Rest for the first day or two,** when symptoms are usually worst.',
          '**Then ease back into light activity,** like short walks, even if you still have mild symptoms. If a symptom gets worse, back off and try again later.',
          '**Protect your sleep.** Limit screens and loud music before bed, keep a regular schedule, and sleep in a dark room.',
          "**Avoid anything that could cause another head injury** until you've recovered.",
          "**Ask when it's safe** to drive and return to work or school, and get the answer in writing.",
          '**Ask which pain reliever is safe** for you before taking one.',
        ),
        "It's generally safe to sleep after a concussion once a clinician has checked you. Call your clinician if symptoms get worse or last longer than 2 to 3 weeks.",
      ),
    },
    {
      heading: 'Sports and play: when in doubt, sit it out',
      body: md(
        "If a player might have a concussion, take them out of the game right away. They should not return the same day, even if they feel fine, and should go back only after a healthcare provider says it's OK.",
        'Returning too soon raises the risk of another concussion while the brain is still healing. That can slow recovery and, in rare cases, cause lasting harm.',
        'Helmets help protect against serious head and brain injuries, so wear one that fits for biking, skating, skiing, and contact sports. But no helmet is concussion-proof, so avoiding hits to the head still matters.',
      ),
    },
  ],
  keyTakeaways: [
    "You don't have to pass out to have a concussion.",
    'A worsening headache, repeated vomiting, seizures, unequal pupils, or confusion means call 911.',
    'Anyone on blood thinners should be checked right away after a head injury, even if they feel fine.',
    'Rest for a day or two, then ease back into light activity.',
    'Athletes with a possible concussion sit out the rest of the day and return only when cleared.',
  ],
  quiz: [
    {
      question: 'Which of these is a danger sign after a head injury that needs emergency care?',
      options: [
        'A mild headache that gets better with rest',
        'Feeling a little tired that evening',
        'A small bump on the forehead',
        'One pupil larger than the other',
      ],
      answerIndex: 3,
      explanation:
        'Unequal pupils can be a sign of bleeding pressing on the brain. Call 911 or go to the ER right away.',
    },
    {
      question:
        'Your 78-year-old mother takes a blood thinner. She bumped her head in a fall but says she feels fine. What should she do?',
      options: [
        'Get checked by a healthcare provider right away',
        'Nothing, since she feels fine',
        'Take an aspirin for the bump',
        'Wait a week and see',
      ],
      answerIndex: 0,
      explanation:
        'Blood thinners raise the risk of bleeding in the brain after a head injury, and symptoms can be delayed or missed in older adults. She should be checked right away.',
    },
    {
      question: 'A teen gets hit in the head during a game and feels dizzy. When can they return to play?',
      options: [
        'After 15 minutes of rest on the bench',
        'As soon as the dizziness stops',
        'Not the same day, and only after a healthcare provider clears them',
        'Next quarter, if they wear a better helmet',
      ],
      answerIndex: 2,
      explanation:
        "When in doubt, sit it out. A player with a possible concussion should not return the same day and needs a healthcare provider's OK first. No helmet is concussion-proof.",
    },
  ],
  sources: [
    {
      title: 'Symptoms of Mild TBI and Concussion',
      publisher: 'CDC',
      url: 'https://www.cdc.gov/traumatic-brain-injury/signs-symptoms/index.html',
    },
    {
      title: 'What to Do After a Mild TBI or Concussion',
      publisher: 'CDC',
      url: 'https://www.cdc.gov/traumatic-brain-injury/response/index.html',
    },
    {
      title: 'Responding to a Sports-related Concussion',
      publisher: 'CDC HEADS UP',
      url: 'https://www.cdc.gov/heads-up/response/index.html',
    },
    {
      title: 'Information for Older Adults (Still Going Strong)',
      publisher: 'CDC',
      url: 'https://www.cdc.gov/still-going-strong/older-adults/',
    },
    {
      title: 'Concussion',
      publisher: 'NIH MedlinePlus',
      url: 'https://medlineplus.gov/concussion.html',
    },
  ],
  askBrianPrompts: [
    'How long does it usually take to recover from a concussion?',
    'When can I drive or go back to work after a concussion?',
    'Which pain relievers are safest after a head injury?',
  ],
  tags: [
    'concussion',
    'head injury',
    'traumatic brain injury',
    'TBI',
    'falls',
    'sports',
    'blood thinners',
    'helmet',
    '911',
  ],
};

const mentalHealthCrisis988: Lesson = {
  id: 'mental-health-crisis-988',
  categoryId: 'emergencies',
  title: 'Mental Health Crisis: How 988 Works and How to Help',
  summary:
    'What to do if you or someone you care about is in emotional crisis or thinking about suicide, including how to reach the 988 Lifeline and when to call 911.',
  readMinutes: 5,
  level: 'Basics',
  icon: 'help-buoy-outline',
  callout: {
    kind: 'emergency',
    text: "If someone is in immediate danger, for example they've hurt themselves, taken an overdose, or have a weapon and intend to use it, call 911. For a suicidal, mental health, or substance use crisis, call or text 988, or chat at 988lifeline.org, any time of day or night.",
  },
  sections: [
    {
      heading: 'What 988 is',
      body: md(
        'The **988 Suicide & Crisis Lifeline** is the US national crisis line. You can reach it three ways:',
        bullets('**Call** 988', '**Text** 988', '**Chat** online at 988lifeline.org'),
        "It's available 24 hours a day, every day. It's free (standard text message rates may apply), and your conversation is confidential. Trained crisis counselors listen without judgment, help you get through the moment, and connect you with local resources.",
        "**You don't have to be suicidal to reach out.** People contact 988 about emotional distress, anxiety, depression, drug or alcohol problems, loneliness, relationship trouble, and more. You can also contact 988 if you're worried about someone else.",
      ),
    },
    {
      heading: 'Options for specific needs',
      body: md(
        bullets(
          '**Veterans, service members, and their loved ones:** call 988 and press 1, or text 838255, to reach the Veterans Crisis Line.',
          '**Spanish speakers:** call 988 and press 2, or text AYUDA to 988.',
          '**Deaf and hard of hearing people:** 988 offers videophone access in American Sign Language (ASL). TTY users can use their preferred relay service or dial 711, then 988.',
          '**Other languages:** free interpretation is available in more than 240 other languages.',
        ),
        "If your local crisis center can't take a call, it is automatically sent to a national backup center, so someone will answer.",
      ),
    },
    {
      heading: 'What happens when you reach out',
      body: md(
        "A trained crisis counselor will introduce themselves, ask about your safety, and listen to understand what's going on. They'll offer support and share resources that may help, such as local mental health services.",
        "Many people worry that contacting 988 will automatically send the police. According to SAMHSA, most people who contact 988 are helped during the call, text, or chat without 911 being involved. Counselors contact 911 only when someone's life is at immediate risk and the danger can't be reduced during the conversation, and many of those times it happens with the caller's cooperation.",
        'In some areas, crisis services can also send a mobile crisis team, trained mental health workers who meet you in person. These services are not yet available everywhere.',
      ),
    },
    {
      heading: 'Warning signs to take seriously',
      body: md(
        "These signs may mean someone is thinking about suicide, especially if they're new, getting worse, or linked to a painful loss or change:",
        bullets(
          '**Talking about** wanting to die, feeling great guilt or shame, or being a burden to others',
          '**Feeling** empty, hopeless, trapped, or like there is no reason to live; extremely sad, anxious, agitated, or full of rage; or in unbearable emotional or physical pain',
          '**Changing behavior,** such as making a plan or researching ways to die; withdrawing from friends; saying goodbye or giving away important items; taking dangerous risks; extreme mood swings; eating or sleeping more or less; or using drugs or alcohol more often',
        ),
        'If you notice these signs in yourself or someone else, reach out to 988.',
      ),
    },
    {
      heading: 'How to help someone: 5 action steps',
      body: md(
        steps(
          '**Ask.** Ask directly: “Are you thinking about suicide?” Studies show that asking does not increase suicidal thoughts or behavior.',
          "**Be there.** Listen without judgment and take what they say seriously. Don't act shocked or argue.",
          '**Help keep them safe.** Ask if they have a plan. Put distance between them and dangerous items, such as firearms and stored-up medicines, by locking them up or having someone else hold them for now.',
          '**Help them connect.** Call or text 988 together, or help them reach a trusted person or a mental health professional.',
          '**Follow up.** Check in after the crisis. Ongoing, caring contact can make a real difference.',
        ),
        "Don't promise to keep their suicidal thoughts a secret. If they are in immediate danger, call 911 and stay with them if it's safe.",
      ),
    },
    {
      heading: "If you're the one struggling",
      body: md(
        "If you're having thoughts of suicide, you are not alone, and help is available right now. Call or text 988, or tell someone you trust how you're feeling.",
        'A few steps can help you get through a hard moment:',
        bullets(
          'Move away from anything you could use to hurt yourself, or ask someone to hold onto it for you.',
          'Go somewhere you feel safer, or be around people you trust.',
          'Avoid alcohol and drugs, which can make things feel worse and make it harder to stay safe.',
          'Work with a counselor or clinician on a written safety plan for future hard times.',
        ),
        'Supporting someone in crisis is hard, too. If it brings up heavy feelings for you, reach out for support. 988 is there for helpers as well.',
      ),
    },
  ],
  keyTakeaways: [
    "Call, text, or chat 988 any time. It's free and confidential, and you don't have to be suicidal to reach out.",
    "Call 911 if someone's life is in immediate danger.",
    "Asking directly about suicide does not put the idea in someone's head.",
    'During a crisis, put distance between the person and firearms or stored-up medicines.',
    'Veterans can press 1. Spanish speakers can press 2 or text AYUDA to 988.',
  ],
  quiz: [
    {
      question: 'Who can contact the 988 Lifeline?',
      options: [
        'Only people who are actively planning suicide',
        'Only veterans',
        'Anyone in emotional distress or a substance use crisis, or anyone worried about someone else',
        'Only people with health insurance',
      ],
      answerIndex: 2,
      explanation:
        "988 is for anyone going through a mental health, suicidal, or substance use crisis, and for people worried about someone else. It's free, and no insurance is needed.",
    },
    {
      question: 'Does asking someone directly whether they are thinking about suicide put the idea in their head?',
      options: [
        'No. Studies show asking does not increase suicidal thoughts or behavior',
        'Yes, so it is better to avoid the topic',
        'Only if you ask more than once',
        'Only for teenagers',
      ],
      answerIndex: 0,
      explanation:
        'Asking directly opens the door to a conversation. Research suggests that talking about suicide may actually reduce suicidal thoughts.',
    },
    {
      question: 'A friend texts that they just swallowed a large number of pills. What should you do first?',
      options: [
        'Text 988 later tonight',
        'Call 911',
        'Wait until they reply again',
        'Tell them to sleep it off',
      ],
      answerIndex: 1,
      explanation:
        'A possible overdose is a medical emergency with immediate danger to life, so call 911 right away. 988 is for crisis support when there is no immediate medical emergency.',
    },
  ],
  sources: [
    {
      title: 'Get Help',
      publisher: '988 Suicide & Crisis Lifeline',
      url: 'https://988lifeline.org/get-help/',
    },
    {
      title: 'Help Someone Else',
      publisher: '988 Suicide & Crisis Lifeline',
      url: 'https://988lifeline.org/help-someone-else/',
    },
    {
      title: '988 Frequently Asked Questions',
      publisher: 'SAMHSA',
      url: 'https://www.samhsa.gov/mental-health/988/faqs',
    },
    {
      title: 'Warning Signs of Suicide',
      publisher: 'NIH National Institute of Mental Health',
      url: 'https://www.nimh.nih.gov/health/publications/warning-signs-of-suicide',
    },
    {
      title: '5 Action Steps to Help Someone Having Thoughts of Suicide',
      publisher: 'NIH National Institute of Mental Health',
      url: 'https://www.nimh.nih.gov/health/publications/5-action-steps-to-help-someone-having-thoughts-of-suicide',
    },
  ],
  askBrianPrompts: [
    "How do I start a conversation with a friend I'm worried about?",
    'What is a safety plan, and how do I make one?',
    'How can I find a therapist or mental health clinic near me?',
  ],
  tags: [
    '988',
    'suicide prevention',
    'mental health crisis',
    'crisis line',
    'Veterans Crisis Line',
    'depression',
    'anxiety',
    'warning signs',
    '911',
  ],
};

export const lessons: Lesson[] = [
  strokeBeFast,
  heartAttackWarningSigns,
  carAccidentWhatToDo,
  firstAidBasics,
  anaphylaxisEpinephrine,
  poisoningOverdoseNaloxone,
  concussionHeadInjury,
  mentalHealthCrisis988,
];
