import * as Moonshine from "./lib/moonshine.min.js";

Moonshine.Settings.BASE_ASSET_PATH.MOONSHINE = new URL("./models/", self.location).href;
Moonshine.Settings.BASE_ASSET_PATH.ONNX_RUNTIME = new URL("./lib/ort/", self.location).href;

let model = null;

self.onmessage = async (e) => {
  const m = e.data;
  try {
    if (m.type === "load") {
      const t0 = performance.now();
      model = new Moonshine.MoonshineModel(m.model);
      await model.loadModel();
      self.postMessage({ type: "loaded", ms: Math.round(performance.now() - t0), coi: self.crossOriginIsolated });
    } else if (m.type === "gen") {
      const t0 = performance.now();
      const text = await model.generate(m.audio);
      self.postMessage({ type: "text", id: m.id, text: text || "", ms: Math.round(performance.now() - t0), final: m.final });
    }
  } catch (err) {
    self.postMessage({ type: "error", error: String((err && err.stack) || err) });
  }
};
