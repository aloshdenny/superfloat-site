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

      <div className="format-explorer__readout" key={`${mode}-${precision}`}>
        <div className="format-explorer__bits" aria-label={`${mode === "bf16" ? "BF16" : `SF${precision}`} 16-bit layout`}>
          {SAMPLE_BITS.map((bit, index) => (
            <span
              className={`format-explorer__bit format-explorer__bit--${fields[index]}`}
              style={{ "--bit-index": index }}
              key={index}
              aria-label={`Bit ${15 - index}: ${bit}, ${fields[index]}`}
            >
              {bit}
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
    </section>
  );
}
