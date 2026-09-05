import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../useAuth'

export default function TermosPrivacidade() {
  const { profile } = useAuth()
  const [salvando, setSalvando] = useState(false)
  const [recusado, setRecusado] = useState(false)

  async function aceitar() {
    setSalvando(true)
    await supabase.rpc('accept_privacy_terms')
    // O useAuth vai recarregar o perfil sozinho na próxima checagem de sessão;
    // como aqui é mais rápido só recarregar a página, garantimos que o app
    // já entra direto no portal, sem precisar de mais um clique.
    window.location.reload()
  }

  async function sair() {
    await supabase.auth.signOut()
  }

  if (recusado) {
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
          <h1>Sem problemas</h1>
          <p className="subtitulo">
            Entendo — sem aceitar os termos, não é possível usar o portal, já que ele funciona
            justamente guardando essas informações. Se preferir, me chama diretamente pelo WhatsApp
            para conversarmos de outra forma.
          </p>
          <button className="btn-primario" onClick={sair}>Sair</button>
        </div>
      </div>
    )
  }

  return (
    <div className="tela-centralizada">
      <div className="cartao-login" style={{ maxWidth: '560px' }}>
        <div className="marca-login">
          <div className="monograma">LL</div>
          <div>
            <strong>Liliane Lima</strong>
            <span>Portal de Acompanhamento</span>
          </div>
        </div>

        <h1>Antes de começar</h1>
        <p className="subtitulo">
          Olá, {profile?.full_name || ''}! Para usar este portal, preciso da sua confirmação de
          que você leu e concorda com o texto abaixo.
        </p>

        <div className="caixa-termos">
          <h3>Sobre seus dados neste portal</h3>
          <p>
            Este portal é uma ferramenta de acompanhamento do seu processo terapêutico/de coaching
            comigo, Liliane Lima. Para funcionar, ele armazena alguns dados seus:
          </p>
          <ul>
            <li>Dados de cadastro: nome, e-mail, telefone e data de nascimento (os três últimos são opcionais).</li>
            <li>Dados das sessões: data, duração, valor e um resumo que eu escrevo após cada sessão.</li>
            <li>Metas e materiais que eu compartilho com você ao longo do acompanhamento.</li>
            <li>O feedback que você escolher me enviar sobre cada sessão.</li>
          </ul>

          <h3>Como esses dados são usados</h3>
          <p>
            Servem exclusivamente para organizar o seu acompanhamento comigo — não são vendidos,
            compartilhados com terceiros, nem usados para qualquer outra finalidade.
          </p>

          <h3>Sobre compartilhar seu feedback publicamente</h3>
          <p>
            Ao enviar um feedback de sessão, você escolhe, a cada vez, se autoriza ou não que ele
            seja usado no meu site ou redes sociais, e se prefere aparecer com seu nome ou de forma
            anônima. Sem essa autorização explícita sua, nenhum feedback é usado publicamente.
          </p>

          <h3>Sigilo profissional</h3>
          <p>
            Como psicanalista, o sigilo sobre o conteúdo das nossas sessões é um compromisso ético
            inegociável da minha atuação — os resumos registrados aqui seguem esse mesmo padrão de
            confidencialidade.
          </p>

          <h3>Seus direitos</h3>
          <p>
            Você pode, a qualquer momento, pedir para corrigir seus dados cadastrais ou solicitar a
            exclusão completa do seu cadastro e de todo o histórico associado a ele — é só me pedir
            diretamente.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '.8rem', marginTop: '1.4rem', flexWrap: 'wrap' }}>
          <button className="btn-primario" onClick={aceitar} disabled={salvando}>
            {salvando ? 'Salvando...' : 'Li e aceito'}
          </button>
          <button className="btn-secundario" onClick={() => setRecusado(true)} disabled={salvando}>
            Não aceito
          </button>
        </div>
      </div>
    </div>
  )
}
