import { useEffect, useState } from 'react'
import { usePwaInstall } from '../../hooks/usePwaInstall'
import { IconX, IconExternal } from '../ui/Icons'

const CHAVE_DISPENSADO = 'pwa_instalar_dispensado'

export default function InstallAppBanner() {
  const { podeInstalarDireto, instalado, ehIOS, instalar } = usePwaInstall()
  const [dispensado, setDispensado] = useState(() => localStorage.getItem(CHAVE_DISPENSADO) === '1')
  const [mostrarPassosIOS, setMostrarPassosIOS] = useState(false)
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    // pequeno atraso para não competir com a tela de carregamento inicial
    const t = setTimeout(() => setVisivel(true), 1200)
    return () => clearTimeout(t)
  }, [])

  function dispensar() {
    localStorage.setItem(CHAVE_DISPENSADO, '1')
    setDispensado(true)
  }

  async function handleInstalar() {
    const resultado = await instalar()
    if (resultado === 'accepted' || resultado === 'dismissed') {
      // o navegador já cuidou do prompt nativo; não precisamos manter o banner
      dispensar()
    }
  }

  if (instalado || dispensado || !visivel) return null
  if (!podeInstalarDireto && !ehIOS) return null

  if (mostrarPassosIOS) {
    return (
      <div className="pwa-banner">
        <button className="pwa-banner-fechar" onClick={dispensar} aria-label="Fechar">
          <IconX size={15} />
        </button>
        <strong>Instalar no iPhone</strong>
        <ol className="pwa-passos-ios">
          <li>Toque no ícone de compartilhar <IconExternal size={13} style={{ verticalAlign: '-2px' }} /> na barra do Safari</li>
          <li>Escolha "Adicionar à Tela de Início"</li>
          <li>Toque em "Adicionar"</li>
        </ol>
        <button className="btn btn-ghost btn-sm" onClick={dispensar}>Entendi</button>
      </div>
    )
  }

  return (
    <div className="pwa-banner">
      <button className="pwa-banner-fechar" onClick={dispensar} aria-label="Fechar">
        <IconX size={15} />
      </button>
      <div className="pwa-banner-marca">
        <div className="monograma" style={{ width: 38, height: 38, fontSize: '.85rem' }}>LL</div>
        <strong>Portal Liliane</strong>
      </div>
      <p>Tenha seu portal sempre à mão — instale como aplicativo.</p>
      <div className="pwa-banner-acoes">
        {podeInstalarDireto ? (
          <button className="btn btn-primario btn-sm" onClick={handleInstalar}>Instalar aplicativo</button>
        ) : (
          <button className="btn btn-primario btn-sm" onClick={() => setMostrarPassosIOS(true)}>Como instalar</button>
        )}
        <button className="btn btn-ghost btn-sm" onClick={dispensar}>Agora não</button>
      </div>
    </div>
  )
}
