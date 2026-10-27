export const PRESETS = [
  {
    id: "trinitron",
    name: "Trinitron",
    curvature: 0.5, scanlines: 0.35, scanDensity: 0.7, aberration: 0.3, noise: 0.05, flicker: 0.1, vignette: 0.6,
    saturation: 1.1, tint: "#ffd9a0", tintAmount: 0.08, pixelate: 0, tracking: 0, jitter: 0.1, brightness: 1.1, contrast: 1.1,
    background: "#0b0b0e", textColor: "#f3ebdd", textFont: "JetBrains Mono", textScale: 1,
    sparkColor: "#2ec4b6", sparkChars: "*+·:", trace: 0.12,
  },
  {
    id: "vhs",
    name: "VHS Tape",
    curvature: 0.25, scanlines: 0.2, scanDensity: 0.5, aberration: 1.4, noise: 0.25, flicker: 0.15, vignette: 0.4,
    saturation: 0.75, tint: "#ff9ad5", tintAmount: 0.1, pixelate: 0, tracking: 0.7, jitter: 0.8, brightness: 1.05, contrast: 0.95,
    background: "#10081a", textColor: "#fff27a", textFont: "VT323", textScale: 1.4,
    sparkColor: "#ff4fd8", sparkChars: "▶■●▲", trace: 0.25,
  },
  {
    id: "noir",
    name: "Noir B/W",
    curvature: 0.4, scanlines: 0.3, scanDensity: 0.8, aberration: 0, noise: 0.5, flicker: 0.6, vignette: 1,
    saturation: 0, tint: "#ffffff", tintAmount: 0, pixelate: 0, tracking: 0, jitter: 0.2, brightness: 1, contrast: 1.35,
    background: "#000000", textColor: "#ffffff", textFont: "JetBrains Mono", textScale: 0.9,
    sparkColor: "#ffffff", sparkChars: "✦·•", trace: 0.2,
  },
  {
    id: "phosphor",
    name: "Arcade Phosphor",
    curvature: 0.6, scanlines: 0.8, scanDensity: 0.45, aberration: 0.2, noise: 0.08, flicker: 0.2, vignette: 0.7,
    saturation: 1, tint: "#39ff7a", tintAmount: 0.85, pixelate: 0.35, tracking: 0, jitter: 0, brightness: 1.35, contrast: 1.2,
    background: "#020a04", textColor: "#b8ffcc", textFont: "VT323", textScale: 1.3,
    sparkColor: "#39ff7a", sparkChars: "01", trace: 0.1,
  },
];

export const PICTURE_CONTROLS = [
  { key: "curvature", label: "Curvature", min: 0, max: 1, step: 0.01 },
  { key: "scanlines", label: "Scanlines", min: 0, max: 1, step: 0.01 },
  { key: "scanDensity", label: "Scanline density", min: 0.2, max: 1, step: 0.01 },
  { key: "aberration", label: "Colour bleed", min: 0, max: 2, step: 0.01 },
  { key: "noise", label: "Grain", min: 0, max: 1, step: 0.01 },
  { key: "flicker", label: "Flicker", min: 0, max: 1, step: 0.01 },
  { key: "vignette", label: "Vignette", min: 0, max: 1, step: 0.01 },
  { key: "saturation", label: "Colour", min: 0, max: 2, step: 0.01 },
  { key: "tintAmount", label: "Tint strength", min: 0, max: 1, step: 0.01 },
  { key: "pixelate", label: "Pixelate", min: 0, max: 1, step: 0.01 },
  { key: "tracking", label: "Tape tracking", min: 0, max: 1, step: 0.01 },
  { key: "jitter", label: "Jitter", min: 0, max: 1, step: 0.01 },
  { key: "brightness", label: "Brightness", min: 0.5, max: 1.6, step: 0.01 },
  { key: "contrast", label: "Contrast", min: 0.5, max: 1.8, step: 0.01 },
];

export const CONTENT_CONTROLS = [
  { key: "textScale", label: "Word size", min: 0.6, max: 2.2, step: 0.01 },
  { key: "trace", label: "Camera trace", min: 0, max: 1, step: 0.01 },
];

export const COLOR_CONTROLS = [
  { key: "tint", label: "Tint" },
  { key: "background", label: "Background" },
  { key: "textColor", label: "Words" },
  { key: "sparkColor", label: "Sparks" },
];

export const FONTS = ["JetBrains Mono", "VT323"];

const STORE_KEY = "made-of-words.custom-styles";

export function loadCustomStyles() {
  try {
    const list = JSON.parse(localStorage.getItem(STORE_KEY) ?? "[]");
    return Array.isArray(list) ? list.map((s) => ({ ...PRESETS[0], ...s, custom: true })) : [];
  } catch {
    return [];
  }
}

export function saveCustomStyles(list) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(list));
  } catch {}
}
