import { detectMismatches } from './mismatchEngine';
import { CaseDocument } from '../types';

describe('Mismatch Engine Deterministic Tests', () => {
  const createAadhaar = (name: string, dob?: string, address?: string): CaseDocument => ({
    id: 'A1', docType: 'AADHAAR', name: 'Aadhaar', verified: true, holderName: name, dob, address
  });

  const createBank = (name: string, dob?: string, address?: string): CaseDocument => ({
    id: 'B1', docType: 'BANK_PASSBOOK', name: 'Bank', verified: true, holderName: name, dob, address
  });

  test('Matching names - exact case variations', () => {
    const issues = detectMismatches([
      createAadhaar('LAKSHMI DEVI'),
      createBank('lakshmi devi')
    ]);
    expect(issues.find(i => i.field === 'name')).toBeUndefined();
  });

  test('Formatting variation - extra spaces', () => {
    const issues = detectMismatches([
      createAadhaar(' Lakshmi Devi '),
      createBank('Lakshmi Devi')
    ]);
    expect(issues.find(i => i.field === 'name')).toBeUndefined();
  });

  test('Actual mismatch - distinct names', () => {
    const issues = detectMismatches([
      createAadhaar('Lakshmi Devi'),
      createBank('Lakshmi D')
    ]);
    const nameIssue = issues.find(i => i.field === 'name');
    expect(nameIssue).toBeDefined();
    expect(nameIssue?.status).toBe('ACTION_REQUIRED');
  });

  test('DOB mismatch - different dates', () => {
    const issues = detectMismatches([
      createAadhaar('Lakshmi Devi', '1964-06-12'),
      createBank('Lakshmi Devi', '1965-06-12')
    ]);
    const dobIssue = issues.find(i => i.field === 'dob');
    expect(dobIssue).toBeDefined();
    expect(dobIssue?.status).toBe('ACTION_REQUIRED');
  });

  test('Address mismatch - different normalized addresses', () => {
    const issues = detectMismatches([
      createAadhaar('Lakshmi Devi', undefined, '14 South St'),
      createBank('Lakshmi Devi', undefined, '15 North St')
    ]);
    const addrIssue = issues.find(i => i.field === 'address');
    expect(addrIssue).toBeDefined();
    expect(addrIssue?.status).toBe('REVIEW');
  });

  test('Missing document - only one doc', () => {
    const issues = detectMismatches([
      createAadhaar('Lakshmi Devi')
    ]);
    expect(issues.length).toBe(0);
  });

  test('Clean application - everything matches', () => {
    const issues = detectMismatches([
      createAadhaar('Lakshmi Devi', '1964-06-12', '14 South St'),
      createBank('Lakshmi Devi', '1964-06-12', '14 South St')
    ]);
    expect(issues.length).toBe(0);
  });
});
