import type { PromptTemplate } from './data/promptTemplates';
import type { VideoPromptTemplate } from './data/videoPromptTemplates';
import type { CoverColorPreset } from './data/coverColorPresets';

export type Gender = 'male' | 'female' | 'random';

export interface UGCSettings {
  gender: Gender;
  ageRange: string;
}

export interface BuildInputs {
  productName: string;
  mainHeading?: string;
  subHeading?: string;
  hasPersonImage: boolean;
  ugc: UGCSettings;
  colorPreset?: CoverColorPreset | null;
}

const GENDER_TH: Record<Gender, string> = {
  male: 'ผู้ชาย',
  female: 'ผู้หญิง',
  random: 'สุ่ม (ชายหรือหญิง)',
};

const GENDER_EN: Record<Gender, string> = {
  male: 'Thai man',
  female: 'Thai woman',
  random: 'Thai person',
};

export function getGenderText(g: Gender): string {
  return GENDER_TH[g] ?? 'ผู้หญิง';
}

export function getGenderTextEn(g: Gender): string {
  return GENDER_EN[g] ?? 'Thai woman';
}

function buildPersonDescription(
  hasPersonImage: boolean,
  ugc: UGCSettings,
  genderText: string,
  genderTextEn: string,
): string {
  if (hasPersonImage) {
    // Face is attached → use it as the source of truth for gender/age/ethnicity.
    // Do NOT inject genderText (may contradict the actual face).
    return `คนในภาพ: ใช้เฉพาะใบหน้าจากภาพที่แนบเท่านั้น (face reference only) — AI จะคงเพศและอายุของบุคคลในรูปไว้ และสร้างท่าทาง เสื้อผ้า ฉากใหม่ที่เหมาะกับสินค้า`;
  }
  const ageText =
    ugc.ageRange === 'random' ? 'สุ่ม (18-55 ปี)' : ugc.ageRange || 'ไม่ระบุ';
  return `คนในภาพ: ${genderText} (${genderTextEn}) อายุ ${ageText}`;
}

function colorHint(preset?: CoverColorPreset | null): string {
  if (!preset || preset.id === 'none' || !preset.main) return '';
  return `โทนสี/อารมณ์ปก: ${preset.name} — ${preset.description}. แนะนำให้บรรยากาศและองค์ประกอบในภาพให้สอดคล้องโทนนี้`;
}

function headingHint(main?: string, sub?: string): string {
  const parts: string[] = [];
  if (main?.trim()) parts.push(`หัวข้อหลักที่จะแปะบนภาพภายหลัง: "${main.trim()}"`);
  if (sub?.trim()) parts.push(`หัวข้อย่อย: "${sub.trim()}"`);
  if (!parts.length) return '';
  return parts.join('\n') + '\nให้เว้นพื้นที่ว่าง (negative space) สำหรับวางข้อความเหล่านี้';
}

export function resolveImageTemplate(
  template: PromptTemplate,
  all: Record<string, PromptTemplate>,
): PromptTemplate {
  if (template.isRandom && template.randomFrom?.length) {
    const candidates = template.randomFrom
      .map((id) => all[id])
      .filter((t): t is PromptTemplate => Boolean(t) && !t.isRandom);
    if (candidates.length) return candidates[Math.floor(Math.random() * candidates.length)];
  }
  return template;
}

export function buildImageUserMessage(
  template: PromptTemplate,
  inputs: BuildInputs,
): string {
  const genderText = inputs.hasPersonImage
    ? 'บุคคลในรูป reference'
    : getGenderText(inputs.ugc.gender);
  const genderTextEn = inputs.hasPersonImage
    ? 'the person from the reference image (preserve their gender and approximate age)'
    : getGenderTextEn(inputs.ugc.gender);
  const personDescription = buildPersonDescription(
    inputs.hasPersonImage,
    inputs.ugc,
    genderText,
    genderTextEn,
  );

  let msg = (template.userMessageTemplate ?? '')
    .replace(/\{\{productName\}\}/g, inputs.productName || 'ไม่ระบุชื่อ')
    .replace(/\{\{personDescription\}\}/g, personDescription)
    .replace(/\{\{genderTextEn\}\}/g, genderTextEn)
    .replace(/\{\{genderText\}\}/g, genderText);

  const heading = headingHint(inputs.mainHeading, inputs.subHeading);
  if (heading) msg += `\n\n${heading}`;
  const tone = colorHint(inputs.colorPreset);
  if (tone) msg += `\n\n${tone}`;
  return msg;
}

export function buildVideoUserMessage(
  template: VideoPromptTemplate,
  inputs: BuildInputs,
): string {
  const genderText = inputs.hasPersonImage
    ? 'บุคคลในรูป reference'
    : getGenderText(inputs.ugc.gender);
  const genderTextEn = inputs.hasPersonImage
    ? 'the person from the reference image (preserve their gender and approximate age)'
    : getGenderTextEn(inputs.ugc.gender);
  const personDescription = buildPersonDescription(
    inputs.hasPersonImage,
    inputs.ugc,
    genderText,
    genderTextEn,
  );
  let msg = (template.userMessageTemplate ?? '')
    .replace(/\{\{productName\}\}/g, inputs.productName || 'ไม่ระบุชื่อ')
    .replace(/\{\{personDescription\}\}/g, personDescription)
    .replace(/\{\{genderTextEn\}\}/g, genderTextEn)
    .replace(/\{\{genderText\}\}/g, genderText);

  const tone = colorHint(inputs.colorPreset);
  if (tone) msg += `\n\n${tone}`;
  return msg;
}

export function resolveVideoTemplate(
  template: VideoPromptTemplate,
  all: Record<string, VideoPromptTemplate>,
): VideoPromptTemplate {
  if (template.isRandom && template.randomFrom?.length) {
    const candidates = template.randomFrom
      .map((id) => all[id])
      .filter((t): t is VideoPromptTemplate => Boolean(t) && !t.isRandom);
    if (candidates.length) return candidates[Math.floor(Math.random() * candidates.length)];
  }
  return template;
}
