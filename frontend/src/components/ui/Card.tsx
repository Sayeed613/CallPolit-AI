import { cn } from '../../lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'glass' | 'interactive'
  onClick?: () => void
}

const variantStyles = {
  default: 'bg-bg-card border border-border-subtle rounded-xl',
  glass: 'bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-xl',
  interactive: 'bg-bg-card border border-border-subtle rounded-xl cursor-pointer hover:border-border-default transition-all duration-150 hover:shadow-elevated',
}

export function Card({ children, className, variant = 'default', onClick }: CardProps) {
  const Component = onClick ? 'button' : 'div'

  return (
    <Component
      onClick={onClick}
      className={cn(variantStyles[variant], 'p-5 text-left', className)}
    >
      {children}
    </Component>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex items-center justify-between mb-4', className)}>{children}</div>
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn('text-base font-semibold text-text-primary', className)}>{children}</h3>
}

export function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('text-sm text-text-secondary', className)}>{children}</p>
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn(className)}>{children}</div>
}

export default Card
