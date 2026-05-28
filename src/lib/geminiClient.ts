import { resizeImage, getBase64Data, getMimeType } from './imageUtils';

const MODEL = 'gemini-2.5-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
];

interface GenerationConfig {
  temperature: number;
  maxOutputTokens?: number;
  thinkingConfig?: { thinkingBudget: number };
}

interface RequestBody {
  system_instruction: { parts: { text: string }[] };
  contents: { parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }> }[];
  generationConfig: GenerationConfig;
  safetySettings: typeof SAFETY_SETTINGS;
}

function sanitizeForSafety(text: string): string {
  return text
    .replace(/image-to-video/gi, 'short video')
    .replace(/^.*ห้าม.*(?:เด็ก|ทารก|baby).*$/gm, '- คนในวิดีโอต้องเป็นผู้ใหญ่เท่านั้น')
    .replace(/^.*ห้าม.*(?:รักษา|หาย|cure).*$/gm, '- ใช้ถ้อยคำทั่วไป หลีกเลี่ยงคำทางการแพทย์')
    .replace(/\n{3,}/g, '\n\n');
}

function extractText(data: any): string {
  const blockReason = data.promptFeedback?.blockReason;
  if (blockReason) throw new Error(`Gemini บล็อค prompt (${blockReason}) — ลองเปลี่ยนภาพหรือ template`);
  const candidate = data.candidates?.[0];
  if (!candidate) throw new Error('Gemini ไม่ส่งผลลัพธ์กลับมา — ลองใหม่อีกครั้ง');
  if (candidate.finishReason === 'SAFETY') throw new Error('Gemini บล็อคเนื้อหา (Safety filter) — ลองเปลี่ยนภาพหรือ template');
  const parts = candidate.content?.parts || [];
  const text = parts.filter((p: any) => !p.thought).map((p: any) => p.text).join('');
  if (!text) throw new Error('Gemini ตอบกลับเป็นค่าว่าง — ลองใหม่อีกครั้ง');
  return text;
}

async function fetchWithRetry(
  apiKey: string,
  requestBody: RequestBody,
  maxRetries = 3,
): Promise<string> {
  const url = `${API_URL}?key=${encodeURIComponent(apiKey)}`;
  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      let body = requestBody;
      if (attempt === maxRetries) {
        body = {
          ...requestBody,
          generationConfig: {
            ...requestBody.generationConfig,
            maxOutputTokens: 16384,
            thinkingConfig: { thinkingBudget: 2048 },
          },
        };
      }
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error?.message || `Gemini API error (${resp.status})`);
      }
      const data = await resp.json();
      return extractText(data);
    } catch (e) {
      lastError = e as Error;
      if (attempt < maxRetries) await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw lastError ?? new Error('Gemini unknown error');
}

export async function generateImagePrompt(args: {
  apiKey: string;
  productImageDataUrl: string;
  systemPrompt: string;
  userMessage: string;
  temperature?: number;
}): Promise<string> {
  const { apiKey, productImageDataUrl, systemPrompt, userMessage, temperature = 0.7 } = args;
  const resized = await resizeImage(productImageDataUrl);
  const requestBody: RequestBody = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [
      {
        parts: [
          { inline_data: { mime_type: getMimeType(resized), data: getBase64Data(resized) } },
          { text: userMessage },
        ],
      },
    ],
    generationConfig: {
      temperature,
      maxOutputTokens: 8192,
      thinkingConfig: { thinkingBudget: 0 },
    },
    safetySettings: SAFETY_SETTINGS,
  };
  return fetchWithRetry(apiKey, requestBody);
}

export async function generateVideoPrompt(args: {
  apiKey: string;
  systemPrompt: string;
  userMessage: string;
}): Promise<string> {
  const { apiKey, systemPrompt, userMessage } = args;
  const requestBody: RequestBody = {
    system_instruction: { parts: [{ text: sanitizeForSafety(systemPrompt) }] },
    contents: [{ parts: [{ text: sanitizeForSafety(userMessage) }] }],
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 8192,
      thinkingConfig: { thinkingBudget: 0 },
    },
    safetySettings: SAFETY_SETTINGS,
  };
  return fetchWithRetry(apiKey, requestBody);
}
