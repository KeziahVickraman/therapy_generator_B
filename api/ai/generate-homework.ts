import { GoogleGenAI, Type } from '@google/genai';

interface Req {
  method?: string;
  body?: {
    clientName?: string;
    modality?: string;
    sessionNotes?: string;
    focusGoal?: string;
    estimatedMinutes?: number;
  };
}

interface Res {
  status: (code: number) => Res;
  json: (payload: unknown) => void;
}

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return res.status(400).json({
      error:
        'GEMINI_API_KEY is not configured. Use Quick-Fill Clinical Presets or set GEMINI_API_KEY in Vercel Environment Variables.',
    });
  }

  const {
    clientName,
    modality,
    sessionNotes,
    focusGoal,
    estimatedMinutes,
  } = req.body || {};

  if (!sessionNotes || !sessionNotes.trim()) {
    return res.status(400).json({
      error: 'Please enter brief session notes before generating.',
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `
You are assisting a licensed clinical psychologist in Singapore preparing a calm, compassionate, evidence-based between-session therapy homework sheet.

Client Preferred Name: ${clientName || 'Client'}
Primary Modality: ${modality || 'CBT'}
Target Duration Per Exercise: ${estimatedMinutes || 10} minutes
Clinical Focus / Goal: ${focusGoal || 'Build practical regulation and self-awareness between sessions'}
Session Notes & Context:
${sessionNotes}

Generate a realistic, concise, warm therapy homework worksheet with 3 structured exercises that the clinician can walk through live with the client in the last 10 minutes of session.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction:
          'You are an experienced clinical psychology supervisor. Return strictly structured JSON matching the schema.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            clinicalRationale: { type: Type.STRING },
            walkthroughNotes: { type: Type.STRING },
            estimatedMinutes: { type: Type.INTEGER },
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  instruction: { type: Type.STRING },
                  frequency: { type: Type.STRING },
                  promptQuestion: { type: Type.STRING },
                },
                required: ['title', 'instruction', 'frequency', 'promptQuestion'],
              },
            },
          },
          required: [
            'title',
            'clinicalRationale',
            'walkthroughNotes',
            'estimatedMinutes',
            'tasks',
          ],
        },
      },
    });

    const rawText = (response.text ?? '{}').trim();
    const parsed = JSON.parse(rawText);
    if (Array.isArray(parsed.tasks)) {
      parsed.tasks = parsed.tasks.slice(0, 3);
    }
    return res.status(200).json(parsed);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Unable to generate homework draft.';
    return res.status(502).json({ error: message });
  }
}
