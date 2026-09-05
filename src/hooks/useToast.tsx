import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { IconCheckCircle, IconAlert } from '../components/ui/Icons'

type Toast = { id: number; tipo: 'sucesso' | 'erro'; texto: string }
type ToastContextValue = {
  sucesso: (texto: string) => void
  erro: (texto: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const proximoId = useRef(1)

  const adicionar = useCallback((tipo: Toast['tipo'], texto: string) => {
    const id = proximoId.current++
    setToasts((atual) => [...atual, { id, tipo, texto }])
    setTimeout(() => {
      setToasts((atual) => atual.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const value: ToastContextValue = {
    sucesso: (texto) => adicionar('sucesso', texto),
    erro: (texto) => adicionar('erro', texto),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.tipo === 'sucesso' ? 'toast-sucesso' : 'toast-erro'}`}>
            {t.tipo === 'sucesso' ? <IconCheckCircle size={18} className="toast-icone" /> : <IconAlert size={18} className="toast-icone" />}
            {t.texto}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast precisa estar dentro de <ToastProvider>')
  return ctx
}
