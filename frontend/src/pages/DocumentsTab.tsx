import { useState, useRef } from 'react'
import { uploadDocument, queryDocuments } from '../lib/api'
import { Upload, FileText, Search, Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function DocumentsTab({ companyId }: { companyId: string }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const [query, setQuery] = useState('')
  const [querying, setQuerying] = useState(false)
  const [queryResults, setQueryResults] = useState<{ chunk_text: string; similarity: number }[] | null>(null)

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadResult(null)
    setUploadError(null)
    try {
      const result = await uploadDocument(companyId, file)
      setUploadResult(`Uploaded "${file.name}" — ${result.chunks_created} chunks created`)
      if (fileRef.current) fileRef.current.value = ''
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    }
    setUploading(false)
  }

  async function handleQuery(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setQuerying(true)
    try {
      const result = await queryDocuments(companyId, query)
      setQueryResults(result.chunks)
    } catch (err: unknown) {
      console.error(err)
    }
    setQuerying(false)
  }

  return (
    <div className="space-y-6">
      {/* Upload */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary-600" /> Upload PDF
        </h3>
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={() => setUploadResult(null)}
            />
            <button type="button" onClick={() => fileRef.current?.click()} className="text-primary-600 hover:text-primary-700 font-medium">
              Click to select a PDF
            </button>
            <p className="text-sm text-gray-400 mt-1">PDF files only</p>
          </div>
          <button type="submit" disabled={uploading} className="btn-primary flex items-center gap-2">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </form>
        {uploadResult && (
          <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="w-4 h-4" /> {uploadResult}
          </div>
        )}
        {uploadError && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
            <XCircle className="w-4 h-4" /> {uploadError}
          </div>
        )}
      </div>

      {/* Test Query */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-primary-600" /> Test Document Search
        </h3>
        <form onSubmit={handleQuery} className="flex gap-2">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="input-field flex-1"
            placeholder="Ask a question about your documents..."
          />
          <button type="submit" disabled={querying} className="btn-primary flex items-center gap-2">
            {querying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search
          </button>
        </form>
        {queryResults && (
          <div className="mt-4 space-y-3">
            {queryResults.length === 0 ? (
              <p className="text-sm text-gray-400">No matching content found</p>
            ) : (
              queryResults.map((chunk, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500">Relevance: {(chunk.similarity * 100).toFixed(0)}%</span>
                  </div>
                  <p className="text-sm text-gray-700">{chunk.chunk_text}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
