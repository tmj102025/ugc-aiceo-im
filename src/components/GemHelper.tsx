'use client';
import { useState, useEffect } from 'react';
import { type GemSpec, categoryOf } from '@/lib/gemBuilder';

const DONE_KEY = 'ugc.gems.done.v1';

interface Props {
  gems: GemSpec[];
}

export function GemHelper({ gems }: Props) {
  const [done, setDone] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string>('');
  const [expanded, setExpanded] = useState<string>('');

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DONE_KEY);
      if (raw) setDone(new Set(JSON.parse(raw)));
    } catch {}
  }, []);

  function persist(next: Set<string>) {
    setDone(next);
    try {
      window.localStorage.setItem(DONE_KEY, JSON.stringify([...next]));
    } catch {}
  }

  function toggleDone(id: string) {
    const next = new Set(done);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    persist(next);
  }

  async function copyInstructions(g: GemSpec) {
    try {
      await navigator.clipboard.writeText(g.instructions);
      setCopiedId(g.id);
      setTimeout(() => setCopiedId(''), 1500);
    } catch {}
  }

  function resetAll() {
    if (!confirm('ล้าง progress ทั้งหมด?')) return;
    persist(new Set());
  }

  const byCategory = gems.reduce<Record<string, GemSpec[]>>((acc, g) => {
    const c = categoryOf(g.id);
    (acc[c] ??= []).push(g);
    return acc;
  }, {});

  const totalDone = done.size;
  const total = gems.length;
  const pct = total ? Math.round((totalDone / total) * 100) : 0;

  const categoryOrder = ['UGC', 'General Ad', 'Pixar 3D', 'ตลก'];

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 bg-bg/85 backdrop-blur border-b border-line">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <a href="/app" className="btn btn-ghost !py-2 !text-sm">← Builder</a>
            <span className="font-bold">✨ Gem Creator Helper</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-ink-dim">
              {totalDone} / {total} เสร็จ ({pct}%)
            </div>
            <button onClick={resetAll} className="btn btn-ghost !py-2 !text-xs">
              ล้าง progress
            </button>
          </div>
        </div>
        <div className="h-1 bg-bg-soft">
          <div
            className="h-1 bg-brand transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="card p-5">
          <h1 className="text-xl font-bold mb-2">สร้าง 24 Gems ใน Gemini ง่ายๆ</h1>
          <ol className="text-sm text-ink-dim space-y-1.5 leading-relaxed list-decimal pl-5">
            <li>
              เปิด{' '}
              <a
                href="https://gemini.google.com/gems/create"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand underline font-bold"
              >
                Gemini Gem Maker
              </a>{' '}
              ในแท็บใหม่
            </li>
            <li>กลับมาที่นี่ คลิก <b className="text-ink">📋 Copy</b> ของ Gem ที่จะสร้าง</li>
            <li>สลับไป Gemini → ตั้งชื่อ Gem (เห็นในการ์ดด้านล่าง) → <b>Cmd+V</b> ลง Instructions → Save</li>
            <li>กลับมาที่นี่ คลิก <b className="text-ink">☑️</b> เพื่อ mark เสร็จ → ต่อตัวถัดไป</li>
          </ol>
          <div className="text-xs text-ink-mute mt-3">
            ⏱️ ~30 วิ/Gem × 24 = **~12 นาที** ทำครั้งเดียวใช้ตลอด · progress เก็บใน browser
          </div>
        </div>

        {categoryOrder.map((cat) => {
          const items = byCategory[cat];
          if (!items?.length) return null;
          return (
            <section key={cat}>
              <h2 className="font-bold text-lg mb-2 px-1">
                {cat === 'UGC' && '🔥'} {cat === 'General Ad' && '🎬'} {cat === 'Pixar 3D' && '🎨'}{' '}
                {cat === 'ตลก' && '😂'} {cat}{' '}
                <span className="text-ink-dim text-sm font-normal">({items.length})</span>
              </h2>
              <div className="space-y-2">
                {items.map((g) => {
                  const isDone = done.has(g.id);
                  const isCopied = copiedId === g.id;
                  const isExpanded = expanded === g.id;
                  return (
                    <div
                      key={g.id}
                      className={`card p-3 transition ${isDone ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleDone(g.id)}
                          className={`w-7 h-7 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                            isDone
                              ? 'bg-brand border-brand text-bg'
                              : 'border-line hover:border-brand/60'
                          }`}
                          title={isDone ? 'ยกเลิก mark' : 'mark ว่าเสร็จ'}
                        >
                          {isDone && '✓'}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm truncate">
                            {g.name}{' '}
                            <span className="text-ink-mute text-xs font-mono ml-1">{g.id}</span>
                          </div>
                          <div className="text-xs text-ink-dim truncate">{g.description}</div>
                        </div>
                        <button
                          onClick={() => copyInstructions(g)}
                          className={`btn !py-1.5 !text-xs shrink-0 ${
                            isCopied ? 'btn-primary' : 'btn-secondary'
                          }`}
                        >
                          {isCopied ? '✓ คัดลอกแล้ว' : '📋 Copy'}
                        </button>
                        <button
                          onClick={() => setExpanded(isExpanded ? '' : g.id)}
                          className="btn btn-ghost !py-1.5 !text-xs shrink-0"
                        >
                          {isExpanded ? '▲' : '▼'}
                        </button>
                      </div>
                      {isExpanded && (
                        <pre className="mt-3 p-3 bg-bg-soft rounded text-[11px] font-mono text-ink-dim overflow-x-auto max-h-80 overflow-y-auto whitespace-pre-wrap">
                          {g.instructions}
                        </pre>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
