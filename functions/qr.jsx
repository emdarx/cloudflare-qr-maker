import { ImageResponse } from '@vercel/og';
import QRCode from 'qrcode';

// تنظیمات Edge Runtime برای سازگاری با @vercel/og
export const config = {
  runtime: 'edge', 
};

export async function onRequest(context) {
  const { searchParams } = new URL(context.request.url);
  const link = searchParams.get('text');

  if (!link) {
    return new Response('لطفا پارامتر text را ارسال کنید', { status: 400 });
  }

  // آدرس‌دهی به عکس پس‌زمینه در پوشه public
  const backgroundImageUrl = new URL('/qr-background.jpg', context.request.url).origin + '/qr-background.jpg';

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
          // استفاده از عکس پس زمینه
          backgroundImage: `url(${backgroundImageUrl})`,
          backgroundSize: '100% 100%',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* تنظیم موقعیت QR Code */}
        <img
          src={qrDataUrl}
          style={{
            width: '450px', 
            height: '450px',
            // این مقدار (50px) را بعداً باید دقیقاً تنظیم کنید تا فیت کادر سفید روی عکس شما شود
            marginTop: '50px', 
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
