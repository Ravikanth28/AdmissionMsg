import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getReports } from '../api'
import {
  FileBarChart, CheckCircle2, XCircle, Clock, ArrowRight,
  Calendar, Users, TrendingUp
} from 'lucide-react'

export default function Reports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReports()
  }, [])

  async function loadReports() {
    try {
      const res = await getReports()
      setReports(res.data.reports || [])
    } catch (err) {
      console.error('Failed to load reports:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Reports</h1>
        <p className="text-dark-400 mt-1">View campaign sending history and results</p>
      </div>

      {reports.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <FileBarChart className="w-12 h-12 text-dark-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-dark-300 mb-2">No reports yet</h3>
          <p className="text-dark-500">Reports will appear here after you send a campaign.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map(report => {
            const successRate = report.total_contacts > 0
              ? Math.round((report.sent_count / report.total_contacts) * 100)
              : 0

            return (
              <Link
                key={report.id}
                to={`/reports/${report.id}`}
                className="glass rounded-2xl p-5 block hover:border-dark-600 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      successRate >= 80 ? 'bg-brand-500/10' : successRate >= 50 ? 'bg-amber-500/10' : 'bg-red-500/10'
                    }`}>
                      <TrendingUp className={`w-6 h-6 ${
                        successRate >= 80 ? 'text-brand-400' : successRate >= 50 ? 'text-amber-400' : 'text-red-400'
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{report.campaign_name}</h3>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-dark-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(report.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-dark-500 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {report.total_contacts} contacts
                        </span>
                        {report.start_time && report.end_time && (
                          <span className="text-xs text-dark-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(report.start_time, report.end_time)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-brand-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="font-bold">{report.sent_count}</span>
                        </div>
                        <p className="text-[10px] text-dark-500">Sent</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-red-400">
                          <XCircle className="w-4 h-4" />
                          <span className="font-bold">{report.failed_count}</span>
                        </div>
                        <p className="text-[10px] text-dark-500">Failed</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-lg font-bold ${
                          successRate >= 80 ? 'text-brand-400' : successRate >= 50 ? 'text-amber-400' : 'text-red-400'
                        }`}>{successRate}%</p>
                        <p className="text-[10px] text-dark-500">Success</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-dark-600 group-hover:text-dark-400 transition-colors" />
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4 h-1.5 bg-dark-800 rounded-full overflow-hidden">
                  <div className="h-full flex">
                    <div
                      className="bg-brand-500 transition-all"
                      style={{ width: `${report.total_contacts > 0 ? (report.sent_count / report.total_contacts) * 100 : 0}%` }}
                    />
                    <div
                      className="bg-red-500 transition-all"
                      style={{ width: `${report.total_contacts > 0 ? (report.failed_count / report.total_contacts) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function formatDuration(start, end) {
  const ms = new Date(end) - new Date(start)
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
}
