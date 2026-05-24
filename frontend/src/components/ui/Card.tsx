import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  glow?: boolean
  glass?: boolean
  onClick?: () => void
}

export function Card({ children, className, hover = false, glow = false, glass = false, onClick }: CardProps) {
  const Component = onClick ? motion.button : motion.div

  return (
    <Component
      whileHover={hover ? { y: -2 } : undefined}
      onClick={onClick}
      className={cn(
        'rounded-card p-5 border transition-all duration-200 shadow-card',
        glass
          ? 'bg-surface-card/60 backdrop-blur-xl border-white/[0.06]'
          : glow
            ? 'bg-surface-card border-brand-500/20 shadow-glow-indigo'
            : 'bg-surface-card border-surface-border',
        hover && !glass && 'hover:shadow-card-hover hover:border-brand-500/20',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </Component>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex items-center justify-between mb-4', className)}>{children}</div>
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn('text-lg font-semibold text-white', className)}>{children}</h3>
}

export function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('text-sm text-zinc-400', className)}>{children}</p>
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('', className)}>{children}</div>
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex items-center justify-between mt-4 pt-4 border-t border-surface-border', className)}>{children}</div>
}
