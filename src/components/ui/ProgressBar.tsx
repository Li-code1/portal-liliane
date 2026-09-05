export default function ProgressBar({
  percentual,
  variante = 'rose',
}: {
  percentual: number
  variante?: 'rose' | 'verde'
}) {
  const valor = Math.max(0, Math.min(100, percentual))
  return (
    <div
      className={`barra-progresso ${variante === 'verde' ? 'verde' : ''}`}
      role="progressbar"
      aria-valuenow={Math.round(valor)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="barra-progresso-preenchimento" style={{ width: `${valor}%` }} />
    </div>
  )
}
