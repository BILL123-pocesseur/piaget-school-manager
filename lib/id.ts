/**
 * Generates a short unique ID.
 * Format: base36 timestamp + 5 random chars → ~11 char string
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/**
 * Generates a student matricule.
 * Format: ETU + last 6 digits of timestamp
 */
export function generateStudentMatricule(): string {
  const suffix = Date.now().toString().slice(-6);
  return `ETU${suffix}`;
}

/**
 * Generates a teacher matricule.
 * Format: PRF + last 6 digits of timestamp
 */
export function generateTeacherMatricule(): string {
  const suffix = Date.now().toString().slice(-6);
  return `PRF${suffix}`;
}
