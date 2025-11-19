import { createCanvas, loadImage } from '@napi-rs/canvas';
import QRCode from 'qrcode';

export async function onRequest(context) {
  const { searchParams } = new URL(context.request.url);
  const text = searchParams.get("text");

  if (!text) {
    return new Response("پارامتر text لازم است", { status: 400 });
  }

  // 1. ساخت QR بصورت DataURL
  const qrDataUrl = await QRCode.toDataURL(text, {
    width: 400,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#ffffff00'
    }
  });

  // 2. لود بک‌گراند از URL
  const background = await loadImage("https://i.ibb.co/fJ7nmz8/qr.jpg");

  // 3. ساخت Canvas
  const width = 1080;
  const height = 1080;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // 4. کشیدن بک‌گراند
  ctx.drawImage(background, 0, 0, width, height);

  // 5. لود QR Code
  const qr = await loadImage(qrDataUrl);

  // 6. کشیدن QR روی بک‌گراند
  ctx.drawImage(qr, 315, 315, 450, 450);

  // 7. خروجی JPG
  const jpg = canvas.toBuffer("image/jpeg");

  return new Response(jpg, {
    headers: {
      "Content-Type": "image/jpeg"
    }
  });
}
