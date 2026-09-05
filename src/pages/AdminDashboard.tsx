import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, type Profile, type Goal, type Session } from '../supabaseClient'
import Layout from '../Layout'
import StatCard from '../components/ui/StatCard'
import Avatar from '../components/ui/Avatar'
import EmptyState from '../components/ui/EmptyState'
import { SkeletonLista, SkeletonStats } from '../components/ui/Skeleton'
import {
  IconUsers, IconCalendar, IconTarget, IconAlert, IconChevronRight, IconInbox, IconMessage, IconSearch,
} from '../components/ui/Icons'

function saudacaoPorHorario() {
  const hora = new Date().toLocaleString('pt-BR', { hour: 'numeric', hour12: false, timeZone: 'America/Sao_Paulo' })
  const h = Number(hora)
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function mesmodia(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export default function AdminDashboard() {
  const [clientes, setClientes] = useState<Profile[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    setCarregando(true)
    const [{ data: perfis }, { data: sessoes }, { data: metas }] = await Promise.all([
      supabase.from('profiles').select('*').eq('is_admin', false).order('created_at', { ascending: false }),
      supabase.from('sessions').select('*'),
      supabase.from('goals').select('*'),
    ])
    setClientes((perfis as Profile[]) || [])
    setSessions((sessoes as Session[]) || [])
    setGoals((metas as Goal[]) || [])
    setCarregando(false)
  }

  const agora = new Date()

  const sessoesFuturas = useMemo(
    () => sessions.filter((s) => new Date(s.data_sessao) > agora).sort((a, b) => +new Date(a.data_sessao) - +new Date(b.data_sessao)),
    [sessions]
  )
  const sessoesHoje = useMemo(
    () => sessoesFuturas.filter((s) => mesmodia(new Date(s.data_sessao), agora)),
    [sessoesFuturas]
  )
  const metasPendentes = useMemo(() => goals.filter((g) => g.status === 'em_andamento'), [goals])

  const proximaSessaoPorCliente = useMemo(() => {
    const mapa = new Map<string, Session>()
    for (const s of sessoesFuturas) {
      if (!mapa.has(s.client_id)) mapa.set(s.client_id, s)
    }
    return mapa
  }, [sessoesFuturas])

  const clientesSemProximaSessao = useMemo(
    () => clientes.filter((c) => !proximaSessaoPorCliente.has(c.id)),
    [clientes, proximaSessaoPorCliente]
  )

  const feedbacksPendentes = useMemo(
    () => sessions.filter((s) => new Date(s.data_sessao) <= agora && !s.feedback_cliente),
    [sessions]
  )

  const mapaClientes = useMemo(() => new Map(clientes.map((c) => [c.id, c])), [clientes])
  const mapaMetasPorCliente = useMemo(() => {
    const mapa = new Map<string, { total: number; concluidas: number }>()
    for (const g of goals) {
      const atual = mapa.get(g.client_id) || { total: 0, concluidas: 0 }
      atual.total += 1
      if (g.status === 'concluida') atual.concluidas += 1
      mapa.set(g.client_id, atual)
    }
    return mapa
  }, [goals])

  const clientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    const lista = !termo
      ? clientes
      : clientes.filter(
          (c) => (c.full_name || '').toLowerCase().includes(termo) || c.email.toLowerCase().includes(termo)
        )
    return lista.slice(0, 6)
  }, [clientes, busca])

  function formatarHora(iso: string) {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
  }
  function formatarDataCurta(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'America/Sao_Paulo' })
  }

  const nomeLiliane = 'Liliane'

  return (
    <Layout titulo="Dashboard">
      <div className="saudacao">
        <h1>{saudacaoPorHorario()}, {nomeLiliane} 🌿</h1>
        <p className="subtitulo-pagina">Aqui está o resumo do seu acompanhamento.</p>
      </div>

      {carregando ? (
        <SkeletonStats itens={5} />
      ) : (
        <div className="grid-stats">
          <StatCard icone={<IconUsers size={17} />} numero={clientes.length} legenda="Clientes ativos" />
          <StatCard icone={<IconCalendar size={17} />} numero={sessoesHoje.length} legenda="Sessões hoje" />
          <StatCard icone={<IconCalendar size={17} />} numero={sessoesFuturas.length} legenda="Sessões próximas" />
          <StatCard icone={<IconTarget size={17} />} numero={metasPendentes.length} legenda="Metas pendentes" />
          <StatCard icone={<IconAlert size={17} />} numero={clientesSemProximaSessao.length} legenda="Sem próxima sessão" />
        </div>
      )}

      <div className="grid-duas-colunas">
        <div>
          <section className="secao">
            <div className="secao-cabecalho">
              <h2>Próximos atendimentos</h2>
              <Link to="/admin/agenda" className="ver-tudo">Ver agenda →</Link>
            </div>
            {carregando ? (
              <SkeletonLista itens={3} />
            ) : sessoesFuturas.length === 0 ? (
              <EmptyState
                icone={<IconCalendar size={24} />}
                titulo="Nenhum atendimento agendado"
                descricao="Quando você agendar uma sessão para um cliente, ela aparece aqui."
              />
            ) : (
              <div className="lista-cards">
                {sessoesFuturas.slice(0, 5).map((s) => {
                  const cliente = mapaClientes.get(s.client_id)
                  return (
                    <Link to={`/admin/cliente/${s.client_id}`} key={s.id} className="linha-atendimento">
                      <div className="horario">
                        {formatarHora(s.data_sessao)}
                        <span>{formatarDataCurta(s.data_sessao)}</span>
                      </div>
                      <div className="info">
                        <strong>{cliente?.full_name || cliente?.email || 'Cliente'}</strong>
                        <span>Sessão {s.numero} — {s.titulo}</span>
                      </div>
                      <IconChevronRight size={16} className="seta" />
                    </Link>
                  )
                })}
              </div>
            )}
          </section>

          <section className="secao">
            <div className="secao-cabecalho">
              <h2>Clientes recentes</h2>
              <Link to="/admin/clientes" className="ver-tudo">Ver todos →</Link>
            </div>
            <div className="caixa-busca">
              <IconSearch size={17} />
              <input
                type="text"
                placeholder="Buscar cliente por nome ou e-mail..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            {carregando ? (
              <SkeletonLista itens={3} />
            ) : clientesFiltrados.length === 0 ? (
              <EmptyState icone={<IconUsers size={24} />} titulo="Nenhum cliente encontrado" />
            ) : (
              <div className="lista-clientes">
                {clientesFiltrados.map((c) => {
                  const metas = mapaMetasPorCliente.get(c.id)
                  const proxima = proximaSessaoPorCliente.get(c.id)
                  return (
                    <Link to={`/admin/cliente/${c.id}`} key={c.id} className="cartao-cliente">
                      <Avatar nome={c.full_name || c.email} />
                      <div className="info">
                        <strong>{c.full_name || 'Sem nome'}</strong>
                        <span>{c.email}</span>
                      </div>
                      <div className="meta">
                        <span style={{ fontWeight: 600, color: 'var(--ink)' }}>
                          {proxima ? formatarDataCurta(proxima.data_sessao) : 'Sem próxima sessão'}
                        </span>
                        {metas && metas.total > 0 && (
                          <span>{metas.concluidas}/{metas.total} metas</span>
                        )}
                      </div>
                      <IconChevronRight size={16} className="seta" />
                    </Link>
                  )
                })}
              </div>
            )}
          </section>
        </div>

        <div>
          <section className="secao">
            <div className="secao-cabecalho">
              <h2>Alertas</h2>
            </div>
            {carregando ? (
              <SkeletonLista itens={2} />
            ) : clientesSemProximaSessao.length === 0 && feedbacksPendentes.length === 0 ? (
              <EmptyState icone={<IconAlert size={22} />} titulo="Tudo em dia" descricao="Nenhum alerta no momento." />
            ) : (
              <div className="lista-alertas">
                {clientesSemProximaSessao.length > 0 && (
                  <div className="alerta">
                    <IconAlert size={17} />
                    <div>
                      <strong>{clientesSemProximaSessao.length} cliente(s) sem próxima sessão</strong>
                      <span>{clientesSemProximaSessao.slice(0, 3).map((c) => c.full_name || c.email).join(', ')}{clientesSemProximaSessao.length > 3 ? '...' : ''}</span>
                    </div>
                  </div>
                )}
                {feedbacksPendentes.length > 0 && (
                  <div className="alerta">
                    <IconMessage size={17} />
                    <div>
                      <strong>{feedbacksPendentes.length} feedback(s) aguardando</strong>
                      <span>Sessões já realizadas sem retorno do cliente.</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="secao">
            <div className="secao-cabecalho">
              <h2>Resumo de metas</h2>
            </div>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '.6rem' }}>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', fontWeight: 700 }}>
                  {goals.length - metasPendentes.length} de {goals.length}
                </span>
                <span className="texto-vazio">concluídas</span>
              </div>
              {goals.length === 0 ? (
                <EmptyState icone={<IconInbox size={20} />} titulo="Nenhuma meta cadastrada ainda" />
              ) : (
                <div className="barra-progresso verde">
                  <div
                    className="barra-progresso-preenchimento"
                    style={{ width: `${((goals.length - metasPendentes.length) / goals.length) * 100}%` }}
                  />
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  )
}
