import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

// Gera um feed de calendário (.ics) com as próximas sessões — a Liliane
// assina esse link no Google Agenda ("Adicionar calendário → A partir
// do URL") e o Google sincroniza sozinho a cada algumas horas.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const segredoEsperado = process.env.REMINDER_SECRET
  const segredoRecebido = req.query.secret

  if (!segredoEsperado || segredoRecebido !== segredoEsperado) {
    return res.status(401).send('Não autorizado.')
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).send('Faltam variáveis de ambiente no servidor.')
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
  const agora = new Date().toISOString()

  const { data: sessoes, error } = await supabaseAdmin
    .from('sessions')
    .select('*, profiles:client_id(email, full_name)')
    .gte('data_sessao', agora)
    .order('data_sessao', { ascending: true })

  if (error) {
    return res.status(500).send('Erro ao buscar sessões.')
  }

  const formatarICS = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const escapar = (texto: string) => (texto || '').replace(/[\n,;]/g, ' ')

  const eventos = (sessoes || [])
    .map((s: any) => {
      const inicio = new Date(s.data_sessao)
      const fim = new Date(inicio.getTime() + s.duracao_minutos * 60000)
      const cliente = s.profiles?.full_name || s.profiles?.email || 'cliente'
      return [
        'BEGIN:VEVENT',
        `UID:${s.id}@portal-liliane`,
        `DTSTAMP:${formatarICS(new Date())}`,
        `DTSTART:${formatarICS(inicio)}`,
        `DTEND:${formatarICS(fim)}`,
        `SUMMARY:Sessão ${s.numero} — ${escapar(cliente)}`,
        `DESCRIPTION:${escapar(s.titulo)}${s.resumo ? ' - ' + escapar(s.resumo) : ''}`,
        'END:VEVENT',
      ].join('\r\n')
    })
    .join('\r\n')

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Portal Liliane Lima//Agenda//PT-BR',
    'CALSCALE:GREGORIAN',
    eventos,
    'END:VCALENDAR',
  ].join('\r\n')

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
  res.setHeader('Content-Disposition', 'inline; filename="agenda.ics"')
  return res.status(200).send(ics)
}
