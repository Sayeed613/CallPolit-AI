import { useState, useCallback, createContext, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '../../lib/utils'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastContextType {
  addToast: (toast: Omit<Toast, 'id'>) => void
}

const ToastContext = createContext<ToastContextType>({ addToast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const styles = {
  success: 'border-success/20 bg-success-muted text-success',
  error: 'border-error/20 bg-error-muted text-error',
  warning: 'border-warning/20 bg-warning-muted text-warning',
  info: 'border-brand-500/20 bg-brand-500/10 text-brand-400',
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [counter, setCounter] = useState(0)

  const addToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = `toast-${counter}`
      setCounter((c) => c + 1)

      setToasts((prev) => [...prev, { ...toast, id }])

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, toast.duration || 4000)
    },
    [counter],
  )

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}

      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon = icons[toast.type]
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 100, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg border shadow-elevated backdrop-blur-xl min-w-[300px] max-w-[420px]',
                  styles[toast.type],
                )}
              >
                <Icon size={18} className="flex-shrink-0 mt-0.5" />
                <p className="text-sm flex-1">{toast.message}</p>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export default ToastProvider
