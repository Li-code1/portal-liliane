import type { ReactNode } from 'react'

export default function EmptyState({
  icone,
  titulo,
  descricao,
  acao,
}: {
  icone: ReactNode
  titulo: string
  descricao?: string
  acao?: ReactNode
}) {
  return (
    <div className="estado-vazio">
      <div className="estado-vazio-icone">{icone}</div>
      <strong>{titulo}</strong>
      {descricao && <p>{descricao}</p>}
      {acao}
    </div>
  )
}
