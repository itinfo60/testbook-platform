import { ApiError } from '../../core/api-error.js';

const INJECTION_PATTERNS = [
  /ignore\s+(?:previous|above|default|system)\s+instructions/i,
  /you\s+are\s+now\s+(?:a|an|in|the)\s+/i,
  /system\s+prompt/i,
  /dan\s+mode/i,
  /developer\s+mode/i,
  /forget\s+(?:everything|rules|instructions)/i,
  /bypass\s+(?:limits|rules|guidelines|parameters)/i,
  /hypothetical\s+scenario\s+where/i,
  /do\s+not\s+(?:explain|follow|restrict|validate)/i,
  /override\s+guidelines/i,
  /ignore\s+the\s+role/i,
];

/**
 * Checks a string input for prompt injection signatures.
 * @param input The text query sent by the user
 * @returns true if safe
 * @throws ApiError if an injection risk is detected
 */
export const sanitizePrompt = (input: string): boolean => {
  if (!input) return true;

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      throw ApiError.badRequest(
        'Security check failed: Input text contains unsafe prompt instruction overrides.'
      );
    }
  }

  return true;
};
