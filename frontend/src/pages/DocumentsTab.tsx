import React, { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import { Progress } from '../components/ui/Progress'
import { Skeleton } from '../components/ui/Skeleton'
import { PageWrapper } from '../components/layout/PageWrapper'
import { useCompanyStore } from '../stores/companyStore'
import { api } from '../lib/api'

export function DocumentsTab() {
  const { activeCompany } = useCompanyStore()
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[] | null>(null)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    async function load() {
      const cid = activeCompany?.id || ''
      if (!cid) { setLoading(false); return }
      try {
        const res = await api.documents.list(cid)
        setDocuments(res.documents || [])
      } catch {
        // fallback
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [activeCompany?.id])

  const handleUpload = useCallback(async (file: File) => {
    setUploading(true)
    setUploadProgress(0)
    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((p) => Math.min(p + 10, 90))
      }, 500)
      const cid = activeCompany?.id || ''
      const result = await api.documents.upload(cid, file)
      clearInterval(progressInterval)
      setUploadProgress(100)
      setDocuments((prev) => [result, ...prev])
      setTimeout(() => setUploading(false), 500)
    } catch {
      setUploading(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file && file.type === 'application/pdf') handleUpload(file)
    },
    [handleUpload]
  )

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    try {
      const cid = activeCompany?.id || ''
      const results = await api.documents.query(cid, searchQuery)
      setSearchResults(results.chunks || [])
    } catch {
      setSearchResults([])
    }
  }

  return (
    <PageWrapper
      title="Documents"
      subtitle={`${documents.length} documents uploaded`}
      actions={
        <label className="cursor-pointer">
          <Button>
            Upload PDF
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            />
          </Button>
        </label>
      }
    >
      {/* Upload Progress */}
      {uploading && (
        <Card className="mb-6 p-4">
          <p className="mb-2 text-sm font-medium text-text-primary">Uploading...</p>
          <Progress value={uploadProgress} size="sm" color="brand" />
        </Card>
      )}

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`mb-6 cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
          dragOver ? 'border-brand-500 bg-brand-500/5' : 'border-surface-border hover:border-zinc-600'
        }`}
      >
        <span className="mb-2 block text-3xl">📄</span>
        <p className="text-sm text-text-muted">
          Drag and drop PDF files here, or click to upload
        </p>
      </div>

      {/* Search */}
      <Card className="mb-6 p-4">
        <div className="flex gap-3">
          <Input
            placeholder="Test your knowledge base — ask a question..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} variant="secondary">
            Search
          </Button>
        </div>
        {searchResults && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-text-muted">
              {searchResults.length} results found
            </p>
            {searchResults.map((result, i) => (
              <div key={i} className="rounded-lg bg-surface-secondary p-3">
                <p className="text-sm text-text-secondary">{result.chunk_text || result.text}</p>
                <p className="mt-1 text-xs text-text-muted">
                  Score: {result.similarity?.toFixed(3) || 'N/A'}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Document Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-5">
              <Skeleton className="mb-3 h-5 w-40" />
              <Skeleton className="mb-2 h-3 w-24" />
              <Skeleton className="h-3 w-32" />
            </Card>
          ))}
        </div>
      ) : documents.length === 0 ? (
        <Card className="flex flex-col items-center py-12">
          <span className="mb-4 text-5xl">📄</span>
          <h3 className="mb-2 text-lg font-medium text-text-primary">No documents yet</h3>
          <p className="text-sm text-text-muted">
            Upload PDFs to build your AI knowledge base
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc, i) => (
            <motion.div
              key={doc.id || i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="p-5 transition-all hover:border-zinc-600/50">
                <div className="mb-3 flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-text-primary">
                      {doc.filename || doc.file_name || `Document ${i + 1}`}
                    </p>
                    <p className="text-xs text-text-muted">
                      {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'Recently'}
                    </p>
                  </div>
                  <Badge variant={doc.status === 'ready' ? 'success' : doc.status === 'processing' ? 'warning' : 'error'} size="sm">
                    {doc.status || 'processing'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <span>{doc.chunks || doc.chunk_count || 0} chunks</span>
                  <span>·</span>
                  <button
                    className="text-brand-400 hover:text-brand-300"
                    onClick={() => setSearchQuery(doc.filename || '')}
                  >
                    Test search
                  </button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </PageWrapper>
  )
}
