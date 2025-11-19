import { Image, ImageData } from "imagescript";
import QRCode from "qrcode-generator";

export async function onRequest(context) {
  const { searchParams } = new URL(context.request.url);

  const text = searchParams.get("text");
  if (!text) {
    return new Response("پارامتر text لازم است", { status: 400 });
  }

  // 1. ساخت QR
  const qr = QRCode(6, "M");
  qr.addData(text);
  qr.make();

  const size = qr.getModuleCount();
  const scale = 10;

  const qrImage = new Image(size * scale, size * scale);
  const data = new Uint8Array(size * size * 4 * scale * scale);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const v = qr.isDark(y, x) ? 0 : 255;

      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const px = (y * scale + dy) * (size * scale) + (x * scale + dx);
          const i = px * 4;

          data[i] = v;
          data[i + 1] = v;
          data[i + 2] = v;
          data[i + 3] = 255;
        }
      }
    }
  }

  qrImage.data = new ImageData(data, size * scale, size * scale);

  // 2. لود بک‌گراند از URL
  const bgReq = await fetch("https://i.ibb.co/fJ7nmz8/qr.jpg");
  const bgBuffer = await bgReq.arrayBuffer();
  const background = await Image.decode(bgBuffer);

  // 3. ترکیب QR روی بک‌گراند
  background.composite(qrImage, 315, 315);

  // 4. خروجی JPG
  const output = await background.encodeJPEG(90);

  return new Response(output, {
    headers: {
      "Content-Type": "image/jpeg",
    },
  });
}
