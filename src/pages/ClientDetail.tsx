import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase, enviarEmail, excluirCliente, type Profile, type Goal, type Tool, type Session } from '../supabaseClient'
import Layout from '../Layout'
import Avatar from '../components/ui/Avatar'
import EmptyState from '../components/ui/EmptyState'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ProgressBar from '../components/ui/ProgressBar'
import { useToast } from '../hooks/useToast'
import {
  IconArrowLeft, IconEdit, IconMail, IconTrash, IconPhone, IconCake, IconCheck,
  IconCalendar, IconTarget, IconBook, IconMessage, IconExternal, IconPlus,
} from '../components/ui/Icons'

type Aba = 'geral' | 'sessoes' | 'metas' | 'materiais' | 'feedback'

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const [cliente, setCliente] = useState<Profile | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [tools, setTools] = useState<Tool[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [carregando, setCarregando] = useState(true)
  const [aba, setAba] = useState<Aba>('geral')

  const [editando, setEditando] = useState(false)
  const [nomeEdit, setNomeEdit] = useState('')
  const [telefoneEdit, setTelefoneEdit] = useState('')
  const [nascimentoEdit, setNascimentoEdit] = useState('')
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)
  const [confirmarExclusao, setConfirmarExclusao] = useState(false)
  const [excluindo, setExcluindo] = useState(false)

  const [novaMetaTitulo, setNovaMetaTitulo] = useState('')
  const [novaMetaDescricao, setNovaMetaDescricao] = useState('')
  const [novaFerramentaTitulo, setNovaFerramentaTitulo] = useState('')
  const [novaFerramentaDescricao, setNovaFerramentaDescricao] = useState('')
  const [novaFerramentaLink, setNovaFerramentaLink] = useState('')

  const [novaSessaoTitulo, setNovaSessaoTitulo] = useState('')
  const [novaSessaoResumo, setNovaSessaoResumo] = useState('')
  const [novaSessaoData, setNovaSessaoData] = useState('')
  const [novaSessaoValor, setNovaSessaoValor] = useState('')
  const [novaSessaoDuracao, setNovaSessaoDuracao] = useState('60')
  const [salvandoSessao, setSalvandoSessao] = useState(false)
  const [mostrarFormSessao, setMostrarFormSessao] = useState(false)

  const [enviandoEmail, setEnviandoEmail] = useState(false)

  useEffect(() => {
    if (id) carregarTudo(id)
  }, [id])

  async function carregarTudo(clientId: string) {
    setCarregando(true)
    const [{ data: perfil }, { data: metas }, { data: ferramentas }, { data: sessoes }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', clientId).single(),
      supabase.from('goals').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
      supabase.from('tools').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
      supabase.from('sessions').select('*').eq('client_id', clientId).order('numero', { ascending: false }),
    ])
    setCliente(perfil as Profile)
    if (perfil) {
      setNomeEdit((perfil as Profile).full_name || '')
      setTelefoneEdit((perfil as Profile).phone || '')
      setNascimentoEdit((perfil as Profile).birth_date || '')
    }
    setGoals((metas as Goal[]) || [])
    setTools((ferramentas as Tool[]) || [])
    setSessions((sessoes as Session[]) || [])
    setCarregando(false)
  }

  async function salvarEdicaoCliente(e: FormEvent) {
    e.preventDefault()
    if (!id) return
    setSalvandoEdicao(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: nomeEdit.trim() || null,
        phone: telefoneEdit.trim() || null,
        birth_date: nascimentoEdit || null,
      })
      .eq('id', id)
    setSalvandoEdicao(false)
    if (!error) {
      setEditando(false)
      toast.sucesso('Cadastro atualizado')
      carregarTudo(id)
    } else {
      toast.erro('Não foi possível salvar as alterações')
    }
  }

  async function handleExcluirCliente() {
    if (!id || !cliente) return
    setExcluindo(true)
    try {
      await excluirCliente(id)
      toast.sucesso('Cliente excluído')
      navigate('/admin/clientes')
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : 'Erro ao excluir cliente.')
      setExcluindo(false)
      setConfirmarExclusao(false)
    }
  }

  async function adicionarMeta(e: FormEvent) {
    e.preventDefault()
    if (!id || !novaMetaTitulo.trim()) return
    const { error } = await supabase.from('goals').insert({
      client_id: id,
      title: novaMetaTitulo.trim(),
      description: novaMetaDescricao.trim() || null,
    })
    if (!error) {
      setNovaMetaTitulo('')
      setNovaMetaDescricao('')
      toast.sucesso('Meta adicionada')
      carregarTudo(id)
    } else {
      toast.erro('Não foi possível adicionar a meta')
    }
  }

  async function apagarMeta(goalId: string) {
    if (!id) return
    await supabase.from('goals').delete().eq('id', goalId)
    toast.sucesso('Meta removida')
    carregarTudo(id)
  }

  async function adicionarFerramenta(e: FormEvent) {
    e.preventDefault()
    if (!id || !novaFerramentaTitulo.trim()) return
    const { error } = await supabase.from('tools').insert({
      client_id: id,
      title: novaFerramentaTitulo.trim(),
      description: novaFerramentaDescricao.trim() || null,
      link: novaFerramentaLink.trim() || null,
    })
    if (!error) {
      setNovaFerramentaTitulo('')
      setNovaFerramentaDescricao('')
      setNovaFerramentaLink('')
      toast.sucesso('Material adicionado')
      carregarTudo(id)
    } else {
      toast.erro('Não foi possível adicionar o material')
    }
  }

  async function apagarFerramenta(toolId: string) {
    if (!id) return
    await supabase.from('tools').delete().eq('id', toolId)
    toast.sucesso('Material removido')
    carregarTudo(id)
  }

  async function adicionarSessao(e: FormEvent) {
    e.preventDefault()
    if (!id || !cliente || !novaSessaoTitulo.trim() || !novaSessaoData) return
    setSalvandoSessao(true)
    const proximoNumero = sessions.length > 0 ? Math.max(...sessions.map((s) => s.numero)) + 1 : 1
    const dataIso = new Date(novaSessaoData).toISOString()
    const { error } = await supabase.from('sessions').insert({
      client_id: id,
      numero: proximoNumero,
      titulo: novaSessaoTitulo.trim(),
      resumo: novaSessaoResumo.trim() || null,
      data_sessao: dataIso,
      valor: novaSessaoValor ? Number(novaSessaoValor) : null,
      duracao_minutos: Number(novaSessaoDuracao) || 60,
    })
    if (!error) {
      const dataFormatada = new Date(dataIso).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
        timeZone: 'America/Sao_Paulo',
      })
      enviarEmail({
        to: cliente.email,
        subject: 'Nova sessão agendada',
        text: `Olá, ${cliente.full_name || ''}!\n\nSua sessão "${novaSessaoTitulo.trim()}" (Sessão ${proximoNumero}) foi agendada para ${dataFormatada}, com duração de ${novaSessaoDuracao || 60} minutos.\n\nAté lá!\nLiliane`,
      }).catch(() => {})

      setNovaSessaoTitulo('')
      setNovaSessaoResumo('')
      setNovaSessaoData('')
      setNovaSessaoValor('')
      setNovaSessaoDuracao('60')
      setMostrarFormSessao(false)
      toast.sucesso('Sessão salva — cliente avisado por e-mail')
      carregarTudo(id)
    } else {
      toast.erro('Não foi possível salvar a sessão')
    }
    setSalvandoSessao(false)
  }

  async function apagarSessao(sessionId: string) {
    if (!id) return
    await supabase.from('sessions').delete().eq('id', sessionId)
    toast.sucesso('Sessão removida')
    carregarTudo(id)
  }

  async function enviarEmailParaCliente() {
    if (!cliente) return
    setEnviandoEmail(true)
    try {
      await enviarEmail({
        to: cliente.email,
        subject: 'Novidades no seu portal de acompanhamento',
        text: `Olá, ${cliente.full_name || ''}!\n\nVocê já tem novidades no seu portal de acompanhamento — metas, sessões e materiais atualizados.\n\nAcesse com seu e-mail e senha combinados.\n\nQualquer dúvida, me chama!\nLiliane`,
      })
      toast.sucesso('E-mail enviado com sucesso')
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : 'Erro ao enviar e-mail.')
    } finally {
      setEnviandoEmail(false)
    }
  }

  function formatarData(iso: string) {
    const d = new Date(iso)
    return d.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    })
  }

  function formatarDataCurta(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'America/Sao_Paulo' })
  }

  function formatarNascimento(iso: string) {
    const [ano, mes, dia] = iso.split('-')
    return `${dia}/${mes}/${ano}`
  }

  function linkGoogleAgenda(s: Session) {
    const inicio = new Date(s.data_sessao)
    const fim = new Date(inicio.getTime() + s.duracao_minutos * 60000)
    const formatar = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `Sessão ${s.numero} — ${s.titulo} (${cliente?.full_name || cliente?.email || 'cliente'})`,
      dates: `${formatar(inicio)}/${formatar(fim)}`,
      details: s.resumo || 'Sessão de acompanhamento.',
    })
    return `https://calendar.google.com/calendar/render?${params.toString()}`
  }

  const proximasSessoes = useMemo(() => sessions.filter((s) => new Date(s.data_sessao) > new Date()).sort((a, b) => +new Date(a.data_sessao) - +new Date(b.data_sessao)), [sessions])
  const sessoesPassadas = useMemo(() => sessions.filter((s) => new Date(s.data_sessao) <= new Date()), [sessions])
  const feedbacks = useMemo(() => sessoesPassadas.filter((s) => s.feedback_cliente), [sessoesPassadas])
  const metasConcluidas = goals.filter((g) => g.status === 'concluida').length
  const percentualMetas = goals.length > 0 ? (metasConcluidas / goals.length) * 100 : 0

  if (carregando) {
    return (
      <Layout titulo="Carregando...">
        <div className="skeleton skeleton-card" style={{ height: 120, marginBottom: '1.4rem' }} />
        <div className="skeleton skeleton-card" style={{ height: 200 }} />
      </Layout>
    )
  }

  if (!cliente) {
    return (
      <Layout titulo="Cliente não encontrado">
        <Link to="/admin/clientes" className="link-voltar"><IconArrowLeft size={15} /> Voltar para a lista</Link>
      </Layout>
    )
  }

  return (
    <Layout titulo={cliente.full_name || cliente.email}>
      <Link to="/admin/clientes" className="link-voltar" style={{ marginBottom: '1rem', display: 'inline-flex' }}>
        <IconArrowLeft size={15} /> Voltar para a lista de clientes
      </Link>

      <div className="cabecalho-cliente-novo">
        <Avatar nome={cliente.full_name || cliente.email} tamanho="lg" />
        <div className="info">
          <h1 style={{ marginBottom: '.2em' }}>{cliente.full_name || 'Sem nome'}</h1>
          <div className="linha-contato">
            <span><IconMail size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />{cliente.email}</span>
            {cliente.phone && <span><IconPhone size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />{cliente.phone}</span>}
            {cliente.birth_date && <span><IconCake size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />{formatarNascimento(cliente.birth_date)}</span>}
          </div>
          <p style={{ marginTop: '.4rem', fontSize: '.82rem', color: cliente.consentimento_lgpd ? 'var(--green)' : 'var(--ink-faint)' }}>
            {cliente.consentimento_lgpd
              ? `✓ Termos aceitos em ${new Date(cliente.consentimento_em!).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`
              : '⏳ Ainda não aceitou os termos de privacidade'}
          </p>
        </div>
        <div className="acoes">
          <button className="btn btn-ghost btn-sm" onClick={() => setEditando(!editando)}>
            <IconEdit size={15} /> {editando ? 'Cancelar' : 'Editar'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={enviarEmailParaCliente} disabled={enviandoEmail}>
            <IconMail size={15} /> {enviandoEmail ? 'Enviando...' : 'Enviar e-mail'}
          </button>
          <button className="btn btn-danger" onClick={() => setConfirmarExclusao(true)}>
            <IconTrash size={15} /> Excluir
          </button>
        </div>
      </div>

      {editando && (
        <form onSubmit={salvarEdicaoCliente} className="form-sessao">
          <input type="text" placeholder="Nome" value={nomeEdit} onChange={(e) => setNomeEdit(e.target.value)} />
          <div className="form-linha">
            <label>
              Telefone
              <input type="tel" value={telefoneEdit} onChange={(e) => setTelefoneEdit(e.target.value)} />
            </label>
            <label>
              Data de nascimento
              <input type="date" value={nascimentoEdit} onChange={(e) => setNascimentoEdit(e.target.value)} />
            </label>
          </div>
          <button type="submit" className="btn btn-primario" disabled={salvandoEdicao}>
            {salvandoEdicao ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </form>
      )}

      <div className="grid-stats" style={{ marginBottom: '1.6rem' }}>
        <div className="stat-card">
          <span className="stat-legenda">Próxima sessão</span>
          <span className="stat-numero" style={{ fontSize: '1.2rem' }}>
            {proximasSessoes[0] ? formatarDataCurta(proximasSessoes[0].data_sessao) : '—'}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-legenda">Sessões realizadas</span>
          <span className="stat-numero" style={{ fontSize: '1.2rem' }}>{sessoesPassadas.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-legenda">Progresso das metas</span>
          <span className="stat-numero" style={{ fontSize: '1.2rem' }}>{goals.length > 0 ? `${Math.round(percentualMetas)}%` : '—'}</span>
        </div>
        <div className="stat-card">
          <span className="stat-legenda">Materiais</span>
          <span className="stat-numero" style={{ fontSize: '1.2rem' }}>{tools.length}</span>
        </div>
      </div>

      <div className="abas">
        <button className={`aba-botao ${aba === 'geral' ? 'ativa' : ''}`} onClick={() => setAba('geral')}>Visão geral</button>
        <button className={`aba-botao ${aba === 'sessoes' ? 'ativa' : ''}`} onClick={() => setAba('sessoes')}>Sessões</button>
        <button className={`aba-botao ${aba === 'metas' ? 'ativa' : ''}`} onClick={() => setAba('metas')}>Metas</button>
        <button className={`aba-botao ${aba === 'materiais' ? 'ativa' : ''}`} onClick={() => setAba('materiais')}>Materiais</button>
        <button className={`aba-botao ${aba === 'feedback' ? 'ativa' : ''}`} onClick={() => setAba('feedback')}>Feedback</button>
      </div>

      {aba === 'geral' && (
        <div>
          <section className="secao">
            <div className="secao-cabecalho"><h2>Próximas sessões</h2></div>
            {proximasSessoes.length === 0 ? (
              <EmptyState icone={<IconCalendar size={22} />} titulo="Nenhuma sessão futura agendada" />
            ) : (
              <ul className="lista-itens">
                {proximasSessoes.map((s) => (
                  <li key={s.id} className="item">
                    <div>
                      <span className="status-tag">{formatarData(s.data_sessao)}</span>
                      <strong style={{ display: 'block', marginTop: '.4rem' }}>Sessão {s.numero} — {s.titulo}</strong>
                      {s.resumo && <p>{s.resumo}</p>}
                      <p>{s.duracao_minutos} min{s.valor != null ? ` · R$ ${Number(s.valor).toFixed(2).replace('.', ',')}` : ''}</p>
                      <a className="link-ferramenta" href={linkGoogleAgenda(s)} target="_blank" rel="noopener noreferrer">
                        <IconExternal size={13} /> Adicionar ao Google Agenda
                      </a>
                    </div>
                    <button className="btn-apagar" onClick={() => apagarSessao(s.id)}>Remover</button>
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
                    <div>
                      <strong>{g.title}</strong>
                      {g.description && <p>{g.description}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {aba === 'sessoes' && (
        <div>
          <section className="secao">
            <div className="secao-cabecalho">
              <h2>Registrar / agendar sessão</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setMostrarFormSessao((v) => !v)}>
                <IconPlus size={15} /> {mostrarFormSessao ? 'Fechar' : 'Nova sessão'}
              </button>
            </div>
            {mostrarFormSessao && (
              <form onSubmit={adicionarSessao} className="form-sessao">
                <input
                  type="text"
                  placeholder="Nome da sessão (ex: Sessão de acolhimento)"
                  value={novaSessaoTitulo}
                  onChange={(e) => setNovaSessaoTitulo(e.target.value)}
                  required
                />
                <textarea
                  placeholder="Resumo da sessão (opcional)"
                  value={novaSessaoResumo}
                  onChange={(e) => setNovaSessaoResumo(e.target.value)}
                  rows={3}
                />
                <div className="form-linha">
                  <label>
                    Data e hora
                    <input
                      type="datetime-local"
                      value={novaSessaoData}
                      onChange={(e) => setNovaSessaoData(e.target.value)}
                      required
                    />
                  </label>
                  <label>
                    Valor (R$)
                    <input
                      type="number"
                      step="0.01"
                      placeholder="150.00"
                      value={novaSessaoValor}
                      onChange={(e) => setNovaSessaoValor(e.target.value)}
                    />
                  </label>
                  <label>
                    Duração (min)
                    <input
                      type="number"
                      value={novaSessaoDuracao}
                      onChange={(e) => setNovaSessaoDuracao(e.target.value)}
                    />
                  </label>
                </div>
                <button type="submit" className="btn btn-primario" disabled={salvandoSessao}>
                  {salvandoSessao ? 'Salvando...' : 'Salvar sessão'}
                </button>
                <p className="texto-vazio" style={{ margin: 0 }}>O cliente recebe um e-mail automático avisando da nova sessão.</p>
              </form>
            )}
          </section>

          <section className="secao">
            <div className="secao-cabecalho"><h2>Histórico de sessões</h2></div>
            {sessions.length === 0 ? (
              <EmptyState icone={<IconCalendar size={22} />} titulo="Nenhuma sessão registrada ainda" />
            ) : (
              <div className="timeline">
                {[...proximasSessoes, ...sessoesPassadas].map((s, i, arr) => {
                  const passado = new Date(s.data_sessao) <= new Date()
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
                          {passado && (
                            s.feedback_cliente ? (
                              <div className="caixa-feedback">
                                <strong>Feedback do cliente:</strong>
                                <p>{s.feedback_cliente}</p>
                                <p style={{ marginTop: '.4rem', fontSize: '.8rem', color: 'var(--rose)', fontWeight: 600 }}>
                                  {s.feedback_autoriza_compartilhar
                                    ? `✓ Autorizou compartilhar publicamente ${s.feedback_anonimo ? '(anônimo)' : '(com nome)'}`
                                    : '✗ Não autorizou compartilhamento público'}
                                </p>
                              </div>
                            ) : (
                              <p className="texto-vazio">O cliente ainda não deixou feedback desta sessão.</p>
                            )
                          )}
                          <div className="item-acoes">
                            <a className="link-ferramenta" href={linkGoogleAgenda(s)} target="_blank" rel="noopener noreferrer">
                              <IconExternal size={13} /> Google Agenda
                            </a>
                            <button className="btn-apagar" onClick={() => apagarSessao(s.id)}>Remover</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {aba === 'metas' && (
        <div>
          <div className="progresso-metas">
            <div className="progresso-metas-topo">
              <span>Progresso geral</span>
              <span className="progresso-metas-numero">{metasConcluidas} de {goals.length}</span>
            </div>
            <ProgressBar percentual={percentualMetas} variante="verde" />
          </div>

          <section className="secao">
            <div className="secao-cabecalho"><h2>Adicionar meta</h2></div>
            <form onSubmit={adicionarMeta} className="form-inline">
              <input
                type="text"
                placeholder="Título da meta"
                value={novaMetaTitulo}
                onChange={(e) => setNovaMetaTitulo(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Descrição (opcional)"
                value={novaMetaDescricao}
                onChange={(e) => setNovaMetaDescricao(e.target.value)}
              />
              <button type="submit" className="btn btn-primario">Adicionar</button>
            </form>

            {goals.length === 0 ? (
              <EmptyState icone={<IconTarget size={22} />} titulo="Nenhuma meta cadastrada ainda" />
            ) : (
              <ul className="lista-itens">
                {goals.map((g) => (
                  <li key={g.id} className={`item ${g.status === 'concluida' ? 'concluido' : ''}`}>
                    <div>
                      <strong>{g.title}</strong>
                      {g.description && <p>{g.description}</p>}
                      <span className="status-tag" style={g.status === 'concluida' ? { background: 'var(--green-soft)', color: '#5a7160' } : undefined}>
                        {g.status === 'concluida' ? <><IconCheck size={11} /> Concluída</> : 'Em andamento'}
                      </span>
                    </div>
                    <button className="btn-apagar" onClick={() => apagarMeta(g.id)}>Remover</button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {aba === 'materiais' && (
        <section className="secao">
          <div className="secao-cabecalho"><h2>Ferramentas e materiais</h2></div>
          <form onSubmit={adicionarFerramenta} className="form-inline">
            <input
              type="text"
              placeholder="Título"
              value={novaFerramentaTitulo}
              onChange={(e) => setNovaFerramentaTitulo(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Descrição (opcional)"
              value={novaFerramentaDescricao}
              onChange={(e) => setNovaFerramentaDescricao(e.target.value)}
            />
            <input
              type="url"
              placeholder="Link (opcional)"
              value={novaFerramentaLink}
              onChange={(e) => setNovaFerramentaLink(e.target.value)}
            />
            <button type="submit" className="btn btn-primario">Adicionar</button>
          </form>

          {tools.length === 0 ? (
            <EmptyState icone={<IconBook size={22} />} titulo="Nenhum material cadastrado ainda" />
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
                  <button className="btn-apagar" onClick={() => apagarFerramenta(t.id)}>Remover</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {aba === 'feedback' && (
        <section className="secao">
          <div className="secao-cabecalho"><h2>Feedbacks recebidos</h2></div>
          {feedbacks.length === 0 ? (
            <EmptyState icone={<IconMessage size={22} />} titulo="Nenhum feedback recebido ainda" descricao="Os feedbacks aparecem aqui assim que o cliente responde após uma sessão." />
          ) : (
            <ul className="lista-itens">
              {feedbacks.map((s) => (
                <li key={s.id} className="item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <span className="status-tag" style={{ alignSelf: 'flex-start', marginBottom: '.4rem' }}>{formatarData(s.data_sessao)}</span>
                  <strong>Sessão {s.numero} — {s.titulo}</strong>
                  <div className="caixa-feedback">
                    <p>{s.feedback_cliente}</p>
                    <p style={{ marginTop: '.4rem', fontSize: '.8rem', color: 'var(--rose)', fontWeight: 600 }}>
                      {s.feedback_autoriza_compartilhar
                        ? `✓ Autorizou compartilhar publicamente ${s.feedback_anonimo ? '(anônimo)' : '(com nome)'}`
                        : '✗ Não autorizou compartilhamento público'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <ConfirmDialog
        aberto={confirmarExclusao}
        titulo="Excluir cliente?"
        descricao={`Isso apaga também todas as metas, ferramentas, sessões e feedbacks de ${cliente.full_name || cliente.email}. Essa ação não pode ser desfeita.`}
        confirmando={excluindo}
        onConfirmar={handleExcluirCliente}
        onCancelar={() => setConfirmarExclusao(false)}
      />
    </Layout>
  )
}
