import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

// Esta função é feita para ser chamada periodicamente (a cada 10-15 min)
// por um serviço externo gratuito, como o cron-job.org — veja o passo a
// passo no README. Ela procura sessões que vão começar dentro da
// próxima 1h e ainda não tiveram lembrete enviado, manda o e-mail, e
// marca como enviado (para nunca mandar duas vezes).
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const segredoEsperado = process.env.REMINDER_SECRET
  const segredoRecebido = req.query.secret

  if (!segredoEsperado || segredoRecebido !== segredoEsperado) {
    return res.status(401).json({ error: 'Não autorizado.' })
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const gmailUser = process.env.GMAIL_USER
  const gmailPass = process.env.GMAIL_APP_PASSWORD

  if (!supabaseUrl || !serviceRoleKey || !gmailUser || !gmailPass) {
    return res.status(500).json({ error: 'Faltam variáveis de ambiente no servidor.' })
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: gmailUser, pass: gmailPass },
  })

  const agora = new Date()
  const daquiUmaHora = new Date(agora.getTime() + 60 * 60 * 1000)
  // Janela um pouco maior (65 min) para garantir que nenhuma sessão escape
  // entre duas chamadas do serviço externo.
  const limiteSuperior = new Date(agora.getTime() + 65 * 60 * 1000)

  const { data: sessoes, error } = await supabaseAdmin
    .from('sessions')
    .select('*, profiles:client_id(email, full_name)')
    .gte('data_sessao', agora.toISOString())
    .lte('data_sessao', limiteSuperior.toISOString())
    .eq('lembrete_enviado', false)

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  let enviados = 0

  for (const sessao of sessoes || []) {
    const cliente = (sessao as any).profiles
    if (!cliente?.email) continue

    const dataFormatada = new Date(sessao.data_sessao).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    })

    try {
      await transporter.sendMail({
        from: `"Liliane Lima - Psicanalista" <${gmailUser}>`,
        to: cliente.email,
        subject: 'Lembrete: sua sessão é daqui a 1 hora',
        text: `Olá, ${cliente.full_name || ''}!\n\nPassando para lembrar que sua sessão "${sessao.titulo}" está agendada para hoje, às ${dataFormatada}.\n\nAté já!\nLiliane`,
      })

      await supabaseAdmin
        .from('sessions')
        .update({ lembrete_enviado: true })
        .eq('id', sessao.id)

      enviados++
    } catch (err) {
      console.error('Erro ao enviar lembrete da sessão', sessao.id, err)
    }
  }

  return res.status(200).json({ ok: true, sessoesVerificadas: (sessoes || []).length, lembretesEnviados: enviados })
}
