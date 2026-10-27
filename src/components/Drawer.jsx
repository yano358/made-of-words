export default function Drawer({ side, title, open, onClose, children }) {
  return (
    <aside className={`drawer drawer-${side}`} data-open={open} aria-hidden={!open} inert={!open}>
      <header className="drawer-head">
        <h2>{title}</h2>
        <button className="tv-btn small" onClick={onClose} aria-label={`Close ${title}`}>
          ✕
        </button>
      </header>
      <div className="drawer-body">{children}</div>
    </aside>
  );
}
