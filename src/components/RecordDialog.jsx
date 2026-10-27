import { useEffect, useRef, useState } from "react";

const stamp = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
};

export default function RecordDialog({ recording, onClose }) {
  const ref = useRef(null);
  const [url] = useState(() => URL.createObjectURL(recording.blob));

  useEffect(() => {
    if (!ref.current.open) ref.current.showModal();
  }, []);

  const close = () => {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    onClose();
  };

  const download = () => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `made-of-words-${stamp()}.${recording.ext}`;
    a.click();
    close();
  };

  return (
    <dialog ref={ref} className="record-dialog" onCancel={close}>
      <h2>Tape's done</h2>
      <video src={url} controls playsInline />
      <p className="hint">
        {(recording.blob.size / 1e6).toFixed(1)} MB · {recording.ext.toUpperCase()}
      </p>
      <div className="btn-row">
        <button className="tv-btn" onClick={close}>
          Discard
        </button>
        <button className="tv-btn primary" onClick={download} autoFocus>
          Download
        </button>
      </div>
    </dialog>
  );
}
