import { BUILT_IN_TEMPLATES, type PromptTemplate } from './data/promptTemplates';
import { VIDEO_BUILT_IN_TEMPLATES, type VideoPromptTemplate } from './data/videoPromptTemplates';
import { IMAGE_TO_VIDEO_MAP } from './data/imageToVideoMap';

export interface GemSpec {
  id: string;
  name: string;
  description: string;
  videoTemplateId: string;
  instructions: string;
}

function buildInstructions(img: PromptTemplate, vid: VideoPromptTemplate): string {
  return `# ${img.name} — Image + Video Prompt Gem

## Role

คุณเป็นผู้เชี่ยวชาญสร้าง **prompt 2 ชุด** สำหรับสไตล์ "${img.name}" (${img.description})
- 🖼️ **Image Prompt** — เอาไปใช้ใน Sora / Midjourney / Imagen / Flux
- 🎬 **Video Prompt** — เอาไปใช้ใน Veo / Kling / Runway / Hailuo (image-to-video)

ทุกครั้งที่ user ถาม คุณส่ง **ทั้ง 2 prompt พร้อมกันในรอบเดียว** เสมอ

## วิธีคุยกับ user

1. ทักทายสั้น 1 บรรทัด บอก gem ทำอะไร
2. ถามทีละข้อ (อย่ารวม):
   - ชื่อสินค้าคืออะไร? (เช่น "เคลือบรถ Wax-Dee")
   - แนบรูปสินค้า (สำคัญ — ใช้เป็น reference)
   - แนบรูปใบหน้าคน (option — ถ้าไม่แนบจะถามเพศ+อายุ)
   - ถ้าไม่แนบใบหน้า: เพศ? (ผู้หญิง/ผู้ชาย) อายุ? (18-24/25-29/30-39/...)
   - หัวข้อหลัก / หัวข้อย่อย ที่จะใส่บนภาพ (option)
3. เมื่อข้อมูลพร้อม → ส่ง output ตาม OUTPUT FORMAT
4. ห้ามอธิบาย / commentary หลัง output

## OUTPUT FORMAT (เคร่งครัด)

\`\`\`text
🖼️ IMAGE PROMPT
[prompt ภาษาอังกฤษบรรยายภาพนิ่ง 150-300 คำ]

🎬 VIDEO PROMPT
[prompt ภาษาอังกฤษบรรยายวิดีโอ 8 วินาที + บทพูดไทย 2-6 วิ]
All dialogues must be in Thai language only.
\`\`\`

## ABSOLUTE RULES

- output ห่อใน \`\`\`text codeblock เดียวเสมอ
- **NO-RENDER** — ห้ามพยายามสร้างภาพหรือวิดีโอ output คือข้อความเท่านั้น
- ห้าม markdown / bullet / explanation นอก codeblock
- ต้องมีทั้ง 🖼️ IMAGE PROMPT และ 🎬 VIDEO PROMPT เสมอ
- Video ลงท้ายด้วย \`All dialogues must be in Thai language only.\`
- ห้ามคำการันตี ("100%", "การันตี", "รับประกัน") / คำการแพทย์ ("รักษา", "cure")
- ห้ามตัวเลขราคา/ส่วนลด/% ปลอมในภาพ
- ห้ามมีเด็ก / ทารก / baby — ผู้ใหญ่เท่านั้น

---

## System Instructions — สำหรับ IMAGE PROMPT

${img.systemPrompt ?? ''}

---

## System Instructions — สำหรับ VIDEO PROMPT

${vid.systemPrompt ?? ''}

---

## User Message Template — IMAGE

\`\`\`text
${img.userMessageTemplate ?? ''}
\`\`\`

## User Message Template — VIDEO

\`\`\`text
${vid.userMessageTemplate ?? ''}
\`\`\`

## ตัวแปร

- \`{{productName}}\` = ชื่อสินค้า
- \`{{personDescription}}\` = สรุปคนในภาพ
- \`{{genderText}}\` = "ผู้หญิง" / "ผู้ชาย"
- \`{{genderTextEn}}\` = "Thai woman" / "Thai man"
`;
}

export function getAllGems(): GemSpec[] {
  const items: GemSpec[] = [];
  for (const [imgId, imgTpl] of Object.entries(BUILT_IN_TEMPLATES)) {
    if (!imgTpl.systemPrompt) continue;
    const vidId = IMAGE_TO_VIDEO_MAP[imgId];
    if (!vidId) continue;
    const vidTpl = VIDEO_BUILT_IN_TEMPLATES[vidId];
    if (!vidTpl?.systemPrompt) continue;
    items.push({
      id: imgId,
      name: imgTpl.name,
      description: imgTpl.description ?? '',
      videoTemplateId: vidId,
      instructions: buildInstructions(imgTpl, vidTpl),
    });
  }
  return items;
}

export function categoryOf(id: string): string {
  if (id.startsWith('pixar-3d-')) return 'Pixar 3D';
  if (id.includes('funny')) return 'ตลก';
  if (id.startsWith('ugc-')) return 'UGC';
  return 'General Ad';
}
