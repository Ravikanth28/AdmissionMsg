import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2, XCircle, Pause, Send, Loader2,
  BarChart3, Download, Home, RefreshCw
} from 'lucide-react'
import { getCampaignStatus } from '../../api'

export default function SendingStep({ status, onPause, campaignId, selectedContacts }) {
  const navigate = useNavigate()
  const [localStatus, setLocalStatus] = useState(status)
  const [showResultPopup, setShowResultPopup] = useState(false)

  useEffect(() => {
    setLocalStatus(status)
    if (status && (status.status === 'completed' || status.status === 'failed')) {
      setShowResultPopup(true)
    }
  }, [status])

  // Poll status if sending
  useEffect(() => {
    if (!campaignId) return
    let timer
    async function poll() {
      try {
        const res = await getCampaignStatus(campaignId)
        setLocalStatus(res.data)
        if (res.data.status === 'sending' && res.data.isActive) {
          timer = setTimeout(poll, 3000)
        } else if (res.data.status === 'completed' || res.data.status === 'failed') {
          setShowResultPopup(true)
        }
      } catch (err) {
        console.error('Poll error:', err)
      }
    }
    poll()
    return () => clearTimeout(timer)
  }, [campaignId])

  const total = localStatus?.total_contacts || selectedContacts?.length || 0
  const sent = localStatus?.sent_count || 0
  const failed = localStatus?.failed_count || 0
  const progress = total > 0 ? ((sent + failed) / total) * 100 : 0
  const isSending = localStatus?.status === 'sending'
  const isCompleted = localStatus?.status === 'completed'
  const isFailed = localStatus?.status === 'failed'

  return (
    <div className="max-w-3xl mx-auto">
      {/* Result Popup */}
      {showResultPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowResultPopup(false)}>
          <div className="glass rounded-2xl p-8 max-w-md w-full animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              {isCompleted ? (
                <div className="w-16 h-16 rounded-full bg-brand-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-brand-400" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-red-400" />
                </div>
              )}
              <h2 className="text-xl font-bold text-white">
                {isCompleted ? 'Campaign Completed!' : 'Campaign Finished'}
              </h2>
              <p className="text-dark-400 text-sm mt-1">Here's your campaign summary</p>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-dark-800 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-white">{total}</p>
                <p className="text-xs text-dark-500 mt-1">Total</p>
              </div>
              <div className="bg-brand-500/10 rounded-xl p-4 text-center border border-brand-500/20">
                <p className="text-2xl font-bold text-brand-400">{sent}</p>
                <p className="text-xs text-brand-400/70 mt-1">Sent</p>
              </div>
              <div className="bg-red-500/10 rounded-xl p-4 text-center border border-red-500/20">
                <p className="text-2xl font-bold text-red-400">{failed}</p>
                <p className="text-xs text-red-400/70 mt-1">Failed</p>
              </div>
            </div>

            {/* Success rate bar */}
            <div className="mb-6">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-dark-400">Success Rate</span>
                <span className="text-brand-400">{total > 0 ? Math.round(sent / total * 100) : 0}%</span>
              </div>
              <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${total > 0 ? (sent / total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate('/reports')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-dark-800 hover:bg-dark-700 text-dark-300 rounded-xl text-sm border border-dark-700 transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                View Reports
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-medium transition-colors"
              >
                <Home className="w-4 h-4" />
                Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main sending card */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-dark-700">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isSending ? 'bg-blue-500/10' : isCompleted ? 'bg-brand-500/10' : 'bg-red-500/10'
            }`}>
              {isSending ? (
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              ) : isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-brand-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {isSending ? 'Sending Campaign...' : isCompleted ? 'Campaign Completed' : 'Campaign Finished'}
              </h2>
              <p className="text-xs text-dark-400">
                {isSending ? 'Messages are being sent in batches' : 'All messages have been processed'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-dark-400">Progress</span>
              <span className="text-white font-medium">{Math.round(progress)}%</span>
            </div>
            <div className="h-3 bg-dark-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isSending
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 animate-pulse-slow'
                    : 'bg-gradient-to-r from-brand-500 to-emerald-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-dark-500 mt-1">{sent + failed} of {total} processed</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-dark-800/50 rounded-xl p-4 text-center border border-dark-700">
              <Send className="w-5 h-5 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{total}</p>
              <p className="text-xs text-dark-500">Total</p>
            </div>
            <div className="bg-brand-500/5 rounded-xl p-4 text-center border border-brand-500/20">
              <CheckCircle2 className="w-5 h-5 text-brand-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-brand-400">{sent}</p>
              <p className="text-xs text-brand-400/70">Sent</p>
            </div>
            <div className="bg-red-500/5 rounded-xl p-4 text-center border border-red-500/20">
              <XCircle className="w-5 h-5 text-red-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-400">{failed}</p>
              <p className="text-xs text-red-400/70">Failed</p>
            </div>
          </div>

          {/* Live indicator */}
          {isSending && (
            <div className="flex items-center justify-center gap-2 p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <p className="text-sm text-blue-300">Sending in progress - do not close this page</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {isSending && (
              <button
                onClick={onPause}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-xl text-sm font-medium border border-amber-500/20 transition-colors"
              >
                <Pause className="w-4 h-4" />
                Pause Campaign
              </button>
            )}
            
            {!isSending && (
              <>
                <button
                  onClick={() => setShowResultPopup(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-dark-800 hover:bg-dark-700 text-dark-300 rounded-xl text-sm border border-dark-700 transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                  View Summary
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  <Home className="w-4 h-4" />
                  Dashboard
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
