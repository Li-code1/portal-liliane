export default function Avatar({
  nome,
  tamanho = 'md',
}: {
  nome: string
  tamanho?: 'sm' | 'md' | 'lg'
}) {
  const classe = tamanho === 'sm' ? 'avatar-sm' : tamanho === 'lg' ? 'avatar-lg' : 'avatar-cliente'
  const inicial = (nome || '?').trim().charAt(0).toUpperCase() || '?'
  return <div className={`avatar ${classe}`}>{inicial}</div>
}
