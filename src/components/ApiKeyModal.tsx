'use client';
import { useState, useEffect } from 'react';
import { loadApiKey, saveApiKey, clearApiKey } from '@/lib/storage';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function ApiKeyModal({ open, onClose, onSaved }: Props) {
  const [key, setKey] = useState('');
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (open) setKey(loadApiKey());
  }, [open]);

  if (!open) return null;

  const masked = key ? `${key.slice(0, 6)}…${key.slice(-4)}` : '';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-5">
        <h3 className="font-bold text-lg mb-1">Gemini API Key</h3>
        <p className="text-sm text-ink-dim mb-4">
          เก็บใน browser ของคุณเท่านั้น ไม่ส่งขึ้นเซิร์ฟเวอร์
          <br />
          ขอ free key ที่{' '}
          <a className="text-brand underline" href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">
            aistudio.google.com/apikey
          </a>
        </p>

        <label className="label block mb-1.5">API Key</label>
        <div className="flex gap-2 mb-3">
          <input
            type={show ? 'text' : 'password'}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="AIza…"
            className="input"
            autoFocus
          />
          <button onClick={() => setShow((v) => !v)} className="btn btn-secondary !px-3" type="button">
            {show ? '🙈' : '👁️'}
          </button>
        </div>

        {key && !show && <div className="text-xs text-ink-mute font-mono mb-3">{masked}</div>}

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
