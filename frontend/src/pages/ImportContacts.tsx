import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { PageWrapper } from '../components/layout/PageWrapper'
import { api } from '../lib/api'
import { useCompanyStore } from '../stores/companyStore'

export function ImportContacts() {
  const navigate = useNavigate()
  const { activeCompany } = useCompanyStore()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{
    imported: number
    skipped: number
    invalid: number
  } | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    setSelectedFile(file)
    // Try to parse CSV preview
    const text = await file.text()
    const lines = text.split('\n').filter((l) => l.trim())
    if (lines.length > 1) {
      const headers = lines[0].split(',').map((h) => h.trim())
      const rows = lines.slice(1, 6).map((line) => {
        const values = line.split(',').map((v) => v.trim())
        return headers.reduce((acc, h, i) => ({ ...acc, [h]: values[i] }), {} as any)
      })
      setPreview(rows)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleImport = async () => {
    if (!selectedFile) return
    setImporting(true)
    try {
      const res = await api.contacts.upload(activeCompany?.id || '', selectedFile)
      setResult({ imported: res.imported, skipped: res.skipped, invalid: 0 })
    } catch {
      setResult({ imported: 0, skipped: 0, invalid: 0 })
    } finally {
      setImporting(false)
    }
  }

  return (
    <PageWrapper
      title="Import Contacts"
      subtitle="Upload CSV or Excel file with your contact list"
      actions={
        <Button variant="secondary" onClick={() => navigate('/contacts')}>
          ← Back to Contacts
        </Button>
      }
    >
      <div className="mx-auto max-w-2xl">
        {result ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-8 text-center">
              <span className="mb-4 text-5xl">✅</span>
              <h3 className="mb-2 text-xl font-semibold text-text-primary">Import Complete</h3>
              <div className="mx-auto mt-6 flex max-w-xs justify-center gap-8">
                <div>
                  <p className="text-2xl font-bold text-emerald-400">{result.imported}</p>
                  <p className="text-sm text-text-muted">Imported</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-400">{result.skipped}</p>
                  <p className="text-sm text-text-muted">Skipped</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-400">{result.invalid}</p>
                  <p className="text-sm text-text-muted">Invalid</p>
                </div>
              </div>
              <div className="mt-8 flex justify-center gap-3">
                <Button variant="secondary" onClick={() => setResult(null)}>
                  Import Another
                </Button>
                <Button onClick={() => navigate('/contacts')}>View Contacts</Button>
              </div>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
              className={`cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all ${
                dragOver
                  ? 'border-brand-500 bg-brand-500/5'
                  : 'border-surface-border hover:border-zinc-600'
              }`}
            >
              <input
                id="file-input"
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <span className="mb-3 block text-4xl">📁</span>
              <p className="mb-1 text-lg font-medium text-text-primary">
                {selectedFile ? selectedFile.name : 'Drop your file here'}
              </p>
              <p className="text-sm text-text-muted">
                {selectedFile
                  ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                  : 'or click to browse. Supports CSV and Excel'}
              </p>
              <Button variant="secondary" size="sm" className="mt-4">
                Browse Files
              </Button>
            </div>

            {/* Preview */}
            {preview.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="p-6">
                  <h3 className="mb-4 font-semibold text-text-primary">Preview (first {preview.length} rows)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-surface-border">
                          {Object.keys(preview[0]).map((header) => (
                            <th key={header} className="p-2 font-medium text-text-muted">{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((row, i) => (
                          <tr key={i} className="border-b border-surface-border/30">
                            {Object.values(row).map((val: any, j) => (
                              <td key={j} className="p-2 text-text-secondary">{val || '-'}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 flex justify-end gap-3">
                    <Button variant="secondary" onClick={() => { setSelectedFile(null); setPreview([]) }}>
                      Cancel
                    </Button>
                    <Button onClick={handleImport} loading={importing}>
                      Import {preview.length}+ Contacts
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Sample Download */}
            <Card className="p-4 text-center">
              <p className="mb-2 text-sm text-text-muted">
                Need a template? Download our sample CSV
              </p>
              <Button variant="secondary" size="sm">
                Download Sample
              </Button>
            </Card>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
