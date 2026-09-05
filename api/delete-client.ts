import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  const { client_id } = req.body || {}

  if (!client_id) {
    return res.status(400).json({ error: 'client_id é obrigatório.' })
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({
      error: 'Servidor sem VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY configurados na Vercel.',
    })
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

  try {
    // Apagar o usuário de login já apaga o perfil, metas, ferramentas e
    // sessões dele em cascata (configurado no banco com "on delete cascade").
    const { error } = await supabaseAdmin.auth.admin.deleteUser(client_id)
    if (error) {
      return res.status(400).json({ error: error.message })
    }
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Erro ao excluir cliente:', err)
    return res.status(500).json({ error: 'Falha ao excluir cliente.' })
  }
}
