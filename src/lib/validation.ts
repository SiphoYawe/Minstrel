import { z } from 'zod/v4';

/**
 * Zod schema for validating UUID v4 strings (SEC-M4).
 * Use this to validate sessionId and other UUID fields before DB operations.
 */
export const uuidSchema = z.string().uuid();

/**
 * Validate that a string is a valid UUID. Returns true if valid, false otherwise.
 */
export function isValidUUID(value: string): boolean {
  return uuidSchema.safeParse(value).success;
}
