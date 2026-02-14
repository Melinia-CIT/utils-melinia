import { Recipient } from '../types.ts';

export function validateRecipient(row: unknown): Recipient {
  if (!row || typeof row !== 'object') {
    throw new Error('Invalid recipient: must be an object');
  }

  const recipient = row as Record<string, unknown>;

  if (!recipient.email || typeof recipient.email !== 'string') {
    throw new Error('Invalid recipient: missing or invalid email field');
  }

  return recipient as Recipient;
}
