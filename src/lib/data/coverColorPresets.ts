/**
 * Cover Color Presets — คู่สีตัวอักษรสำหรับ TikTok Shop cover thumbnails
 * main: สีข้อความหัวหลัก | sub: สีข้อความหัวย่อย | accent: สีคำเน้น/highlight | badge: สีพื้น badge ราคา
 */
export interface CoverColorPreset {
  id: string;
  name: string;
  description: string;
  main: string | null;
  sub: string | null;
  accent: string | null;
  badge: string | null;
  recommended?: boolean;
  isRandom?: boolean;
}

export const COVER_COLOR_PRESETS: CoverColorPreset[] = [
  {
    id: 'none',
    name: 'ไม่ใช้',
    description: 'ไม่เพิ่มข้อความบนภาพ',
    main: null, sub: null, accent: null, badge: null
  },
  {
    id: 'random',
    name: 'สุ่ม',
    description: 'สุ่มคู่สีใหม่ทุกรอบที่สร้าง',
    main: null, sub: null, accent: null, badge: null,
    isRandom: true
  },
  {
    id: 'golden-triangle',
    name: 'Golden Triangle',
    description: 'เหลืองทอง + ขาว + แดงสด — combo ยอดวิ่ง',
    main: '#FFD700', sub: '#FFFFFF', accent: '#FF1744', badge: '#FF6D00',
    recommended: true
  },
  {
    id: 'yellow-red',
    name: 'เหลือง+แดง',
    description: 'โปรแรง ลดราคา urgency',
    main: '#FFD700', sub: '#FFFFFF', accent: '#FF0000', badge: '#FF0000',
    recommended: true
  },
  {
    id: 'white-red',
    name: 'ขาว+แดง',
    description: 'คลีน อ่านง่าย สากล',
    main: '#FFFFFF', sub: '#FFEB3B', accent: '#FF1744', badge: '#FF1744',
    recommended: true
  },
  {
    id: 'yellow-black',
    name: 'เหลือง+ดำ',
    description: 'สะดุดตา warning style',
    main: '#FFEB3B', sub: '#000000', accent: '#FF0000', badge: '#000000'
  },
  {
    id: 'gold-white',
    name: 'ทอง+ขาว',
    description: 'luxury premium สกินแคร์ อาหารเสริม',
    main: '#FFD700', sub: '#FFFFFF', accent: '#FFC107', badge: '#212121'
  },
  {
    id: 'pink-white',
    name: 'ชมพู+ขาว',
    description: 'beauty, women, ของผู้หญิง',
    main: '#FF4FA3', sub: '#FFFFFF', accent: '#E91E63', badge: '#E91E63'
  },
  {
    id: 'mint-white',
    name: 'มินต์+ขาว',
    description: 'clean, health, organic',
    main: '#00E676', sub: '#FFFFFF', accent: '#00C853', badge: '#00C853'
  },
  {
    id: 'orange-white',
    name: 'ส้ม+ขาว',
    description: 'urgency ไม่จัดเท่าแดง',
    main: '#FF6D00', sub: '#FFFFFF', accent: '#FF3D00', badge: '#FF3D00'
  },
  {
    id: 'cyan-yellow',
    name: 'ฟ้านีออน+เหลือง',
    description: 'tech, gadget, รถ',
    main: '#00E5FF', sub: '#FFEB3B', accent: '#FFEB3B', badge: '#0091EA'
  },
  {
    id: 'black-gold',
    name: 'ดำ+ทอง',
    description: 'luxury masculine นาฬิกา น้ำหอม',
    main: '#FFD700', sub: '#FFFFFF', accent: '#FFC107', badge: '#000000'
  },
  {
    id: 'deep-red-gold',
    name: 'แดงเข้ม+ทอง',
    description: 'มงคล ตรุษจีน เทศกาล',
    main: '#FFD700', sub: '#FFFFFF', accent: '#FFD700', badge: '#B71C1C'
  },
  {
    id: 'navy-orange',
    name: 'กรมท่า+ส้ม',
    description: 'professional tech, business',
    main: '#FF6D00', sub: '#FFFFFF', accent: '#FFAB00', badge: '#0D47A1'
  },
  {
    id: 'black-neon-green',
    name: 'ดำ+เขียวนีออน',
    description: 'gaming, edgy tech',
    main: '#00FF88', sub: '#FFFFFF', accent: '#00E676', badge: '#000000'
  },
  {
    id: 'purple-yellow',
    name: 'ม่วง+เหลือง',
    description: 'party, energy drink',
    main: '#FFEB3B', sub: '#FFFFFF', accent: '#FFEA00', badge: '#6A1B9A'
  },
  {
    id: 'hot-pink-cyan',
    name: 'ชมพูร้อน+ฟ้า',
    description: 'Y2K, fun, fashion',
    main: '#FF0080', sub: '#00E5FF', accent: '#FFEB3B', badge: '#FF0080'
  },
  {
    id: 'brown-cream',
    name: 'น้ำตาล+ครีม',
    description: 'organic, food, คาเฟ่',
    main: '#FFF8E1', sub: '#FFCC80', accent: '#FF6F00', badge: '#6D4C41'
  },
  {
    id: 'lavender-white',
    name: 'ลาเวนเดอร์+ขาว',
    description: 'spa, perfume, premium beauty',
    main: '#FFFFFF', sub: '#E1BEE7', accent: '#AB47BC', badge: '#6A1B9A'
  }
];

