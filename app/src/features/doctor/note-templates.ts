// Quick templates for the visit-note composer.
import type { IoniconName } from '@/components/ui';

export interface NoteTemplate {
  id: string;
  label: string;
  icon: IoniconName;
  title: string;
  body: string;
}

export const NOTE_TEMPLATES: readonly NoteTemplate[] = [
  {
    id: 'follow-up',
    label: 'Follow-up',
    icon: 'repeat-outline',
    title: 'Follow-up visit',
    body: [
      'Reason for visit: ',
      'Vitals: BP ___/___, HR ___',
      'Assessment: ',
      'Plan:',
      '- ',
      'RTC in ___ weeks, sooner PRN.',
    ].join('\n'),
  },
  {
    id: 'lab-results',
    label: 'Lab results',
    icon: 'flask-outline',
    title: 'Lab results',
    body: ['Labs reviewed: ', 'Results:', '- ', 'Interpretation: ', 'Plan: ', 'Recheck in: '].join('\n'),
  },
  {
    id: 'new-medication',
    label: 'New medication',
    icon: 'medkit-outline',
    title: 'New medication',
    body: [
      'Started: [drug] [strength] [route] [frequency]',
      'Indication: ',
      'Counseled on: how to take it, common side effects, when to call.',
      'Monitoring: ',
      'Follow-up: ',
    ].join('\n'),
  },
  {
    id: 'referral',
    label: 'Referral',
    icon: 'arrow-redo-outline',
    title: 'Referral',
    body: [
      'Referred to: ',
      'Reason: ',
      'Urgency: routine',
      "Next steps: the specialist's office will call to schedule.",
      'Please bring: current medication list and recent labs.',
    ].join('\n'),
  },
];
