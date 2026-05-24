import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { FileText, Upload, Search, Trash2, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Progress from '../components/ui/Progress'
import Input from '../components/ui/Input'
import { SkeletonCard } from '../components/ui/Skeleton'
import { documentsApi } from '../lib/api'
import { formatDate, formatNumber, cn } from '../lib/utils'
import useCompanyStore from '../stores/companyStore'
import { useToast } from '../components/ui/Toast'

export function DocumentsTab() {
  const { company } = useCompanyStore()
  const { addToast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [chunkProgress, setChunkProgress] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [query, setQuery] = useState('')
  const [queryResult, setQueryResult] = useState<any>(null)
  const [querying, setQuerying] = useState(false)

  useEffect(() => {
    if (!company?.id) return
    loadDocuments()
  }, [company?.id])

  const loadDocuments = async () => {
    if (!company?.id) return
    setLoading(true)
    try {
      const data = await documentsApi.list(company.id)
      setDocuments(data.documents || [])
    } catch {
      // fallback
    }
    setLoading(false)
  }

  const handleUpload = async (file: File) => {
    if (!company?.id) return
    setUploading(true)
    setUploadProgress(10)
    setChunkProgress('Uploading...')

    try {
      const data = await documentsApi.upload(company.id, file)
      setUploadProgress(100)
      setChunkProgress(`Creating chunks: ${data.chunks} chunks`)
      addToast({ type: 'success', message: `Document "${file.name}" uploaded` })
      loadDocuments()
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Upload failed' })
    }
    setUploading(false)
    setUploadProgress(0)
    setChunkProgress('')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f && f.type === 'application/pdf') {
      handleUpload(f)
    } else {
      addToast({ type: 'error', message: 'Please upload a PDF file' })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await documentsApi.delete(id)
      setDocuments((prev) => prev.filter((d) => d.id !== id))
      addToast({ type: 'success', message: 'Document deleted' })
    } catch (err: any) {
      addToast({ type: 'error', message: err.message })
    }
  }

  const handleQuery = async () => {
    if (!company?.id || !query) return
    setQuerying(true)
    try {
      const data = await documentsApi.query(company.id, query)
      setQueryResult(data)
    } catch (err: any) {
      addToast({ type: 'error', message: err.message })
    }
    setQuerying(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Documents</h2>
          <p className="text-sm text-text-tertiary">{documents.length} documents</p>
        </div>
        <Button onClick={() => fileRef.current?.click()} icon={<Upload size={16} />}>
          Upload PDF
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
          className="hidden"
        />
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileRef.current?.click()}
        className={cn(
          'flex flex-col items-center justify-center py-12 rounded-xl border-2 border-dashed cursor-pointer transition-all',
          dragOver ? 'border-brand-500 bg-brand-500/5' : 'border-border-default hover:border-border-strong bg-bg-surface',
        )}
      >
        <div className={cn(
          'w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-all',
          dragOver ? 'bg-brand-500/20' : 'bg-bg-elevated',
        )}>
          <Upload size={24} className={dragOver ? 'text-brand-400' : 'text-text-tertiary'} />
        </div>
        <p className="text-sm text-text-primary mb-1">Drop PDFs here or click to browse</p>
        <p className="text-xs text-text-tertiary">Upload knowledge base documents for your AI</p>
      </div>

      {/* Upload progress */}
      {uploading && (
        <Card>
          <CardHeader>
            <CardTitle>Uploading...</CardTitle>
          </CardHeader>
          <Progress value={uploadProgress} showLabel />
          {chunkProgress && <p className="text-xs text-text-tertiary mt-2">{chunkProgress}</p>}
        </Card>
      )}

      {/* Knowledge base test */}
      <Card>
        <CardHeader>
          <CardTitle>Test Knowledge Base</CardTitle>
        </CardHeader>
        <div className="flex gap-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question to test your AI..."
            icon={<Search size={16} />}
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
          />
          <Button onClick={handleQuery} loading={querying}>
            Search
          </Button>
        </div>

        {queryResult && (
          <div className="mt-4 space-y-2">
            {queryResult.chunks?.map((chunk: any, i: number) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-bg-surface border border-border-subtle text-sm"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    size="sm"
                    variant={(chunk.similarity || 0) > 0.7 ? 'success' : (chunk.similarity || 0) > 0.4 ? 'warning' : 'default'}
                  >
                    {Math.round((chunk.similarity || 0) * 100)}% match
                  </Badge>
                </div>
                <p className="text-text-secondary text-xs">{chunk.content}</p>
              </div>
            ))}
            {(!queryResult.chunks || queryResult.chunks.length === 0) && (
              <p className="text-sm text-text-tertiary text-center py-4">No relevant chunks found</p>
            )}
          </div>
        )}
      </Card>

      {/* Document grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <FileText size={40} className="text-text-tertiary mb-3" />
          <p className="text-sm text-text-secondary">No documents uploaded</p>
          <p className="text-xs text-text-tertiary mt-1">Upload PDFs to build your AI knowledge base</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                      <FileText size={20} className="text-brand-400" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-sm truncate">{doc.original_filename}</CardTitle>
                      <p className="text-xs text-text-tertiary">{formatDate(doc.created_at)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-1.5 text-text-tertiary hover:text-error rounded-md hover:bg-error/5 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </CardHeader>

                <div className="flex items-center gap-3 text-xs text-text-tertiary">
                  <span>{formatNumber(doc.file_size || 0)} bytes</span>
                  <span>·</span>
                  <span>{doc.chunk_count || 0} chunks</span>
                </div>

                <Badge
                  variant={doc.status === 'ready' ? 'success' : doc.status === 'processing' ? 'warning' : 'error'}
                  dot
                  className="mt-3"
                >
                  {doc.status === 'ready' ? 'Ready' : doc.status === 'processing' ? 'Processing' : 'Failed'}
                </Badge>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

export default DocumentsTab
