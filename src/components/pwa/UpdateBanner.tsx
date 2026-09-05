import { useEffect, useState } from 'react'
import { aplicarAtualizacaoPwa } from '../../pwa'

export default function UpdateBanner() {
  const [disponivel, setDisponivel] = useState(false)
  const [atualizando, setAtualizando] = useState(false)

  useEffect(() => {
    function aoAvisar() {
      setDisponivel(true)
    }
    window.addEventListener('pwa:atualizacao-disponivel', aoAvisar)
    return () => window.removeEventListener('pwa:atualizacao-disponivel', aoAvisar)
  }, [])

  if (!disponivel) return null

  function atualizar() {
    setAtualizando(true)
    aplicarAtualizacaoPwa()
  }

  return (
    <div className="pwa-banner pwa-banner-atualizacao">
      <strong>Nova versão disponível</strong>
      <p>Atualize o Portal Liliane para ter acesso às melhorias.</p>
      <div className="pwa-banner-acoes">
        <button className="btn btn-primario btn-sm" onClick={atualizar} disabled={atualizando}>
          {atualizando ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>
    </div>
  )
}
