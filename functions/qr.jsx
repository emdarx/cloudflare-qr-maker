import { ImageResponse } from '@vercel/og';
import QRCode from 'qrcode';

// این تنظیمات حیاتی است
export const config = {
  runtime: 'edge', 
};

export async function onRequest(context) {
  // آدرس مستقیم عکس پس‌زمینه از سرویس خارجی (تضمین می‌کند که آدرس معتبر است)
  const BACKGROUND_IMAGE_URL = 'https://i.ibb.co/fJ7nmz8/qr.jpg';

  // ما همچنان به new URL نیاز داریم تا پارامترهای کوئری را بخوانیم
  const { searchParams } = new URL(context.request.url);
  const link = searchParams.get('text');

  if (!link) {
    // در صورت عدم ارسال لینک، یک پاسخ خطا برگردانده شود
    return new Response('لطفا پارامتر text را ارسال کنید', { status: 400 });
  }

  // 1. تولید کد QR به صورت Data URL (این عملیات کاملاً داخلی و امن است)
  const qrDataUrl = await QRCode.toDataURL(link, {
    width: 400,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#ffffff00' // پس زمینه QR شفاف
    }
  });

  // 2. ساخت پاسخ عکس با استفاده از JSX
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          height: '100%',
          width: '100%',
          // استفاده از آدرس خارجی ثابت
          backgroundImage: `url(${BACKGROUND_IMAGE_URL})`, 
          backgroundSize: '100% 100%',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* تنظیم موقعیت و اندازه QR Code */}
        <img
          src={qrDataUrl}
          style={{
            width: '450px', 
            height: '450px',
            // این مقدار (50px) را بعداً پس از تست باید کمی تنظیم کنید تا کاملاً روی کادر سفید بیفتد
            marginTop: '50px', 
          }}
        />
        
      </div>
    ),
    {
      width: 1080, // ابعاد عکس خروجی نهایی
      height: 1080,
    },
  );
}
