'use client';
import { useState, useEffect } from 'react';

interface Props {
  children: React.ReactNode;
}

type State = 'checking' | 'need-code' | 'ok';

export function AccessGate({ children }: Props) {
  const [state, setState] = useState<State>('checking');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/access')
      .then((r) => r.json())
      .then((d) => setState(d.ok ? 'ok' : 'need-code'))
      .catch(() => setState('need-code'));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const resp = await fetch('/api/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await resp.json();
      if (resp.ok && data.ok) {
        setState('ok');
      } else {
        setError(data.error ?? 'รหัสไม่ถูกต้อง');
      }
    } catch {
      setError('เชื่อมต่อ server ไม่ได้');
    } finally {
      setSubmitting(false);
    }
  }

  if (state === 'ok') return <>{children}</>;

  if (state === 'checking') {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-ink-dim">กำลังตรวจสอบ…</div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4">
      <form onSubmit={submit} className="card p-6 w-full max-w-sm">
        <div className="text-center mb-5">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-brand/15 text-brand flex items-center justify-center text-2xl">
            🔐
          </div>
          <h2 className="font-bold text-xl mb-1">ใส่รหัสพิเศษ</h2>
          <p className="text-sm text-ink-dim">เว็บนี้สำหรับนักเรียนของ Tim เท่านั้น</p>
        </div>

        <input
          type="text"
          className="input mb-3 text-center text-lg tracking-wider"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="รหัส…"
          autoFocus
          autoComplete="off"
        />

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-3 py-2 mb-3">
            {error}
          </div>
        )}

        <button type="submit" disabled={submitting || !code.trim()} className="btn btn-primary w-full disabled:opacity-60">
          {submitting ? 'กำลังตรวจ…' : 'ยืนยัน'}
        </button>
      </form>
    </div>
  );
}
