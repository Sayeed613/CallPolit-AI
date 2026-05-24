import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function maskPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 2)}xxx xxx${cleaned.slice(-2)}`
  }
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+91 ${cleaned.slice(2, 4)}xxx xxx${cleaned.slice(-2)}`
  }
  if (cleaned.length > 0) {
    const prefix = cleaned.slice(0, Math.min(3, cleaned.length))
    const suffix = cleaned.slice(-2)
    return `${prefix}xxx xxx${suffix}`
  }
  return phone
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins > 0) return `${mins}:${secs.toString().padStart(2, '0')}`
  return `0:${secs.toString().padStart(2, '0')}`
}

export function formatDurationLong(seconds: number): string {
  if (seconds <= 0) return '0s'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const hrs = Math.floor(mins / 60)
  const remainingMins = mins % 60
  if (hrs > 0) return `${hrs}h ${remainingMins}m ${secs}s`
  if (mins > 0) return `${mins}m ${secs}s`
  return `${secs}s`
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export function formatDate(dateStr: string, fmt: 'short' | 'long' | 'full' = 'short'): string {
  const d = new Date(dateStr)
  switch (fmt) {
    case 'short':
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    case 'long':
      return d.toLocaleDateString('en-IN', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
      })
    case 'full':
      return d.toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
  }
}

export function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'
}

export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, ms = 300) {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

export function formatPercentage(value: number, total: number): string {
  if (total === 0) return '0%'
  return `${Math.round((value / total) * 100)}%`
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    running: 'text-success',
    completed: 'text-brand-400',
    failed: 'text-error',
    paused: 'text-warning',
    draft: 'text-zinc-400',
    scheduled: 'text-accent-400',
    pending: 'text-zinc-400',
    called: 'text-brand-400',
    connected: 'text-success',
    unreachable: 'text-warning',
    invalid: 'text-error',
    initiated: 'text-brand-400',
    'in-progress': 'text-success',
  }
  return map[status] || 'text-zinc-400'
}

export function getStatusBg(status: string): string {
  const map: Record<string, string> = {
    running: 'bg-success/10',
    completed: 'bg-brand-500/10',
    failed: 'bg-error/10',
    paused: 'bg-warning/10',
    draft: 'bg-zinc-500/10',
    scheduled: 'bg-accent-500/10',
    pending: 'bg-zinc-500/10',
    called: 'bg-brand-500/10',
    connected: 'bg-success/10',
    unreachable: 'bg-warning/10',
    invalid: 'bg-error/10',
  }
  return map[status] || 'bg-zinc-500/10'
}

export function getSentimentColor(sentiment: string): string {
  const map: Record<string, string> = {
    positive: 'text-success',
    neutral: 'text-zinc-400',
    negative: 'text-error',
  }
  return map[sentiment] || 'text-zinc-400'
}

export function getVerificationIcon(level: number): string {
  if (level === 0) return '🔴'
  if (level === 1) return '🟢'
  if (level === 2) return '🟢'
  if (level === 3) return '🟢'
  return '⚪'
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str
  return str.slice(0, len) + '...'
}
