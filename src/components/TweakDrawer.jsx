import { useState } from "react";
import Drawer from "./Drawer.jsx";
import { COLOR_CONTROLS, CONTENT_CONTROLS, FONTS, PICTURE_CONTROLS } from "../styles/presets.js";

function Slider({ control, value, onChange }) {
  return (
    <label className="field">
      <span className="field-label">
        {control.label}
        <output>{value.toFixed(2)}</output>
      </span>
      <input
        type="range"
        min={control.min}
        max={control.max}
        step={control.step}
        value={value}
        onChange={(e) => onChange(control.key, Number(e.target.value))}
      />
    </label>
  );
}

export default function TweakDrawer({ open, onClose, styles, active, draft, onSelect, onEdit, onReset, onSaveAs, onDelete }) {
  const [name, setName] = useState("");
  const dirty = !active.custom && draft !== active;

  const save = (e) => {
    e.preventDefault();
    onSaveAs(name.trim() || `My style ${styles.filter((s) => s.custom).length + 1}`);
    setName("");
  };

  return (
    <Drawer side="right" title="Tweak the set" open={open} onClose={onClose}>
      <section>
        <h3>Channels</h3>
        <ul className="style-list">
          {styles.map((s, i) => (
            <li key={s.id}>
              <button className="style-pick" aria-pressed={s.id === active.id} onClick={() => onSelect(s)}>
                <span className="ch">{String(i + 1).padStart(2, "0")}</span>
                <span className="swatch" style={{ background: s.background, color: s.textColor, borderColor: s.sparkColor }}>
                  Aa
                </span>
                {s.name}
              </button>
              {s.custom && (
                <button className="tv-btn small" onClick={() => onDelete(s.id)} aria-label={`Delete ${s.name}`}>
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <form className="save-row" onSubmit={save}>
        <input
          type="text"
          placeholder={active.custom ? "Copy as…" : "Save as…"}
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="New style name"
          maxLength={32}
        />
        <button className="tv-btn small" type="submit">
          Save
        </button>
        {dirty && (
          <button className="tv-btn small" type="button" onClick={onReset}>
            Reset
          </button>
        )}
      </form>
      <p className="hint">
        {active.custom
          ? "Changes to your own styles save automatically."
          : "Presets stay as they are. Save your changes as a new channel."}
      </p>

      <section>
        <h3>Picture</h3>
        {PICTURE_CONTROLS.map((c) => (
          <Slider key={c.key} control={c} value={draft[c.key]} onChange={onEdit} />
        ))}
      </section>

      <section>
        <h3>Words &amp; sparks</h3>
        {CONTENT_CONTROLS.map((c) => (
          <Slider key={c.key} control={c} value={draft[c.key]} onChange={onEdit} />
        ))}
        <label className="field">
          <span className="field-label">Font</span>
          <select value={draft.textFont} onChange={(e) => onEdit("textFont", e.target.value)}>
            {FONTS.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-label">Spark characters</span>
          <input type="text" value={draft.sparkChars} maxLength={12} onChange={(e) => onEdit("sparkChars", e.target.value)} />
        </label>
        <div className="colors">
          {COLOR_CONTROLS.map((c) => (
            <label key={c.key} className="color">
              <input type="color" value={draft[c.key]} onChange={(e) => onEdit(c.key, e.target.value)} />
              {c.label}
            </label>
          ))}
        </div>
      </section>
    </Drawer>
  );
}
