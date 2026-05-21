import { useState, useRef } from 'react'
import { uploadContacts } from '../lib/api'
import { Upload, Download, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function ContactsTab({ companyId }: { companyId: string }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setUploading(true)
    setResult(null)
    setError(null)
    try {
      const res = await uploadContacts(companyId, file)
      setResult({ imported: res.imported, skipped: res.skipped })
      if (fileRef.current) fileRef.current.value = ''
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    }
    setUploading(false)
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary-600" /> Upload Contacts
        </h3>
        <a
          href="data:text/csv;charset=utf-8,phone%2Cname%2Cemail%0A9876543210%2CRahul+Sharma%2Crahul%40example.com%0A"
          download="sample_contacts.csv"
          className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
        >
          <Download className="w-4 h-4" /> Sample CSV
        </a>
      </div>
      <form onSubmit={handleUpload} className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={() => setResult(null)} />
          <button type="button" onClick={() => fileRef.current?.click()} className="text-primary-600 hover:text-primary-700 font-medium">
            Click to select CSV or Excel
          </button>
          <p className="text-sm text-gray-400 mt-1">CSV or Excel format</p>
        </div>
        <button type="submit" disabled={uploading} className="btn-primary flex items-center gap-2">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? 'Uploading...' : 'Upload Contacts'}
        </button>
      </form>
      {result && (
        <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="w-4 h-4" />
          Imported {result.imported} contacts{result.skipped > 0 ? ` (${result.skipped} skipped)` : ''}
        </div>
      )}
      {error && (
        <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
          <XCircle className="w-4 h-4" /> {error}
        </div>
      )}
    </div>
  )
}
