import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface InfoPanelProps {
  title: string;
  description: string;
  formula?: string;
}

export function InfoPanel({ title, description, formula }: InfoPanelProps) {
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
      <h2>{title}</h2>
      <p>{description}</p>
      {formula && (
        <div className="formula" ref={formulaRef} />
      )}
    </div>
  );
}
