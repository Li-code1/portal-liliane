import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './useAuth'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import AgendarPublico from './pages/AgendarPublico'
import TermosPrivacidade from './pages/TermosPrivacidade'
import AdminDashboard from './pages/AdminDashboard'
import AdminClientes from './pages/AdminClientes'
import AdminAgenda from './pages/AdminAgenda'
import AdminHorarios from './pages/AdminHorarios'
import ClientDetail from './pages/ClientDetail'
import ClientDashboard from './pages/ClientDashboard'
import InstallAppBanner from './components/pwa/InstallAppBanner'
import UpdateBanner from './components/pwa/UpdateBanner'
import OfflineBanner from './components/pwa/OfflineBanner'

function PwaCamadas() {
  return (
    <>
      <OfflineBanner />
      <UpdateBanner />
      <InstallAppBanner />
    </>
  )
}

export default function App() {
  const { session, profile, loading } = useAuth()

  // Estas duas páginas são públicas e funcionam independente do estado de
  // login normal — precisam ser checadas antes de qualquer redirecionamento.
  if (window.location.pathname === '/redefinir-senha') {
    return (
      <>
        <Routes>
          <Route path="/redefinir-senha" element={<ResetPassword />} />
        </Routes>
        <PwaCamadas />
      </>
    )
  }
  if (window.location.pathname === '/agendar') {
    return (
      <>
        <Routes>
          <Route path="/agendar" element={<AgendarPublico />} />
        </Routes>
        <PwaCamadas />
      </>
    )
  }

  if (loading) {
    return (
      <div className="tela-carregando">
        <div className="spinner" /> Carregando...
      </div>
    )
  }

  if (!session) {
    return (
      <>
        <Routes>
          <Route path="*" element={<Login />} />
        </Routes>
        <PwaCamadas />
      </>
    )
  }

  const isAdmin = profile?.is_admin === true

  // Cliente (não-admin) precisa aceitar os termos de privacidade antes de
  // ver qualquer dado do portal.
  if (!isAdmin && profile && !profile.consentimento_lgpd) {
    return (
      <>
        <TermosPrivacidade />
        <PwaCamadas />
      </>
    )
  }

  return (
    <>
      <Routes>
        {isAdmin ? (
          <>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/clientes" element={<AdminClientes />} />
            <Route path="/admin/agenda" element={<AdminAgenda />} />
            <Route path="/admin/horarios" element={<AdminHorarios />} />
            <Route path="/admin/cliente/:id" element={<ClientDetail />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </>
        ) : (
          <>
            <Route path="/portal" element={<ClientDashboard />} />
            <Route path="*" element={<Navigate to="/portal" replace />} />
          </>
        )}
      </Routes>
      <PwaCamadas />
    </>
  )
}
