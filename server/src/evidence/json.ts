// Tiny, allocation-free accessors for walking untrusted JSON (`unknown`) without `any`.

export type JsonRecord = Record<string, unknown>;

export const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const asRecord = (value: unknown): JsonRecord | null => (isRecord(value) ? value : null);

export const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

export const asString = (value: unknown): string | null => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
};

/** `obj[key]` as a record (or null). */
export const rec = (obj: unknown, key: string): JsonRecord | null => asRecord(asRecord(obj)?.[key]);

/** `obj[key]` as an array (or []). */
export const arr = (obj: unknown, key: string): unknown[] => asArray(asRecord(obj)?.[key]);

/** `obj[key]` as a string (or null). */
export const str = (obj: unknown, key: string): string | null => asString(asRecord(obj)?.[key]);

/** `obj[key]` as an array of strings (non-strings dropped). */
export const strings = (obj: unknown, key: string): string[] =>
  arr(obj, key)
    .map(asString)
    .filter((s): s is string => s !== null);

/** First string of an openFDA-style `string[]` field. */
export const firstString = (obj: unknown, key: string): string | null => strings(obj, key)[0] ?? null;

export function parseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}
