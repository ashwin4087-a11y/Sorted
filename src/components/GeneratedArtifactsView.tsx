import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { CitizenCase } from '../types';
import { generateLetter } from '../engine/letterGenerator';
import { PaperReceipt } from './PaperReceipt';
import { RubberStamp } from './RubberStamp';
import { Printer, Copy, Check, Download, Languages, FileCheck } from 'lucide-react';

interface GeneratedArtifactsViewProps {
  currentCase: CitizenCase;
}

export const GeneratedArtifactsView: React.FC<GeneratedArtifactsViewProps> = ({
  currentCase
}) => {
  const [lang, setLang] = useState<'en' | 'ta'>(currentCase.language);
  const [copied, setCopied] = useState(false);
  const [selectedLetterType, setSelectedLetterType] = useState<string>(
    currentCase.diagnosis?.isUnknownReason ? 'DEPARTMENT_REASON_REQUEST' : 'BANK_REQUEST'
  );

  const bankDoc = currentCase.documents.find(d => d.docType === 'BANK_PASSBOOK');
  const aadhaarDoc = currentCase.documents.find(d => d.docType === 'AADHAAR');

  const letter = generateLetter(selectedLetterType, {
    caseRef: currentCase.caseRef,
    date: currentCase.createdDate,
    citizenName: currentCase.citizenName,
    citizenAge: currentCase.citizenAge,
    location: currentCase.location,
    schemeName: currentCase.schemeName,
    bankName: bankDoc?.bankName || 'Canara Bank',
    accountNumberMasked: bankDoc?.accountNumber ? bankDoc.accountNumber.replace(/\d(?=\d{4})/g, 'X') : 'XXXX XXXX 89234',
    ifsc: bankDoc?.ifsc || 'CNRB0001204',
    aadhaarMasked: aadhaarDoc?.number ? aadhaarDoc.number.replace(/\d(?=\d{4})/g, 'X') : 'XXXX XXXX 8912',
    failureCode: currentCase.diagnosis?.code || 'P-U1',
    failureReason: currentCase.diagnosis?.title || 'Aadhaar de-seeded in NPCI mapper',
    language: lang
  });

  const handleCopy = () => {
    const fullText = `
${letter.title}
Reference: ${letter.caseRef} | Date: ${letter.date}
${letter.draftNotice}

To:
${letter.toAuthority}

${letter.subject}

${letter.bodyParagraphs.join('\n\n')}

Enclosures:
${letter.enclosures.join('\n')}

${letter.signatureBlock}
    `.trim();

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="bg-white border border-[#123B63] shadow-hard p-4 rounded-[2px] flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-technical text-[#123B63] font-bold">
            DOCUMENT TEMPLATE:
          </span>
          <button
            onClick={() => setSelectedLetterType('BANK_REQUEST')}
            className={`btn-instrument px-3 py-1 text-xs ${
              selectedLetterType === 'BANK_REQUEST'
                ? 'bg-[#123B63] text-white'
                : 'bg-white text-[#123B63]'
            }`}
          >
            BANK AADHAAR SEEDING REQUEST
          </button>
          <button
            onClick={() => setSelectedLetterType('DEPARTMENT_REASON_REQUEST')}
            className={`btn-instrument px-3 py-1 text-xs ${
              selectedLetterType === 'DEPARTMENT_REASON_REQUEST'
                ? 'bg-[#123B63] text-white'
                : 'bg-white text-[#123B63]'
            }`}
          >
            DEPARTMENT REASON REQUISITION
          </button>
          <button
            onClick={() => setSelectedLetterType('DEPARTMENT_CORRECTION')}
            className={`btn-instrument px-3 py-1 text-xs ${
              selectedLetterType === 'DEPARTMENT_CORRECTION'
                ? 'bg-[#123B63] text-white'
                : 'bg-white text-[#123B63]'
            }`}
          >
            PORTAL CORRECTION MEMO
          </button>
        </div>

        {/* Language switch & Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[#F7FAFC] border border-[#123B63] p-0.5 rounded-[2px]">
            <button
              onClick={() => setLang('en')}
              className={`px-2 py-0.5 text-xs font-mono-tech font-bold transition-all ${
                lang === 'en' ? 'bg-[#123B63] text-white' : 'text-[#5B6B80]'
              }`}
            >
              ENGLISH
            </button>
            <button
              onClick={() => setLang('ta')}
              className={`px-2 py-0.5 text-xs font-mono-tech font-bold transition-all ${
                lang === 'ta' ? 'bg-[#123B63] text-white' : 'text-[#5B6B80]'
              }`}
            >
              தமிழ் (TAMIL)
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="btn-instrument bg-white text-[#123B63] px-3 py-1 text-xs flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#2E7D57]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'COPIED' : 'COPY'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="btn-instrument bg-[#123B63] text-white px-3.5 py-1 text-xs flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PRINT SLIP</span>
          </button>
        </div>
      </div>

      {/* Physical Paper Receipt Presentation */}
      <PaperReceipt
        title={letter.title}
        caseRef={letter.caseRef}
        date={letter.date}
        stamp="AI_GENERATED"
        stampLabel="AI DRAFT // CITIZEN TO SIGN"
        className="max-w-4xl mx-auto"
      >
        {/* Statutory Draft Watermark Banner */}
        <div className="bg-[#FEF7EA] border border-[#F4B942] p-2.5 rounded-[2px] flex items-center justify-between text-xs">
          <span className="font-display font-[800] text-[#D99020] uppercase">
            {letter.draftNotice}
          </span>
          <span className="font-mono-tech text-[10px] text-[#5B6B80]">
            MANDATORY: ATTACH PHOTOCOPIES OF DOCUMENTS LISTED BELOW
          </span>
        </div>

        {/* Addressee Block */}
        <div className="p-3 bg-[#F7FAFC] border border-[#DCE5ED] rounded-[2px] font-mono-tech text-xs whitespace-pre-line text-[#17212B]">
          {letter.toAuthority}
        </div>

        {/* Subject Line */}
        <div className="p-2 border-l-4 border-[#123B63] bg-white font-display font-[800] text-sm text-[#0C2A47]">
          {letter.subject}
        </div>

        {/* Paragraphs */}
        <div className="space-y-3 text-sm leading-relaxed text-[#17212B]">
          {letter.bodyParagraphs.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        {/* Enclosures / Attachments */}
        <div className="bg-[#F7FAFC] border border-[#DCE5ED] p-3 rounded-[2px] space-y-1.5 mt-4">
          <span className="font-mono-tech text-[11px] font-bold text-[#123B63] uppercase block">
            {lang === 'ta' ? 'இணைப்புகள் (ENCLOSURES):' : 'ENCLOSURES ATTACHED:'}
          </span>
          <ul className="text-xs space-y-1 font-mono-tech text-[#17212B]">
            {letter.enclosures.map((enc, idx) => (
              <li key={idx} className="flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-[#56A67A] shrink-0" />
                <span>{enc}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Signature Box */}
        <div className="pt-4 flex justify-end">
          <div className="p-3 border border-[#DCE5ED] bg-white w-64 text-xs font-mono-tech text-right whitespace-pre-line">
            {letter.signatureBlock}
          </div>
        </div>
      </PaperReceipt>

      {/* Print Document Portal */}
      {createPortal(
        <div className="print-document">
          <div className="print-header">
            <h1 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center', textTransform: 'uppercase' }}>
              {letter.title}
            </h1>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <div><strong>Ref:</strong> {letter.caseRef}</div>
              <div><strong>Date:</strong> {letter.date}</div>
            </div>
            
            <div style={{ whiteSpace: 'pre-line', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              {letter.toAuthority}
            </div>

            <div style={{ fontWeight: 'bold', marginBottom: '2rem', paddingLeft: '1rem', borderLeft: '3px solid black' }}>
              {letter.subject}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            {letter.bodyParagraphs.map((para, i) => (
              <p key={i} style={{ margin: 0, lineHeight: 1.6, textAlign: 'justify' }}>{para}</p>
            ))}
          </div>

          {letter.enclosures && letter.enclosures.length > 0 && (
            <div style={{ marginBottom: '3rem' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {lang === 'ta' ? 'இணைப்புகள் (ENCLOSURES):' : 'ENCLOSURES ATTACHED:'}
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: 1.5 }}>
                {letter.enclosures.map((enc, idx) => (
                  <li key={idx} style={{ marginBottom: '0.25rem' }}>{enc}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="print-signature signature-block">
            <div style={{ whiteSpace: 'pre-line', textAlign: 'right', lineHeight: 1.5, paddingBottom: '2rem', paddingRight: '2rem' }}>
              {letter.signatureBlock}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
