import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { useCallStore } from '../../stores/callStore'
import { useCompanyStore } from '../../stores/companyStore'
import { useWebSocket } from '../../hooks/useWebSocket'
import { cn } from '../../lib/utils'

export function LiveDashboard() {
  const { activeCalls } = useCallStore()
  const { activeCompany } = useCompanyStore()

  useWebSocket({ companyId: activeCompany?.id || null })

  const handleIntervene = async (callSid: string) => {
    try {
      const { api } = await import('../../lib/api')
      await api.live.intervene(callSid)
    } catch {
      // handle error
    }
  }

  return (
    <PageWrapper
      title="Live Calls"
      subtitle="Real-time call monitoring"
    >
      {activeCalls.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center py-24"
        >
          <span className="mb-4 text-6xl">🎙</span>
          <h3 className="mb-2 text-xl font-semibold text-text-primary">No active calls</h3>
          <p className="text-sm text-text-muted">
            Calls will appear here in real time when customers call in
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence>
            {activeCalls.map((call) => (
              <motion.div
                key={call.call_sid}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                layout
              >
                <Card className="p-5">
                  {/* Header */}
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <p className="text-lg font-semibold text-text-primary">
                        {call.caller_number?.replace(/(\d{2})(\d{4})(\d{4})/, '$1****$3') || 'Unknown'}
                      </p>
                      <p className="text-sm text-text-muted">
                        {call.duration
                          ? `${Math.floor(call.duration / 60)}:${(call.duration % 60).toString().padStart(2, '0')}`
                          : 'Connecting...'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'flex h-2.5 w-2.5 rounded-full',
                          call.sentiment === 'positive'
                            ? 'bg-emerald-500'
                            : call.sentiment === 'negative'
                            ? 'bg-red-500'
                            : 'bg-yellow-500'
                        )}
                      />
                    </div>
                  </div>

                  {/* Verification Status */}
                  <div className="mb-4 flex items-center gap-2">
                    <Badge
                      variant={
                        call.verification_status === 'verified'
                          ? 'success'
                          : call.verification_status === 'verifying'
                          ? 'warning'
                          : 'error'
                      }
                    >
                      {call.verification_status === 'verified'
                        ? '✓ Verified'
                        : call.verification_status === 'verifying'
                        ? '⏳ Verifying'
                        : '✗ Not Verified'}
                    </Badge>
                    {call.language && (
                      <Badge variant="default">{call.language}</Badge>
                    )}
                  </div>

                  {/* Transcript */}
                  {call.transcript && (
                    <div className="mb-4 rounded-lg bg-surface-secondary p-3">
                      <p className="font-mono text-xs leading-relaxed text-text-secondary">
                        {call.transcript}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleIntervene(call.call_sid)}
                    >
                      Intervene
                    </Button>
                    <Button size="sm" variant="ghost" className="flex-1">
                      Details
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </PageWrapper>
  )
}
