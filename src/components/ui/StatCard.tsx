import type { ReactNode } from 'react'

export default function StatCard({
  icone,
  numero,
  legenda,
}: {
  icone: ReactNode
  numero: ReactNode
  legenda: string
}) {
  return (
    <div className="stat-card">
      <div className="stat-card-topo">
        <div className="stat-icone">{icone}</div>
      </div>
      <span className="stat-numero">{numero}</span>
      <span className="stat-legenda">{legenda}</span>
    </div>
  )
}
