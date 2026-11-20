import { GoogleGenAI } from '@google/genai';

// Serverless Function for Vercel / Cloudflare / Node backend
// Protects GEMINI_API_KEY from exposure in the client-side JavaScript bundle
export default async function handler(req: any, res: any) {
  // Set JSON headers
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'GEMINI_API_KEY is not configured in server environment variables.' 
    });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  const { prompt, model = 'gemini-3.5-flash-lite' } = body || {};
  if (!prompt) {
    return res.status(400).json({ error: 'Missing required field: prompt' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const candidateModels = Array.from(new Set([
      model,
      'gemini-3.5-flash-lite',
      'gemini-3.6-flash',
      'gemini-3.8-flash'
    ]));

    for (const candidate of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: candidate,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        if (response.text) {
          return res.status(200).json({ text: response.text });
        }
      } catch (err: any) {
        const isThrottled = 
          err?.status === 'RESOURCE_EXHAUSTED' || 
          err?.message?.includes('429') || 
          err?.status === 'UNAVAILABLE' || 
          err?.message?.includes('503');

        if (isThrottled) {
          continue; // Try next fallback candidate
        }
        throw err;
      }
    }

    return res.status(503).json({ error: 'Gemini service capacity exceeded across all candidate models.' });
  } catch (error: any) {
    console.error('Gemini Serverless API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal AI Generation Error' });
  }
}
