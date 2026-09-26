// Doctor feature: components, hooks and helpers used by app/src/app/doctor/**.
export { useActivityFeed, useActivityRecorder, clearActivity, type ActivityItem, type ActivityKind } from './activity';
export { buildAdherence, type DoseCell, type DoseCellState, type DoseRow, type PrescriptionAdherence } from './adherence';
export { DRUG_CLASSES, findAllergyAlerts, type AllergyAlert, type AllergyAlertLevel, type DrugClass } from './allergies';
export {
  ageLabel,
  doctorShortName,
  medLabel,
  relativePhrase,
  removeById,
  rxDirections,
  rxTimesLabel,
  STATUS_BADGE,
  threadIdFor,
  timeKey,
  titleCase,
  upsertById,
} from './format';
export { doctorHrefs, goBackOr, paramValue } from './navigation';
export { NOTE_TEMPLATES, type NoteTemplate } from './note-templates';
export * from './prescription-form';
export { useLiveEvents } from './useLiveEvents';

export { ActivityFeed, type ActivityDirectory, type ActivityFeedProps } from './components/ActivityFeed';
export { AdherenceGrid, AdherenceLegend, type AdherenceGridProps } from './components/AdherenceGrid';
export { AllergyWarning, type AllergyWarningProps } from './components/AllergyWarning';
export { CheckboxRow, type CheckboxRowProps } from './components/CheckboxRow';
export { ChipGroup, type ChipGroupProps, type ChipOption } from './components/ChipGroup';
export { DrugLookupPanel, type DrugLookupPanelProps, type DrugLookupState } from './components/DrugLookupPanel';
export { topWarnings } from './drug-info';
export { LOW_ADHERENCE, PatientCard, type PatientCardProps } from './components/PatientCard';
export { PrescriptionCard, type PrescriptionCardProps } from './components/PrescriptionCard';
export {
  RefillRequestCard,
  ResolvedRefillRow,
  type RefillRequestCardProps,
  type ResolvedRefillRowProps,
} from './components/RefillRequestCard';
export { StatTile, type StatTileProps } from './components/StatTile';
export { Stepper, type StepperProps } from './components/Stepper';
export { Tag, TagList, type TagListProps, type TagProps, type TagVariant } from './components/Tags';
export { TimeChipsEditor, type TimeChipsEditorProps } from './components/TimeChipsEditor';
export { VisitNoteItem } from './components/VisitNoteItem';
