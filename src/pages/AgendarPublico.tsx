import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../supabaseClient'
import EmptyState from '../components/ui/EmptyState'
import { SkeletonLista } from '../components/ui/Skeleton'
import { IconCalendar, IconArrowLeft, IconCheck } from '../components/ui/Icons'

type SlotPublico = {
  id: string
  data_hora: string
  duracao_minutos: number
  tipo: 'regular' | 'cortesia' | 'experimental'
}

type Passo = 'horario' | 'dados' | 'revisar'

const RESULTADO_INICIAL: { tipo: 'ok' | 'erro'; texto: string } | null = null

export default function AgendarPublico() {
  const [slots, setSlots] = useState<SlotPublico[]>([])
  const [carregando, setCarregando] = useState(true)
  const [slotSelecionado, setSlotSelecionado] = useState<SlotPublico | null>(null)
  const [passo, setPasso] = useState<Passo>('horario')

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState(RESULTADO_INICIAL)

  useEffect(() => {
    carregarSlots()
  }, [])

  async function carregarSlots() {
    setCarregando(true)
    const { data, error } = await supabase
      .from('available_slots_public')
      .select('*')
      .order('data_hora', { ascending: true })
    if (!error && data) setSlots(data as SlotPublico[])
    setCarregando(false)
  }

  function formatarData(iso: string) {
    return new Date(iso).toLocaleString('pt-BR', {
      weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    })
  }

  function rotuloTipo(tipo: string) {
    if (tipo === 'cortesia') return 'Sessão de cortesia'
    if (tipo === 'experimental') return 'Sessão experimental'
    return 'Sessão'
  }

  function escolherSlot(s: SlotPublico) {
    setSlotSelecionado(s)
    setPasso('dados')
  }

  function irParaRevisao(e: FormEvent) {
    e.preventDefault()
    setPasso('revisar')
  }

  async function handleReservar() {
    if (!slotSelecionado) return
    setEnviando(true)
    setResultado(null)
    try {
      const resposta = await fetch('/api/book-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot_id: slotSelecionado.id,
          nome,
          email,
          telefone,
        }),
      })
      const dados = await resposta.json()
      if (!resposta.ok) {
        setResultado({ tipo: 'erro', texto: dados.error || 'Não foi possível concluir a reserva.' })
        if (resposta.status === 409) { carregarSlots(); setPasso('horario'); setSlotSelecionado(null) }
        return
      }
      setResultado({ tipo: 'ok', texto: dados.mensagem })
      setSlotSelecionado(null)
      setNome('')
      setEmail('')
      setTelefone('')
      setPasso('horario')
      carregarSlots()
    } catch {
      setResultado({ tipo: 'erro', texto: 'Erro de conexão. Tente novamente em instantes.' })
    } finally {
      setEnviando(false)
    }
  }

  const indicePasso = passo === 'horario' ? 0 : passo === 'dados' ? 1 : 2

  return (
    <div className="pagina-agendar">
      <div className="cabecalho-agendar">
        <div className="monograma">LL</div>
        <div>
          <strong>Liliane Lima</strong>
          <span>Agende sua sessão</span>
        </div>
      </div>

      <div className="passos-agendar">
        {['Horário', 'Seus dados', 'Confirmação'].map((rotulo, i) => (
          <div className={`passo-agendar ${i === indicePasso ? 'ativo' : ''} ${i < indicePasso ? 'concluido' : ''}`} key={rotulo}>
            <div className="bola">{i < indicePasso ? <IconCheck size={13} /> : i + 1}</div>
            {i < 2 && <div className="traco" />}
          </div>
        ))}
      </div>

      <div className="aviso-pagamento">
        <strong>Importante:</strong> a confirmação definitiva do agendamento só acontece após a
        confirmação do pagamento — exceto em sessões de cortesia ou experimentais, que já são
        confirmadas automaticamente.
      </div>

      {resultado && (
        <div className={resultado.tipo === 'ok' ? 'mensagem-info' : 'mensagem-erro-caixa'}>
          {resultado.texto}
        </div>
      )}

      {passo === 'horario' && (
        <>
          <h2 className="titulo-secao-agendar">Escolha um horário</h2>
          {carregando ? (
            <SkeletonLista itens={4} />
          ) : slots.length === 0 ? (
            <EmptyState
              icone={<IconCalendar size={24} />}
              titulo="Nenhum horário disponível no momento"
              descricao="Me chama no WhatsApp para combinarmos um horário."
            />
          ) : (
            <div className="lista-slots">
              {slots.map((s) => (
                <button key={s.id} className="cartao-slot" onClick={() => escolherSlot(s)}>
                  <span className="slot-data">{formatarData(s.data_hora)}</span>
                  <span className="slot-detalhe">{s.duracao_minutos} min · {rotuloTipo(s.tipo)}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {passo === 'dados' && slotSelecionado && (
        <div className="cartao-login" style={{ maxWidth: '460px', margin: '0 auto' }}>
          <button className="link-botao" onClick={() => { setPasso('horario'); setSlotSelecionado(null) }} style={{ marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', gap: '.3em' }}>
            <IconArrowLeft size={14} /> Escolher outro horário
          </button>
          <p>
            <strong>{formatarData(slotSelecionado.data_hora)}</strong><br />
            {slotSelecionado.duracao_minutos} min · {rotuloTipo(slotSelecionado.tipo)}
          </p>
          <form onSubmit={irParaRevisao}>
            <label>
              Seu nome
              <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required />
            </label>
            <label>
              Seu e-mail
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label>
              WhatsApp (opcional)
              <input type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(13) 90000-0000" />
            </label>
            <button type="submit" className="btn-primario">Revisar e confirmar</button>
          </form>
        </div>
      )}

      {passo === 'revisar' && slotSelecionado && (
        <div className="cartao-login" style={{ maxWidth: '460px', margin: '0 auto' }}>
          <button className="link-botao" onClick={() => setPasso('dados')} style={{ marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', gap: '.3em' }}>
            <IconArrowLeft size={14} /> Voltar e editar
          </button>
          <h1 style={{ fontSize: '1.25rem' }}>Confirme seus dados</h1>
          <div className="resumo-agendamento">
            <strong>{formatarData(slotSelecionado.data_hora)}</strong>
            <span className="slot-detalhe">{slotSelecionado.duracao_minutos} min · {rotuloTipo(slotSelecionado.tipo)}</span>
          </div>
          <p><strong>Nome:</strong> {nome}</p>
          <p><strong>E-mail:</strong> {email}</p>
          {telefone && <p><strong>WhatsApp:</strong> {telefone}</p>}
          <button className="btn-primario btn-block" onClick={handleReservar} disabled={enviando}>
            {enviando ? 'Reservando...' : 'Confirmar agendamento'}
          </button>
        </div>
      )}
    </div>
  )
}
