import { useMemo, useState } from "react";
import "./FormatExplorer.css";

const SAMPLE_BITS = "1000010101000100".split("");

function getField(index, mode, precision) {
  if (index === 0) return "sign";
  if (mode === "bf16") return index <= 8 ? "exponent" : "fraction";
  if (index < precision) return "sf-value";
  return "inactive";
}

export default function FormatExplorer() {
  const [mode, setMode] = useState("bf16");
  const [precision, setPrecision] = useState(16);
  const fields = useMemo(
    () => SAMPLE_BITS.map((_, index) => getField(index, mode, precision)),
    [mode, precision],
  );

  return (
    <section className="format-explorer" aria-labelledby="format-explorer-title">
      <div className="format-explorer__heading">
        <div>
          <span className="format-explorer__eyebrow">Inside the datatype</span>
          <h2 id="format-explorer-title">See what every bit is doing.</h2>
          <p>Compare a fixed BF16 layout with a scalable Superfloat word. Change the active SF width to see which bits the hardware keeps.</p>
        </div>

        <div className="format-explorer__toggle" aria-label="Number format">
          <button type="button" aria-pressed={mode === "bf16"} onClick={() => setMode("bf16")}>BF16</button>
          <button type="button" aria-pressed={mode === "sf"} onClick={() => setMode("sf")}>Superfloat</button>
        </div>
      </div>

      <div className="format-explorer__readout">
        <div className="format-explorer__bits" aria-label={`${mode === "bf16" ? "BF16" : `SF${precision}`} 16-bit layout`}>
          {SAMPLE_BITS.map((bit, index) => (
            <span
              className={`format-explorer__bit format-explorer__bit--${fields[index]}`}
              style={{ "--bit-index": index }}
              key={index}
              aria-label={`Bit ${15 - index}: ${bit}, ${fields[index]}`}
            >
              <small className="bit-index" aria-hidden="true">{15 - index}</small>{bit}
            </span>
          ))}
        </div>

        <div className="format-explorer__legend" aria-live="polite">
          <strong>{mode === "bf16" ? "BF16 · 1 / 8 / 7" : `SF${precision} · 1 / ${precision - 1}`}</strong>
          <span className="legend-dot legend-dot--sign">Sign</span>
          {mode === "bf16" ? (
            <>
              <span className="legend-dot legend-dot--exponent">Exponent</span>
              <span className="legend-dot legend-dot--fraction">Fraction</span>
            </>
          ) : (
            <>
              <span className="legend-dot legend-dot--sf">Scalable value field</span>
              {precision < 16 && <span className="legend-dot legend-dot--inactive">Unused</span>}
            </>
          )}
        </div>
      </div>

      {mode === "sf" && (
        <div className="format-explorer__precision">
          <div className="precision-presets" aria-label="Precision presets">{[4, 8, 12, 16].map(width => <button key={width} aria-pressed={precision === width} onClick={() => setPrecision(width)}>SF{width}</button>)}</div>
          <label htmlFor="sf-precision">Superfloat width <strong>SF{precision}</strong></label>
          <input
            id="sf-precision"
            aria-label="Superfloat precision"
            type="range"
            min="4"
            max="16"
            step="1"
            value={precision}
            onChange={(event) => setPrecision(Number(event.target.value))}
          />
          <div><span>SF4</span><span>SF16</span></div>
        </div>
      )}
      <div className="storage-comparison">
        <div><span className="storage-label">RAW STORAGE / 1,000,000 VALUES</span><div className="storage-row"><span>BF16</span><div className="storage-track"><i style={{ width: "100%" }} /></div><b>2.00 MB</b></div><div className="storage-row"><span>{mode === "bf16" ? "BF16" : `SF${precision}`}</span><div className="storage-track selected"><i style={{ width: `${(mode === "bf16" ? 16 : precision) / 16 * 100}%` }} /></div><b>{((mode === "bf16" ? 16 : precision) / 8).toFixed(2)} MB</b></div></div>
        <div className="storage-result" aria-live="polite"><strong>{mode === "bf16" ? 0 : Math.round((1 - precision / 16) * 100)}%</strong><span>fewer storage bits vs BF16</span></div>
        <p>Ideal bit-packed payload, using decimal MB. Excludes scales, metadata, alignment, and runtime overhead. The bit pattern above illustrates field layout, not equivalent decoded values.</p>
      </div>
    </section>
  );
}
