export const MAX_RECORD_MS = 180_000;

const TYPES = ["video/mp4;codecs=avc1,mp4a.40.2", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm"];

export function startRecording(canvas, audioTrack, onDone) {
  const stream = canvas.captureStream(30);
  if (audioTrack) stream.addTrack(audioTrack);
  const mimeType = TYPES.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
  const rec = new MediaRecorder(stream, { ...(mimeType && { mimeType }), videoBitsPerSecond: 6_000_000 });
  const chunks = [];
  const stop = () => rec.state !== "inactive" && rec.stop();
  const timer = setTimeout(stop, MAX_RECORD_MS);

  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  rec.onstop = () => {
    clearTimeout(timer);
    stream.getVideoTracks().forEach((t) => t.stop());
    const type = rec.mimeType || mimeType || "video/webm";
    onDone({ blob: new Blob(chunks, { type }), ext: type.includes("mp4") ? "mp4" : "webm" });
  };
  rec.start(1000);
  return { stop, startedAt: performance.now() };
}
