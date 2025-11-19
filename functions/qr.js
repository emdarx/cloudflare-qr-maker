// functions/qr.js
import { toDataURL } from 'qrcode';
import { PhotonImage, open_image, putImageData } from '@cf-wasm/photon';

export const onRequestGet = async ({ request }) => {  // تغییر به onRequestGet برای GET
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
      return new Response(qrBuffer, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    const bgArrayBuffer = await bgResponse.arrayBuffer();
    const bgBuffer = new Uint8Array(bgArrayBuffer);

    // استفاده از Photon برای ترکیب تصاویر
    const background = open_image(bgBuffer);  // باز کردن بک‌گراند
    const qrImage = open_image(qrBuffer);    // باز کردن QR

    // تغییر اندازه QR به 550x550
    qrImage.resize(550, 550, 1);  // 1 = Lanczos3 sampling

    // قرار دادن QR در مرکز بک‌گراند
    const top = (background.get_height() - 550) / 2;
    const left = (background.get_width() - 550) / 2;
    background.put_image(qrImage, left, top);

    // انکود نهایی به PNG
    const finalBuffer = background.get_bytes_png();

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
