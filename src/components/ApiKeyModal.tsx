'use client';
import { useState, useEffect } from 'react';
import { loadApiKey, saveApiKey, clearApiKey, loadAllowPaid, saveAllowPaid } from '@/lib/storage';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function ApiKeyModal({ open, onClose, onSaved }: Props) {
  const [key, setKey] = useState('');
  const [show, setShow] = useState(false);
  const [allowPaid, setAllowPaid] = useState(false);

  useEffect(() => {
    if (open) {
      setKey(loadApiKey());
      setAllowPaid(loadAllowPaid());
    }
  }, [open]);

  if (!open) return null;

  const masked = key ? `${key.slice(0, 6)}…${key.slice(-4)}` : '';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-5">
        <h3 className="font-bold text-lg mb-1">OpenRouter API Key</h3>
        <p className="text-sm text-ink-dim mb-4">
          เก็บใน browser เท่านั้น ไม่ส่งขึ้นเซิร์ฟเวอร์
          <br />
          ขอ key (เริ่มต้นฟรี) ที่{' '}
          <a className="text-brand underline" href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer">
            openrouter.ai/keys
          </a>
        </p>

        <label className="label block mb-1.5">API Key</label>
        <div className="flex gap-2 mb-3">
          <input
            type={show ? 'text' : 'password'}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="sk-or-v1-…"
            className="input"
            autoFocus
          />
          <button onClick={() => setShow((v) => !v)} className="btn btn-secondary !px-3" type="button">
            {show ? '🙈' : '👁️'}
          </button>
        </div>

        {key && !show && <div className="text-xs text-ink-mute font-mono mb-3">{masked}</div>}

        <label className="flex items-start gap-3 p-3 rounded-lg bg-bg-soft border border-line cursor-pointer hover:border-brand/40 mb-4">
          <input
            type="checkbox"
            checked={allowPaid}
            onChange={(e) => setAllowPaid(e.target.checked)}
            className="mt-0.5 accent-brand w-4 h-4"
          />
          <div className="flex-1 text-sm">
            <div className="font-bold">เปิด paid fallback</div>
            <div className="text-xs text-ink-dim mt-0.5">
              ถ้า free models เต็ม rate limit จะข้ามไปใช้ paid models ถูกๆ (Gemini Flash Lite ~$0.04/M tokens) จนงานเสร็จ
            </div>
          </div>
        </label>

        <div className="rounded-lg bg-bg-soft p-3 mb-4 text-xs text-ink-dim">
          <div className="font-bold text-ink mb-1">Auto-rotate models (ฟรีก่อน):</div>
          <ul className="space-y-0.5 leading-relaxed">
            <li>① google/gemini-2.5-flash-exp <span className="chip-recommend chip !py-0 !px-1.5 !text-[9px]">free</span></li>
            <li>② qwen/qwen2.5-vl-72b <span className="chip-recommend chip !py-0 !px-1.5 !text-[9px]">free</span></li>
            <li>③ llama-3.2-90b-vision <span className="chip-recommend chip !py-0 !px-1.5 !text-[9px]">free</span></li>
            <li>④ mistral-small-3.1 <span className="chip-recommend chip !py-0 !px-1.5 !text-[9px]">free</span></li>
            {allowPaid && <li className="text-brand">⑤–⑧ Gemini Flash Lite / Llama vision / GPT-4o-mini · paid</li>}
          </ul>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={() => {
              clearApiKey();
              setKey('');
            }}
            className="btn btn-ghost"
            type="button"
          >
            ลบ
          </button>
          <button onClick={onClose} className="btn btn-secondary" type="button">ยกเลิก</button>
          <button
            onClick={() => {
              saveApiKey(key.trim());
              saveAllowPaid(allowPaid);
              onSaved?.();
              onClose();
            }}
            className="btn btn-primary"
            type="button"
            disabled={!key.trim()}
          >
            บันทึก
          </button>
        </div>
      </div>
    </div>
  );
}
