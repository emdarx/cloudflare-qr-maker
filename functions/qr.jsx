import { ImageResponse } from "@vercel/og";
import QRCode from "qrcode";

export const config = {
  runtime: "edge",
};

export default async function handler(request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text") || "EMPTY";

  // ساخت بارکد به‌صورت dataURL
  const qrDataURL = await QRCode.toDataURL(text, {
    margin: 1,
    scale: 8,
    color: {
      dark: "#000000",
      light: "#ffffff00"
    }
  });

  // گرفتن پس‌زمینه از پوشه public
  const bgURL = new URL("/qr-background.jpg", request.url).toString();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        {/* پس‌زمینه */}
        <img
          src={bgURL}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover"
          }}
        />

        {/* تصویر QR روی پس‌زمینه */}
        <img
          src={qrDataURL}
          width={400}
          height={400}
          style={{
            zIndex: 10,
          }}
        />
      </div>
    ),
    {
      width: 1080,
      height: 1080,
    }
  );
}
