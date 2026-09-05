import { useState, type FormEvent } from 'react'
import { supabase } from '../supabaseClient'

export default function Login() {
  const [modo, setModo] = useState<'entrar' | 'recuperar'>('entrar')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)

  const [emailRecuperar, setEmailRecuperar] = useState('')
  const [mensagemRecuperar, setMensagemRecuperar] = useState<string | null>(null)
  const [enviandoRecuperar, setEnviandoRecuperar] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setCarregando(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setCarregando(false)
    if (error) {
      setErro('E-mail ou senha incorretos. Confira e tente novamente.')
    }
  }

  async function handleRecuperar(e: FormEvent) {
    e.preventDefault()
    setMensagemRecuperar(null)
    setEnviandoRecuperar(true)
    const { error } = await supabase.auth.resetPasswordForEmail(emailRecuperar, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })
    setEnviandoRecuperar(false)
    if (error) {
      setMensagemRecuperar('Não foi possível enviar o e-mail agora. Tente novamente em instantes.')
    } else {
      setMensagemRecuperar('Se esse e-mail estiver cadastrado, você vai receber um link para criar uma nova senha em instantes. Confira também a caixa de Spam.')
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

        {modo === 'entrar' ? (
          <>
            <h1>Entrar</h1>
            <p className="subtitulo">Acesse suas metas, sessões e materiais de acompanhamento.</p>

            <form onSubmit={handleSubmit}>
              <label>
                E-mail
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="seu@email.com"
                />
              </label>
              <label>
                Senha
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </label>

              {erro && <p className="mensagem-erro">{erro}</p>}

              <button type="submit" className="btn-primario" disabled={carregando}>
                {carregando ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            <p className="rodape-login">
              <button type="button" className="link-botao" onClick={() => setModo('recuperar')}>
                Esqueci minha senha
              </button>
            </p>
            <p className="rodape-login">
              Ainda não tem acesso? Fale com a Liliane para receber seu login.
            </p>
          </>
        ) : (
          <>
            <h1>Redefinir senha</h1>
            <p className="subtitulo">Informe seu e-mail cadastrado — vamos te mandar um link para criar uma nova senha.</p>

            <form onSubmit={handleRecuperar}>
              <label>
                E-mail
                <input
                  type="email"
                  value={emailRecuperar}
                  onChange={(e) => setEmailRecuperar(e.target.value)}
                  required
                  placeholder="seu@email.com"
                />
              </label>

              {mensagemRecuperar && <p className="mensagem-info">{mensagemRecuperar}</p>}

              <button type="submit" className="btn-primario" disabled={enviandoRecuperar}>
                {enviandoRecuperar ? 'Enviando...' : 'Enviar link de redefinição'}
              </button>
            </form>

            <p className="rodape-login">
              <button type="button" className="link-botao" onClick={() => setModo('entrar')}>
                ← Voltar para o login
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
