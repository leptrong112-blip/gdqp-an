import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";

const WEBSITE_URL = "https://gdqp-an.gdqp-3d.workers.dev/";
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const publicDirectory = resolve(scriptDirectory, "..", "public");

await mkdir(publicDirectory, { recursive: true });

const options = {
  errorCorrectionLevel: "H",
  margin: 4,
  width: 1024,
  color: {
    dark: "#020617",
    light: "#ffffff",
  },
};

await Promise.all([
  QRCode.toFile(resolve(publicDirectory, "qr-gdqp-an.png"), WEBSITE_URL, {
    ...options,
    type: "png",
  }),
  QRCode.toFile(resolve(publicDirectory, "qr-gdqp-an.svg"), WEBSITE_URL, {
    ...options,
    type: "svg",
  }),
]);

console.log(`Generated QR code for ${WEBSITE_URL}`);
