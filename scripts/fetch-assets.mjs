import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");

const assets = {
  "lib/vision_bundle.mjs": "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/vision_bundle.mjs",
  "lib/wasm/vision_wasm_internal.js": "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm/vision_wasm_internal.js",
  "lib/wasm/vision_wasm_internal.wasm": "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm/vision_wasm_internal.wasm",
  "lib/moonshine.min.js": "https://cdn.jsdelivr.net/npm/@moonshine-ai/moonshine-js@0.1.29/dist/moonshine.min.js",
  "lib/ort/ort-wasm-simd-threaded.jsep.mjs": "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/ort-wasm-simd-threaded.jsep.mjs",
  "lib/ort/ort-wasm-simd-threaded.jsep.wasm": "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/ort-wasm-simd-threaded.jsep.wasm",
  "models/moonshine-base/quantized/encoder_model.onnx": "https://download.moonshine.ai/model/base/quantized/encoder_model.onnx",
  "models/moonshine-base/quantized/decoder_model_merged.onnx": "https://download.moonshine.ai/model/base/quantized/decoder_model_merged.onnx",
  "models/selfie_segmenter.tflite": "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite",
  "models/hand_landmarker.task": "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task",
};

let failed = 0;
for (const [rel, url] of Object.entries(assets)) {
  const file = path.join(root, rel);
  if (fs.existsSync(file) && fs.statSync(file).size > 0) {
    console.log(`skip  ${rel}`);
    continue;
  }
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file + ".part", buf);
    fs.renameSync(file + ".part", file);
    console.log(`ok    ${rel}  ${(buf.length / 1e6).toFixed(2)} MB`);
  } catch (err) {
    failed++;
    console.error(`FAIL  ${rel}  ${url}  ${err.message}`);
  }
}
if (failed) {
  console.error(`${failed} file(s) failed`);
  process.exit(1);
}
