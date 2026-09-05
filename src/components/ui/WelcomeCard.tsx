import { useState } from 'react'
import { IconX } from './Icons'

function chaveDispensado(clienteId: string) {
  return `boas_vindas_dispensada_${clienteId}`
}

export default function WelcomeCard({
  clienteId,
  primeiroNome,
}: {
  clienteId: string
  primeiroNome?: string
}) {
  const [dispensado, setDispensado] = useState(
    () => localStorage.getItem(chaveDispensado(clienteId)) === '1'
  )

  if (dispensado) return null

  function dispensar() {
    localStorage.setItem(chaveDispensado(clienteId), '1')
    setDispensado(true)
  }

  return (
    <div className="cartao-boas-vindas">
      <button className="pwa-banner-fechar" onClick={dispensar} aria-label="Fechar">
        <IconX size={15} />
      </button>
      <strong>Seja muito bem-vinda{primeiroNome ? `, ${primeiroNome}` : ''}! 🌿</strong>
      <p>
        Esse é o seu espaço de acompanhamento — um lugar só seu, pensado para te
        ajudar a enxergar sua caminhada com mais clareza.
      </p>
      <ul>
        <li>suas <strong>próximas sessões</strong> e o histórico das anteriores;</li>
        <li>as <strong>metas</strong> que vamos construindo juntas;</li>
        <li><strong>materiais</strong> que preparo especialmente pra você;</li>
        <li>um espaço para deixar seu <strong>feedback</strong> depois de cada sessão, se quiser.</li>
      </ul>
      <p>Fique à vontade para explorar no seu ritmo. Qualquer dúvida, estou por aqui.</p>
      <button className="btn btn-primario btn-sm" onClick={dispensar}>Entendi</button>
    </div>
  )
}
