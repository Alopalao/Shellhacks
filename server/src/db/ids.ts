import { randomBytes } from 'node:crypto';

/** Prefixes used across the store so ids are recognisable at a glance in logs and URLs. */
export type IdPrefix = 'usr' | 'rx' | 'msg' | 'dose' | 'ref' | 'note' | 'ai' | 'ntf';

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';

/**
 * Short, URL-safe, prefixed random id, e.g. `rx_k3j9d8f7a2b1`.
 * 12 base-36 characters ≈ 62 bits of entropy — plenty for a single-node demo store.
 */
export function newId(prefix: IdPrefix, length = 12): string {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i]! % ALPHABET.length];
  return `${prefix}_${out}`;
}
