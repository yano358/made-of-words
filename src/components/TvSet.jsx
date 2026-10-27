import { useEffect, useRef } from "react";

const fmt = (ms) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

function MicMeter({ engineRef }) {
  const fill = useRef(null);
  useEffect(() => {
    let raf;
    const tick = () => {
      const level = Math.min(1, (engineRef.current?.level ?? 0) * 12);
      fill.current.style.clipPath = `inset(0 ${(1 - level) * 100}% 0 0)`;
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [engineRef]);
  return (
    <div className="meter" role="img" aria-label="Microphone level">
      <div className="meter-fill" ref={fill} />
    </div>
  );
}

export default function TvSet({
  canvasRef, engineRef, status, style, channel, onPower, onChannel,
  recElapsed, recMax, onRecord, panel, onPanel,
}) {
  const live = status.camera === "on";
  const recording = recElapsed !== null;

  return (
    <div className="tv" style={{ "--glow": style.textColor }}>
      <div className="tv-cabinet">
        <div className="tv-screen-wrap">
          <div className="tv-tube">
            <canvas ref={canvasRef} className="tv-screen" aria-label={`TV screen, ${style.name}`} />
            <div className="tv-glass" />
          </div>
        </div>

        <div className="tv-panel">
          <div className="tv-brand">Made of Words</div>

          <div className="knob-group">
            <button
              className="knob"
              style={{ "--rot": `${(channel - 1) * 47}deg` }}
              onClick={(e) => onChannel(e.shiftKey ? -1 : 1)}
              onContextMenu={(e) => {
                e.preventDefault();
                onChannel(-1);
              }}
              aria-label={`Channel ${channel}: ${style.name}. Click for next, shift-click for previous.`}
            >
              <span className="knob-mark" />
            </button>
            <div className="knob-label">
              <span className="ch">CH {String(channel).padStart(2, "0")}</span>
              <span className="ch-name">{style.name}</span>
            </div>
          </div>

          <div className="btn-row">
            <button className="tv-btn power" onClick={onPower} aria-pressed={status.camera !== "off"}>
              <span className={`led led-${status.camera}`} />
              Power
            </button>
            <button
              className="tv-btn rec"
              onClick={onRecord}
              disabled={!live && !recording}
              aria-pressed={recording}
            >
              <span className={`led ${recording ? "led-rec" : ""}`} />
              Rec
            </button>
          </div>

          <div className={`rec-counter ${recording ? "on" : ""}`} aria-live="polite">
            {recording ? `${fmt(recElapsed)} / ${fmt(recMax)}` : `-:-- / ${fmt(recMax)}`}
          </div>

          <MicMeter engineRef={engineRef} />

          <div className="btn-row">
            <button className="tv-btn" onClick={() => onPanel("tweak")} aria-pressed={panel === "tweak"}>
              Tweak
            </button>
            <button className="tv-btn" onClick={() => onPanel("info")} aria-pressed={panel === "info"}>
              Info
            </button>
          </div>

          <div className="grille" />
        </div>
      </div>
      <div className="tv-legs">
        <span />
        <span />
      </div>
    </div>
  );
}
