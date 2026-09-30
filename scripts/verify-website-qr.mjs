import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import jsQR from "jsqr";
import { PNG } from "pngjs";

const EXPECTED_URL = "https://gdqp-an.gdqp-3d.workers.dev/";
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const qrPath = resolve(scriptDirectory, "..", "public", "qr-gdqp-an.png");
const png = PNG.sync.read(await readFile(qrPath));
const result = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);

if (!result) {
  throw new Error("Không thể giải mã tệp QR đã tạo.");
}

if (result.data !== EXPECTED_URL) {
  throw new Error(`QR trỏ sai địa chỉ: ${result.data}`);
}

console.log(`QR verified: ${result.data}`);
