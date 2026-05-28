import { NextResponse } from 'next/server';
import { pb, ensureAdminAuth } from '@/lib/pocketbase';

const COLLECTION = 'ugc_leads';

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad json' }, { status: 400 });
  }
  const { event, email, name, picture } = body ?? {};
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ ok: false, error: 'email required' }, { status: 400 });
  }
  if (event !== 'login' && event !== 'generate') {
    return NextResponse.json({ ok: false, error: 'unknown event' }, { status: 400 });
  }

  try {
    await ensureAdminAuth();
    const client = pb();
    const now = new Date().toISOString();
    let existing: any = null;
    try {
      existing = await client.collection(COLLECTION).getFirstListItem(`email="${email.replace(/"/g, '')}"`);
    } catch {
      existing = null;
    }
    if (existing) {
      const patch: any = {};
      if (event === 'login') {
        patch.login_count = (existing.login_count ?? 0) + 1;
        patch.last_login_at = now;
        if (name) patch.name = name;
        if (picture) patch.picture = picture;
      } else {
        patch.generate_count = (existing.generate_count ?? 0) + 1;
        patch.last_generate_at = now;
      }
      await client.collection(COLLECTION).update(existing.id, patch);
    } else {
      const data: any = {
        email,
        name: name ?? '',
        picture: picture ?? '',
        login_count: event === 'login' ? 1 : 0,
        generate_count: event === 'generate' ? 1 : 0,
        last_login_at: event === 'login' ? now : null,
        last_generate_at: event === 'generate' ? now : null,
      };
      await client.collection(COLLECTION).create(data);
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[lead/track] error:', e?.message ?? e);
    return NextResponse.json({ ok: false, error: e?.message ?? 'pb error' }, { status: 500 });
  }
}
