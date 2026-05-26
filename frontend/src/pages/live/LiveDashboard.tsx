import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Radio, PhoneCall, Activity, User, MessageSquare, AlertTriangle,
  BrainCircuit, Volume2, PhoneOff, PhoneIncoming,
} from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { SkeletonCard } from '../../components/ui/Skeleton'
import Modal from '../../components/ui/Modal'
import { liveApi } from '../../lib/api'
import { formatDuration, maskPhone } from '../../lib/utils'
import useCallStore from '../../stores/callStore'

// ─── Helpers ────────────────────────────────────────────────────

function getSentimentColor(score: number): string {
  if (score >= 0.6) return 'bg-success'
  if (score >= 0.3) return 'bg-warning'
  return 'bg-error'
}

function getStatusBadgeVariant(status: string): 'success' | 'brand' | 'warning' | 'error' | 'default' {
  switch (status) {
    case 'in-progress': return 'brand'
    case 'completed': return 'success'
    case 'ringing': return 'warning'
    case 'no-answer': case 'failed': return 'error'
    default: return 'default'
  }
}

// ─── Transcript Bubble Component ────────────────────────────────

function TranscriptBubble({ entry }: { entry: { role: string; content: string } }) {
  const isAI = entry.role === 'assistant'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-2 ${isAI ? 'justify-start' : 'justify-end'}`}
    >
      {isAI && (
        <div className="w-6 h-6 rounded-full bg-brand-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <BrainCircuit size={12} className="text-brand-400" />
        </div>
      )}
      <div
        className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
          isAI
            ? 'bg-bg-surface border border-border-subtle text-text-primary rounded-bl-md'
            : 'bg-brand-500/15 border border-brand-500/20 text-text-primary rounded-br-md'
        }`}
      >
        <p className="text-xs text-text-tertiary mb-0.5">{isAI ? 'CallPilot AI' : 'Customer'}</p>
        <p>{entry.content}</p>
      </div>
      {!isAI && (
        <div className="w-6 h-6 rounded-full bg-text-tertiary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <User size={12} className="text-text-tertiary" />
        </div>
      )}
    </motion.div>
  )
}

// ─── Call Card Component ────────────────────────────────────────

function CallCard({
  call,
  onViewDetails,
}: {
  call: any
  onViewDetails: (call: any) => void
}) {
  const isFinished = ['completed', 'no-answer', 'failed'].includes(call.status)
  const isRinging = call.status === 'ringing'
  const isLive = call.status === 'in-progress'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.95 }}
      transition={{ duration: 0.25, type: 'spring', stiffness: 300, damping: 25 }}
    >
      <Card className={`h-full overflow-hidden border-t-2 ${
        isLive ? 'border-t-brand-500' :
        isRinging ? 'border-t-warning' :
        'border-t-border-subtle'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              isLive ? 'bg-brand-500/15' :
              isRinging ? 'bg-warning/15' :
              'bg-bg-surface'
            }`}>
              {isRinging ? (
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-warning" />
                </span>
              ) : isLive ? (
                <Volume2 size={14} className="text-brand-400" />
              ) : (
                <PhoneOff size={14} className="text-text-tertiary" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                {call.contact_name || maskPhone(call.contact_phone) || 'Unknown'}
              </p>
              <p className="text-xs text-text-tertiary">{maskPhone(call.contact_phone)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isLive && (
              <span className="flex items-center gap-1 text-xs text-success font-mono">
                <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                {formatDuration(call.duration || 0)}
              </span>
            )}
            <Badge variant={getStatusBadgeVariant(call.status)} size="sm" dot={isLive || isRinging}>
              {call.status}
            </Badge>
          </div>
        </div>

        {/* Call direction + campaign info */}
        <div className="flex items-center gap-2 mb-2 text-xs text-text-tertiary">
          <Badge variant="default" size="sm">{call.direction || 'outbound'}</Badge>
          {call.campaign_id && (
            <span className="truncate">Campaign: {call.campaign_id.slice(0, 8)}...</span>
          )}
        </div>

        {/* Transcript */}
        <div className="mb-3 space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
          {call.transcript && call.transcript.length > 0 ? (
            call.transcript.map((t: any, i: number) => (
              <TranscriptBubble key={i} entry={t} />
            ))
          ) : (
            <div className="flex items-center justify-center py-6">
              {isRinging ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center">
                    <PhoneIncoming size={16} className="text-warning animate-pulse" />
                  </div>
                  <p className="text-xs text-text-tertiary animate-pulse">Connecting...</p>
                </div>
              ) : (
                <p className="text-xs text-text-tertiary">Waiting for conversation...</p>
              )}
            </div>
          )}
        </div>

        {/* Sentiment bar */}
        {!isRinging && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-text-tertiary">Sentiment</span>
              <span className={
                call.sentiment_score >= 0.6 ? 'text-success' :
                call.sentiment_score >= 0.3 ? 'text-warning' :
                'text-error'
              }>
                {Math.round((call.sentiment_score || 0.5) * 100)}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-bg-overlay overflow-hidden">
              <motion.div
                className={`h-full rounded-full transition-all ${getSentimentColor(call.sentiment_score || 0.5)}`}
                initial={{ width: '50%' }}
                animate={{ width: `${(call.sentiment_score || 0.5) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}

        {/* View details */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => onViewDetails(call)}
        >
          View Conversation
        </Button>
      </Card>
    </motion.div>
  )
}

// ─── LiveDashboard ──────────────────────────────────────────────

export function LiveDashboard() {
  const { activeCalls, fetchActiveCalls } = useCallStore()
  const [loading, setLoading] = useState(true)
  const [selectedCall, setSelectedCall] = useState<any>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const transcriptEndRef = useRef<HTMLDivElement>(null)

  // ── Load initial data + set up polling ─────────────────────
  useEffect(() => {
    const load = async () => {
      await fetchActiveCalls()
      setLoading(false)
    }
    load()

    const interval = setInterval(() => {
      fetchActiveCalls()
    }, 5000)

    return () => clearInterval(interval)
  }, [fetchActiveCalls])

  // Auto-scroll transcript in detail modal
  useEffect(() => {
    if (showDetailModal && transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [selectedCall?.transcript, showDetailModal])

  // ── View call details ─────────────────────────────────────
  const handleViewDetails = useCallback((call: any) => {
    setSelectedCall(call)
    setShowDetailModal(true)
  }, [])

  // ── Stats from active calls ───────────────────────────────
  const stats = {
    active: activeCalls.filter((c) => c.status === 'in-progress').length,
    ringing: activeCalls.filter((c) => c.status === 'ringing').length,
    completed: activeCalls.filter((c) => c.status === 'completed').length,
    failed: activeCalls.filter((c) => ['no-answer', 'failed'].includes(c.status)).length,
    total: activeCalls.length,
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="relative space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Live Dashboard</h1>
          <p className="text-sm text-text-tertiary mt-1">
            Monitor real-time call activity
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={activeCalls.length > 0 ? 'success' : 'default'} dot={activeCalls.length > 0}>
            {activeCalls.length > 0 ? `${activeCalls.length} active` : 'No active calls'}
          </Badge>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Active', value: stats.active, color: 'text-brand-400', bg: 'bg-brand-500/10' },
          { label: 'Ringing', value: stats.ringing, color: 'text-warning', bg: 'bg-warning/10' },
          { label: 'Completed', value: stats.completed, color: 'text-success', bg: 'bg-success/10' },
          { label: 'Failed', value: stats.failed, color: 'text-error', bg: 'bg-error/10' },
          { label: 'Total', value: stats.total, color: 'text-text-primary', bg: 'bg-bg-surface' },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${stat.bg} rounded-xl p-3 text-center`}
          >
            <p className={`text-2xl font-bold ${stat.color}`}>
              {loading ? '--' : stat.value}
            </p>
            <p className="text-xs text-text-tertiary mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Call Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : activeCalls.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-bg-card border border-border-subtle flex items-center justify-center mb-4">
            <Radio size={32} className="text-text-tertiary" />
          </div>
          <h3 className="text-lg font-medium text-text-primary mb-2">No active calls</h3>
          <p className="text-sm text-text-tertiary mb-2 max-w-md text-center">
            Active calls from your campaigns will appear here in real-time.
          </p>
          <p className="text-xs text-text-tertiary max-w-sm text-center">
            Launch a campaign from the Campaigns page to start seeing live call data.
          </p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeCalls.map((call) => (
              <CallCard
                key={call.id}
                call={call}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Detail Modal */}
      <Modal
        open={showDetailModal && !!selectedCall}
        onClose={() => setShowDetailModal(false)}
        maxWidth="lg"
        title={selectedCall?.contact_name || 'Call Details'}
      >
        {selectedCall && (
          <div className="space-y-4">
            {/* Call metadata */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-bg-surface text-xs">
              <div>
                <span className="text-text-tertiary">Phone:</span>
                <span className="text-text-primary ml-2">{maskPhone(selectedCall.contact_phone)}</span>
              </div>
              <div>
                <span className="text-text-tertiary">Status:</span>
                <Badge variant={getStatusBadgeVariant(selectedCall.status)} size="sm" className="ml-2">
                  {selectedCall.status}
                </Badge>
              </div>
              <div>
                <span className="text-text-tertiary">Duration:</span>
                <span className="text-text-primary ml-2">{formatDuration(selectedCall.duration || 0)}</span>
              </div>
              <div>
                <span className="text-text-tertiary">Sentiment:</span>
                <span className={`ml-2 ${
                  selectedCall.sentiment_score >= 0.6 ? 'text-success' :
                  selectedCall.sentiment_score >= 0.3 ? 'text-warning' :
                  'text-error'
                }`}>
                  {Math.round((selectedCall.sentiment_score || 0.5) * 100)}%
                </span>
              </div>
              <div>
                <span className="text-text-tertiary">Direction:</span>
                <span className="text-text-primary ml-2 capitalize">{selectedCall.direction || 'outbound'}</span>
              </div>
              <div>
                <span className="text-text-tertiary">Campaign:</span>
                <span className="text-text-primary ml-2">{selectedCall.campaign_id?.slice(0, 8) || '-'}</span>
              </div>
            </div>

            {/* Full transcript */}
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar p-2">
              {selectedCall.transcript && selectedCall.transcript.length > 0 ? (
                selectedCall.transcript.map((t: any, i: number) => (
                  <TranscriptBubble key={i} entry={t} />
                ))
              ) : (
                <p className="text-center text-text-tertiary py-8">No transcript available</p>
              )}
              <div ref={transcriptEndRef} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default LiveDashboard
