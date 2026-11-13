export default function ItemControls({ index, count, onMove, onRemove, removeLabel = 'Delete', vertical = true }) {
  return (
    <div className="item-controls">
      <button type="button" className="icon-btn" onClick={() => onMove(index, -1)} disabled={index === 0} aria-label="Move earlier" title="Move earlier">
        {vertical ? '↑' : '←'}
      </button>
      <button
        type="button"
        className="icon-btn"
        onClick={() => onMove(index, 1)}
        disabled={index === count - 1}
        aria-label="Move later"
        title="Move later"
      >
        {vertical ? '↓' : '→'}
      </button>
      <button
        type="button"
        className="icon-btn danger"
        onClick={() => window.confirm(`${removeLabel}? This takes effect when you save.`) && onRemove(index)}
        aria-label={removeLabel}
        title={removeLabel}
      >
        ✕
      </button>
    </div>
  );
}
