import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, type Session, type Profile } from '../supabaseClient'
import Layout from '../Layout'
import EmptyState from '../components/ui/EmptyState'
import { SkeletonLista } from '../components/ui/Skeleton'
import { IconCalendar, IconExternal, IconChevronRight } from '../components/ui/Icons'

type SessaoComCliente = Session & { cliente?: Profile }

function inicioDaSemana(data: Date) {
  const d = new Date(data)
  const diaSemana = d.getDay() // 0 = domingo
  const deslocamento = diaSemana === 0 ? -6 : 1 - diaSemana // volta para segunda-feira
  d.setDate(d.getDate() + deslocamento)
  d.setHours(0, 0, 0, 0)
  return d
}

const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

export default function AdminAgenda() {
  const [todasSessoes, setTodasSessoes] = useState<SessaoComCliente[]>([])
  const [carregando, setCarregando] = useState(true)
  const [inicioSemana, setInicioSemana] = useState(() => inicioDaSemana(new Date()))

  const [totalClientesAtendidos, setTotalClientesAtendidos] = useState(0)
  const [totalHoras, setTotalHoras] = useState(0)
  const [totalValor, setTotalValor] = useState(0)

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    setCarregando(true)
    const agora = new Date().toISOString()

    const [{ data: futuras }, { data: passadas }] = await Promise.all([
      supabase.from('sessions').select('*').gte('data_sessao', agora).order('data_sessao', { ascending: true }),
      supabase.from('sessions').select('*').lt('data_sessao', agora),
    ])

    const idsFuturas = [...new Set((futuras || []).map((s) => s.client_id))]
    const { data: perfis } = idsFuturas.length
      ? await supabase.from('profiles').select('*').in('id', idsFuturas)
      : { data: [] as Profile[] }
    const mapaPerfis = new Map((perfis || []).map((p) => [p.id, p as Profile]))

    setTodasSessoes(
      ((futuras as Session[]) || []).map((s) => ({ ...s, cliente: mapaPerfis.get(s.client_id) }))
    )

    const sessoesPassadas = (passadas as Session[]) || []
    const clientesUnicos = new Set(sessoesPassadas.map((s) => s.client_id))
    const minutosTotais = sessoesPassadas.reduce((soma, s) => soma + (s.duracao_minutos || 0), 0)
    const valorTotal = sessoesPassadas.reduce((soma, s) => soma + (Number(s.valor) || 0), 0)

    setTotalClientesAtendidos(clientesUnicos.size)
    setTotalHoras(minutosTotais / 60)
    setTotalValor(valorTotal)

    setCarregando(false)
  }

  function formatarData(iso: string) {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    })
  }

  function linkGoogleAgenda(s: SessaoComCliente) {
    const inicio = new Date(s.data_sessao)
    const fim = new Date(inicio.getTime() + s.duracao_minutos * 60000)
    const formatar = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `Sessão ${s.numero} — ${s.cliente?.full_name || s.cliente?.email || 'cliente'}`,
      dates: `${formatar(inicio)}/${formatar(fim)}`,
      details: s.resumo || s.titulo,
    })
    return `https://calendar.google.com/calendar/render?${params.toString()}`
  }

  const diasDaSemana = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(inicioSemana)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [inicioSemana])

  const sessoesPorDia = useMemo(() => {
    const mapa = new Map<string, SessaoComCliente[]>()
    for (const dia of diasDaSemana) mapa.set(dia.toDateString(), [])
    for (const s of todasSessoes) {
      const chave = new Date(s.data_sessao).toDateString()
      if (mapa.has(chave)) mapa.get(chave)!.push(s)
    }
    return mapa
  }, [todasSessoes, diasDaSemana])

  const hoje = new Date().toDateString()
  const rotuloSemana = `${diasDaSemana[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} – ${diasDaSemana[6].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`

  const proximasOrdenadas = useMemo(
    () => [...todasSessoes].sort((a, b) => +new Date(a.data_sessao) - +new Date(b.data_sessao)),
    [todasSessoes]
  )
  const sessoesAgrupadasPorDiaMobile = useMemo(() => {
    const grupos: { rotulo: string; sessoes: SessaoComCliente[] }[] = []
    for (const s of proximasOrdenadas) {
      const rotulo = new Date(s.data_sessao).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short', timeZone: 'America/Sao_Paulo' })
      let grupo = grupos.find((g) => g.rotulo === rotulo)
      if (!grupo) { grupo = { rotulo, sessoes: [] }; grupos.push(grupo) }
      grupo.sessoes.push(s)
    }
    return grupos
  }, [proximasOrdenadas])

  return (
    <Layout titulo="Agenda" subtitulo="Suas sessões futuras, organizadas por semana.">
      <div className="caixa-info">
        <strong>Ver toda a agenda automaticamente no Google Agenda:</strong>
        <p>
          No Google Agenda (celular ou computador), vá em "Outras agendas" → "+" → "A partir do URL" e
          cole este link:
        </p>
        <p style={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '.78rem' }}>
          {window.location.origin}/api/agenda.ics?secret=SEU_REMINDER_SECRET
        </p>
        <p>
          (troque <code>SEU_REMINDER_SECRET</code> pela mesma senha configurada nas variáveis de
          ambiente da Vercel). O Google sincroniza esse link sozinho a cada algumas horas.
        </p>
      </div>

      <div className="agenda-semana-nav">
        <button className="btn btn-ghost btn-sm" onClick={() => setInicioSemana((d) => { const n = new Date(d); n.setDate(n.getDate() - 7); return n })}>← Semana anterior</button>
        <span className="rotulo">{rotuloSemana}</span>
        <button className="btn btn-ghost btn-sm" onClick={() => setInicioSemana((d) => { const n = new Date(d); n.setDate(n.getDate() + 7); return n })}>Próxima semana →</button>
      </div>

      {carregando ? (
        <SkeletonLista itens={3} />
      ) : (
        <>
          <div className="agenda-grade">
            {diasDaSemana.map((dia, i) => {
              const sessoesDoDia = (sessoesPorDia.get(dia.toDateString()) || []).sort((a, b) => +new Date(a.data_sessao) - +new Date(b.data_sessao))
              return (
                <div className={`agenda-dia ${dia.toDateString() === hoje ? 'hoje' : ''}`} key={i}>
                  <div className="agenda-dia-cabecalho">{DIAS_SEMANA[i]}</div>
                  <div className="agenda-dia-numero">{dia.getDate()}</div>
                  {sessoesDoDia.map((s) => (
                    <Link key={s.id} to={`/admin/cliente/${s.client_id}`} className="agenda-sessao-mini" title={`${s.cliente?.full_name || s.cliente?.email} — ${s.titulo}`}>
                      {new Date(s.data_sessao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })} {s.cliente?.full_name || s.cliente?.email}
                    </Link>
                  ))}
                </div>
              )
            })}
          </div>

          <div className="agenda-lista-mobile">
            {proximasOrdenadas.length === 0 ? (
              <EmptyState icone={<IconCalendar size={22} />} titulo="Nenhuma sessão futura agendada ainda" />
            ) : (
              sessoesAgrupadasPorDiaMobile.map((grupo) => (
                <div key={grupo.rotulo}>
                  <div className="agenda-dia-mobile-titulo">{grupo.rotulo}</div>
                  <div className="lista-cards">
                    {grupo.sessoes.map((s) => (
                      <Link to={`/admin/cliente/${s.client_id}`} key={s.id} className="linha-atendimento">
                        <div className="horario">
                          {new Date(s.data_sessao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}
                        </div>
                        <div className="info">
                          <strong>{s.cliente?.full_name || s.cliente?.email || 'desconhecido'}</strong>
                          <span>Sessão {s.numero} — {s.titulo} · {s.duracao_minutos} min</span>
                        </div>
                        <IconChevronRight size={16} className="seta" />
                      </Link>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      <section className="secao-admin" style={{ marginTop: '2.6rem' }}>
        <h2>Todas as próximas sessões</h2>
        {proximasOrdenadas.length === 0 ? (
          <p className="texto-vazio">Nenhuma sessão futura agendada ainda.</p>
        ) : (
          <ul className="lista-itens">
            {proximasOrdenadas.map((s) => (
              <li key={s.id} className="item">
                <div>
                  <span className="status-tag">{formatarData(s.data_sessao)}</span>
                  <strong style={{ display: 'block', marginTop: '.4rem' }}>
                    Sessão {s.numero} — {s.titulo}
                  </strong>
                  <p>
                    Cliente:{' '}
                    <Link to={`/admin/cliente/${s.client_id}`} className="link-ferramenta" style={{ display: 'inline' }}>
                      {s.cliente?.full_name || s.cliente?.email || 'desconhecido'}
                    </Link>
                  </p>
                  <p>
                    {s.duracao_minutos} min
                    {s.valor != null ? ` · R$ ${Number(s.valor).toFixed(2).replace('.', ',')}` : ''}
                  </p>
                  <a className="link-ferramenta" href={linkGoogleAgenda(s)} target="_blank" rel="noopener noreferrer">
                    <IconExternal size={13} /> Adicionar ao Google Agenda
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="secao-admin">
        <h2>Meu desempenho</h2>
        <div className="grid-desempenho">
          <div className="cartao-metrica">
            <span className="metrica-numero">{totalClientesAtendidos}</span>
            <span className="metrica-legenda">clientes atendidos</span>
          </div>
          <div className="cartao-metrica">
            <span className="metrica-numero">{totalHoras.toFixed(1)}</span>
            <span className="metrica-legenda">horas de atendimento</span>
          </div>
          <div className="cartao-metrica">
            <span className="metrica-numero">R$ {totalValor.toFixed(2).replace('.', ',')}</span>
            <span className="metrica-legenda">valor acumulado</span>
          </div>
        </div>
        <p className="texto-vazio" style={{ marginTop: '.9rem' }}>
          Calculado com base nas sessões cuja data já passou.
        </p>
      </section>
    </Layout>
  )
}
