import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Radio, PhoneCall, Activity, User, MessageSquare, AlertTriangle } from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { SkeletonCard } from '../../components/ui/Skeleton'
import Modal from '../../components/ui/Modal'
import { liveApi } from '../../lib/api'
import { formatDuration, maskPhone } from '../../lib/utils'
import waveBackground from '../../components/three/WaveBackground'
import WaveBackground from '../../components/three/WaveBackground'

interface LiveCall {
  id: string
  contact_phone: string
  contact_name: string
  status: string
  duration: number
  language: string
  sentiment_score: number
  verification_status: string
  transcript: { role: string; content: string }[]
  direction: string
}

export function LiveDashboard() {
  const [calls, setCalls] = useState<LiveCall[]>([])
  const [loading, setLoading] = useState(true)
  const [interveneModal, setInterveneModal] = useState<string | null>(null)
  const [websocketStatus, setWebsocketStatus] = useState<'connected' | 'disconnected'>('disconnected')
  const [stats, setStats] = useState({ active: 0, connected_today: 0, total_today: 0 })

  useEffect(() => {
    const load = async () => {
      try {
        const [liveData, liveStats] = await Promise.all([
          liveApi.calls(),
          liveApi.stats(),
        ])
        setCalls(liveData.calls || [])
        setStats({
          active: liveData.active_count || 0,
          connected_today: liveStats?.connected_today || 0,
          total_today: liveStats?.total_today || 0,
        })
      } catch {
        // fallback
      }
      setLoading(false)
    }
    load()

    const interval = setInterval(async () => {
      try {
        const liveData = await liveApi.calls()
        setCalls(liveData.calls || [])
        setStats((prev) => ({ ...prev, active: liveData.active_count || 0 }))
      } catch {
        // ignore
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const handleIntervene = (callId: string) => {
    // In production, this would notify the Twilio call to bridge
    setInterveneModal(null)
    setCalls((prev) =>
      prev.map((c) => (c.id === callId ? { ...c, status: 'intervened' as any } : c)),
    )
  }

  const getSentimentColor = (score: number) => {
    if (score >= 0.6) return 'bg-success'
    if (score >= 0.3) return 'bg-warning'
    return 'bg-error'
  }

  return (
    <div className="relative">
      <WaveBackground />

      <div className="relative z-10 space-y-6">
        {/* Hero stats */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-text-primary">{stats.active}</span>
              <span className="text-sm text-text-tertiary">active calls</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-text-primary">{stats.connected_today}</span>
              <span className="text-sm text-text-tertiary">connected today</span>
            </div>
          </div>
          <div className="flex-1" />
          <Badge variant={websocketStatus === 'connected' ? 'success' : 'error'} dot pulse={websocketStatus === 'connected'}>
            {websocketStatus === 'connected' ? 'Live' : 'Reconnecting...'}
          </Badge>
        </div>

        {/* Calls Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : calls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-bg-card border border-border-subtle flex items-center justify-center mb-4">
              <Radio size={32} className="text-text-tertiary" />
            </div>
            <h3 className="text-lg font-medium text-text-primary mb-2">No active calls</h3>
            <p className="text-sm text-text-tertiary">Your AI is ready. Waiting for incoming or scheduled calls.</p>
          </div>
        ) : (
          <AnimatePresence>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {calls.map((call, index) => (
                <motion.div
                  key={call.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ delay: index * 0.03, duration: 0.2 }}
                >
                  <Card className="h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-brand-400">
                            {call.contact_name?.[0] || '?'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">
                            {call.contact_name || maskPhone(call.contact_phone)}
                          </p>
                          <p className="text-xs text-text-tertiary">{maskPhone(call.contact_phone)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-success font-mono">
                        <span className="w-1.5 h-1.5 bg-success rounded-full pulse-dot" />
                        {formatDuration(call.duration)}
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-2 mb-3">
                      <Badge
                        variant={call.verification_status === 'verified' ? 'success' : 'default'}
                        size="sm"
                        dot={call.verification_status === 'verified'}
                      >
                        {call.verification_status === 'verified' ? 'Verified L2' : 'Pending'}
                      </Badge>
                      <Badge variant="purple" size="sm">
                        {call.language === 'hindi' ? '🇮🇳 Hindi' : '🇬🇧 English'}
                      </Badge>
                    </div>

                    {/* Transcript preview */}
                    <div className="mb-3 p-2 rounded-lg bg-bg-surface text-xs space-y-1 max-h-20 overflow-hidden">
                      {(call.transcript || []).slice(-2).map((t, i) => (
                        <p key={i} className="truncate">
                          <span className={t.role === 'assistant' ? 'text-brand-400' : 'text-text-secondary'}>
                            {t.role === 'assistant' ? 'AI' : 'Customer'}:
                          </span>{' '}
                          <span className="text-text-primary">{t.content}</span>
                        </p>
                      ))}
                      {(!call.transcript || call.transcript.length === 0) && (
                        <p className="text-text-tertiary">No transcript yet...</p>
                      )}
                    </div>

                    {/* Sentiment */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-text-tertiary">Sentiment</span>
                        <span className={call.sentiment_score >= 0.6 ? 'text-success' : call.sentiment_score >= 0.3 ? 'text-warning' : 'text-error'}>
                          {Math.round((call.sentiment_score || 0.5) * 100)}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-bg-overflow overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${getSentimentColor(call.sentiment_score || 0.5)}`}
                          style={{ width: `${(call.sentiment_score || 0.5) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="danger"
                        size="sm"
                        className="flex-1"
                        onClick={() => setInterveneModal(call.id)}
                      >
                        Intervene
                      </Button>
                      <Button variant="secondary" size="sm" className="flex-1">
                        View Details
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* Intervene Modal */}
        <Modal
          open={!!interveneModal}
          onClose={() => setInterveneModal(null)}
          maxWidth="sm"
          title="Intervene in Call"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-warning-muted border border-warning/20">
              <AlertTriangle size={20} className="text-warning flex-shrink-0" />
              <p className="text-sm text-warning">
                Are you sure? This will notify the customer that a human agent is joining.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setInterveneModal(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => interveneModal && handleIntervene(interveneModal)}
              >
                Confirm Intervene
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}

export default LiveDashboard
