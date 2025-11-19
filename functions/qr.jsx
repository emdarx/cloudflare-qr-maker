import { ImageResponse } from '@vercel/og';
import QRCode from 'qrcode';

export const config = {
  runtime: 'edge',
};

// آدرس تصویر پس‌زمینه
const BACKGROUND_URL = "https://i.ibb.co/fJ7nmz8/qr.jpg";

export async function onRequest(context) {
  const { searchParams } = new URL(context.request.url);
  const link = searchParams.get('text');

  if (!link) {
    return new Response('لطفا پارامتر text را ارسال کنید', { status: 400 });
  }

  // ساخت QR
  const qrDataUrl = await QRCode.toDataURL(link, {
    width: 400,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#ffffff00',
    },
  });

  // ریسپانس تصویر OG
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          backgroundImage: `url(${BACKGROUND_URL})`,
          backgroundSize: 'cover',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <img
          src={qrDataUrl}
          style={{
            width: '450px',
            height: '450px',
            marginTop: '50px',
          }}
        />
      </div>
    ),
    {
      width: 1080,
      height: 1080,
    },
  );
}
