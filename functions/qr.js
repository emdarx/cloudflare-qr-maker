// functions/qr.js (نام فایل رو تغییر بده)
import { toDataURL } from 'qrcode';

// این کتابخانه خالص JS هست و روی Workers عالی کار می‌کنه
export async function onRequestGet(context) {  // تغییر به onRequestGet
  const { request } = context;
  const url = new URL(request.url);
  const text = url.searchParams.get('text') || url.searchParams.get('t') || 'https://example.com';

  try {
    // تولید QR Code به صورت DataURL (PNG)
    const qrDataUrl = await toDataURL(text, {
      width: 800,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    });

    // استخراج base64 از dataURL
    const base64 = qrDataUrl.replace(/^data:image\/png;base64,/, '');

    // تبدیل base64 به Buffer
    const qrBuffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

    // دریافت بک‌گراند از public/qr-background.jpg
    const bgResponse = await fetch(new URL('/qr-background.jpg', request.url));
    if (!bgResponse.ok) {
      // اگر بک‌گراند نبود، فقط QR رو نشون بده
      return new Response(qrBuffer, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    const bgArrayBuffer = await bgResponse.arrayBuffer();
    const bgBuffer = new Uint8Array(bgArrayBuffer);

    // ترکیب QR روی بک‌گراند
    // نکته: اگر @cf-wasm/imaging کار نکرد، جایگزین کن با @cf-wasm/png یا sharp (با nodejs_compat)
    const { Image } = await import('@cf-wasm/imaging');  // اگر error داد، پکیج رو چک کن

    const background = await Image.fromArrayBuffer(bgBuffer);
    const qrImage = await Image.fromArrayBuffer(qrBuffer);

    // تغییر اندازه QR به ۵۵۰x۵۵۰
    qrImage.resize(550, 550);

    // قرار دادن QR در مرکز
    background.composite(qrImage, {
      top: (background.height - 550) / 2,
      left: (background.width - 550) / 2,
    });

    const finalBuffer = await background.encode('png');

    return new Response(finalBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e) {
    return new Response('خطا در تولید QR: ' + e.message, { status: 500 });
  }
};
