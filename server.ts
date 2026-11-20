import 'dotenv/config';
import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { readStore, writeStore } from './src/server/store.ts';
import type { HomeworkAssignment, HomeworkTask, TherapyModality } from './src/types/care.ts';

const PORT = 3000;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function generateToken(clientName: string): string {
  const slug = clientName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .split('-')[0] || 'client';
  const rand = crypto.randomBytes(2).toString('hex');
  return `hc-${slug}-${rand}`;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // Get full workspace payload
  app.get('/api/workspace', (_req, res) => {
    const store = readStore();
    res.json(store);
  });

  // AI-assisted therapy homework generator using @google/genai (server-side only)
  app.post('/api/ai/generate-homework', async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(400).json({
        error:
          'Gemini API key is not configured. Please verify GEMINI_API_KEY in Settings > Secrets.',
      });
    }

    const {
      clientName,
      modality,
      sessionNotes,
      focusGoal,
      estimatedMinutes,
    } = req.body as {
      clientName?: string;
      modality?: TherapyModality;
      sessionNotes?: string;
      focusGoal?: string;
      estimatedMinutes?: number;
    };

    if (!sessionNotes || !sessionNotes.trim()) {
      return res.status(400).json({
        error: 'Please enter brief session notes or clinical themes before generating.',
      });
    }

    try {
      const prompt = `
You are assisting a licensed clinical psychologist in Singapore preparing a calm, compassionate, evidence-based between-session therapy homework sheet.

Client Preferred Name: ${clientName || 'Client'}
Primary Modality: ${modality || 'CBT'}
Target Duration Per Exercise: ${estimatedMinutes || 10} minutes
Clinical Focus / Goal: ${focusGoal || 'Build practical regulation and self-awareness between sessions'}
Session Notes & Context:
${sessionNotes}

Generate a realistic, concise, warm therapy homework worksheet with 3 structured exercises that the clinician can walk through live with the client in the last 10 minutes of session. Keep instructions concrete, culturally respectful, non-judgmental, and doable within a busy week.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'You are an experienced clinical psychology supervisor. Return strictly structured JSON matching the schema. Never include diagnostic jargon in client-facing task instructions; keep the tone warm, grounded, and practical.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: 'Clear, inviting title for the homework sheet (4-8 words).',
              },
              clinicalRationale: {
                type: Type.STRING,
                description: '1-2 sentence clinical rationale for the clinician record.',
              },
              walkthroughNotes: {
                type: Type.STRING,
                description:
                  'Warm 1-2 sentence note addressed to the client summarizing what to keep in mind.',
              },
              estimatedMinutes: {
                type: Type.INTEGER,
                description: 'Estimated minutes per practice.',
              },
              tasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: {
                      type: Type.STRING,
                      description: 'Short action-oriented exercise title.',
                    },
                    instruction: {
                      type: Type.STRING,
                      description: 'Clear 1-2 sentence step-by-step instruction for the client.',
                    },
                    frequency: {
                      type: Type.STRING,
                      description: 'Recommended cadence (e.g. "3 evenings this week", "Daily").',
                    },
                    promptQuestion: {
                      type: Type.STRING,
                      description:
                        'Thoughtful reflection question for the client to answer after completing the exercise.',
                    },
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
      return res.json(parsed);
    } catch (err: unknown) {
      console.error('Gemini homework generation error:', err);
      const message =
        err instanceof Error ? err.message : 'Unable to generate homework draft right now.';
      return res.status(502).json({ error: message });
    }
  });

  // Create a new homework assignment
  app.post('/api/assignments', (req, res) => {
    const store = readStore();
    const {
      clientId,
      title,
      modality,
      clinicalRationale,
      walkthroughNotes,
      estimatedMinutes,
      status,
      practiceSchedule,
      tasks,
    } = req.body as {
      clientId: string;
      title: string;
      modality: TherapyModality;
      clinicalRationale: string;
      walkthroughNotes: string;
      estimatedMinutes: number;
      status?: 'draft' | 'walkthrough' | 'pushed';
      practiceSchedule?: HomeworkAssignment['practiceSchedule'];
      tasks: Array<{
        title: string;
        instruction: string;
        frequency: string;
        promptQuestion: string;
      }>;
    };

    const client = store.clients.find((c) => c.id === clientId);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const now = new Date().toISOString();
    const assignmentId = `asg-${crypto.randomBytes(4).toString('hex')}`;
    const resolvedStatus = status || 'walkthrough';

    const formattedTasks: HomeworkTask[] = (tasks || []).map((t, idx) => ({
      id: `task-${assignmentId}-${idx + 1}`,
      title: t.title,
      instruction: t.instruction,
      frequency: t.frequency || '3x this week',
      promptQuestion: t.promptQuestion || 'What did you notice while practicing this?',
      completed: false,
      reflectionResponse: '',
    }));

    const newAssignment: HomeworkAssignment = {
      id: assignmentId,
      clientId,
      title: title || 'Custom Between-Session Worksheet',
      modality: modality || client.modality,
      clinicalRationale: clinicalRationale || '',
      walkthroughNotes: walkthroughNotes || '',
      estimatedMinutes: Number(estimatedMinutes) || 10,
      status: resolvedStatus,
      uniqueToken: generateToken(client.name),
      createdAt: now,
      pushedAt: resolvedStatus === 'pushed' ? now : undefined,
      practiceSchedule,
      tasks: formattedTasks,
    };

    store.assignments.unshift(newAssignment);
    writeStore(store);
    return res.status(201).json(newAssignment);
  });

  // Update assignment (walkthrough edits or one-click push to client)
  app.patch('/api/assignments/:id', (req, res) => {
    const store = readStore();
    const idx = store.assignments.findIndex((a) => a.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const existing = store.assignments[idx];
    const updates = req.body as Partial<HomeworkAssignment>;
    const now = new Date().toISOString();

    const nextStatus = updates.status ?? existing.status;
    const pushedAt =
      nextStatus === 'pushed' && !existing.pushedAt ? now : existing.pushedAt;

    const updated: HomeworkAssignment = {
      ...existing,
      ...updates,
      id: existing.id,
      uniqueToken: existing.uniqueToken,
      pushedAt,
    };

    store.assignments[idx] = updated;
    writeStore(store);
    return res.json(updated);
  });

  // Fetch assignment by unique client weblink token
  app.get('/api/client-link/:token', (req, res) => {
    const store = readStore();
    const assignment = store.assignments.find(
      (a) => a.uniqueToken === req.params.token
    );
    if (!assignment) {
      return res.status(404).json({ error: 'Worksheet link not found or expired' });
    }
    const client = store.clients.find((c) => c.id === assignment.clientId);
    const clientHistory = store.assignments.filter(
      (a) => a.clientId === assignment.clientId
    );
    return res.json({
      clinician: store.clinician,
      client,
      assignment,
      clientHistory,
    });
  });

  // Client toggles task completion and/or saves reflection response
  app.post('/api/assignments/:id/tasks/:taskId/toggle', (req, res) => {
    const store = readStore();
    const assignment = store.assignments.find((a) => a.id === req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    const task = assignment.tasks.find((t) => t.id === req.params.taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { completed, reflectionResponse } = req.body as {
      completed?: boolean;
      reflectionResponse?: string;
    };

    if (typeof completed === 'boolean') {
      task.completed = completed;
      task.completedAt = completed ? new Date().toISOString() : undefined;
    }
    if (typeof reflectionResponse === 'string') {
      task.reflectionResponse = reflectionResponse;
    }

    writeStore(store);
    return res.json(assignment);
  });

  // Client submits completed homework assignment with mood check-in & reflection
  app.post('/api/assignments/:id/submit', (req, res) => {
    const store = readStore();
    const assignment = store.assignments.find((a) => a.id === req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const { moodRating, difficultyRating, overallReflection } = req.body as {
      moodRating: number;
      difficultyRating: number;
      overallReflection: string;
    };

    const now = new Date();
    assignment.status = 'completed';
    assignment.submittedAt = now.toISOString();
    assignment.moodRating = moodRating;
    assignment.difficultyRating = difficultyRating;
    assignment.overallReflection = overallReflection;

    // Update client's weekly longitudinal progress chart
    const client = store.clients.find((c) => c.id === assignment.clientId);
    if (client) {
      const completedCount = assignment.tasks.filter((t) => t.completed).length;
      const total = Math.max(assignment.tasks.length, 1);
      const completionRate = Math.round((completedCount / total) * 100);
      const nextWeekNum = client.weeklyProgress.length + 1;
      const formattedDate = now.toLocaleDateString('en-SG', {
        day: '2-digit',
        month: 'short',
      });

      client.weeklyProgress.push({
        weekLabel: `Wk ${nextWeekNum}`,
        completionRate,
        moodScore: Number(moodRating) || 3,
        submittedDate: formattedDate,
      });
    }

    writeStore(store);
    return res.json({ assignment, client });
  });

  // Clinician adds post-submission review note
  app.post('/api/assignments/:id/clinician-review', (req, res) => {
    const store = readStore();
    const assignment = store.assignments.find((a) => a.id === req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    const { clinicianFeedback } = req.body as { clinicianFeedback: string };
    assignment.clinicianFeedback = clinicianFeedback;
    writeStore(store);
    return res.json(assignment);
  });

  // Vite dev middleware or static production build
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Heidi Care server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup error:', err);
  process.exit(1);
});
