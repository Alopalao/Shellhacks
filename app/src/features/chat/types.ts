// Chat feature types shared by the thread hook, list rows and bubbles.
import type { ChatMessage } from '@/lib/contracts';

/** `sent` = stored by the server; `pending` = optimistic, POST in flight; `failed` = POST failed (retryable). */
export type DeliveryStatus = 'sent' | 'pending' | 'failed';

/** A chat message as the UI sees it: a server message, or an optimistic one waiting for the server. */
export interface LocalMessage extends ChatMessage {
  status: DeliveryStatus;
  /**
   * Client-generated id of an optimistic message. Kept after the server copy replaces it so the
   * React key (and therefore the bubble) stays stable — no flicker on reconciliation.
   */
  clientId?: string;
  /** Friendly reason shown under a failed bubble. */
  error?: string;
}

/** "Seen 3:05 PM" / "Sent" under the viewer's latest message. */
export type Receipt = { kind: 'seen'; at: string } | { kind: 'sent' };

/** One row of the (inverted) message list. */
export type ChatRow =
  | { type: 'day'; key: string; label: string }
  | {
      type: 'message';
      key: string;
      message: LocalMessage;
      /** Sent by the signed-in user. */
      mine: boolean;
      /** First bubble of a run from the same sender (gets extra top spacing). */
      firstInGroup: boolean;
      /** Last bubble of a run from the same sender (gets the "tail" corner). */
      lastInGroup: boolean;
      /** Read receipt, only on the viewer's latest delivered message. */
      receipt: Receipt | null;
    };
