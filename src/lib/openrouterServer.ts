// Server-only OpenRouter client (no DOM/canvas). Browser sends pre-resized image base64.

const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Verified against OpenRouter /api/v1/models — May 2026 snapshot
export const FREE_VISION_MODELS = [
  'google/gemma-4-31b-it:free',
  'moonshotai/kimi-k2.6:free',
  'google/gemma-4-26b-a4b-it:free',
  'nvidia/nemotron-nano-12b-v2-vl:free',
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
];

export const FREE_TEXT_MODELS = [
  'qwen/qwen3-next-80b-a3b-instruct:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'deepseek/deepseek-v4-flash:free',
  'minimax/minimax-m2.5:free',
];

export const PAID_VISION_MODELS = [
  'google/gemma-3-4b-it',
  'openai/gpt-5-nano',
  'amazon/nova-lite-v1',
  'google/gemma-4-26b-a4b-it',
];

export const PAID_TEXT_MODELS = [
  'qwen/qwen3.5-9b',
  'google/gemma-3-12b-it',
  'openai/gpt-5-nano',
];

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string } }
  >;
}

export interface GenerateResult {
  text: string;
  model: string;
  attempts: { model: string; ok: boolean; error?: string }[];
}

function isRetryable(status: number, msg: string): boolean {
  if (status === 429 || status === 408 || status === 502 || status === 503 || status === 504) return true;
  if (status === 404 || status === 402) return true;
  // Model-level errors: try next model
  if (status === 400 && /valid model|not.+available|deprecated|unknown model|does not support/i.test(msg)) return true;
  if (/rate.?limit|quota|temporar(?:y|ily)|unavailable|overloaded/i.test(msg)) return true;
  return false;
}

async function callOne(args: {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  temperature: number;
}): Promise<string> {
  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://ugc.aiceo.im',
      'X-Title': 'UGC Prompt Builder',
    },
    body: JSON.stringify({
      model: args.model,
      messages: args.messages,
      temperature: args.temperature,
      max_tokens: 4096,
    }),
  });
  const body: any = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const msg = body?.error?.message || `HTTP ${resp.status}`;
    const err: any = new Error(msg);
    err.status = resp.status;
    throw err;
  }
  const text = body?.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) {
    const err: any = new Error('empty response');
    err.status = 502;
    throw err;
  }
  return text.trim();
}

async function callWithRotation(args: {
  apiKey: string;
  models: string[];
  messages: ChatMessage[];
  temperature: number;
}): Promise<GenerateResult> {
  const attempts: GenerateResult['attempts'] = [];
  let lastErr: Error | null = null;
  for (const model of args.models) {
    try {
      const text = await callOne({
        apiKey: args.apiKey,
        model,
        messages: args.messages,
        temperature: args.temperature,
      });
      attempts.push({ model, ok: true });
      return { text, model, attempts };
    } catch (e: any) {
      const status = e?.status ?? 0;
      const msg = e?.message ?? 'unknown';
      attempts.push({ model, ok: false, error: `${status} ${msg}` });
      lastErr = e;
      if (!isRetryable(status, msg)) break;
    }
  }
  const detail = attempts.map((a) => `${a.model}: ${a.error ?? 'ok'}`).join(' | ');
  throw new Error(`OpenRouter: ทุก model ล้มเหลว → ${detail}`);
}

export async function serverGenerateImagePrompt(args: {
  apiKey: string;
  productImageDataUrl: string;
  personImageDataUrl?: string;
  systemPrompt: string;
  userMessage: string;
  temperature?: number;
  allowPaid?: boolean;
}): Promise<GenerateResult> {
  const userContent: Array<
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string } }
  > = [{ type: 'image_url', image_url: { url: args.productImageDataUrl } }];
  if (args.personImageDataUrl) {
    userContent.push({ type: 'image_url', image_url: { url: args.personImageDataUrl } });
  }
  userContent.push({ type: 'text', text: args.userMessage });
  const messages: ChatMessage[] = [
    { role: 'system', content: args.systemPrompt },
    { role: 'user', content: userContent },
  ];
  const models = args.allowPaid ? [...FREE_VISION_MODELS, ...PAID_VISION_MODELS] : FREE_VISION_MODELS;
  return callWithRotation({
    apiKey: args.apiKey,
    models,
    messages,
    temperature: args.temperature ?? 0.7,
  });
}

export async function serverGenerateVideoPrompt(args: {
  apiKey: string;
  systemPrompt: string;
  userMessage: string;
  allowPaid?: boolean;
}): Promise<GenerateResult> {
  const messages: ChatMessage[] = [
    { role: 'system', content: args.systemPrompt },
    { role: 'user', content: args.userMessage },
  ];
  const models = args.allowPaid ? [...FREE_TEXT_MODELS, ...PAID_TEXT_MODELS] : FREE_TEXT_MODELS;
  return callWithRotation({
    apiKey: args.apiKey,
    models,
    messages,
    temperature: 0.8,
  });
}
