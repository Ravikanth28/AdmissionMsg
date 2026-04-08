import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getReport } from '../api'
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, Users,
  Download, Phone, User, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react'

export default function ReportDetail() {
  const { id } = useParams()
  const [report, setReport] = useState(null)
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadReport()
  }, [id])

  async function loadReport() {
    try {
      const res = await getReport(id)
      setReport(res.data.report)
      setContacts(res.data.contacts || [])
    } catch (err) {
      console.error('Failed to load report:', err)
    } finally {
      setLoading(false)
    }
  }

  function downloadCSV() {
    const headers = ['Name', 'Phone', 'Status', 'Error', 'Sent At']
    const rows = contacts.map(c => [
      c.name || '',
      c.phone,
      c.status,
      c.error_message || '',
      c.sent_at ? new Date(c.sent_at).toLocaleString() : ''
    ])
    
    const csvContent = [headers, ...rows].map(r => r.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report-${report?.campaign_name || id}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredContacts = contacts.filter(c => {
    if (filter === 'all') return true
    return c.status === filter
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <p className="text-dark-400">Report not found</p>
        <Link to="/reports" className="text-brand-400 mt-2 inline-block">Back to Reports</Link>
      </div>
    )
  }

  const successRate = report.total_contacts > 0
    ? Math.round((report.sent_count / report.total_contacts) * 100)
    : 0

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            to="/reports"
            className="p-2 bg-dark-800 hover:bg-dark-700 rounded-xl border border-dark-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-dark-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{report.campaign_name}</h1>
            <p className="text-dark-400 text-sm mt-0.5">
              {new Date(report.created_at).toLocaleDateString()} at {new Date(report.created_at).toLocaleTimeString()}
            </p>
          </div>
        </div>
        <button
          onClick={downloadCSV}
          className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 text-dark-300 rounded-xl text-sm border border-dark-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="glass rounded-xl p-4 text-center">
          <Users className="w-5 h-5 text-blue-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{report.total_contacts}</p>
          <p className="text-xs text-dark-500">Total</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <CheckCircle2 className="w-5 h-5 text-brand-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-brand-400">{report.sent_count}</p>
          <p className="text-xs text-dark-500">Sent</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <XCircle className="w-5 h-5 text-red-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-red-400">{report.failed_count}</p>
          <p className="text-xs text-dark-500">Failed</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <AlertCircle className="w-5 h-5 text-amber-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-amber-400">{report.skipped_count || 0}</p>
          <p className="text-xs text-dark-500">Skipped</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className={`text-2xl font-bold ${
            successRate >= 80 ? 'text-brand-400' : successRate >= 50 ? 'text-amber-400' : 'text-red-400'
          }`}>{successRate}%</div>
          <p className="text-xs text-dark-500 mt-2">Success Rate</p>
        </div>
      </div>

      {/* Contact list */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-dark-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Contact Details</h2>
          <div className="flex gap-1">
            {['all', 'sent', 'failed', 'pending', 'skipped'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-lg capitalize transition-colors ${
                  filter === f
                    ? 'bg-brand-500 text-white'
                    : 'bg-dark-800 text-dark-400 hover:bg-dark-700'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-[500px] overflow-y-auto">
          {filteredContacts.length === 0 ? (
            <p className="text-center text-dark-500 py-8">No contacts found</p>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 bg-dark-900/90 backdrop-blur-sm">
                <tr className="text-xs text-dark-500 uppercase">
                  <th className="text-left px-4 py-3">Contact</th>
                  <th className="text-left px-4 py-3">Phone</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Error</th>
                  <th className="text-left px-4 py-3">Sent At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800">
                {filteredContacts.map(contact => (
                  <ContactRow key={contact.id} contact={contact} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

function ContactRow({ contact }) {
  const [expanded, setExpanded] = useState(false)
  const hasError = !!contact.error_message
  const isWarning = contact.status === 'sent' && hasError

  return (
    <>
      <tr className={`hover:bg-dark-800/30 transition-colors ${expanded ? 'bg-dark-800/20' : ''}`}>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-dark-700 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-dark-400" />
            </div>
            <span className="text-sm text-white">{contact.name || 'Unknown'}</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <span className="text-sm text-dark-300 flex items-center gap-1 font-mono">
            <Phone className="w-3 h-3 flex-shrink-0" />
            {contact.phone}
          </span>
        </td>
        <td className="px-4 py-3">
          <span className={`text-xs px-2 py-1 rounded-md font-medium ${
            contact.status === 'sent' ? 'bg-brand-500/10 text-brand-400' :
            contact.status === 'failed' ? 'bg-red-500/10 text-red-400' :
            contact.status === 'skipped' ? 'bg-amber-500/10 text-amber-400' :
            'bg-dark-700 text-dark-400'
          }`}>
            {contact.status}{isWarning ? ' ⚠' : ''}
          </span>
        </td>
        <td className="px-4 py-3 max-w-[220px]">
          {hasError ? (
            <button
              onClick={() => setExpanded(v => !v)}
              className={`flex items-start gap-1 text-xs text-left w-full hover:opacity-80 transition-opacity ${isWarning ? 'text-amber-400' : 'text-red-400'}`}
            >
              <span className="line-clamp-2 flex-1">{contact.error_message}</span>
              {contact.error_message.length > 60 && (
                expanded ? <ChevronUp className="w-3 h-3 mt-0.5 flex-shrink-0" /> : <ChevronDown className="w-3 h-3 mt-0.5 flex-shrink-0" />
              )}
            </button>
          ) : (
            <span className="text-xs text-dark-600">—</span>
          )}
        </td>
        <td className="px-4 py-3">
          <span className="text-xs text-dark-500">
            {contact.sent_at ? new Date(contact.sent_at).toLocaleTimeString() : '—'}
          </span>
        </td>
      </tr>
      {expanded && hasError && (
        <tr className="bg-dark-800/30">
          <td colSpan={5} className="px-4 pb-3 pt-1">
            <div className={`p-3 rounded-xl text-xs font-mono whitespace-pre-wrap break-all ${isWarning ? 'bg-amber-500/5 border border-amber-500/20 text-amber-300' : 'bg-red-500/5 border border-red-500/20 text-red-300'}`}>
              {contact.error_message}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
