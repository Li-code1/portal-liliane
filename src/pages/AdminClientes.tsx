import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase, criarCliente, type Profile, type Session } from '../supabaseClient'
import Layout from '../Layout'
import Avatar from '../components/ui/Avatar'
import EmptyState from '../components/ui/EmptyState'
import { SkeletonLista } from '../components/ui/Skeleton'
import { useToast } from '../hooks/useToast'
import { IconUsers, IconSearch, IconChevronRight, IconPlus, IconX } from '../components/ui/Icons'

const PALAVRAS_SENHA = [
  'Girassol', 'Acolher', 'Essencia', 'Jardim', 'Estrela', 'Sereno',
  'Horizonte', 'Semente', 'Aurora', 'Raiz', 'Caminho', 'Reflexo',
  'Bussola', 'Clareza', 'Nascente', 'Alento',
]

function gerarSenhaProvisoria() {
  const palavra = PALAVRAS_SENHA[Math.floor(Math.random() * PALAVRAS_SENHA.length)]
  const numero = Math.floor(100 + Math.random() * 900)
  return `${palavra}${numero}`
}

type Filtro = 'todos' | 'ativos' | 'sem_sessao' | 'novos'

export default function AdminClientes() {
  const toast = useToast()
  const [clientes, setClientes] = useState<Profile[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [carregando, setCarregando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todos')

  const [email, setEmail] = useState('')
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [nascimento, setNascimento] = useState('')
  const [senhaGerada, setSenhaGerada] = useState(gerarSenhaProvisoria())
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)

  useEffect(() => {
    carregarTudo()
  }, [])

  async function carregarTudo() {
    setCarregando(true)
    const [{ data: perfis }, { data: sessoes }] = await Promise.all([
      supabase.from('profiles').select('*').eq('is_admin', false).order('created_at', { ascending: false }),
      supabase.from('sessions').select('*'),
    ])
    setClientes((perfis as Profile[]) || [])
    setSessions((sessoes as Session[]) || [])
    setCarregando(false)
  }

  async function handleCriarCliente(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setSucesso(null)
    setSalvando(true)
    try {
      await criarCliente({
        email: email.trim(),
        password: senhaGerada,
        full_name: nome.trim() || undefined,
        phone: telefone.trim() || undefined,
        birth_date: nascimento || undefined,
      })
      setSucesso(`Cliente criado! Envie estes dados de acesso para ${email.trim()}: senha provisória "${senhaGerada}".`)
      toast.sucesso('Cliente criado com sucesso')
      setEmail('')
      setNome('')
      setTelefone('')
      setNascimento('')
      setSenhaGerada(gerarSenhaProvisoria())
      setMostrarForm(false)
      carregarTudo()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar cliente.'
      setErro(msg)
      toast.erro(msg)
    } finally {
      setSalvando(false)
    }
  }

  const agora = new Date()
  const proximaSessaoPorCliente = useMemo(() => {
    const mapa = new Map<string, Session>()
    const futuras = sessions.filter((s) => new Date(s.data_sessao) > agora).sort((a, b) => +new Date(a.data_sessao) - +new Date(b.data_sessao))
    for (const s of futuras) if (!mapa.has(s.client_id)) mapa.set(s.client_id, s)
    return mapa
  }, [sessions])

  const clientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    let lista = clientes
    if (termo) {
      lista = lista.filter((c) => (c.full_name || '').toLowerCase().includes(termo) || c.email.toLowerCase().includes(termo))
    }
    if (filtro === 'ativos') lista = lista.filter((c) => proximaSessaoPorCliente.has(c.id))
    if (filtro === 'sem_sessao') lista = lista.filter((c) => !proximaSessaoPorCliente.has(c.id))
    if (filtro === 'novos') {
      const trintaDias = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000)
      lista = lista.filter((c) => new Date(c.created_at) > trintaDias)
    }
    return lista
  }, [clientes, busca, filtro, proximaSessaoPorCliente])

  function formatarDataCurta(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'America/Sao_Paulo' })
  }

  return (
    <Layout titulo="Clientes" subtitulo={`${clientes.length} cliente(s) cadastrado(s)`}>
      <div className="topo-app-desktop" style={{ marginTop: '-1.2rem' }}>
        <div />
        <button className="btn btn-primario" onClick={() => setMostrarForm((v) => !v)}>
          {mostrarForm ? <IconX size={16} /> : <IconPlus size={16} />}
          {mostrarForm ? 'Cancelar' : 'Novo cliente'}
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={handleCriarCliente} className="form-sessao">
          <div className="caixa-info" style={{ margin: 0 }}>
            <strong>Como funciona o cadastro:</strong>
            <p>
              Preencha o e-mail (obrigatório) e o que mais quiser. Uma senha provisória é gerada
              automaticamente — copie e envie para o cliente por WhatsApp ou e-mail.
            </p>
          </div>
          <input
            type="email"
            placeholder="E-mail do cliente (obrigatório)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Nome (opcional)"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
          <div className="form-linha">
            <label>
              Telefone (opcional)
              <input
                type="tel"
                placeholder="(13) 90000-0000"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
              />
            </label>
            <label>
              Data de nascimento (opcional)
              <input
                type="date"
                value={nascimento}
                onChange={(e) => setNascimento(e.target.value)}
              />
            </label>
          </div>
          <div className="caixa-info" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '.8rem', flexWrap: 'wrap' }}>
            Senha provisória gerada: <strong>{senhaGerada}</strong>
            <button type="button" className="btn btn-secundario btn-sm" onClick={() => setSenhaGerada(gerarSenhaProvisoria())}>
              Gerar outra
            </button>
          </div>
          {erro && <p className="mensagem-erro">{erro}</p>}
          <button type="submit" className="btn btn-primario" disabled={salvando}>
            {salvando ? 'Criando...' : 'Criar cliente'}
          </button>
        </form>
      )}

      {sucesso && <div className="caixa-info">{sucesso}</div>}

      <div className="caixa-busca">
        <IconSearch size={17} />
        <input
          type="text"
          placeholder="Buscar por nome ou e-mail..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="filtros">
        {([
          ['todos', 'Todos'],
          ['ativos', 'Ativos'],
          ['sem_sessao', 'Sem próxima sessão'],
          ['novos', 'Novos'],
        ] as [Filtro, string][]).map(([valor, rotulo]) => (
          <button
            key={valor}
            className={`filtro-chip ${filtro === valor ? 'ativo' : ''}`}
            onClick={() => setFiltro(valor)}
          >
            {rotulo}
          </button>
        ))}
      </div>

      {carregando ? (
        <SkeletonLista itens={4} />
      ) : clientesFiltrados.length === 0 ? (
        <EmptyState
          icone={<IconUsers size={24} />}
          titulo={clientes.length === 0 ? 'Nenhum cliente ainda' : 'Nenhum cliente encontrado'}
          descricao={clientes.length === 0 ? 'Cadastre seu primeiro cliente para começar seu acompanhamento.' : 'Tente ajustar a busca ou os filtros.'}
          acao={clientes.length === 0 ? (
            <button className="btn btn-primario" onClick={() => setMostrarForm(true)} style={{ marginTop: '.6rem' }}>
              <IconPlus size={16} /> Novo cliente
            </button>
          ) : undefined}
        />
      ) : (
        <div className="lista-clientes">
          {clientesFiltrados.map((c) => {
            const proxima = proximaSessaoPorCliente.get(c.id)
            return (
              <Link to={`/admin/cliente/${c.id}`} key={c.id} className="cartao-cliente">
                <Avatar nome={c.full_name || c.email} />
                <div className="info">
                  <strong>{c.full_name || 'Sem nome'}</strong>
                  <span>{c.email}</span>
                </div>
                <div className="meta">
                  <span style={{ fontWeight: 600, color: proxima ? 'var(--ink)' : 'var(--ink-faint)' }}>
                    {proxima ? formatarDataCurta(proxima.data_sessao) : 'Sem próxima sessão'}
                  </span>
                </div>
                <IconChevronRight size={16} className="seta" />
              </Link>
            )
          })}
        </div>
      )}
    </Layout>
  )
}
