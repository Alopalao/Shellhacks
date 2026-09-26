import { AiChatScreen } from '@/features/ai';

/** Evidence AI — the clinician's literature assistant. Accepts deep-link params (see features/ai/links.ts). */
export default function DoctorAiScreen() {
  return <AiChatScreen role="doctor" />;
}
