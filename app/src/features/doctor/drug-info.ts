// Helpers for the prescribe screen's drug look-up (GET /api/drugs/info).
import type { DrugInfo } from '@/lib/contracts';
import { truncate } from '@/lib/format';

const WARNING_TITLE = /boxed|warning|precaution|contraindicat|do not use|stop use/i;
const MAX_WARNINGS = 3;
const WARNING_CHARS = 220;

/**
 * The label warnings most relevant before prescribing (boxed warning first), as short lines.
 * Section text is markdown-lite: `- ` bullet lines or plain paragraphs.
 */
export function topWarnings(info: Pick<DrugInfo, 'sections'>): string[] {
  const lines = info.sections
    .filter((s) => WARNING_TITLE.test(s.title))
    .flatMap((s) => s.text.split(/\n+/))
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+\.)\s+/, '').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0 && !/:$/.test(line));
  const boxedFirst = [...lines].sort((a, b) => Number(/boxed warning/i.test(b)) - Number(/boxed warning/i.test(a)));
  return boxedFirst.slice(0, MAX_WARNINGS).map((line) => truncate(line, WARNING_CHARS));
}
