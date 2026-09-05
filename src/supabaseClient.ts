import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Faltam as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY. ' +
    'Confira o arquivo .env (local) ou as variáveis de ambiente configuradas na Vercel.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Profile = {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  birth_date: string | null
  is_admin: boolean
  consentimento_lgpd: boolean
  consentimento_em: string | null
  created_at: string
}

export type Goal = {
  id: string
  client_id: string
  title: string
  description: string | null
  status: 'em_andamento' | 'concluida'
  created_at: string
}

export type Tool = {
  id: string
  client_id: string
  title: string
  description: string | null
  link: string | null
  created_at: string
}

export type Session = {
  id: string
  client_id: string
  numero: number
  titulo: string
  resumo: string | null
  data_sessao: string
  valor: number | null
  duracao_minutos: number
  feedback_cliente: string | null
  feedback_enviado_em: string | null
  feedback_autoriza_compartilhar: boolean | null
  feedback_anonimo: boolean | null
  lembrete_enviado: boolean
  created_at: string
}

// Envia um e-mail de verdade, através da função serverless (que usa a
// conta lilianelimapsicanalista@gmail.com configurada na Vercel).
export async function enviarEmail(params: { to: string; subject: string; text: string }) {
  const resposta = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!resposta.ok) {
    const dados = await resposta.json().catch(() => ({}))
    throw new Error(dados.error || 'Falha ao enviar e-mail')
  }
  return resposta.json()
}

// Cria um novo cliente (login + perfil), usando a função serverless segura.
export async function criarCliente(params: {
  email: string
  password: string
  full_name?: string
  phone?: string
  birth_date?: string
}) {
  const resposta = await fetch('/api/create-client', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!resposta.ok) {
    const dados = await resposta.json().catch(() => ({}))
    throw new Error(dados.error || 'Falha ao criar cliente')
  }
  return resposta.json()
}

// Exclui um cliente (login + todos os dados dele), usando a função serverless segura.
export async function excluirCliente(clientId: string) {
  const resposta = await fetch('/api/delete-client', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId }),
  })
  if (!resposta.ok) {
    const dados = await resposta.json().catch(() => ({}))
    throw new Error(dados.error || 'Falha ao excluir cliente')
  }
  return resposta.json()
}
