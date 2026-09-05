import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from './supabaseClient'
import { useAuth } from './useAuth'
import { IconHome, IconUsers, IconCalendar, IconClock, IconLogout } from './components/ui/Icons'
import Avatar from './components/ui/Avatar'

const NAV_ADMIN = [
  { to: '/admin', label: 'Dashboard', icon: IconHome, match: (p: string) => p === '/admin' },
  { to: '/admin/clientes', label: 'Clientes', icon: IconUsers, match: (p: string) => p.startsWith('/admin/clientes') || p.startsWith('/admin/cliente/') },
  { to: '/admin/agenda', label: 'Agenda', icon: IconCalendar, match: (p: string) => p.startsWith('/admin/agenda') },
  { to: '/admin/horarios', label: 'Horários', icon: IconClock, match: (p: string) => p.startsWith('/admin/horarios') },
]

export default function Layout({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string
  subtitulo?: string
  children: ReactNode
}) {
  const { profile } = useAuth()
  const location = useLocation()
  const isAdmin = profile?.is_admin === true

  async function sair() {
    await supabase.auth.signOut()
  }

  return (
    <div className="app-shell">
      {isAdmin && (
        <aside className="sidebar">
          <div className="sidebar-marca">
            <div className="monograma">LL</div>
            <div>
              <strong>Liliane Lima</strong>
              <span>Portal · Admin</span>
            </div>
          </div>
          <nav className="sidebar-nav">
            {NAV_ADMIN.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`sidebar-link ${item.match(location.pathname) ? 'ativo' : ''}`}
              >
                <item.icon size={19} />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="sidebar-rodape">
            <button className="sidebar-link" style={{ border: 'none', background: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }} onClick={sair}>
              <IconLogout size={19} />
              Sair
            </button>
          </div>
        </aside>
      )}

      <header className={`topbar-mobile ${!isAdmin ? 'sempre-visivel' : ''}`}>
        <div className="marca-topo">
          <div className="monograma">LL</div>
          <span>Liliane Lima</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem' }}>
          {!isAdmin && profile && <Avatar nome={profile.full_name || profile.email} tamanho="sm" />}
          <button className="btn btn-icon btn-ghost" onClick={sair} aria-label="Sair" title="Sair">
            <IconLogout size={17} />
          </button>
        </div>
      </header>

      <main className={`conteudo-app ${!isAdmin ? 'sem-sidebar' : ''}`}>
        <div className="topo-app-desktop">
          <div>
            <h1 className="titulo-pagina">{titulo}</h1>
            {subtitulo && <p className="subtitulo-pagina">{subtitulo}</p>}
          </div>
        </div>
        {children}
      </main>

      {isAdmin && (
        <nav className="bottom-nav" aria-label="Navegação principal">
          <ul className="bottom-nav-lista">
            {NAV_ADMIN.map((item) => (
              <li key={item.to} style={{ flex: 1 }}>
                <Link to={item.to} className={`bottom-nav-link ${item.match(location.pathname) ? 'ativo' : ''}`}>
                  <item.icon size={20} />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  )
}
