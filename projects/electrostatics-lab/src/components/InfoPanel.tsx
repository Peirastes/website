import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface InfoPanelProps {
  description: string;
  formula?: string;
}

export function InfoPanel({ description, formula }: InfoPanelProps) {
  const formulaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (formula && formulaRef.current) {
      try {
        katex.render(formula, formulaRef.current, {
          throwOnError: false,
          displayMode: true,
        });
      } catch (error) {
        // Fallback to plain text if LaTeX rendering fails
        formulaRef.current.textContent = formula;
      }
    }
  }, [formula]);

  return (
    <div className="info-panel">
      <div className="ip-label">Overview</div>
      <p>{description}</p>
      {formula && (
        <div className="ip-eq">
          <div className="ip-eq-title">Field</div>
          <div className="formula" ref={formulaRef} />
        </div>
      )}
    </div>
  );
}
