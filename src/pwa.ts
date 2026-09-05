// Registro do Service Worker e ponte de atualização do PWA.
//
// Mantido simples de propósito: não usamos nenhuma lib externa (não
// precisa adicionar dependências novas ao projeto). O próprio
// navegador cuida de tudo — este arquivo só liga as pontas.

let workerEmEspera: ServiceWorker | null = null

export function registrarServiceWorker() {
  if (!('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registro) => {
        if (registro.waiting && navigator.serviceWorker.controller) {
          workerEmEspera = registro.waiting
          avisarAtualizacaoDisponivel()
        }

        registro.addEventListener('updatefound', () => {
          const novo = registro.installing
          if (!novo) return
          novo.addEventListener('statechange', () => {
            if (novo.state === 'installed' && navigator.serviceWorker.controller) {
              workerEmEspera = novo
              avisarAtualizacaoDisponivel()
            }
          })
        })
      })
      .catch(() => {
        // Falha ao registrar o Service Worker não deve quebrar o app —
        // ele simplesmente continua funcionando como um site normal.
      })

    let recarregouUmaVez = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (recarregouUmaVez) return
      recarregouUmaVez = true
      window.location.reload()
    })
  })
}

function avisarAtualizacaoDisponivel() {
  window.dispatchEvent(new CustomEvent('pwa:atualizacao-disponivel'))
}

export function aplicarAtualizacaoPwa() {
  workerEmEspera?.postMessage('SKIP_WAITING')
}
