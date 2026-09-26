import { AiChatScreen } from '@/features/ai';

/** BRIAN AI — the patient's AI health guide. Accepts deep-link params (see features/ai/links.ts). */
export default function PatientAiScreen() {
  return <AiChatScreen role="patient" />;
}
