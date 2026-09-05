// Service Worker do Portal Liliane Lima
//
// Objetivo: permitir instalação como app, acelerar o carregamento de
// arquivos estáticos (JS, CSS, fontes, ícones) e oferecer um fallback
// de app-shell quando a conexão cair.
//
// O que este Service Worker NUNCA faz:
//   - nunca intercepta ou cacheia chamadas para /api/*
//   - nunca intercepta ou cacheia chamadas para *.supabase.co (dados,
//     autenticação, tokens, sessão)
//   - nunca guarda dados privados/dinâmicos do usuário
//
// Ou seja: dados de clientes, sessões, metas, login etc. sempre vêm
// direto da rede, como num site normal. Só os arquivos "de vitrine"
// (o próprio app compilado) são acelerados via cache.

const VERSAO_CACHE = 'portal-liliane-v1'
const CACHE_ESTATICO = `estatico-${VERSAO_CACHE}`

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const nomes = await caches.keys()
      await Promise.all(
        nomes
          .filter((nome) => nome.startsWith('estatico-') && nome !== CACHE_ESTATICO)
          .map((nome) => caches.delete(nome))
      )
      await self.clients.claim()
    })()
  )
})

// Atualização controlada: a página manda essa mensagem quando o
// usuário confirma que quer atualizar para a nova versão.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

function ehChamadaDeApi(url) {
  return url.pathname.startsWith('/api/')
}

function ehSupabaseOuServicoExterno(url) {
  return (
    url.hostname.endsWith('.supabase.co') ||
    url.hostname.endsWith('supabase.in') ||
    url.hostname === 'vercel.live'
  )
}

function ehAssetEstatico(url) {
  if (url.origin !== self.location.origin) {
    // fontes do Google Fonts também podem ser cacheadas (são públicas e estáticas)
    return url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com'
  }
  return /\.(?:js|css|woff2?|ttf|png|jpg|jpeg|svg|webp|ico)$/.test(url.pathname) ||
    url.pathname === '/manifest.webmanifest'
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Nunca mexe em API própria ou em Supabase/serviços externos sensíveis.
  if (ehChamadaDeApi(url) || ehSupabaseOuServicoExterno(url)) {
    return
  }

  // Navegação entre páginas (ex: digitar /admin/agenda direto na barra):
  // tenta a rede primeiro; se cair a conexão, cai pro app-shell em cache
  // (index.html), que então mostra a mensagem de "sem conexão" via app.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const resposta = await fetch(request)
          const cache = await caches.open(CACHE_ESTATICO)
          cache.put('/index.html', resposta.clone())
          return resposta
        } catch {
          const cache = await caches.open(CACHE_ESTATICO)
          const shell = await cache.match('/index.html')
          return shell || Response.error()
        }
      })()
    )
    return
  }

  // Assets estáticos: stale-while-revalidate (serve rápido do cache,
  // atualiza em segundo plano para a próxima vez).
  if (ehAssetEstatico(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_ESTATICO)
        const emCache = await cache.match(request)
        const buscaNaRede = fetch(request)
          .then((resposta) => {
            if (resposta && resposta.ok) cache.put(request, resposta.clone())
            return resposta
          })
          .catch(() => undefined)
        return emCache || (await buscaNaRede) || Response.error()
      })()
    )
  }
  // Qualquer outra requisição (ex: dados dinâmicos de terceiros) segue
  // o caminho normal do navegador, sem passar pelo cache.
})
