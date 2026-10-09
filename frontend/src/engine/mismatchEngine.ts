import { CaseDocument } from '../types';

export interface MismatchIssue {
  field: string;
  documentA: {
    type: string;
    name: string;
    value: string;
  };
  documentB: {
    type: string;
    name: string;
    value: string;
  };
  severity: 'HIGH' | 'WARNING';
  status: 'ACTION_REQUIRED' | 'REVIEW';
  evidence: string[];
  recommendedAction: string;
}

const HONORIFICS = ['shri', 'smt', 'srimathi', 'thiru', 'selvi', 'dr', 'mr', 'mrs', 'ms', 'kumari', 'late'];

function normalizeName(name: string): { tokens: string[]; clean: string } {
  let clean = name.toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
  let tokens = clean.split(' ').filter(t => t.length > 0 && !HONORIFICS.includes(t));
  return { tokens, clean: tokens.sort().join(' ') };
}

function normalizeDate(dateStr: string): { year?: number; raw: string } {
  const clean = dateStr.trim();
  const isoMatch = clean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) return { year: parseInt(isoMatch[1]), raw: clean };
  const indMatch = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (indMatch) return { year: parseInt(indMatch[3]), raw: clean };
  const yearMatch = clean.match(/\b(19\d{2}|20\d{2})\b/);
  if (yearMatch) return { year: parseInt(yearMatch[1]), raw: clean };
  return { raw: clean };
}

function normalizeAddress(addr: string): string {
  return addr.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function detectMismatches(docs: CaseDocument[]): MismatchIssue[] {
  const issues: MismatchIssue[] = [];
  if (docs.length < 2) return issues;

  const anchor = docs.find(d => d.docType === 'AADHAAR') || docs[0];
  const others = docs.filter(d => d.id !== anchor.id);

  for (const doc of others) {
    if (anchor.holderName && doc.holderName) {
      const normA = normalizeName(anchor.holderName);
      const normB = normalizeName(doc.holderName);
      
      if (normA.clean !== normB.clean) {
        const tokensA = normA.tokens;
        const tokensB = normB.tokens;
        const maxTokens = Math.max(tokensA.length, tokensB.length);
        const shared = tokensA.filter(t => tokensB.includes(t));
        
        let initialsMatch = false;
        if (tokensA.length > 0 && tokensB.length > 0) {
          const singleLetterA = tokensA.filter(t => t.length === 1);
          const wordsB = tokensB.filter(t => t.length > 1);
          if (singleLetterA.some(init => wordsB.some(w => w.startsWith(init)))) initialsMatch = true;
          
          const singleLetterB = tokensB.filter(t => t.length === 1);
          const wordsA = tokensA.filter(t => t.length > 1);
          if (singleLetterB.some(init => wordsA.some(w => w.startsWith(init)))) initialsMatch = true;
        }

        if (shared.length !== maxTokens && !initialsMatch) {
          issues.push({
            field: 'name',
            documentA: { type: anchor.docType, name: anchor.name, value: anchor.holderName },
            documentB: { type: doc.docType, name: doc.name, value: doc.holderName },
            severity: 'HIGH',
            status: 'ACTION_REQUIRED',
            evidence: [`Normalized Anchor: ${normA.clean}`, `Normalized Target: ${normB.clean}`],
            recommendedAction: 'Potential mismatch detected. The relevant authority or bank should confirm which record needs correction.'
          });
        }
      }
    }

    if (anchor.dob && doc.dob) {
      const dateA = normalizeDate(anchor.dob);
      const dateB = normalizeDate(doc.dob);
      if (dateA.year && dateB.year && dateA.year !== dateB.year) {
        issues.push({
          field: 'dob',
          documentA: { type: anchor.docType, name: anchor.name, value: anchor.dob },
          documentB: { type: doc.docType, name: doc.name, value: doc.dob },
          severity: 'HIGH',
          status: 'ACTION_REQUIRED',
          evidence: [`Year A: ${dateA.year}`, `Year B: ${dateB.year}`],
          recommendedAction: 'Potential mismatch detected. The relevant authority or bank should confirm which record needs correction.'
        });
      }
    }

    if (anchor.address && doc.address) {
      const addrA = normalizeAddress(anchor.address);
      const addrB = normalizeAddress(doc.address);
      if (addrA !== addrB) {
        if (!addrA.includes(addrB) && !addrB.includes(addrA)) {
          issues.push({
            field: 'address',
            documentA: { type: anchor.docType, name: anchor.name, value: anchor.address },
            documentB: { type: doc.docType, name: doc.name, value: doc.address },
            severity: 'WARNING',
            status: 'REVIEW',
            evidence: [],
            recommendedAction: 'Potential mismatch detected. The relevant authority or bank should confirm which record needs correction.'
          });
        }
      }
    }
  }

  return issues;
}
