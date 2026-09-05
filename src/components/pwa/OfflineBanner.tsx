import { useEffect, useState } from 'react'
import { IconAlert } from '../ui/Icons'

export default function OfflineBanner() {
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    function aoFicarOnline() { setOnline(true) }
    function aoFicarOffline() { setOnline(false) }
    window.addEventListener('online', aoFicarOnline)
    window.addEventListener('offline', aoFicarOffline)
    return () => {
      window.removeEventListener('online', aoFicarOnline)
      window.removeEventListener('offline', aoFicarOffline)
    }
  }, [])

  if (online) return null

  return (
    <div className="offline-banner" role="status">
      <IconAlert size={15} />
      <div>
        <strong>Sem conexão</strong>
        <span>Verifique sua internet para carregar os dados mais recentes.</span>
      </div>
    </div>
  )
}
