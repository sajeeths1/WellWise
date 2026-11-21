import { copyFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
const require = createRequire(import.meta.url);
const destination = new URL("../public/ocr/", import.meta.url);
await mkdir(destination, { recursive: true });
const assets = [
  ["tesseract.js", "dist/worker.min.js"],
  ["tesseract.js-core", "tesseract-core-lstm.wasm.js"],
  ["@tesseract.js-data/eng", "4.0.0_best_int/eng.traineddata.gz"],
];
for (const [pkg, path] of assets) {
  const root = dirname(require.resolve(pkg + "/package.json"));
  await copyFile(join(root, path), new URL(path.split("/").pop(), destination));
}
