'use client';
import { useState, useRef, useEffect } from 'react';
import { COVER_COLOR_PRESETS, type CoverColorPreset } from '@/lib/data/coverColorPresets';

interface Props {
  value: string;
  onChange: (id: string) => void;
}

export function ColorPresetPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = COVER_COLOR_PRESETS.find((p) => p.id === value) ?? COVER_COLOR_PRESETS[0];

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const recommended = COVER_COLOR_PRESETS.filter((p) => p.recommended);
  const meta = COVER_COLOR_PRESETS.filter((p) => p.id === 'none' || p.id === 'random');
  const others = COVER_COLOR_PRESETS.filter(
    (p) => !p.recommended && p.id !== 'none' && p.id !== 'random',
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="input flex items-center justify-between text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-3 min-w-0">
          <Swatches preset={current} />
          <span className="truncate">{current.name}</span>
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-ink-dim">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-full min-w-[280px] card max-h-[60vh] overflow-y-auto py-2">
          <Section title="ตัวเลือก">
            {meta.map((p) => (
              <PresetRow key={p.id} preset={p} active={p.id === value} onPick={(id) => { onChange(id); setOpen(false); }} />
            ))}
          </Section>
          <Section title="⭐ แนะนำ">
            {recommended.map((p) => (
              <PresetRow key={p.id} preset={p} active={p.id === value} onPick={(id) => { onChange(id); setOpen(false); }} />
            ))}
          </Section>
          <Section title="โทนอื่น">
            {others.map((p) => (
              <PresetRow key={p.id} preset={p} active={p.id === value} onPick={(id) => { onChange(id); setOpen(false); }} />
            ))}
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-1.5">
      <div className="text-[10px] uppercase tracking-wider text-ink-mute font-bold px-2.5 pt-2 pb-1">{title}</div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function PresetRow({ preset, active, onPick }: { preset: CoverColorPreset; active: boolean; onPick: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onPick(preset.id)}
      className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left hover:bg-bg-soft transition ${active ? 'bg-bg-soft border border-brand/40' : 'border border-transparent'}`}
    >
      <Swatches preset={preset} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm">{preset.name}</span>
          {preset.recommended && <span className="chip chip-recommend !py-0 !px-1.5 !text-[9px]">แนะนำ</span>}
        </div>
        <div className="text-[11px] text-ink-dim truncate">{preset.description}</div>
      </div>
    </button>
  );
}

function Swatches({ preset }: { preset: CoverColorPreset }) {
  if (!preset.main) {
    return (
      <div className="w-9 h-6 rounded border border-line bg-bg-soft flex items-center justify-center text-ink-mute">
        {preset.isRandom ? '🎲' : '—'}
      </div>
    );
  }
  return (
    <div className="flex gap-0.5 w-9 h-6 overflow-hidden rounded border border-line">
      <span className="flex-1" style={{ background: preset.main ?? 'transparent' }} />
      <span className="flex-1" style={{ background: preset.sub ?? 'transparent' }} />
      <span className="flex-1" style={{ background: preset.accent ?? 'transparent' }} />
      <span className="flex-1" style={{ background: preset.badge ?? 'transparent' }} />
    </div>
  );
}
