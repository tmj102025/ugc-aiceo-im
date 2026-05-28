'use client';
import { useState } from 'react';
import { BUILT_IN_TEMPLATES, TEMPLATE_ICONS, type PromptTemplate } from '@/lib/data/promptTemplates';
import { VIDEO_BUILT_IN_TEMPLATES, type VideoPromptTemplate } from '@/lib/data/videoPromptTemplates';

interface Props {
  mode: 'image' | 'video';
  value: string;
  onChange: (id: string) => void;
}

export function TemplatePicker({ mode, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const list: Array<PromptTemplate | VideoPromptTemplate> =
    mode === 'image'
      ? Object.values(BUILT_IN_TEMPLATES)
      : Object.values(VIDEO_BUILT_IN_TEMPLATES);
  const current = list.find((t) => t.id === value) ?? list[0];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="input flex items-center justify-between text-left"
      >
        <span className="flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 rounded-lg bg-brand/15 text-brand flex items-center justify-center shrink-0">
            <TemplateIcon icon={(current as any).icon ?? 'user-check'} />
          </span>
          <span className="flex flex-col min-w-0">
            <span className="font-bold text-sm truncate">{current.name}</span>
            <span className="text-[11px] text-ink-dim truncate">{current.description}</span>
          </span>
        </span>
        <span className="text-xs text-ink-dim shrink-0">เปลี่ยน →</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-3">
          <div className="card w-full max-w-3xl max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-bg-card/95 backdrop-blur border-b border-line px-5 py-4 flex items-center justify-between z-10">
              <h3 className="font-bold text-lg">เลือก Template — {mode === 'image' ? 'ภาพ' : 'วิดีโอ'}</h3>
              <button onClick={() => setOpen(false)} className="btn btn-ghost !p-2">✕</button>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
              {list.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    onChange(t.id);
                    setOpen(false);
                  }}
                  className={`text-left p-3 rounded-xl border transition ${t.id === value ? 'border-brand/60 bg-brand/5' : 'border-line bg-bg-soft hover:border-brand/30'}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="w-10 h-10 rounded-lg bg-brand/15 text-brand flex items-center justify-center shrink-0">
                      <TemplateIcon icon={(t as any).icon ?? 'user-check'} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-sm">{t.name}</div>
                        {t.isDefault && <span className="chip chip-recommend !py-0 !px-1.5 !text-[9px]">แนะนำ</span>}
                      </div>
                      <div className="text-[12px] text-ink-dim mt-0.5 leading-snug">{t.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TemplateIcon({ icon }: { icon: string }) {
  const path = TEMPLATE_ICONS[icon] ?? TEMPLATE_ICONS['user-check'];
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: path }}
    />
  );
}
