import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

// Esta função roda só no servidor. A SUPABASE_SERVICE_ROLE_KEY nunca é
// enviada ao navegador — por isso criar/excluir usuários de login só
// pode ser feito por aqui, nunca diretamente pelo site.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  const { email, password, full_name, phone, birth_date } = req.body || {}

  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' })
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
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (createError || !userData.user) {
      return res.status(400).json({ error: createError?.message || 'Erro ao criar usuário.' })
    }

    // O perfil já é criado automaticamente pelo trigger do banco (handle_new_user).
    // Aqui só complementamos com os campos extras que o trigger não preenche.
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: full_name || null,
        phone: phone || null,
        birth_date: birth_date || null,
      })
      .eq('id', userData.user.id)

    if (updateError) {
      return res.status(400).json({ error: updateError.message })
    }

    return res.status(200).json({ ok: true, id: userData.user.id })
  } catch (err) {
    console.error('Erro ao criar cliente:', err)
    return res.status(500).json({ error: 'Falha ao criar cliente.' })
  }
}
