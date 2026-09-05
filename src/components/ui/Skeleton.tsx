export function SkeletonLinha({ largura = '100%' }: { largura?: string }) {
  return <div className="skeleton skeleton-linha" style={{ width: largura }} />
}

export function SkeletonCard() {
  return <div className="skeleton skeleton-card" />
}

export function SkeletonLista({ itens = 3 }: { itens?: number }) {
  return (
    <div className="lista-cards" aria-busy="true" aria-label="Carregando">
      {Array.from({ length: itens }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonStats({ itens = 4 }: { itens?: number }) {
  return (
    <div className="grid-stats" aria-busy="true" aria-label="Carregando">
      {Array.from({ length: itens }).map((_, i) => (
        <div className="stat-card" key={i}>
          <SkeletonLinha largura="60%" />
          <div className="skeleton skeleton-linha" style={{ height: 26, width: '40%' }} />
        </div>
      ))}
    </div>
  )
}
