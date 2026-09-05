import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  const { slot_id, nome, email, telefone } = req.body || {}

  if (!slot_id || !nome || !email) {
    return res.status(400).json({ error: 'Nome, e-mail e horário são obrigatórios.' })
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const gmailUser = process.env.GMAIL_USER
  const gmailPass = process.env.GMAIL_APP_PASSWORD

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: 'Servidor sem configuração do Supabase.' })
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

  // Busca o horário e confirma, no próprio banco, que ele ainda está livre
  // (evita que duas pessoas reservem o mesmo horário ao mesmo tempo).
  const { data: slot, error: erroBusca } = await supabaseAdmin
    .from('available_slots')
    .select('*')
    .eq('id', slot_id)
    .single()

  if (erroBusca || !slot) {
    return res.status(404).json({ error: 'Horário não encontrado.' })
  }
  if (slot.status !== 'disponivel') {
    return res.status(409).json({ error: 'Esse horário acabou de ser reservado por outra pessoa. Escolha outro.' })
  }

  const { error: erroUpdate } = await supabaseAdmin
    .from('available_slots')
    .update({
      status: 'reservado',
      reservado_nome: nome,
      reservado_email: email,
      reservado_telefone: telefone || null,
      reservado_em: new Date().toISOString(),
    })
    .eq('id', slot_id)
    .eq('status', 'disponivel') // trava extra contra reserva dupla simultânea

  if (erroUpdate) {
    return res.status(500).json({ error: 'Erro ao registrar a reserva.' })
  }

  const dataFormatada = new Date(slot.data_hora).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })

  const ehGratuita = slot.tipo === 'cortesia' || slot.tipo === 'experimental'

  // Envia e-mails de confirmação (não bloqueia a resposta se falhar)
  if (gmailUser && gmailPass) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailPass },
    })

    const textoCliente = ehGratuita
      ? `Olá, ${nome}!\n\nSua sessão (${slot.tipo === 'cortesia' ? 'cortesia' : 'experimental'}) foi reservada para ${dataFormatada}, com duração de ${slot.duracao_minutos} minutos.\n\nComo é uma sessão sem custo, seu agendamento já está confirmado!\n\nAté lá!\nLiliane`
      : `Olá, ${nome}!\n\nSua reserva foi registrada para ${dataFormatada}, com duração de ${slot.duracao_minutos} minutos.\n\nIMPORTANTE: esse horário fica pré-reservado, mas a confirmação definitiva do seu agendamento só acontece após a confirmação do pagamento. Combine a forma de pagamento comigo pelo WhatsApp o quanto antes para garantir seu horário.\n\nAté breve!\nLiliane`

    transporter.sendMail({
      from: `"Liliane Lima - Psicanalista" <${gmailUser}>`,
      to: email,
      subject: ehGratuita ? 'Sessão confirmada' : 'Reserva recebida — aguardando confirmação de pagamento',
      text: textoCliente,
    }).catch(() => {})

    transporter.sendMail({
      from: `"Liliane Lima - Psicanalista" <${gmailUser}>`,
      to: gmailUser,
      subject: `Novo agendamento: ${nome}`,
      text: `${nome} (${email}${telefone ? ', ' + telefone : ''}) reservou o horário de ${dataFormatada} (${slot.tipo}).\n\n${ehGratuita ? 'Sessão sem custo — já confirmada automaticamente.' : 'Aguardando confirmação de pagamento antes de confirmar definitivamente.'}`,
    }).catch(() => {})
  }

  return res.status(200).json({
    ok: true,
    ehGratuita,
    mensagem: ehGratuita
      ? 'Sessão confirmada! Você vai receber um e-mail com os detalhes.'
      : 'Reserva registrada! A confirmação final depende do pagamento — combine com a Liliane pelo WhatsApp.',
  })
}
