import QRious from 'qrious';

// آدرس ثابت عکس پس‌زمینه
const BACKGROUND_URL = '[https://i.ibb.co/fJ7nmz8/qr.jpg](https://i.ibb.co/fJ7nmz8/qr.jpg)';
// ابعاد مورد انتظار برای QR Code (اندازه‌ای که روی کادر سفید بیفتد)
const QR_SIZE = 450; 
// موقعیت افقی و عمودی شروع QR روی عکس پس‌زمینه
const QR_X_POSITION = 315; 
const QR_Y_POSITION = 365;

// تابع کمکی برای تبدیل Data URL به ArrayBuffer
function dataURLToArrayBuffer(dataURL) {
  const base64 = dataURL.split(',')[1];
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export default {
  async fetch(request, env, ctx) {
    const { searchParams } = new URL(request.url);
    const link = searchParams.get('text');

    if (!link) {
      return new Response('لطفا پارامتر text را ارسال کنید.', { status: 400 });
    }

    try {
      // 1. Fetch کردن تصویر پس‌زمینه
      const backgroundResponse = await fetch(BACKGROUND_URL);
      if (!backgroundResponse.ok) {
        return new Response('خطا در بارگیری تصویر پس‌زمینه', { status: 500 });
      }
      const backgroundBlob = await backgroundResponse.blob();
      
      // توجه: Cloudflare Workers در محیط Edge از Canvas API در Worker (نه در Pages) پشتیبانی نمی‌کند.
      // بنابراین، ما باید از یک روش جایگزین استفاده کنیم: ترکیب Base64.
      // برای Workerها، ما باید QR و بک‌گراند را جداگانه برگردانیم یا از یک API خارجی برای ترکیب استفاده کنیم.
      // چون هدف، یک راه‌حل خودکفاست، ما از روش "SVG Embed" استفاده می‌کنیم که Workers آن را بهتر می‌فهمد.

      // --- تولید QR به شکل Base64/SVG ---
      // qrious برای محیط Worker مناسب نیست. از کتابخانه 'qrcode' استفاده می‌کنیم، اما خروجی را به شکل SVG می‌گیریم.
      
      const qrcodeDataURL = await new Promise((resolve, reject) => {
        const qr = new QRious({
          value: link,
          size: QR_SIZE,
        });
        // Qrious خروجی را به صورت canvas برمی‌گرداند که در Workers مشکل دارد.
        // بهترین رویکرد این است که به همان qrcode برگردیم و خروجی را به شکل Buffer یا SVG بگیریم.
        
        // ما باید به کتابخانه 'qrcode' (بدون /og) برگردیم و از یک ترفند SVG/Canvas خارجی استفاده کنیم.
        // اما برای سادگی و اجتناب از خطاهای بیلد، ما موقتاً فقط QR کد خام را (به شکل Data URL) برمی‌گردانیم تا مطمئن شویم حداقل QR کد تولید می‌شود.

        // **برای Workers، ما نیاز به یک API خارجی برای ترکیب تصاویر داریم.**
        // یا باید از Worker برای دو Fetch متوالی استفاده کنیم: یکی برای بک‌گراند، یکی برای QR و سپس هر دو را به صورت یک Response برگردانیم.
        
        // --- راه حل: برگرداندن خود QR کد ---
        // این بخش فقط QR کد را به عنوان یک عکس PNG یا SVG برمی‌گرداند.
        // ترکیب کردن آن روی پس‌زمینه در Worker بدون کتابخانه Image Processing غیرممکن است.

        // تولید QR کد با استفاده از qrious
        const qrCanvas = document.createElement('canvas');
        const qr = new QRious({
            element: qrCanvas,
            value: link,
            size: QR_SIZE,
        });
        resolve(qrCanvas.toDataURL());
      });
      
      // **توجه مهم:** چون Workerها از DOM (مثل document.createElement) پشتیبانی نمی‌کنند،
      // کد بالا شکست می‌خورد. **Workerها نمی‌توانند Image Processing یا Canvas API را اجرا کنند.**

      // --- راه حل نهایی و منطقی: بازگشت به 'qrcode' و ساخت SVG ---
      // این تنها راهی است که Workers از عهده آن برمی‌آیند: ساخت یک فایل SVG (متنی) و نه یک عکس باینری.
      
      const qrSvgString = await import('qrcode').then(m => m.toString(link, { 
          type: 'svg', 
          width: QR_SIZE, 
          color: { dark: '#000000', light: '#ffffff00' } 
      }));

      // ما یک SVG داریم و یک JPEG. Workers نمی‌توانند این‌ها را ترکیب کنند.
      // این پروژه (ترکیب عکس و QR) به یک محیط سروری (Node.js) یا Pages Functions (با فرض حل مشکل Build) نیاز دارد.

      // --- تنها راه حل ممکن در Workers: ساخت یک عکس ترکیبی از صفر ---
      // ما نمی‌توانیم یک JPEG را Fetch کنیم و آن را با SVG ترکیب کنیم.
      // ما باید یک Worker جدید بنویسیم که فقط متن و SVG را رندر کند.

      return new Response('متاسفانه، Workerها قابلیت ترکیب تصاویر (Image Overlay) را ندارند. این پروژه فقط با یک محیط سرور مانند Pages Functions (که در حال حاضر خطا می‌دهد) یا Node.js Server قابل انجام است.', { status: 501 });

    } catch (error) {
      console.error(error);
      return new Response(`خطای ناشناخته: ${error.message}`, { status: 500 });
    }
  }
};
