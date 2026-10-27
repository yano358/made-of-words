import { createTv } from "./tvShader.js";

export const SCENE_W = 960;
export const SCENE_H = 720;

const VISION_BUNDLE = "/lib/vision_bundle.mjs";
const BARS = ["#c0c0c0", "#c0c000", "#00c0c0", "#00c000", "#c000c0", "#c00000", "#0000c0"];
const FINGERTIPS = [4, 8, 12, 16, 20];
const join = (chunks) => {
  const a = new Float32Array(chunks.length * 320);
  chunks.forEach((c, i) => a.set(c, i * 320));
  return a;
};

function cropFor(w, h) {
  const cw = Math.min(w, (h * 4) / 3);
  const ch = Math.min(h, (w * 3) / 4);
  return { x: (w - cw) / 2 / w, y: (h - ch) / 2 / h, w: cw / w, h: ch / h };
}

export function createEngine(canvas, { onStatus, onTranscript }) {
  const tv = createTv(canvas, SCENE_W, SCENE_H);
  const scene = document.createElement("canvas");
  scene.width = SCENE_W;
  scene.height = SCENE_H;
  const ctx = scene.getContext("2d");
  const text = new OffscreenCanvas(SCENE_W, SCENE_H);
  const tctx = text.getContext("2d");
  const mask = new OffscreenCanvas(1, 1);
  const mctx = mask.getContext("2d");
  let maskImg = null;

  let style = null;
  let status = { camera: "off", vision: "idle", speech: "idle", error: null };
  const setStatus = (patch) => {
    status = { ...status, ...patch };
    onStatus?.(status);
  };

  let vision = null;
  let visionLoading = null;
  let asr = null;
  let asrReady = false;
  let busy = false;
  let waiting = null;
  let heard = [];
  let partial = [];

  let session = null;
  let run = 0;
  let sparks = [];
  let level = 0;
  const stats = { fps: 0 };
  let fpsCount = 0;
  let fpsAt = performance.now();

  document.fonts.load('700 20px "JetBrains Mono"');
  document.fonts.load('20px "VT323"');

  const post = (chunks, final) => {
    busy = true;
    asr.postMessage({ type: "gen", id: Date.now(), audio: join(chunks), final });
  };

  function startSpeech() {
    if (asr) return;
    setStatus({ speech: "loading" });
    asr = new Worker("/asr-worker.js", { type: "module" });
    asr.onmessage = ({ data }) => {
      if (data.type === "loaded") {
        asrReady = true;
        setStatus({ speech: "ready" });
        return;
      }
      if (data.type === "error") {
        busy = false;
        if (!asrReady) setStatus({ speech: "error", error: data.error.split("\n")[0] });
        else console.error(data.error);
        return;
      }
      if (data.type !== "text") return;
      busy = false;
      if (waiting) {
        post(waiting, true);
        waiting = null;
      }
      const words = data.text.trim().split(/\s+/).filter(Boolean);
      if (data.final) {
        heard = heard.concat(words).slice(-80);
        partial = [];
      } else partial = words;
      onTranscript?.({ heard, partial });
    };
    asr.postMessage({ type: "load", model: "moonshine-base" });
  }

  function loadVision() {
    visionLoading ??= (async () => {
      setStatus({ vision: "loading" });
      const { FilesetResolver, ImageSegmenter, HandLandmarker } = await import(/* @vite-ignore */ VISION_BUNDLE);
      const files = await FilesetResolver.forVisionTasks("/lib/wasm");
      const segmenter = await ImageSegmenter.createFromOptions(files, {
        baseOptions: { modelAssetPath: "/models/selfie_segmenter.tflite", delegate: "GPU" },
        runningMode: "VIDEO",
        outputConfidenceMasks: true,
        outputCategoryMask: false,
      });
      const hands = await HandLandmarker.createFromOptions(files, {
        baseOptions: { modelAssetPath: "/models/hand_landmarker.task", delegate: "GPU" },
        runningMode: "VIDEO",
        numHands: 2,
      });
      vision = { segmenter, hands };
      setStatus({ vision: "ready" });
    })().catch((err) => {
      visionLoading = null;
      setStatus({ vision: "error" });
      throw err;
    });
    return visionLoading;
  }

  async function startAudio(s) {
    const audio = new AudioContext();
    s.audio = audio;
    await audio.resume();
    await audio.audioWorklet.addModule("/capture-worklet.js");
    const capture = new AudioWorkletNode(audio, "capture-16k");
    const mute = audio.createGain();
    mute.gain.value = 0;
    audio.createMediaStreamSource(s.stream).connect(capture).connect(mute).connect(audio.destination);

    let floor = 0.01;
    let pre = [];
    let line = null;
    let quiet = 0;
    let lastSend = 0;
    const send = (final) => {
      lastSend = performance.now();
      if (!busy) post(line, final);
      else if (final) waiting = line;
    };
    capture.port.onmessage = ({ data: { pcm, rms } }) => {
      level = Math.max(rms, level * 0.9);
      floor = rms < floor ? rms : floor + (rms - floor) * 0.002;
      const voiced = rms > Math.max(0.006, floor * 2.5);
      if (!line) {
        pre.push(pcm);
        if (pre.length > 15) pre.shift();
        if (voiced && asrReady) {
          line = pre;
          pre = [];
          quiet = 0;
        }
        return;
      }
      line.push(pcm);
      quiet = voiced ? 0 : quiet + 0.02;
      if (quiet > 0.8 || line.length > 500) {
        send(true);
        line = null;
      } else if (performance.now() - lastSend > 400) send(false);
    };
  }

  function teardown(s) {
    s.stream?.getTracks().forEach((t) => t.stop());
    s.audio?.close();
    if (s.video) s.video.srcObject = null;
  }

  async function start() {
    const id = ++run;
    const s = {};
    session = s;
    setStatus({ camera: "loading", error: null });
    try {
      s.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      if (id !== run) return teardown(s);
      s.video = document.createElement("video");
      s.video.srcObject = s.stream;
      s.video.muted = true;
      s.video.playsInline = true;
      await s.video.play();
      startSpeech();
      await startAudio(s);
      await loadVision();
      if (id !== run) return teardown(s);
      s.crop = cropFor(s.video.videoWidth, s.video.videoHeight);
      const onFrame = () => {
        s.fresh = true;
        if (session === s) s.video.requestVideoFrameCallback(onFrame);
      };
      s.video.requestVideoFrameCallback(onFrame);
      s.ready = true;
      setStatus({ camera: "on" });
    } catch (err) {
      teardown(s);
      if (id === run) {
        session = null;
        setStatus({ camera: "error", error: err?.message || String(err) });
      }
    }
  }

  function stop() {
    run++;
    if (session) teardown(session);
    session = null;
    sparks = [];
    level = 0;
    setStatus({ camera: "off", error: null });
  }

  function drawMirrored(target, src, sw, sh, crop) {
    target.save();
    target.translate(SCENE_W, 0);
    target.scale(-1, 1);
    target.drawImage(src, crop.x * sw, crop.y * sh, crop.w * sw, crop.h * sh, 0, 0, SCENE_W, SCENE_H);
    target.restore();
  }

  function compose() {
    const { video, crop } = session;
    const now = performance.now();

    const seg = vision.segmenter.segmentForVideo(video, now);
    const m = seg.confidenceMasks[0];
    if (mask.width !== m.width || mask.height !== m.height) {
      mask.width = m.width;
      mask.height = m.height;
      maskImg = new ImageData(m.width, m.height);
    }
    const conf = m.getAsFloat32Array();
    for (let i = 0; i < conf.length; i++) maskImg.data[i * 4 + 3] = conf[i] * 255;
    seg.close();
    mctx.putImageData(maskImg, 0, 0);

    const size = Math.round((SCENE_H / 34) * style.textScale);
    const words = heard.concat(partial).slice(-24);
    const line = (words.length ? words.join(" ") : asrReady ? "say something" : "tuning in") + "  ";
    tctx.globalCompositeOperation = "source-over";
    tctx.clearRect(0, 0, SCENE_W, SCENE_H);
    tctx.fillStyle = style.textColor;
    tctx.font = `700 ${size}px "${style.textFont}", monospace`;
    tctx.textBaseline = "top";
    const repeated = line.repeat(Math.ceil((SCENE_W * 3) / tctx.measureText(line).width) + 1);
    for (let y = 0, r = 0; y < SCENE_H; y += size * 1.15, r++) tctx.fillText(repeated, -((r * 137) % SCENE_W), y);
    tctx.globalCompositeOperation = "destination-in";
    drawMirrored(tctx, mask, mask.width, mask.height, crop);

    ctx.fillStyle = style.background;
    ctx.fillRect(0, 0, SCENE_W, SCENE_H);
    ctx.globalAlpha = style.trace;
    drawMirrored(ctx, video, video.videoWidth, video.videoHeight, crop);
    ctx.globalAlpha = 1;
    ctx.drawImage(text, 0, 0);

    const glyphs = [...(style.sparkChars || "*")];
    const h = vision.hands.detectForVideo(video, now);
    for (const hand of h.landmarks) {
      for (const k of FINGERTIPS) {
        const px = (hand[k].x - crop.x) / crop.w;
        const py = (hand[k].y - crop.y) / crop.h;
        if (px < 0 || px > 1 || py < 0 || py > 1) continue;
        sparks.push({
          x: (1 - px) * SCENE_W,
          y: py * SCENE_H,
          vx: (Math.random() - 0.5) * 3,
          vy: -1 - Math.random() * 2,
          life: 1,
          ch: glyphs[(Math.random() * glyphs.length) | 0],
        });
      }
    }
    ctx.fillStyle = style.sparkColor;
    ctx.textAlign = "center";
    for (const s of sparks) {
      s.x += s.vx;
      s.y += s.vy;
      s.life -= 0.03;
      ctx.globalAlpha = Math.max(0, s.life);
      ctx.font = `700 ${Math.round(size * (0.6 + s.life * 0.6))}px "${style.textFont}", monospace`;
      ctx.fillText(s.ch, s.x, s.y);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = "start";
    sparks = sparks.filter((s) => s.life > 0);

    fpsCount++;
    if (now - fpsAt >= 1000) {
      stats.fps = Math.round((fpsCount * 1000) / (now - fpsAt));
      fpsCount = 0;
      fpsAt = now;
    }
  }

  function drawIdle() {
    const label = { loading: "WARMING UP", error: "NO SIGNAL" }[status.camera] ?? "PRESS POWER";
    const barW = SCENE_W / BARS.length;
    BARS.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.fillRect(i * barW, 0, Math.ceil(barW), SCENE_H * 0.7);
    });
    BARS.toReversed().forEach((c, i) => {
      ctx.fillStyle = i % 2 ? "#101010" : c;
      ctx.fillRect(i * barW, SCENE_H * 0.7, Math.ceil(barW), SCENE_H * 0.08);
    });
    ["#00214c", "#ffffff", "#32006a", "#131313"].forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.fillRect((i * SCENE_W) / 4, SCENE_H * 0.78, Math.ceil(SCENE_W / 4), SCENE_H * 0.22);
    });
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(SCENE_W * 0.18, SCENE_H * 0.36, SCENE_W * 0.64, SCENE_H * 0.2);
    ctx.fillStyle = style.textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${SCENE_H / 9}px "VT323", monospace`;
    ctx.fillText(label, SCENE_W / 2, SCENE_H * 0.46);
    if (status.error) {
      ctx.font = `${SCENE_H / 26}px "VT323", monospace`;
      ctx.fillText(status.error.slice(0, 70), SCENE_W / 2, SCENE_H * 0.85);
    }
    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";
  }

  let raf = 0;
  const loop = (t) => {
    raf = requestAnimationFrame(loop);
    if (!style) return;
    if (session?.ready) {
      if (session.fresh) {
        session.fresh = false;
        compose();
      }
    } else drawIdle();
    tv.render(scene, style, t / 1000);
    level *= 0.97;
  };
  raf = requestAnimationFrame(loop);

  return {
    start,
    stop,
    setStyle: (s) => {
      style = s;
    },
    get level() {
      return level;
    },
    get fps() {
      return session?.ready ? stats.fps : 0;
    },
    get audioTrack() {
      return session?.stream?.getAudioTracks()[0] ?? null;
    },
    destroy() {
      cancelAnimationFrame(raf);
      stop();
      asr?.terminate();
    },
  };
}
