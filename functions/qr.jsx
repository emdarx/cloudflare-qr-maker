import { QRCodeCanvas } from 'qrcode.react'; // ما از کتابخانه qrcode.react استفاده می‌کنیم
import ReactDOMServer from 'react-dom/server';
import { Buffer } from 'buffer';
import sharp from 'sharp';

// بک‌گراند پیش‌فرض (اگر کاربر نذاشت)
const BACKGROUND_PATH = '/qr-background.jpg';

export const onRequestGet = async ({ request, env, params }) => {
  const url = new URL(request.url);
  const text = url.searchParams.get('text') || url.searchParams.get('t');

  if (!text) {
    return new Response('❌ پارامتر text یا t الزامی است\nمثال: /qr?text=سلام', {
      status: 400,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  // تنظیمات QR Code
  const qrSize = 512;
  const margin = 30; // حاشیه سفید دور QR

  // تولید SVG از QR Code با qrcode.react
  const qrSvg = ReactDOMServer.renderToStaticMarkup(
    <QRCodeCanvas
      value={text}
      size={qrSize}
      level="H"
      imageSettings={{
        src: '', // می‌تونی لوگوی وسط QR هم بذاری
        height: 80,
        width: 80,
        excavate: true,
        opacity: 1,
      }}
      fgColor="#000000"
      bgColor="#ffffff"
      includeMargin={false}
    />
  );

  // تبدیل SVG به PNG با sharp
  const qrBuffer = await sharp(Buffer.from(qrSvg))
    .png()
    .toBuffer();

  // دریافت بک‌گراند (از public)
  const backgroundUrl = BACKGROUND_PATH;
  const bgResponse = await fetch(`${url.origin}${backgroundUrl}`);
  if (!bgResponse.ok) {
    return new Response('بک‌گراند پیدا نشد: public' + backgroundUrl, { status: 404 });
  }
  const bgBuffer = Buffer.from(await bgResponse.arrayBuffer());

  // ترکیب QR روی بک‌گراند (وسط چین)
  const finalImage = await sharp(bgBuffer)
    .composite([
      {
        input: qrBuffer,
        gravity: 'centre', // دقیقاً وسط تصویر
        // اگر بخوای کمی بالاتر یا پایین‌تر بذاری می‌تونی از top/left استفاده کنی
      },
    ])
    .png() // یا .jpeg() اگر بک‌گراندت jpg هست
    .toBuffer();

  return new Response(finalImage, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
