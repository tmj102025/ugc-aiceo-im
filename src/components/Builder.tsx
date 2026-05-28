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

const AGE_RANGES = ['18-24', '25-29', '30-39', '40-49', '50-59', 'random'];

interface PromptResult {
  text: string;
  model: string;
  error: string | null;
}

export function Builder({ user }: Props) {
  const [imageTemplateId, setImageTemplateId] = useState<string>('ugc-review');
  const [productName, setProductName] = useState('');
  const [mainHeading, setMainHeading] = useState('');
  const [subHeading, setSubHeading] = useState('');
  const [productImage, setProductImage] = useState<string>('');
  const [personImage, setPersonImage] = useState<string>('');
  const [colorPresetId, setColorPresetId] = useState<string>('golden-triangle');
  const [gender, setGender] = useState<Gender>('female');
  const [ageRange, setAgeRange] = useState<string>('25-29');
  const [imageResult, setImageResult] = useState<PromptResult | null>(null);
  const [videoResult, setVideoResult] = useState<PromptResult | null>(null);
  const [pairedVideoName, setPairedVideoName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const productFileRef = useRef<HTMLInputElement>(null);
  const personFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  async function handleProductFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('ไฟล์ที่อัปโหลดต้องเป็นรูปภาพ');
      return;
    }
    setError('');
    try {
      setProductImage(await fileToDataUrl(file));
    } catch {
      setError('อ่านไฟล์ไม่สำเร็จ');
    }
  }

  async function handlePersonFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('ไฟล์ที่อัปโหลดต้องเป็นรูปภาพ');
      return;
    }
    setError('');
    try {
      setPersonImage(await fileToDataUrl(file));
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
    if (!productImage) {
      setError('กรุณาอัปโหลดรูปสินค้า');
      return;
    }
    setLoading(true);
    setImageResult(null);
    setVideoResult(null);
    setPairedVideoName('');
    try {
      const productResized = await resizeImage(productImage);
      const personResized = personImage ? await resizeImage(personImage) : undefined;

      const resp = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageTemplateId,
          productName,
          mainHeading,
          subHeading,
          productImageDataUrl: productResized,
          personImageDataUrl: personResized,
          colorPresetId,
          gender,
          ageRange,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error ?? `HTTP ${resp.status}`);

      setImageResult(data.image);
      setVideoResult(data.video);
      setPairedVideoName(data.videoTemplateName ?? '');

      if (data.image?.text || data.video?.text) {
        const item: HistoryItem = {
          id: `h-${Date.now()}`,
          ts: Date.now(),
          type: 'image',
          templateId: imageTemplateId,
          productName,
          prompt: `IMAGE:\n${data.image?.text ?? '(ล้มเหลว)'}\n\nVIDEO (${data.videoTemplateName ?? ''}):\n${data.video?.text ?? '(ล้มเหลว)'}`,
        };
        pushHistory(item);
        setHistory(loadHistory());
      }
    } catch (e: any) {
      setError(e?.message ?? 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  }

  async function copyText(text: string) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
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
        <section className="card p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="label mb-2">รูปสินค้า <span className="text-red-400">*</span></div>
              <div
                onClick={() => productFileRef.current?.click()}
                className="relative h-32 rounded-xl border-2 border-dashed border-line hover:border-brand/60 cursor-pointer overflow-hidden bg-bg-soft flex items-center justify-center"
              >
                {productImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={productImage} alt="product" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center text-ink-dim text-xs">
                    <div className="text-2xl mb-1">📦</div>
                    <div className="font-bold">รูปสินค้า</div>
                  </div>
                )}
                {productImage && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setProductImage('');
                    }}
                    className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white text-xs px-2 py-0.5 rounded"
                  >
                    ✕
                  </button>
                )}
              </div>
              <input
                ref={productFileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => handleProductFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <div>
              <div className="label mb-2">รูปคน <span className="text-ink-mute font-normal">(ใบหน้า — option)</span></div>
              <div
                onClick={() => personFileRef.current?.click()}
                className="relative h-32 rounded-xl border-2 border-dashed border-line hover:border-brand/60 cursor-pointer overflow-hidden bg-bg-soft flex items-center justify-center"
              >
                {personImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={personImage} alt="person" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-ink-dim text-xs">
                    <div className="text-2xl mb-1">👤</div>
                    <div className="font-bold">รูปคน</div>
                  </div>
                )}
                {personImage && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPersonImage('');
                    }}
                    className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white text-xs px-2 py-0.5 rounded"
                  >
                    ✕
                  </button>
                )}
              </div>
              <input
                ref={personFileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => handlePersonFile(e.target.files?.[0] ?? null)}
              />
            </div>
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
            <div className="label mb-1.5">สไตล์ (จับคู่ video อัตโนมัติ)</div>
            <TemplatePicker mode="image" value={imageTemplateId} onChange={setImageTemplateId} />
          </div>

          <div>
            <div className="label mb-1.5">รายละเอียดปก / โทนสี</div>
            <ColorPresetPicker value={colorPresetId} onChange={setColorPresetId} />
          </div>

          {personImage ? (
            <div className="rounded-lg bg-brand/10 border border-brand/30 text-ink px-3 py-2.5 text-xs leading-relaxed">
              <b className="text-brand">✓ ใช้ใบหน้าจากรูปคนที่อัปโหลด</b>
              <div className="text-ink-dim mt-0.5">เพศ + อายุ AI จะดูจากรูปเอง ไม่ต้องเลือก</div>
            </div>
          ) : (
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
                <select className="input" value={ageRange} onChange={(e) => setAgeRange(e.target.value)}>
                  {AGE_RANGES.map((a) => (
                    <option key={a} value={a}>
                      {a === 'random' ? 'สุ่ม (18-55)' : a}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

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
            {loading ? '⏳ กำลังสร้าง image + video prompt…' : '⚡ สร้าง Prompt (ภาพ + วิดีโอ)'}
          </button>
        </section>

        <section className="space-y-5">
          <OutputCard
            title="🖼️ Image Prompt"
            subtitle="วางใน Sora · Midjourney · Imagen · Flux"
            result={imageResult}
            onCopy={() => imageResult && copyText(imageResult.text)}
            loading={loading}
          />

          <OutputCard
            title={`🎬 Video Prompt ${pairedVideoName ? `· ${pairedVideoName}` : ''}`}
            subtitle="วางใน Veo · Kling · Runway · Hailuo (มีบทพูดไทย)"
            result={videoResult}
            onCopy={() => videoResult && copyText(videoResult.text)}
            loading={loading}
          />

          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold">
                ประวัติ <span className="text-ink-dim text-sm font-normal">({history.length})</span>
              </h3>
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
              <div className="text-sm text-ink-dim py-6 text-center">
                ยังไม่มีประวัติ — prompt ที่สร้างจะเก็บอัตโนมัติ (สูงสุด 30 รายการ)
              </div>
            ) : (
              <ul className="space-y-1.5 max-h-72 overflow-y-auto">
                {history.map((h) => (
                  <li key={h.id}>
                    <button
                      onClick={() => copyText(h.prompt)}
                      className="w-full text-left p-2.5 rounded-lg hover:bg-bg-soft border border-transparent hover:border-line transition"
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="chip !py-0 !px-1.5 !text-[10px]">{new Date(h.ts).toLocaleString('th-TH')}</span>
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

function OutputCard({
  title,
  subtitle,
  result,
  onCopy,
  loading,
}: {
  title: string;
  subtitle: string;
  result: PromptResult | null;
  onCopy: () => void;
  loading: boolean;
}) {
  const hasError = result?.error;
  const hasText = !!result?.text;
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-bold text-lg">{title}</h2>
          <p className="text-xs text-ink-dim mt-0.5">
            {subtitle}
            {result?.model && <> · <span className="text-brand font-mono">{result.model}</span></>}
          </p>
        </div>
        <button
          onClick={onCopy}
          disabled={!hasText}
          className="btn btn-secondary !py-2 !text-sm disabled:opacity-50"
        >
          📋 คัดลอก
        </button>
      </div>
      {hasError ? (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm p-3">
          {result?.error}
        </div>
      ) : (
        <textarea
          className="input min-h-[180px] font-mono text-[13px] leading-relaxed"
          value={result?.text ?? ''}
          readOnly
          placeholder={loading ? 'กำลังให้ AI เขียน…' : 'กดปุ่ม "สร้าง Prompt" ทางซ้ายเพื่อสร้าง'}
        />
      )}
    </div>
  );
}
