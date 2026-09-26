// Visit notes: list rows, the clinical note card and the offline jargon decoder. Import from '@/features/notes'.
export {
  JARGON_CATEGORY_LABEL,
  NOTE_GLOSSARY,
  decodeJargon,
  findJargon,
  segmentNote,
  type JargonCategory,
  type JargonEntry,
  type JargonMatch,
  type NoteSegment,
} from './glossary';
export { HighlightedNoteText, type HighlightedNoteTextProps } from './HighlightedNoteText';
export { JargonDecoder, type JargonDecoderProps } from './JargonDecoder';
export { NoteCard, type NoteCardProps } from './NoteCard';
export { NoteListItem, type NoteListItemProps } from './NoteListItem';
export { explainNoteHref, patientNoteHref } from './links';
