import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Progress from '../components/ui/Progress'
import { useToast } from '../components/ui/Toast'
import { contactsApi } from '../lib/api'
import useCompanyStore from '../stores/companyStore'
import { cn } from '../lib/utils'

export function ImportContacts() {
  const navigate = useNavigate()
  const { company } = useCompanyStore()
  const { addToast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{ imported: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f && (f.name.endsWith('.csv') || f.name.endsWith('.xlsx') || f.name.endsWith('.xls'))) {
      setFile(f)
    } else {
      addToast({ type: 'error', message: 'Please upload a CSV or Excel file' })
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setFile(f)
  }

  const handleImport = async () => {
    if (!file || !company?.id) return
    setImporting(true)
    setError(null)
    setProgress(30)

    try {
      const data = await contactsApi.import(company.id, file)
      setProgress(100)
      setResult(data)
      addToast({ type: 'success', message: `${data.imported} contacts imported` })
    } catch (err: any) {
      setError(err.message || 'Import failed')
      addToast({ type: 'error', message: err.message || 'Import failed' })
    }
    setImporting(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => navigate('/contacts')} className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
        <ArrowLeft size={16} />
        Back to contacts
      </button>

      <div>
        <h1 className="text-xl font-bold text-text-primary">Import Contacts</h1>
        <p className="text-sm text-text-tertiary mt-1">Upload a CSV or Excel file with your contacts</p>
      </div>

      {/* Step 1: File upload */}
      {!file && !importing && !result && (
        <Card>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileRef.current?.click()}
            className={cn(
              'flex flex-col items-center justify-center py-16 px-6 rounded-xl border-2 border-dashed cursor-pointer transition-all',
              dragOver
                ? 'border-brand-500 bg-brand-500/5'
                : 'border-border-default hover:border-border-strong bg-bg-surface',
            )}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className={cn(
              'w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all',
              dragOver ? 'bg-brand-500/20' : 'bg-bg-elevated',
            )}>
              <Upload size={28} className={dragOver ? 'text-brand-400' : 'text-text-tertiary'} />
            </div>
            <p className="text-sm text-text-primary mb-1">
              {dragOver ? 'Drop file here' : 'Drop CSV or Excel file here'}
            </p>
            <p className="text-xs text-text-tertiary">or click to browse</p>
            <div className="flex items-center gap-4 mt-6 text-xs text-text-tertiary">
              <span>Supports: .csv, .xlsx</span>
              <span>Max: 10MB</span>
            </div>
          </div>
        </Card>
      )}

      {/* File selected */}
      {file && !importing && !result && (
        <Card>
          <CardHeader>
            <CardTitle>File Selected</CardTitle>
          </CardHeader>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-surface">
            <FileText size={20} className="text-brand-400" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary truncate">{file.name}</p>
              <p className="text-xs text-text-tertiary">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button onClick={() => setFile(null)} className="text-xs text-text-tertiary hover:text-text-primary">
              Remove
            </button>
          </div>

          <div className="mt-6 flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setFile(null)}>
              Choose Different
            </Button>
            <Button className="flex-1" onClick={handleImport}>
              <Upload size={16} />
              Import Contacts
            </Button>
          </div>
        </Card>
      )}

      {/* Importing */}
      {importing && (
        <Card>
          <CardHeader>
            <CardTitle>Importing Contacts...</CardTitle>
          </CardHeader>
          <Progress value={progress} showLabel size="lg" />
          <p className="text-xs text-text-tertiary mt-2">Processing your file...</p>
        </Card>
      )}

      {/* Result */}
      {result && !importing && (
        <Card>
          <div className="flex flex-col items-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-success-muted border border-success/20 flex items-center justify-center mb-4">
              <CheckCircle size={32} className="text-success" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-1">Import Complete!</h3>
            <p className="text-sm text-text-secondary mb-6">
              Successfully imported {result.imported} contacts
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => { setFile(null); setResult(null) }}>
                Import Another
              </Button>
              <Button onClick={() => navigate('/contacts')}>
                View Contacts
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Error */}
      {error && !importing && (
        <Card>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-error-muted border border-error/20">
            <AlertCircle size={20} className="text-error flex-shrink-0" />
            <div>
              <p className="text-sm text-error font-medium">Import failed</p>
              <p className="text-xs text-error/80 mt-1">{error}</p>
            </div>
          </div>
          <Button variant="secondary" className="mt-4" onClick={() => { setError(null); setFile(null) }}>
            Try Again
          </Button>
        </Card>
      )}
    </div>
  )
}

export default ImportContacts
