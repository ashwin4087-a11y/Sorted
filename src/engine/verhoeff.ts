/**
 * UIDAI Aadhaar Format & Verhoeff Checksum Algorithm
 * Aadhaar numbers are 12-digit numbers where the last digit is a Verhoeff checksum.
 */

// The multiplication table (d)
const d: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
];

// The permutation table (p)
const p: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];

/**
 * Validates whether a given string is a mathematically valid 12-digit Aadhaar number
 * according to UIDAI specification using the Verhoeff algorithm.
 */
export function validateVerhoeffAadhaar(aadhaarStr: string): { isValid: boolean; reason?: string } {
  const sanitized = aadhaarStr.replace(/[\s-]/g, '');

  if (!/^\d+$/.test(sanitized)) {
    return { isValid: false, reason: 'Contains non-numeric characters' };
  }

  if (sanitized.length !== 12) {
    return { isValid: false, reason: `Invalid length: expected 12 digits, got ${sanitized.length}` };
  }

  // Aadhaar cannot start with 0 or 1 per UIDAI numbering specifications
  if (sanitized[0] === '0' || sanitized[0] === '1') {
    return { isValid: false, reason: 'UIDAI numbers do not begin with 0 or 1' };
  }

  let c = 0;
  const reversedDigits = sanitized.split('').reverse().map(Number);

  for (let i = 0; i < reversedDigits.length; i++) {
    c = d[c][p[i % 8][reversedDigits[i]]];
  }

  if (c === 0) {
    return { isValid: true };
  } else {
    return { isValid: false, reason: 'Verhoeff checksum validation failed (checksum mismatch)' };
  }
}
