'use client';
import { useEffect, useRef, useState } from 'react';
import { signOut } from 'next-auth/react';
import { type Gender } from '@/lib/promptBuilder';
import { fileToDataUrl, resizeImage } from '@/lib/imageUtils';
import { pushHistory, loadHistory, clearHistory, type HistoryItem } from '@/lib/storage';
import { ColorPresetPicker } from './ColorPresetPicker';
import { TemplatePicker } from './TemplatePicker';

interface Props {
  user: { email: string; name: string; picture: string };
}

type Mode = 'image' | 'video';

const AGE_RANGES = ['18-24', '25-29', '30-39', '40-49', '50-59', 'random'];

export function Builder({ user }: Props) {
  const [mode, setMode] = useState<Mode>('image');
  const [imageTemplateId, setImageTemplateId] = useState<string>('ugc-review');
  const [videoTemplateId, setVideoTemplateId] = useState<string>('video-ugc');
  const [productName, setProductName] = useState('');
  const [mainHeading, setMainHeading] = useState('');
  const [subHeading, setSubHeading] = useState('');
  const [productImage, setProductImage] = useState<string>('');
  const [colorPresetId, setColorPresetId] = useState<string>('golden-triangle');
  const [gender, setGender] = useState<Gender>('female');
  const [ageRange, setAgeRange] = useState<string>('25-29');
  const [output, setOutput] = useState('');
  const [usedModel, setUsedModel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const templateId = mode === 'image' ? imageTemplateId : videoTemplateId;

  async function handleFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('ไฟล์ที่อัปโหลดต้องเป็นรูปภาพ');
      return;
    }
    setError('');
    try {
      const dataUrl = await fileToDataUrl(file);
      setProductImage(dataUrl);
    } catch {
      setError('อ่านไฟล์ไม่สำเร็จ');
    }
  }

  async function handleGenerate() {
    setError('');
    if (!productName.trim()) {
      setError('กรุณาใส่ชื่อสินค้า');
      return;
    }
    if (mode === 'image' && !productImage) {
      setError('โหมดภาพต้องอัปโหลดรูปสินค้า');
      return;
    }
    setLoading(true);
    setUsedModel('');
    try {
      let imageDataUrl: string | undefined;
      if (mode === 'image' && productImage) {
        imageDataUrl = await resizeImage(productImage);
      }
      const resp = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          templateId,
          productName,
          mainHeading,
          subHeading,
          productImageDataUrl: imageDataUrl,
          colorPresetId,
          gender,
          ageRange,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data?.error ?? `HTTP ${resp.status}`);
      }
      setOutput(data.text);
      setUsedModel(data.model);
      const item: HistoryItem = {
        id: `h-${Date.now()}`,
        ts: Date.now(),
        type: mode,
        templateId,
        productName,
        prompt: data.text,
      };
      pushHistory(item);
      setHistory(loadHistory());
    } catch (e: any) {
      setError(e?.message ?? 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  }

  async function copyOutput() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
    } catch {}
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 bg-bg/85 backdrop-blur border-b border-line">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-brand text-bg flex items-center justify-center font-bold">U</span>
            <span className="font-bold">UGC Prompt Builder</span>
            <span className="chip">AiCEO</span>
          </div>
          <div className="flex items-center gap-2">
            {user.picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.picture} alt="" className="w-8 h-8 rounded-full border border-line" />
            ) : null}
            <button onClick={() => signOut({ callbackUrl: '/' })} className="btn btn-ghost !py-2 !text-sm">
              ออก
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-5">
        {/* Sidebar — controls */}
        <section className="card p-4 space-y-4">
          <div>
            <div className="label mb-2">รูปสินค้า {mode === 'image' && <span className="text-red-400">*</span>}</div>
            <div
              onClick={() => fileRef.current?.click()}
              className="relative h-44 rounded-xl border-2 border-dashed border-line hover:border-brand/60 transition cursor-pointer overflow-hidden bg-bg-soft flex items-center justify-center"
            >
              {productImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={productImage} alt="product" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center text-ink-dim">
                  <div className="text-3xl mb-1">📦</div>
                  <div className="text-sm font-bold">อัปโหลดรูปสินค้า</div>
                  <div className="text-xs mt-0.5">jpg / png — ใช้เป็น reference ให้ Gemini วิเคราะห์</div>
                </div>
              )}
              {productImage && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setProductImage('');
                  }}
                  className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-black/80 text-white text-xs px-2 py-1 rounded"
                >
                  ลบ
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <div>
            <div className="label mb-1.5">ชื่อสินค้า <span className="text-red-400">*</span></div>
            <input
              className="input"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="เช่น เคลือบรถ Wax-Dee"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="label mb-1.5">หัวข้อหลัก</div>
              <input
                className="input"
                value={mainHeading}
                onChange={(e) => setMainHeading(e.target.value)}
                placeholder="รถเงาฉ่ำแค่ปาด"
              />
            </div>
            <div>
              <div className="label mb-1.5">หัวข้อย่อย</div>
              <input
                className="input"
                value={subHeading}
                onChange={(e) => setSubHeading(e.target.value)}
                placeholder="เงาแบบกระจก"
              />
            </div>
          </div>

          <div>
            <div className="label mb-1.5">ประเภท Prompt</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('image')}
                className={`btn ${mode === 'image' ? 'btn-primary' : 'btn-secondary'}`}
              >
                🖼️ ภาพ
              </button>
              <button
                type="button"
                onClick={() => setMode('video')}
                className={`btn ${mode === 'video' ? 'btn-primary' : 'btn-secondary'}`}
              >
                🎬 วิดีโอ
              </button>
            </div>
          </div>

          <div>
            <div className="label mb-1.5">Template</div>
            <TemplatePicker
              mode={mode}
              value={templateId}
              onChange={(id) => (mode === 'image' ? setImageTemplateId(id) : setVideoTemplateId(id))}
            />
          </div>

          <div>
            <div className="label mb-1.5">รายละเอียดปก / โทนสี</div>
            <ColorPresetPicker value={colorPresetId} onChange={setColorPresetId} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="label mb-1.5">เพศนางแบบ</div>
              <select
                className="input"
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
              >
                <option value="female">ผู้หญิง</option>
                <option value="male">ผู้ชาย</option>
                <option value="random">สุ่ม</option>
              </select>
            </div>
            <div>
              <div className="label mb-1.5">อายุ</div>
              <select
                className="input"
                value={ageRange}
                onChange={(e) => setAgeRange(e.target.value)}
              >
                {AGE_RANGES.map((a) => (
                  <option key={a} value={a}>
                    {a === 'random' ? 'สุ่ม (18-55)' : a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-3 py-2">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="btn btn-primary w-full text-base py-3 disabled:opacity-60"
          >
            {loading ? '⏳ กำลังสร้าง prompt…' : '⚡ สร้าง Prompt'}
          </button>
        </section>

        {/* Right — output */}
        <section className="space-y-5">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-bold text-lg">Prompt (ภาษาอังกฤษ)</h2>
                <p className="text-xs text-ink-dim mt-0.5">
                  คัดลอกแล้วนำไปวางใน Sora · Veo · MJ · Imagen · Kling
                  {usedModel && <> · ใช้ <span className="text-brand font-mono">{usedModel}</span></>}
                </p>
              </div>
              <button
                onClick={copyOutput}
                disabled={!output}
                className="btn btn-secondary !py-2 !text-sm disabled:opacity-50"
              >
                📋 คัดลอก
              </button>
            </div>
            <textarea
              className="input min-h-[280px] font-mono text-[13px] leading-relaxed"
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              placeholder={loading ? 'กำลังให้ Gemini เขียน prompt ภาษาอังกฤษ context-aware…' : 'กดปุ่ม “สร้าง Prompt” เพื่อให้ Gemini วิเคราะห์รูปสินค้า + template + โทนสี → ออกเป็น prompt EN พร้อมใช้'}
            />
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold">ประวัติ <span className="text-ink-dim text-sm font-normal">({history.length})</span></h3>
              {history.length > 0 && (
                <button
                  onClick={() => {
                    clearHistory();
                    setHistory([]);
                  }}
                  className="btn btn-ghost !text-xs !py-1"
                >
                  ล้างทั้งหมด
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <div className="text-sm text-ink-dim py-6 text-center">ยังไม่มีประวัติ — prompt ที่สร้างไว้จะเก็บอัตโนมัติ (สูงสุด 30 รายการ)</div>
            ) : (
              <ul className="space-y-1.5 max-h-72 overflow-y-auto">
                {history.map((h) => (
                  <li key={h.id}>
                    <button
                      onClick={() => setOutput(h.prompt)}
                      className="w-full text-left p-2.5 rounded-lg hover:bg-bg-soft border border-transparent hover:border-line transition"
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="chip !py-0 !px-1.5 !text-[10px]">{h.type === 'image' ? '🖼️ ภาพ' : '🎬 วิดีโอ'}</span>
                        <span className="text-xs text-ink-dim">{new Date(h.ts).toLocaleString('th-TH')}</span>
                      </div>
                      <div className="text-sm font-bold truncate">{h.productName}</div>
                      <div className="text-[12px] text-ink-dim line-clamp-2">{h.prompt}</div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>

    </div>
  );
}
