import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { cookies } from 'next/headers';
import { authOptions } from '@/lib/authOptions';
import { BUILT_IN_TEMPLATES } from '@/lib/data/promptTemplates';
import { VIDEO_BUILT_IN_TEMPLATES } from '@/lib/data/videoPromptTemplates';
import { COVER_COLOR_PRESETS } from '@/lib/data/coverColorPresets';
import {
  buildImageUserMessage,
  buildVideoUserMessage,
  resolveImageTemplate,
  resolveVideoTemplate,
  type Gender,
} from '@/lib/promptBuilder';
import {
  serverGenerateImagePrompt,
  serverGenerateVideoPrompt,
} from '@/lib/openrouterServer';
import { pb, ensureAdminAuth } from '@/lib/pocketbase';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'ต้อง login ก่อน' }, { status: 401 });
  }
  if (cookies().get('ugc_access')?.value !== 'ok') {
    return NextResponse.json({ error: 'ต้องใส่รหัสพิเศษก่อน' }, { status: 403 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENROUTER_API_KEY ยังไม่ถูกตั้งบน server' }, { status: 500 });
  }
  const allowPaid = (process.env.ALLOW_PAID_FALLBACK ?? '1') === '1';

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }

  const {
    mode,
    templateId,
    productName,
    mainHeading,
    subHeading,
    productImageDataUrl,
    colorPresetId,
    gender,
    ageRange,
  } = body ?? {};

  if (mode !== 'image' && mode !== 'video') {
    return NextResponse.json({ error: 'invalid mode' }, { status: 400 });
  }
  if (!productName || typeof productName !== 'string') {
    return NextResponse.json({ error: 'ขาดชื่อสินค้า' }, { status: 400 });
  }
  if (mode === 'image' && (typeof productImageDataUrl !== 'string' || !productImageDataUrl.startsWith('data:image/'))) {
    return NextResponse.json({ error: 'ภาพไม่ถูกต้อง (โหมดภาพต้องมีรูป)' }, { status: 400 });
  }

  const colorPreset = COVER_COLOR_PRESETS.find((p) => p.id === colorPresetId) ?? null;
  const ugc = { gender: (gender as Gender) ?? 'female', ageRange: String(ageRange ?? '25-29') };

  try {
    let result;
    if (mode === 'image') {
      const tpl = resolveImageTemplate(
        BUILT_IN_TEMPLATES[templateId] ?? BUILT_IN_TEMPLATES['ugc-review'],
        BUILT_IN_TEMPLATES,
      );
      const userMessage = buildImageUserMessage(tpl, {
        productName,
        mainHeading,
        subHeading,
        hasPersonImage: false,
        ugc,
        colorPreset,
      });
      result = await serverGenerateImagePrompt({
        apiKey,
        productImageDataUrl,
        systemPrompt: tpl.systemPrompt ?? '',
        userMessage,
        temperature: tpl.settings.temperature ?? 0.7,
        allowPaid,
      });
    } else {
      const tpl = resolveVideoTemplate(
        VIDEO_BUILT_IN_TEMPLATES[templateId] ?? VIDEO_BUILT_IN_TEMPLATES['video-ugc'],
        VIDEO_BUILT_IN_TEMPLATES,
      );
      const userMessage = buildVideoUserMessage(tpl, {
        productName,
        mainHeading,
        subHeading,
        hasPersonImage: false,
        ugc,
        colorPreset,
      });
      result = await serverGenerateVideoPrompt({
        apiKey,
        systemPrompt: tpl.systemPrompt ?? '',
        userMessage,
        allowPaid,
      });
    }

    ensureAdminAuth()
      .then(async () => {
        const email = session.user!.email!;
        try {
          const existing = await pb()
            .collection('ugc_leads')
            .getFirstListItem(`email="${email.replace(/"/g, '')}"`);
          await pb()
            .collection('ugc_leads')
            .update(existing.id, {
              generate_count: ((existing as any).generate_count ?? 0) + 1,
              last_generate_at: new Date().toISOString(),
            });
        } catch {
          // ignore tracking errors
        }
      })
      .catch(() => {});

    return NextResponse.json({ text: result.text, model: result.model });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'gen failed' }, { status: 500 });
  }
}
