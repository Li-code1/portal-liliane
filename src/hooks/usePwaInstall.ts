import { useEffect, useState } from 'react'

type EventoInstalacao = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function estaEmModoStandalone() {
  const iosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone
  return window.matchMedia('(display-mode: standalone)').matches || iosStandalone === true
}

function ehIOS() {
  const ua = window.navigator.userAgent
  const iOSDispositivo = /iphone|ipad|ipod/i.test(ua)
  // iPadOS moderno se identifica como Mac, mas tem touch — diferencia de um Mac de verdade.
  const iPadOSComoMac = ua.includes('Macintosh') && navigator.maxTouchPoints > 1
  return iOSDispositivo || iPadOSComoMac
}

export function usePwaInstall() {
  const [promptEvento, setPromptEvento] = useState<EventoInstalacao | null>(null)
  const [instalado, setInstalado] = useState(estaEmModoStandalone())

  useEffect(() => {
    function aoTerPrompt(e: Event) {
      e.preventDefault()
      setPromptEvento(e as EventoInstalacao)
    }
    function aoInstalar() {
      setInstalado(true)
      setPromptEvento(null)
    }
    window.addEventListener('beforeinstallprompt', aoTerPrompt)
    window.addEventListener('appinstalled', aoInstalar)

    const media = window.matchMedia('(display-mode: standalone)')
    const aoMudarModo = () => setInstalado(estaEmModoStandalone())
    media.addEventListener?.('change', aoMudarModo)

    return () => {
      window.removeEventListener('beforeinstallprompt', aoTerPrompt)
      window.removeEventListener('appinstalled', aoInstalar)
      media.removeEventListener?.('change', aoMudarModo)
    }
  }, [])

  async function instalar() {
    if (!promptEvento) return 'indisponivel' as const
    await promptEvento.prompt()
    const escolha = await promptEvento.userChoice
    setPromptEvento(null)
    return escolha.outcome
  }

  return {
    podeInstalarDireto: !!promptEvento,
    instalado,
    ehIOS: ehIOS(),
    instalar,
  }
}
