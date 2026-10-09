import { generateLetter, LetterContext } from './letterGenerator';

describe('Letter Generator Tamil Data Binding Tests', () => {
  const baseContext: LetterContext = {
    caseRef: 'TN-DEMO-123',
    date: '10/10/2026',
    citizenName: 'Lakshmi K',
    schemeName: 'Demo Scheme',
    language: 'ta'
  };

  test('Tamil BANK_REQUEST contains canonical citizen name in body and signature', () => {
    const doc = generateLetter('BANK_REQUEST', baseContext);
    
    // Assert generatedDocument contains "Lakshmi K"
    const fullText = doc.bodyParagraphs.join('\n') + '\n' + doc.signatureBlock;
    expect(fullText).toContain('Lakshmi K');
    
    // Assert generatedDocument contains the Tamil signature section
    expect(doc.signatureBlock).toContain('இப்படிக்கு,');
    expect(doc.signatureBlock).toContain('Lakshmi K');
    expect(doc.signatureBlock).toContain('பயனாளி');
  });

  test('Tamil DEPARTMENT_REASON_REQUEST contains canonical citizen name in body and signature', () => {
    const doc = generateLetter('DEPARTMENT_REASON_REQUEST', baseContext);
    
    const fullText = doc.bodyParagraphs.join('\n') + '\n' + doc.signatureBlock;
    expect(fullText).toContain('Lakshmi K');
    
    expect(doc.signatureBlock).toContain('இப்படிக்கு,');
    expect(doc.signatureBlock).toContain('Lakshmi K');
    expect(doc.signatureBlock).toContain('விண்ணப்பதாரர்');
  });

  test('Tamil DEPARTMENT_CORRECTION contains canonical citizen name in body and signature', () => {
    const doc = generateLetter('DEPARTMENT_CORRECTION', baseContext);
    
    const fullText = doc.bodyParagraphs.join('\n') + '\n' + doc.signatureBlock;
    expect(fullText).toContain('Lakshmi K');
    
    expect(doc.signatureBlock).toContain('இப்படிக்கு,');
    expect(doc.signatureBlock).toContain('Lakshmi K');
    expect(doc.signatureBlock).toContain('பயனாளி');
  });
});
