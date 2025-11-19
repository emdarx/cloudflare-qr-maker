import { ImageResponse } from '@vercel/og';
import QRCode from 'qrcode';

// تنظیمات Edge Runtime
export const config = {
  runtime: 'edge', 
};

export async function onRequest(context) {
  const { searchParams } = new URL(context.request.url);
  const link = searchParams.get('text');

  if (!link) {
    return new Response('لطفا پارامتر text را ارسال کنید', { status: 400 });
  }

  // --- اصلاح آدرس‌دهی ---
  // آدرس کامل سایت (مثلاً: https://qr-maker-git.pages.dev)
  const origin = new URL(context.request.url).origin;
  // آدرس کامل عکس پس‌زمینه
  const backgroundImageUrl = `${origin}/qr-background.jpg`; 
  // -----------------------

  // 1. تولید کد QR به صورت Data URL
  const qrDataUrl = await QRCode.toDataURL(link, {
    width: 400,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#ffffff00' // پس زمینه QR شفاف
    }
  });

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          height: '100%',
          width: '100%',
          backgroundImage: `url(${backgroundImageUrl})`,
          backgroundSize: '100% 100%',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <img
          src={qrDataUrl}
          style={{
            width: '450px', 
            height: '450px',
            marginTop: '50px', // تنظیم موقعیت
          }}
        />
        
      </div>
    ),
    {
      width: 1080, // ابعاد خروجی عکس
      height: 1080,
    },
  );
}
