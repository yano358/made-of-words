import { useEffect, useRef, useState } from "react";
import { createEngine } from "./engine/pipeline.js";
import { MAX_RECORD_MS, startRecording } from "./engine/recorder.js";
import { PRESETS, loadCustomStyles, saveCustomStyles } from "./styles/presets.js";
import TvSet from "./components/TvSet.jsx";
import TweakDrawer from "./components/TweakDrawer.jsx";
import InfoDrawer from "./components/InfoDrawer.jsx";
import RecordDialog from "./components/RecordDialog.jsx";

export default function App() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const recRef = useRef(null);

  const [status, setStatus] = useState({ camera: "off", vision: "idle", speech: "idle", error: null });
  const [transcript, setTranscript] = useState({ heard: [], partial: [] });
  const [customs, setCustoms] = useState(loadCustomStyles);
  const [activeId, setActiveId] = useState(PRESETS[0].id);
  const [draft, setDraft] = useState(PRESETS[0]);
  const [panel, setPanel] = useState(null);
  const [recElapsed, setRecElapsed] = useState(null);
  const [recording, setRecording] = useState(null);

  const styles = [...PRESETS, ...customs];
  const active = styles.find((s) => s.id === activeId) ?? PRESETS[0];

  useEffect(() => {
    const engine = createEngine(canvasRef.current, { onStatus: setStatus, onTranscript: setTranscript });
    engineRef.current = engine;
    return () => engine.destroy();
  }, []);

  useEffect(() => engineRef.current?.setStyle(draft), [draft]);
  useEffect(() => saveCustomStyles(customs), [customs]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setPanel(null);
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  const selectStyle = (style) => {
    setActiveId(style.id);
    setDraft(style);
  };

  const nextStyle = (dir = 1) => {
    const i = styles.findIndex((s) => s.id === activeId);
    selectStyle(styles[(i + dir + styles.length) % styles.length]);
  };

  const editStyle = (key, value) => {
    const next = { ...draft, [key]: value };
    setDraft(next);
    if (next.custom) setCustoms((list) => list.map((s) => (s.id === next.id ? next : s)));
  };

  const saveAs = (name) => {
    const style = { ...draft, id: crypto.randomUUID(), name, custom: true };
    setCustoms((list) => [...list, style]);
    selectStyle(style);
  };

  const deleteStyle = (id) => {
    setCustoms((list) => list.filter((s) => s.id !== id));
    if (id === activeId) selectStyle(PRESETS[0]);
  };

  const stopRecording = () => recRef.current?.stop();

  const toggleRecording = () => {
    if (recRef.current) return stopRecording();
    const rec = startRecording(canvasRef.current, engineRef.current.audioTrack, (result) => {
      clearInterval(tick);
      recRef.current = null;
      setRecElapsed(null);
      setRecording(result);
    });
    const tick = setInterval(() => setRecElapsed(performance.now() - rec.startedAt), 250);
    recRef.current = rec;
    setRecElapsed(0);
  };

  const togglePower = () => {
    if (status.camera === "off" || status.camera === "error") return engineRef.current.start();
    stopRecording();
    engineRef.current.stop();
  };

  return (
    <div className="app" data-panel={panel ?? undefined}>
      <InfoDrawer
        open={panel === "info"}
        onClose={() => setPanel(null)}
        status={status}
        transcript={transcript}
        engineRef={engineRef}
      />
      <main className="stage">
        <TvSet
          canvasRef={canvasRef}
          engineRef={engineRef}
          status={status}
          style={draft}
          channel={styles.findIndex((s) => s.id === activeId) + 1}
          onPower={togglePower}
          onChannel={nextStyle}
          recElapsed={recElapsed}
          recMax={MAX_RECORD_MS}
          onRecord={toggleRecording}
          panel={panel}
          onPanel={(p) => setPanel((cur) => (cur === p ? null : p))}
        />
      </main>
      <TweakDrawer
        open={panel === "tweak"}
        onClose={() => setPanel(null)}
        styles={styles}
        active={active}
        draft={draft}
        onSelect={selectStyle}
        onEdit={editStyle}
        onReset={() => setDraft(active)}
        onSaveAs={saveAs}
        onDelete={deleteStyle}
      />
      {recording && <RecordDialog recording={recording} onClose={() => setRecording(null)} />}
    </div>
  );
}
