import type { LessonCategory } from './types';

export const lessonCategories: LessonCategory[] = [
  {
    id: 'emergencies',
    title: 'Emergencies & Accidents',
    description: 'Stroke, heart attack, car accidents, first aid, and when to call 911.',
    icon: 'alert-circle-outline',
  },
  {
    id: 'illness',
    title: 'Feeling Sick?',
    description: 'What to do if you suspect an illness, how to describe symptoms, and when to get seen.',
    icon: 'thermometer-outline',
  },
  {
    id: 'healthcare-system',
    title: 'Navigating Healthcare',
    description: 'How the system works: primary care, specialists, urgent care vs. the ER, and your records.',
    icon: 'business-outline',
  },
  {
    id: 'insurance',
    title: 'Insurance & Bills',
    description: 'Premiums, deductibles, plan types, Medicare/Medicaid, and how to read (and fight) a bill.',
    icon: 'card-outline',
  },
  {
    id: 'rights-liability',
    title: 'Rights & Liability',
    description: 'Informed consent, privacy, malpractice basics, advance directives, and accident liability.',
    icon: 'shield-checkmark-outline',
  },
  {
    id: 'medications',
    title: 'Medications & Pharmacy',
    description: 'Reading labels, generics, saving money, interactions, antibiotics, and safe disposal.',
    icon: 'medkit-outline',
  },
  {
    id: 'cosmetic',
    title: 'Cosmetic & Aesthetic Care',
    description: 'Plastic surgery, teeth whitening, clear skin, injectables, lasers, and hair — safely.',
    icon: 'sparkles-outline',
  },
  {
    id: 'wellness',
    title: 'Wellness & Prevention',
    description: 'Screenings, vaccines, sleep, movement, nutrition, and mental well-being.',
    icon: 'leaf-outline',
  },
];

export const categoryById = Object.fromEntries(lessonCategories.map((c) => [c.id, c])) as Record<
  LessonCategory['id'],
  LessonCategory
>;
