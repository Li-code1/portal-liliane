import type { VercelRequest, VercelResponse } from '@vercel/node'
import nodemailer from 'nodemailer'

// Esta função roda no servidor da Vercel — nunca no navegador — então a
// senha de app do Gmail (GMAIL_APP_PASSWORD) fica sempre protegida,
// nunca aparece no código do site.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  const { to, subject, text } = req.body || {}

  if (!to || !subject || !text) {
    return res.status(400).json({ error: 'Faltam campos: to, subject e text são obrigatórios' })
  }

  const gmailUser = process.env.GMAIL_USER
  const gmailPass = process.env.GMAIL_APP_PASSWORD

  if (!gmailUser || !gmailPass) {
    return res.status(500).json({
      error: 'Servidor sem GMAIL_USER / GMAIL_APP_PASSWORD configurados nas variáveis de ambiente da Vercel.',
    })
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailPass },
    })

    await transporter.sendMail({
      from: `"Liliane Lima - Psicanalista" <${gmailUser}>`,
      to,
      subject,
      text,
    })

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Erro ao enviar e-mail:', err)
    return res.status(500).json({ error: 'Falha ao enviar e-mail. Confira a senha de app do Gmail.' })
  }
}
