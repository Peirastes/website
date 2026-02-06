interface InfoPanelProps {
  title: string;
  description: string;
  formula?: string;
}

export function InfoPanel({ title, description, formula }: InfoPanelProps) {
  return (
    <div className="info-panel">
      <h2>{title}</h2>
      <p>{description}</p>
      {formula && (
        <div className="formula">
          {formula}
        </div>
      )}
    </div>
  );
}
