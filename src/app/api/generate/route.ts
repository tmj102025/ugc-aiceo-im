import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { cookies } from 'next/headers';
import { authOptions } from '@/lib/authOptions';
import { BUILT_IN_TEMPLATES } from '@/lib/data/promptTemplates';
import { VIDEO_BUILT_IN_TEMPLATES } from '@/lib/data/videoPromptTemplates';
import { COVER_COLOR_PRESETS } from '@/lib/data/coverColorPresets';
import { pairedVideoFor } from '@/lib/data/imageToVideoMap';
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
    imageTemplateId,
    videoTemplateId: videoTemplateIdInput,
    productName,
    mainHeading,
    subHeading,
    productImageDataUrl,
    personImageDataUrl,
    colorPresetId,
    gender,
    ageRange,
  } = body ?? {};

  if (!productName || typeof productName !== 'string') {
    return NextResponse.json({ error: 'ขาดชื่อสินค้า' }, { status: 400 });
  }
  if (typeof productImageDataUrl !== 'string' || !productImageDataUrl.startsWith('data:image/')) {
    return NextResponse.json({ error: 'ต้องอัปโหลดรูปสินค้า' }, { status: 400 });
  }
  const hasPersonImage =
    typeof personImageDataUrl === 'string' && personImageDataUrl.startsWith('data:image/');

  const colorPreset = COVER_COLOR_PRESETS.find((p) => p.id === colorPresetId) ?? null;
  const ugc = { gender: (gender as Gender) ?? 'female', ageRange: String(ageRange ?? '25-29') };

  const imgTplPicked = BUILT_IN_TEMPLATES[imageTemplateId] ?? BUILT_IN_TEMPLATES['ugc-review'];
  const imgTpl = resolveImageTemplate(imgTplPicked, BUILT_IN_TEMPLATES);
  const effectiveVideoId =
    (typeof videoTemplateIdInput === 'string' && VIDEO_BUILT_IN_TEMPLATES[videoTemplateIdInput])
      ? videoTemplateIdInput
      : pairedVideoFor(imgTpl.id);
  const vidTplPicked = VIDEO_BUILT_IN_TEMPLATES[effectiveVideoId] ?? VIDEO_BUILT_IN_TEMPLATES['video-ugc'];
  const vidTpl = resolveVideoTemplate(vidTplPicked, VIDEO_BUILT_IN_TEMPLATES);

  const imageUserMessage = buildImageUserMessage(imgTpl, {
    productName,
    mainHeading,
    subHeading,
    hasPersonImage,
    ugc,
    colorPreset,
  });
  const videoUserMessage = buildVideoUserMessage(vidTpl, {
    productName,
    mainHeading,
    subHeading,
    hasPersonImage,
    ugc,
    colorPreset,
  });

  try {
    const [imageRes, videoRes] = await Promise.allSettled([
      serverGenerateImagePrompt({
        apiKey,
        productImageDataUrl,
        personImageDataUrl: hasPersonImage ? personImageDataUrl : undefined,
        systemPrompt: imgTpl.systemPrompt ?? '',
        userMessage: imageUserMessage,
        temperature: imgTpl.settings.temperature ?? 0.7,
        allowPaid,
      }),
      serverGenerateVideoPrompt({
        apiKey,
        systemPrompt: vidTpl.systemPrompt ?? '',
        userMessage: videoUserMessage,
        allowPaid,
      }),
    ]);

    const image =
      imageRes.status === 'fulfilled'
        ? { text: imageRes.value.text, model: imageRes.value.model, error: null }
        : { text: '', model: '', error: (imageRes.reason as Error)?.message ?? 'image gen failed' };
    const video =
      videoRes.status === 'fulfilled'
        ? { text: videoRes.value.text, model: videoRes.value.model, error: null }
        : { text: '', model: '', error: (videoRes.reason as Error)?.message ?? 'video gen failed' };

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
        } catch {}
      })
      .catch(() => {});

    return NextResponse.json({
      image,
      video,
      imageTemplateId: imgTpl.id,
      videoTemplateId: vidTpl.id,
      imageTemplateName: imgTpl.name,
      videoTemplateName: vidTpl.name,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'gen failed' }, { status: 500 });
  }
}
