import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../supabaseClient'

export default function ResetPassword() {
  const [pronto, setPronto] = useState(false)
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmaSenha, setConfirmaSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    // Quando a pessoa clica no link do e-mail, o Supabase dispara este
    // evento assim que reconhece o token de recuperação na URL.
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPronto(true)
      }
    })
    // Caso a sessão de recuperação já tenha sido processada antes deste
    // componente montar (recarregou a página, por exemplo).
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setPronto(true)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    if (novaSenha.length < 6) {
      setErro('A senha precisa ter pelo menos 6 caracteres.')
      return
    }
    if (novaSenha !== confirmaSenha) {
      setErro('As duas senhas precisam ser iguais.')
      return
    }
    setSalvando(true)
    const { error } = await supabase.auth.updateUser({ password: novaSenha })
    setSalvando(false)
    if (error) {
      setErro('Não foi possível salvar a nova senha. Tente pedir o link novamente.')
    } else {
      setSucesso(true)
    }
  }

  return (
    <div className="tela-centralizada">
      <div className="cartao-login">
        <div className="marca-login">
          <div className="monograma">LL</div>
          <div>
            <strong>Liliane Lima</strong>
            <span>Portal de Acompanhamento</span>
          </div>
        </div>

        <h1>Criar nova senha</h1>

        {sucesso ? (
          <p className="mensagem-info">
            Senha alterada com sucesso! Você já pode <a href="/">entrar</a> usando a nova senha.
          </p>
        ) : !pronto ? (
          <p className="subtitulo">
            Confira se você abriu esta página a partir do link enviado por e-mail. Se acabou de
            chegar aqui, aguarde alguns instantes — a página vai liberar o formulário automaticamente.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label>
              Nova senha
              <input
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                required
                placeholder="••••••••"
              />
            </label>
            <label>
              Confirme a nova senha
              <input
                type="password"
                value={confirmaSenha}
                onChange={(e) => setConfirmaSenha(e.target.value)}
                required
                placeholder="••••••••"
              />
            </label>

            {erro && <p className="mensagem-erro">{erro}</p>}

            <button type="submit" className="btn-primario" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar nova senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
