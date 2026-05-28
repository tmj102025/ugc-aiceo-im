import './globals.css';
import type { Metadata } from 'next';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'UGC Prompt Builder — AiCEO',
  description: 'สร้าง prompt ภาษาอังกฤษสำหรับภาพ/วิดีโอ UGC ปก TikTok Shop ใช้ใน Sora · Veo · MJ · Imagen',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
