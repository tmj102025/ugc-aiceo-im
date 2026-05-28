import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { cookies } from 'next/headers';
import { authOptions } from '@/lib/authOptions';

const COOKIE_NAME = 'ugc_access';
const COOKIE_VALUE = 'ok';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, error: 'login required' }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad json' }, { status: 400 });
  }

  const code = String(body?.code ?? '').trim();
  const expected = process.env.ACCESS_CODE ?? '';
  if (!expected) {
    return NextResponse.json({ ok: false, error: 'ACCESS_CODE not configured' }, { status: 500 });
  }
  if (!code || code !== expected) {
    return NextResponse.json({ ok: false, error: 'รหัสไม่ถูกต้อง' }, { status: 403 });
  }

  cookies().set({
    name: COOKIE_NAME,
    value: COOKIE_VALUE,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const c = cookies().get('ugc_access');
  return NextResponse.json({ ok: c?.value === 'ok' });
}
