import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getCampaigns, getReports, deleteCampaign, bulkDeleteCampaigns } from "../api"
import toast from "react-hot-toast"
import {
  Plus, Send, CheckCircle2, XCircle, Clock,
  TrendingUp, MessageSquare, BarChart3,
  ArrowRight, Zap, Trash2, CheckSquare, Square
} from "lucide-react"

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState([])
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(new Set())
  const [deleting, setDeleting] = useState(false)
  const [confirmId, setConfirmId] = useState(null)   // single delete
  const [confirmBulk, setConfirmBulk] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const [campRes, repRes] = await Promise.all([getCampaigns(), getReports()])
      setCampaigns(campRes.data.campaigns || [])
      setReports(repRes.data.reports || [])
    } catch (err) {
      console.error("Failed to load dashboard:", err)
    } finally {
      setLoading(false)
    }
  }

  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected(prev => prev.size === campaigns.length ? new Set() : new Set(campaigns.map(c => c.id)))
  }

  async function handleDelete(id) {
    setDeleting(true)
    try {
      await deleteCampaign(id)
      toast.success("Campaign deleted")
      setCampaigns(prev => prev.filter(c => c.id !== id))
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n })
    } catch {
      toast.error("Failed to delete campaign")
    } finally {
      setDeleting(false)
      setConfirmId(null)
    }
  }

  async function handleBulkDelete() {
    setDeleting(true)
    const ids = [...selected]
    try {
      await bulkDeleteCampaigns(ids)
      toast.success(`${ids.length} campaign${ids.length > 1 ? "s" : ""} deleted`)
      setCampaigns(prev => prev.filter(c => !ids.includes(c.id)))
      setSelected(new Set())
    } catch {
      toast.error("Bulk delete failed")
    } finally {
      setDeleting(false)
      setConfirmBulk(false)
    }
  }

  const totalSent = reports.reduce((sum, r) => sum + (r.sent_count || 0), 0)
  const totalFailed = reports.reduce((sum, r) => sum + (r.failed_count || 0), 0)
  const activeCampaigns = campaigns.filter(c => c.status === "sending").length

  const stats = [
    { label: "Total Campaigns", value: campaigns.length, icon: MessageSquare, color: "from-brand-500 to-emerald-500", bg: "bg-brand-500/10" },
    { label: "Messages Sent", value: totalSent, icon: Send, color: "from-blue-500 to-cyan-500", bg: "bg-blue-500/10" },
    { label: "Success Rate", value: totalSent + totalFailed > 0 ? `${Math.round(totalSent / (totalSent + totalFailed) * 100)}%` : "N/A", icon: TrendingUp, color: "from-purple-500 to-pink-500", bg: "bg-purple-500/10" },
    { label: "Active Now", value: activeCampaigns, icon: Zap, color: "from-amber-500 to-orange-500", bg: "bg-amber-500/10" },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-dark-400 mt-1">Manage your WhatsApp campaigns</p>
        </div>
        <Link
          to="/campaign/new"
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg shadow-brand-500/20"
        >
          <Plus className="w-5 h-5" /> New Campaign
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map(({ label, value, icon: Icon, bg }) => (
          <div key={label} className="glass rounded-2xl p-5">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5 text-white/70" />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-sm text-dark-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Campaigns Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-dark-700 flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-400" />
            Campaigns
            {campaigns.length > 0 && <span className="text-xs font-normal text-dark-500">({campaigns.length})</span>}
          </h2>
          <div className="flex items-center gap-2">
            {selected.size > 0 && (
              <button
                onClick={() => setConfirmBulk(true)}
                disabled={deleting}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-sm border border-red-500/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete {selected.size} selected
              </button>
            )}
            <Link to="/reports" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1">
              View Reports <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {campaigns.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-dark-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-dark-300 mb-2">No campaigns yet</h3>
            <p className="text-dark-500 mb-6">Create your first WhatsApp campaign to get started.</p>
            <Link to="/campaign/new" className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium transition-all">
              <Plus className="w-4 h-4" /> Create Campaign
            </Link>
          </div>
        ) : (
          <>
            {/* Select-all header row */}
            <div className="flex items-center gap-3 px-4 py-2.5 bg-dark-800/40 border-b border-dark-800 text-xs text-dark-500 uppercase tracking-wider">
              <button onClick={toggleAll} className="flex items-center gap-2 hover:text-dark-300 transition-colors">
                {selected.size === campaigns.length
                  ? <CheckSquare className="w-4 h-4 text-brand-400" />
                  : <Square className="w-4 h-4" />}
                {selected.size === campaigns.length ? "Deselect all" : "Select all"}
              </button>
            </div>
            <div className="divide-y divide-dark-800">
              {campaigns.map(campaign => (
                <div key={campaign.id} className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${selected.has(campaign.id) ? "bg-brand-500/5" : "hover:bg-dark-800/30"}`}>
                  {/* Checkbox */}
                  <button onClick={() => toggleSelect(campaign.id)} className="flex-shrink-0">
                    {selected.has(campaign.id)
                      ? <CheckSquare className="w-4 h-4 text-brand-400" />
                      : <Square className="w-4 h-4 text-dark-600 hover:text-dark-400" />}
                  </button>

                  {/* Status icon */}
                  <StatusBadge status={campaign.status} />

                  {/* Info — clickable to open */}
                  <Link to={`/campaign/${campaign.id}`} className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-white truncate">{campaign.name}</h3>
                    <p className="text-xs text-dark-500 mt-0.5">
                      {campaign.total_contacts} contacts &middot; {new Date(campaign.created_at).toLocaleDateString()}
                    </p>
                  </Link>

                  {/* Sent / Failed counts */}
                  <div className="hidden sm:flex items-center gap-5 text-sm">
                    <div className="flex items-center gap-1.5 text-brand-400">
                      <CheckCircle2 className="w-4 h-4" />{campaign.sent_count}
                    </div>
                    <div className="flex items-center gap-1.5 text-red-400">
                      <XCircle className="w-4 h-4" />{campaign.failed_count}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Link to={`/campaign/${campaign.id}`} className="p-1.5 hover:bg-dark-700 rounded-lg text-dark-500 hover:text-dark-300 transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => setConfirmId(campaign.id)}
                      disabled={deleting}
                      className="p-1.5 hover:bg-red-500/10 rounded-lg text-dark-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Single delete confirm modal */}
      {confirmId && (
        <ConfirmModal
          message="Delete this campaign? This cannot be undone."
          onConfirm={() => handleDelete(confirmId)}
          onCancel={() => setConfirmId(null)}
          loading={deleting}
        />
      )}

      {/* Bulk delete confirm modal */}
      {confirmBulk && (
        <ConfirmModal
          message={`Delete ${selected.size} campaign${selected.size > 1 ? "s" : ""}? This cannot be undone.`}
          onConfirm={handleBulkDelete}
          onCancel={() => setConfirmBulk(false)}
          loading={deleting}
        />
      )}
    </div>
  )
}

function StatusBadge({ status }) {
  const config = {
    draft: { color: "bg-dark-600 text-dark-300", icon: Clock },
    reviewing: { color: "bg-amber-500/10 text-amber-400", icon: Clock },
    sending: { color: "bg-blue-500/10 text-blue-400", icon: Send },
    completed: { color: "bg-brand-500/10 text-brand-400", icon: CheckCircle2 },
    paused: { color: "bg-amber-500/10 text-amber-400", icon: Clock },
    failed: { color: "bg-red-500/10 text-red-400", icon: XCircle },
  }
  const { color, icon: Icon } = config[status] || config.draft
  return (
    <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
      <Icon className="w-4 h-4" />
    </div>
  )
}

function ConfirmModal({ message, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="glass rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-6 h-6 text-red-400" />
        </div>
        <p className="text-center text-white font-medium mb-1">Are you sure?</p>
        <p className="text-center text-sm text-dark-400 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 py-2.5 bg-dark-800 hover:bg-dark-700 text-dark-300 rounded-xl text-sm border border-dark-700 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  )
}
