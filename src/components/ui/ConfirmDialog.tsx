export default function ConfirmDialog({
  aberto,
  titulo,
  descricao,
  textoConfirmar = 'Excluir',
  textoCancelar = 'Cancelar',
  confirmando = false,
  onConfirmar,
  onCancelar,
}: {
  aberto: boolean
  titulo: string
  descricao?: string
  textoConfirmar?: string
  textoCancelar?: string
  confirmando?: boolean
  onConfirmar: () => void
  onCancelar: () => void
}) {
  if (!aberto) return null
  return (
    <div className="dialog-fundo" role="dialog" aria-modal="true" aria-labelledby="dialog-titulo" onClick={onCancelar}>
      <div className="dialog-caixa" onClick={(e) => e.stopPropagation()}>
        <h3 id="dialog-titulo">{titulo}</h3>
        {descricao && <p>{descricao}</p>}
        <div className="dialog-acoes">
          <button className="btn btn-ghost" onClick={onCancelar} disabled={confirmando}>
            {textoCancelar}
          </button>
          <button className="btn btn-danger" style={{ background: 'var(--red)', color: '#fff' }} onClick={onConfirmar} disabled={confirmando}>
            {confirmando ? 'Excluindo...' : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}
