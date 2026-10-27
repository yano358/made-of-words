import { useEffect, useState } from "react";
import Drawer from "./Drawer.jsx";

const ROWS = [
  ["camera", "Camera & mic"],
  ["vision", "Cut-out + hands"],
  ["speech", "Speech (Moonshine)"],
];

export default function InfoDrawer({ open, onClose, status, transcript, engineRef }) {
  const [fps, setFps] = useState(0);

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setFps(engineRef.current?.fps ?? 0), 1000);
    return () => clearInterval(id);
  }, [open, engineRef]);

  return (
    <Drawer side="left" title="Info" open={open} onClose={onClose}>
      <section>
        <h3>Status</h3>
        <dl className="status">
          {ROWS.map(([key, label]) => (
            <div key={key}>
              <dt>{label}</dt>
              <dd data-state={status[key]}>{status[key]}</dd>
            </div>
          ))}
          <div>
            <dt>Frames / s</dt>
            <dd>{fps}</dd>
          </div>
        </dl>
        {status.error && <p className="error">{status.error}</p>}
      </section>
      <section>
        <h3>Transcript</h3>
        <p className="transcript">
          {transcript.heard.join(" ")} <span className="partial">{transcript.partial.join(" ")}</span>
          {!transcript.heard.length && !transcript.partial.length && <span className="hint">Nothing heard yet.</span>}
        </p>
      </section>
    </Drawer>
  );
}
