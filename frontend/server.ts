import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Fix COOP policy for Google Sign-in popups
app.use((req: Request, res: Response, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
});

// Initialize Gemini client if API key is provided
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI();
  } catch (err) {
    console.warn('Gemini client initialization warning:', err);
  }
}

// 1. Operator Intake & Fact Extraction API
app.post('/api/operator', async (req: Request, res: Response) => {
  const { message, language = 'en', existingFacts = [], chatHistory = [] } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // If Gemini API is available, use it for structured reasoning
  if (aiClient && process.env.GEMINI_API_KEY) {
    try {
      const prompt = `You are the proactive AI triage operator for SORTED, an administrative government-benefit resolution platform in India.
Your goal is to extract facts, identify missing evidence, and ask the SINGLE most useful next question to diagnose a payment failure.
Language: \${language === 'ta' ? 'Tamil' : 'English'}

Chat History:
\${JSON.stringify(chatHistory)}

Citizen statement: "\${message}"
Existing facts: \${JSON.stringify(existingFacts)}

INSTRUCTIONS:
1. Extract ALL new facts from the citizen statement (e.g., payment_attempted, bank_rejected, account_closed, aadhaar_seeded). Do not discard any information. Assign provenance as "USER_REPORTED".
2. Identify what single piece of missing evidence would most reduce uncertainty for diagnosing the issue.
3. If you have enough evidence to identify the root cause (e.g., you have the specific rejection reason like "account closed" or a PFMS code like "P-U1"), set readyForDiagnosis = true and reply EXACTLY with: "\${language === 'ta' ? 'இந்தத் தகவல்களைக் கொண்டு diagnostic check செய்ய போதுமான தகவல் இருக்கிறது.' : 'Enough information to run the diagnostic check.'}"
4. If you need more evidence, ask ONE targeted question. Do NOT ask for information already provided. Do NOT ask generic scripted questions (e.g., "Is your application approved?") if the citizen already provided a specific rejection reason or payment status.
5. Acknowledge what the citizen said, explain your reasoning briefly, and ask the targeted question (Proactive Response Format).
6. Do NOT diagnose the problem yourself. Do NOT invent failure codes.

Respond ONLY in valid JSON matching this schema:
{
  "reply": "Acknowledge + Understand + Explain + Next Best Question (in the correct language)",
  "extractedFacts": [
    {
      "id": "generated_id",
      "key": "fact_key",
      "label": "Human readable label",
      "value": "extracted string or boolean",
      "provenance": "USER_REPORTED",
      "confidence": "HIGH"
    }
  ],
  "readyForDiagnosis": true or false
}`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    } catch (err) {
      console.warn('Gemini API call fell back to deterministic engine:', err);
    }
  }

  // Deterministic fallback (Evidence-driven)
  const lower = message.toLowerCase();
  let updatedFacts = [...existingFacts];
  
  // 1. EXTRACT ALL FACTS
  if (lower.includes('approved') || lower.includes('yes') || lower.includes('approve') || message.includes('ஆம்')) {
    if (!updatedFacts.some(f => f.key === 'application_approved')) {
      updatedFacts.push({ id: `F_${Date.now()}_1`, key: 'application_approved', label: 'Application Approved', value: 'true', provenance: 'USER_REPORTED', confidence: 'HIGH' });
    }
  } else if (lower.includes('not approved') || lower.includes('no') || message.includes('இல்லை')) {
    if (!updatedFacts.some(f => f.key === 'application_approved')) {
      updatedFacts.push({ id: `F_${Date.now()}_1`, key: 'application_approved', label: 'Application Approved', value: 'false', provenance: 'USER_REPORTED', confidence: 'HIGH' });
    }
  }

  if (lower.includes('rejected') || lower.includes('failed') || lower.includes('நிராகரித்தது') || lower.includes('payment processed') || lower.includes('பணம் செலுத்தப்பட்டது')) {
    if (!updatedFacts.some(f => f.key === 'payment_attempted')) {
      updatedFacts.push({ id: `F_${Date.now()}_pay`, key: 'payment_attempted', label: 'Payment Attempted', value: 'true', provenance: 'USER_REPORTED', confidence: 'HIGH' });
    }
  }

  if (lower.includes('account closed') || lower.includes('closed') || lower.includes('p-u1') || lower.includes('deseed') || lower.includes('seed') || lower.includes('ifsc') || lower.includes('kyc') || lower.includes('v-a2')) {
    if (!updatedFacts.some(f => f.key === 'reported_reason')) {
      updatedFacts.push({ id: `F_${Date.now()}_2`, key: 'reported_reason', label: 'Reported Failure Reason', value: message.slice(0, 100), provenance: 'USER_REPORTED', confidence: 'HIGH' });
    }
  }

  // 2. IDENTIFY MISSING EVIDENCE & NEXT BEST QUESTION
  const hasApproveFact = updatedFacts.some(f => f.key === 'application_approved');
  const hasReasonFact = updatedFacts.some(f => f.key === 'reported_reason');
  const hasPaymentAttempted = updatedFacts.some(f => f.key === 'payment_attempted');
  
  let ready = false;
  let reply = '';

  if (hasReasonFact || (lower.includes('unknown') || message.includes('தெரியவில்லை'))) {
    ready = true;
    reply = language === 'ta' ? 'இந்தத் தகவல்களைக் கொண்டு diagnostic check செய்ய போதுமான தகவல் இருக்கிறது.' : 'Enough information to run the diagnostic check.';
  } else if (hasPaymentAttempted) {
    reply = language === 'ta' ? 'புரிந்தது. Payment process செய்யப்பட்டிருந்தாலும், வங்கி அதை reject செய்திருக்கிறது. உங்களுக்கு வந்த Payment failure message அல்லது SMS ஐ சரியாக கூறவும்.' : 'Understood. A payment was attempted but rejected. Please provide the exact payment failure message or code from your SMS or portal.';
  } else if (!hasApproveFact) {
    reply = language === 'ta' ? 'தயவுசெய்து உங்கள் application approve ஆகியிருக்கிறதா என கூறவும்?' : 'Please confirm: has your application been approved?';
  } else {
    reply = language === 'ta' ? 'உங்களுக்கு வந்த Payment failure message அல்லது SMS ஐ சரியாக கூறவும். (அல்லது "தெரியவில்லை" என கூறவும்)' : 'Please provide the exact payment failure message or code. (If you do not have one, say "Unknown")';
  }

  // Extract only new facts for the return value
  const facts = updatedFacts.filter(nf => !existingFacts.some((of: any) => of.key === nf.key));

  return res.json({
    reply,
    extractedFacts: facts,
    readyForDiagnosis: ready
  });
});

// 2. Health check route
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    system: 'SORTED Administrative Instrument Engine',
    geminiActive: Boolean(process.env.GEMINI_API_KEY)
  });
});

// Vite middleware in dev or static files in production
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`SORTED Platform running on http://localhost:${port}`);
  });
}

setupVite();
