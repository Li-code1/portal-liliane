import { useEffect, useMemo, useState } from 'react'
import { supabase, enviarEmail, type Goal, type Tool, type Session } from '../supabaseClient'
import { useAuth } from '../useAuth'
import Layout from '../Layout'
import EmptyState from '../components/ui/EmptyState'
import ProgressBar from '../components/ui/ProgressBar'
import WelcomeCard from '../components/ui/WelcomeCard'
import { SkeletonLista } from '../components/ui/Skeleton'
import { useToast } from '../hooks/useToast'
import {
  IconCalendar, IconTarget, IconBook, IconMessage, IconExternal,
} from '../components/ui/Icons'

type RascunhoFeedback = {
  texto: string
  autoriza: '' | 'sim' | 'nao'
  anonimo: '' | 'sim' | 'nao'
}

const RASCUNHO_VAZIO: RascunhoFeedback = { texto: '', autoriza: '', anonimo: '' }
type Aba = 'geral' | 'metas' | 'sessoes' | 'materiais'

export default function ClientDashboard() {
  const { profile } = useAuth()
  const toast = useToast()
  const [goals, setGoals] = useState<Goal[]>([])
  const [tools, setTools] = useState<Tool[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [carregando, setCarregando] = useState(true)
  const [aba, setAba] = useState<Aba>('geral')
  const [rascunhos, setRascunhos] = useState<Record<string, RascunhoFeedback>>({})
  const [enviando, setEnviando] = useState<string | null>(null)

  useEffect(() => {
    if (profile) carregar(profile.id)
  }, [profile])

  async function carregar(clientId: string) {
    setCarregando(true)
    const [{ data: metas }, { data: ferramentas }, { data: sessoes }] = await Promise.all([
      supabase.from('goals').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
      supabase.from('tools').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
      supabase.from('sessions').select('*').eq('client_id', clientId).order('numero', { ascending: false }),
    ])
    setGoals((metas as Goal[]) || [])
    setTools((ferramentas as Tool[]) || [])
    setSessions((sessoes as Session[]) || [])
    setCarregando(false)
  }

  async function alternarStatus(goal: Goal) {
    const novoStatus = goal.status === 'concluida' ? 'em_andamento' : 'concluida'
    const { error } = await supabase.from('goals').update({ status: novoStatus }).eq('id', goal.id)
    if (!error && profile) carregar(profile.id)
  }

  function atualizarRascunho(sessaoId: string, campo: keyof RascunhoFeedback, valor: string) {
    const atual = rascunhos[sessaoId] || RASCUNHO_VAZIO
    setRascunhos({ ...rascunhos, [sessaoId]: { ...atual, [campo]: valor } })
  }

  async function enviarFeedback(sessao: Session) {
    const rascunho = rascunhos[sessao.id] || RASCUNHO_VAZIO
    const texto = rascunho.texto.trim()
    if (!texto || !rascunho.autoriza) return
    if (rascunho.autoriza === 'sim' && !rascunho.anonimo) return

    setEnviando(sessao.id)
    try {
      const autoriza = rascunho.autoriza === 'sim'
      const anonimo = rascunho.autoriza === 'sim' ? rascunho.anonimo === 'sim' : null

      const { error } = await supabase.rpc('submit_session_feedback', {
        p_session_id: sessao.id,
        p_feedback: texto,
        p_autoriza_compartilhar: autoriza,
        p_anonimo: anonimo,
      })
      if (error) throw error

      const linhaConsentimento = autoriza
        ? `Autorizou compartilhar no site/redes sociais (${anonimo ? 'de forma anônima' : 'com nome'}).`
        : 'Não autorizou compartilhar publicamente.'

      enviarEmail({
        to: 'lilianelimapsicanalista@gmail.com',
        subject: `Novo feedback de sessão — ${profile?.full_name || profile?.email}`,
        text: `${profile?.full_name || profile?.email} deixou um feedback na Sessão ${sessao.numero} (${sessao.titulo}):\n\n"${texto}"\n\n${linhaConsentimento}`,
      }).catch(() => {})

      toast.sucesso('Feedback enviado — obrigada por compartilhar')
      if (profile) carregar(profile.id)
    } catch {
      toast.erro('Não foi possível enviar o feedback agora.')
    } finally {
      setEnviando(null)
    }
  }

  function formatarData(iso: string) {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    })
  }
  function formatarDataCurta(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'America/Sao_Paulo' })
  }
  function formatarHora(iso: string) {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
  }

  function linkGoogleAgenda(s: Session) {
    const inicio = new Date(s.data_sessao)
    const fim = new Date(inicio.getTime() + s.duracao_minutos * 60000)
    const formatar = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `Sessão ${s.numero} — ${s.titulo} (Liliane Lima)`,
      dates: `${formatar(inicio)}/${formatar(fim)}`,
      details: s.resumo || 'Sessão de acompanhamento com Liliane Lima.',
    })
    return `https://calendar.google.com/calendar/render?${params.toString()}`
  }

  const proximasSessoes = useMemo(() => sessions.filter((s) => new Date(s.data_sessao) > new Date()).sort((a, b) => +new Date(a.data_sessao) - +new Date(b.data_sessao)), [sessions])
  const sessoesPassadas = useMemo(() => sessions.filter((s) => new Date(s.data_sessao) <= new Date()), [sessions])
  const metasConcluidas = goals.filter((g) => g.status === 'concluida').length
  const percentualMetas = goals.length > 0 ? (metasConcluidas / goals.length) * 100 : 0
  const proximaSessao = proximasSessoes[0]

  const primeiroNome = (profile?.full_name || '').trim().split(' ')[0]

  return (
    <Layout titulo="Seu acompanhamento">
      <div className="saudacao">
        <h1>Olá{primeiroNome ? `, ${primeiroNome}` : ''} 🌿</h1>
        <p className="subtitulo-pagina">Que bom ter você por aqui.</p>
      </div>

      {profile && <WelcomeCard clienteId={profile.id} primeiroNome={primeiroNome} />}

      {carregando ? (
        <SkeletonLista itens={2} />
      ) : (
        <div className="grid-duas-colunas" style={{ marginBottom: '.4rem' }}>
          <div className="cartao-destaque">
            <span className="rotulo">Próxima sessão</span>
            {proximaSessao ? (
              <>
                <span className="valor-grande">{formatarDataCurta(proximaSessao.data_sessao)} · {formatarHora(proximaSessao.data_sessao)}</span>
                <span className="detalhe">Sessão {proximaSessao.numero} — {proximaSessao.titulo}</span>
                <a className="link-ferramenta" href={linkGoogleAgenda(proximaSessao)} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', marginTop: '.5rem' }}>
                  <IconExternal size={13} /> Adicionar ao Google Agenda
                </a>
              </>
            ) : (
              <span className="detalhe">Nenhuma sessão agendada no momento.</span>
            )}
          </div>
          <div className="card">
            <span className="stat-legenda">Seu progresso</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '.4rem', margin: '.3rem 0 .7rem' }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 700 }}>{metasConcluidas} / {goals.length}</span>
              <span className="texto-vazio">metas</span>
            </div>
            <ProgressBar percentual={percentualMetas} variante="verde" />
          </div>
        </div>
      )}

      <div className="grid-atalhos" style={{ marginTop: '1.6rem' }}>
        <button className="atalho" onClick={() => setAba('metas')}>
          <div className="stat-icone"><IconTarget size={18} /></div>
          <strong>Metas</strong>
        </button>
        <button className="atalho" onClick={() => setAba('sessoes')}>
          <div className="stat-icone"><IconCalendar size={18} /></div>
          <strong>Sessões</strong>
        </button>
        <button className="atalho" onClick={() => setAba('materiais')}>
          <div className="stat-icone"><IconBook size={18} /></div>
          <strong>Materiais</strong>
        </button>
        <button className="atalho" onClick={() => setAba('geral')}>
          <div className="stat-icone"><IconMessage size={18} /></div>
          <strong>Visão geral</strong>
        </button>
      </div>

      <div className="abas">
        <button className={`aba-botao ${aba === 'geral' ? 'ativa' : ''}`} onClick={() => setAba('geral')}>Visão geral</button>
        <button className={`aba-botao ${aba === 'metas' ? 'ativa' : ''}`} onClick={() => setAba('metas')}>Metas</button>
        <button className={`aba-botao ${aba === 'sessoes' ? 'ativa' : ''}`} onClick={() => setAba('sessoes')}>Sessões</button>
        <button className={`aba-botao ${aba === 'materiais' ? 'ativa' : ''}`} onClick={() => setAba('materiais')}>Materiais</button>
      </div>

      {aba === 'geral' && (
        <div>
          <section className="secao">
            <div className="secao-cabecalho"><h2>Suas próximas sessões</h2></div>
            {proximasSessoes.length === 0 ? (
              <EmptyState icone={<IconCalendar size={22} />} titulo="Nenhuma sessão futura agendada ainda" />
            ) : (
              <ul className="lista-itens">
                {proximasSessoes.map((s) => (
                  <li key={s.id} className="item">
                    <div>
                      <span className="status-tag">{formatarData(s.data_sessao)}</span>
                      <strong style={{ display: 'block', marginTop: '.4rem' }}>Sessão {s.numero} — {s.titulo}</strong>
                      <p>{s.duracao_minutos} min{s.valor != null ? ` · R$ ${Number(s.valor).toFixed(2).replace('.', ',')}` : ''}</p>
                      <a className="link-ferramenta" href={linkGoogleAgenda(s)} target="_blank" rel="noopener noreferrer">
                        <IconExternal size={13} /> Adicionar ao Google Agenda
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="secao">
            <div className="secao-cabecalho"><h2>Metas em andamento</h2></div>
            {goals.filter((g) => g.status === 'em_andamento').length === 0 ? (
              <EmptyState icone={<IconTarget size={22} />} titulo="Nenhuma meta em andamento" />
            ) : (
              <ul className="lista-itens">
                {goals.filter((g) => g.status === 'em_andamento').map((g) => (
                  <li key={g.id} className="item">
                    <label className="checkbox-meta">
                      <input type="checkbox" checked={false} onChange={() => alternarStatus(g)} />
                      <div>
                        <strong>{g.title}</strong>
                        {g.description && <p>{g.description}</p>}
                      </div>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {aba === 'metas' && (
        <section className="secao">
          <div className="progresso-metas">
            <div className="progresso-metas-topo">
              <span>Seu progresso</span>
              <span className="progresso-metas-numero">{metasConcluidas} de {goals.length} metas concluídas</span>
            </div>
            <ProgressBar percentual={percentualMetas} variante="verde" />
          </div>
          {goals.length === 0 ? (
            <EmptyState icone={<IconTarget size={22} />} titulo="Nenhuma meta por aqui ainda" descricao="Em breve a Liliane vai adicionar suas metas de acompanhamento." />
          ) : (
            <ul className="lista-itens">
              {goals.map((g) => (
                <li key={g.id} className={`item ${g.status === 'concluida' ? 'concluido' : ''}`}>
                  <label className="checkbox-meta">
                    <input
                      type="checkbox"
                      checked={g.status === 'concluida'}
                      onChange={() => alternarStatus(g)}
                    />
                    <div>
                      <strong>{g.title}</strong>
                      {g.description && <p>{g.description}</p>}
                    </div>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {aba === 'sessoes' && (
        <section className="secao">
          <div className="secao-cabecalho"><h2>Histórico de sessões e feedback</h2></div>
          {sessoesPassadas.length === 0 && proximasSessoes.length === 0 ? (
            <EmptyState icone={<IconCalendar size={22} />} titulo="Nenhuma sessão registrada ainda" />
          ) : (
            <div className="timeline">
              {[...proximasSessoes, ...sessoesPassadas].map((s, i, arr) => {
                const passado = new Date(s.data_sessao) <= new Date()
                const rascunho = rascunhos[s.id] || RASCUNHO_VAZIO
                const podeEnviar = rascunho.texto.trim() && rascunho.autoriza && (rascunho.autoriza === 'nao' || rascunho.anonimo)
                return (
                  <div className={`timeline-item ${passado ? 'passado' : ''}`} key={s.id}>
                    <div className="timeline-marcador">
                      <div className="timeline-ponto" />
                      {i < arr.length - 1 && <div className="timeline-linha" />}
                    </div>
                    <div className="timeline-conteudo">
                      <span className="timeline-data">{formatarData(s.data_sessao)}</span>
                      <div className="timeline-card">
                        <strong>Sessão {s.numero} — {s.titulo}</strong>
                        {s.resumo && <p>{s.resumo}</p>}
                        <p>{s.duracao_minutos} min{s.valor != null ? ` · R$ ${Number(s.valor).toFixed(2).replace('.', ',')}` : ''}</p>
                        {!passado && (
                          <a className="link-ferramenta" href={linkGoogleAgenda(s)} target="_blank" rel="noopener noreferrer">
                            <IconExternal size={13} /> Adicionar ao Google Agenda
                          </a>
                        )}
                        {passado && (
                          s.feedback_cliente ? (
                            <div className="caixa-feedback">
                              <strong>Seu feedback enviado:</strong>
                              <p>{s.feedback_cliente}</p>
                              <p style={{ marginTop: '.4rem', fontSize: '.8rem', color: 'var(--ink-soft)' }}>
                                {s.feedback_autoriza_compartilhar
                                  ? `Você autorizou compartilhar ${s.feedback_anonimo ? '(de forma anônima)' : '(com seu nome)'}.`
                                  : 'Você optou por não autorizar o compartilhamento público.'}
                              </p>
                            </div>
                          ) : (
                            <div className="form-feedback">
                              <textarea
                                placeholder="Como foi essa sessão para você? Conte pra Liliane..."
                                rows={3}
                                value={rascunho.texto}
                                onChange={(e) => atualizarRascunho(s.id, 'texto', e.target.value)}
                              />
                              <div className="pergunta-consentimento">
                                <span>Autoriza compartilhar esse feedback no site ou redes sociais da Liliane?</span>
                                <div className="opcoes-consentimento">
                                  <label>
                                    <input
                                      type="radio"
                                      name={`autoriza-${s.id}`}
                                      checked={rascunho.autoriza === 'sim'}
                                      onChange={() => atualizarRascunho(s.id, 'autoriza', 'sim')}
                                    />
                                    Sim
                                  </label>
                                  <label>
                                    <input
                                      type="radio"
                                      name={`autoriza-${s.id}`}
                                      checked={rascunho.autoriza === 'nao'}
                                      onChange={() => atualizarRascunho(s.id, 'autoriza', 'nao')}
                                    />
                                    Não
                                  </label>
                                </div>
                              </div>
                              {rascunho.autoriza === 'sim' && (
                                <div className="pergunta-consentimento">
                                  <span>Prefere aparecer de forma anônima ou com seu nome?</span>
                                  <div className="opcoes-consentimento">
                                    <label>
                                      <input
                                        type="radio"
                                        name={`anonimo-${s.id}`}
                                        checked={rascunho.anonimo === 'sim'}
                                        onChange={() => atualizarRascunho(s.id, 'anonimo', 'sim')}
                                      />
                                      Anônimo
                                    </label>
                                    <label>
                                      <input
                                        type="radio"
                                        name={`anonimo-${s.id}`}
                                        checked={rascunho.anonimo === 'nao'}
                                        onChange={() => atualizarRascunho(s.id, 'anonimo', 'nao')}
                                      />
                                      Com meu nome
                                    </label>
                                  </div>
                                </div>
                              )}
                              <button
                                className="btn btn-primario"
                                onClick={() => enviarFeedback(s)}
                                disabled={enviando === s.id || !podeEnviar}
                              >
                                {enviando === s.id ? 'Enviando...' : 'Enviar feedback'}
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {aba === 'materiais' && (
        <section className="secao">
          <div className="secao-cabecalho"><h2>Ferramentas e materiais para você</h2></div>
          {tools.length === 0 ? (
            <EmptyState icone={<IconBook size={22} />} titulo="Nenhum material por aqui ainda" />
          ) : (
            <ul className="lista-itens">
              {tools.map((t) => (
                <li key={t.id} className="item">
                  <div>
                    <strong>{t.title}</strong>
                    {t.description && <p>{t.description}</p>}
                    {t.link && (
                      <a href={t.link} target="_blank" rel="noopener noreferrer" className="link-ferramenta">
                        <IconExternal size={13} /> Abrir material
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </Layout>
  )
}
