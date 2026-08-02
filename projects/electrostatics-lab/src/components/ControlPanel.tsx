/* Canon control panel — hand-built to match the Optics/Induction instrument
   panel exactly (glass panel, Orbitron amber section headers, canon range
   sliders, toggle switches, dropdown, buttons). Replaces the Leva panel. */
import './ControlPanel.css';

export type Controls = Record<string, number | boolean | string>;

type Field =
  | { key: string; type: 'select'; label: string; options: Record<string, string> } // value->label
  | { key: string; type: 'slider'; label: string; min: number; max: number; step: number; fmt?: (n: number) => string }
  | { key: string; type: 'toggle'; label: string }
  | { key: string; type: 'button'; label: string; onClick: () => void };

type Section = { title: string; fields: Field[] };

export function ControlPanel({
  controls,
  set,
  sections,
}: {
  controls: Controls;
  set: (key: string, value: number | boolean | string) => void;
  sections: Section[];
}) {
  return (
    <div className="es-panel">
      {sections.map((sec) => (
        <div className="es-section" key={sec.title}>
          <div className="es-section-label">{sec.title}</div>
          {sec.fields.map((f) => {
            if (f.type === 'select') {
              return (
                <div className="es-row es-row--stack" key={f.key}>
                  <label className="es-input-label">{f.label}</label>
                  <select
                    className="es-select"
                    value={controls[f.key] as string}
                    onChange={(e) => set(f.key, e.target.value)}
                  >
                    {Object.entries(f.options).map(([val, lbl]) => (
                      <option value={val} key={val}>{lbl}</option>
                    ))}
                  </select>
                </div>
              );
            }
            if (f.type === 'slider') {
              const v = controls[f.key] as number;
              const disp = f.fmt ? f.fmt(v) : (Number.isInteger(f.step) ? String(v) : v.toFixed(2));
              return (
                <div className="es-row es-slider-row" key={f.key}>
                  <span className="es-slider-label">{f.label}</span>
                  <input
                    type="range"
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    value={v}
                    onChange={(e) => set(f.key, parseFloat(e.target.value))}
                  />
                  <span className="es-slider-value">{disp}</span>
                </div>
              );
            }
            if (f.type === 'toggle') {
              return (
                <label className="es-row es-chk-row" key={f.key}>
                  <input
                    type="checkbox"
                    checked={controls[f.key] as boolean}
                    onChange={(e) => set(f.key, e.target.checked)}
                  />
                  <span>{f.label}</span>
                </label>
              );
            }
            // button
            return (
              <button className="es-btn" key={f.key} onClick={f.onClick}>
                {f.label}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export type { Field, Section };
