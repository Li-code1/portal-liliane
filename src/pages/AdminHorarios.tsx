import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../supabaseClient'
import Layout from '../Layout'
import EmptyState from '../components/ui/EmptyState'
import { SkeletonLista } from '../components/ui/Skeleton'
import { useToast } from '../hooks/useToast'
import { IconClock, IconCheck } from '../components/ui/Icons'

type Slot = {
  id: string
  data_hora: string
  duracao_minutos: number
  tipo: 'regular' | 'cortesia' | 'experimental'
  status: 'disponivel' | 'reservado' | 'cancelado'
  reservado_nome: string | null
  reservado_email: string | null
  reservado_telefone: string | null
  pagamento_confirmado: boolean
}

export default function AdminHorarios() {
  const toast = useToast()
  const [slots, setSlots] = useState<Slot[]>([])
  const [carregando, setCarregando] = useState(true)

  const [dataHora, setDataHora] = useState('')
  const [duracao, setDuracao] = useState('60')
  const [tipo, setTipo] = useState<'regular' | 'cortesia' | 'experimental'>('regular')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    setCarregando(true)
    const { data, error } = await supabase
      .from('available_slots')
      .select('*')
      .gte('data_hora', new Date().toISOString())
      .order('data_hora', { ascending: true })
    if (!error && data) setSlots(data as Slot[])
    setCarregando(false)
  }

  async function adicionarSlot(e: FormEvent) {
    e.preventDefault()
    if (!dataHora) return
    setSalvando(true)
    const { error } = await supabase.from('available_slots').insert({
      data_hora: new Date(dataHora).toISOString(),
      duracao_minutos: Number(duracao) || 60,
      tipo,
    })
    setSalvando(false)
    if (!error) {
      setDataHora('')
      setDuracao('60')
      setTipo('regular')
      toast.sucesso('Horário adicionado')
      carregar()
    } else {
      toast.erro('Não foi possível adicionar o horário')
    }
  }

  async function excluirSlot(id: string) {
    await supabase.from('available_slots').delete().eq('id', id)
    toast.sucesso('Horário removido')
    carregar()
  }

  async function confirmarPagamento(id: string) {
    await supabase.from('available_slots').update({ pagamento_confirmado: true }).eq('id', id)
    toast.sucesso('Pagamento confirmado')
    carregar()
  }

  function formatarData(iso: string) {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    })
  }

  const linkPublico = `${window.location.origin}/agendar`

  return (
    <Layout titulo="Horários" subtitulo="Gerencie os horários disponíveis para agendamento público.">
      <div className="caixa-info">
        <strong>Link para compartilhar / colocar no seu site:</strong>
        <p style={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '.85rem' }}>{linkPublico}</p>
        <p>
          Você pode colar esse link direto num botão do seu site, ou embutir a página inteira com um
          iframe, colando isto num elemento de código:
        </p>
        <p style={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '.78rem' }}>
          {`<iframe src="${linkPublico}" style="width:100%;height:800px;border:none;"></iframe>`}
        </p>
      </div>

      <section className="secao-admin">
        <h2>Adicionar horário disponível</h2>
        <form onSubmit={adicionarSlot} className="form-sessao">
          <div className="form-linha">
            <label>
              Data e hora
              <input type="datetime-local" value={dataHora} onChange={(e) => setDataHora(e.target.value)} required />
            </label>
            <label>
              Duração (min)
              <input type="number" value={duracao} onChange={(e) => setDuracao(e.target.value)} />
            </label>
            <label>
              Tipo
              <select value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)}>
                <option value="regular">Regular (paga)</option>
                <option value="cortesia">Cortesia</option>
                <option value="experimental">Experimental</option>
              </select>
            </label>
          </div>
          <button type="submit" className="btn btn-primario" disabled={salvando} style={{ alignSelf: 'flex-start' }}>
            {salvando ? 'Salvando...' : 'Adicionar horário'}
          </button>
        </form>
      </section>

      <section className="secao-admin">
        <h2>Horários cadastrados</h2>
        {carregando ? (
          <SkeletonLista itens={3} />
        ) : slots.length === 0 ? (
          <EmptyState icone={<IconClock size={22} />} titulo="Nenhum horário cadastrado ainda" descricao="Adicione horários acima para que seus clientes possam agendar sozinhos." />
        ) : (
          <ul className="lista-itens">
            {slots.map((s) => (
              <li key={s.id} className="item item-sessao">
                <div>
                  <span className="status-tag">{formatarData(s.data_hora)}</span>
                  <strong style={{ display: 'block', marginTop: '.4rem' }}>
                    {s.duracao_minutos} min · {s.tipo}
                    {s.status === 'reservado' && ' · RESERVADO'}
                  </strong>
                  {s.status === 'reservado' && (
                    <div className="caixa-feedback">
                      <p><strong>{s.reservado_nome}</strong> — {s.reservado_email}{s.reservado_telefone ? ` — ${s.reservado_telefone}` : ''}</p>
                      <p style={{ marginTop: '.3rem', fontWeight: 600, color: s.pagamento_confirmado || s.tipo !== 'regular' ? 'var(--green)' : 'var(--red)' }}>
                        {s.pagamento_confirmado || s.tipo !== 'regular' ? <><IconCheck size={13} /> Confirmado</> : '⏳ Aguardando confirmação de pagamento'}
                      </p>
                      {!s.pagamento_confirmado && s.tipo === 'regular' && (
                        <button className="btn btn-secundario btn-sm" style={{ marginTop: '.5rem' }} onClick={() => confirmarPagamento(s.id)}>
                          Marcar pagamento como confirmado
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <button className="btn-apagar" onClick={() => excluirSlot(s.id)}>Remover</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Layout>
  )
}
