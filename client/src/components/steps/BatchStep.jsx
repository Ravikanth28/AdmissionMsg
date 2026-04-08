import {
  ChevronLeft, Rocket, Timer, Users, Layers, AlertTriangle,
  Loader2, Clock, Info
} from 'lucide-react'

export default function BatchStep({ batchSize, setBatchSize, batchDelay, setBatchDelay, totalContacts, onBack, onStart, loading }) {
  const totalBatches = Math.ceil(totalContacts / batchSize)
  const estimatedTime = totalBatches > 1 
    ? (totalBatches - 1) * batchDelay + totalContacts * 2 // 2s per message
    : totalContacts * 2

  function formatTime(seconds) {
    if (seconds < 60) return `~${seconds}s`
    if (seconds < 3600) return `~${Math.ceil(seconds / 60)} min`
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.ceil((seconds % 3600) / 60)
    return `~${hrs}h ${mins}m`
  }

  const presets = [
    { label: 'Conservative', batchSize: 5, delay: 120, description: 'Safest, slowest' },
    { label: 'Balanced', batchSize: 10, delay: 60, description: 'Recommended' },
    { label: 'Moderate', batchSize: 20, delay: 45, description: 'Faster, moderate risk' },
    { label: 'Fast', batchSize: 30, delay: 30, description: 'Quick, higher risk' },
  ]

  return (
    <div className="max-w-3xl mx-auto">
      <div className="glass rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-dark-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Layers className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Batch Settings</h2>
              <p className="text-xs text-dark-400">Configure sending speed to avoid WhatsApp blocks</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* Warning */}
          <div className="flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-300 font-medium">Account Safety</p>
              <p className="text-xs text-dark-400 mt-1">
                Sending too many messages too quickly can result in WhatsApp blocking your account. 
                Use conservative settings for safety. We recommend no more than 10 messages per batch 
                with at least 60 second delays.
              </p>
            </div>
          </div>

          {/* Quick presets */}
          <div>
            <label className="text-sm font-medium text-dark-300 mb-3 block">Quick Presets</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {presets.map(preset => (
                <button
                  key={preset.label}
                  onClick={() => { setBatchSize(preset.batchSize); setBatchDelay(preset.delay) }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    batchSize === preset.batchSize && batchDelay === preset.delay
                      ? 'border-brand-500 bg-brand-500/10'
                      : 'border-dark-700 hover:border-dark-600 bg-dark-800/50'
                  }`}
                >
                  <p className="text-sm font-medium text-white">{preset.label}</p>
                  <p className="text-[10px] text-dark-500 mt-0.5">{preset.description}</p>
                  <p className="text-xs text-dark-400 mt-1">
                    {preset.batchSize}/batch • {preset.delay}s delay
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Custom settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-sm font-medium text-dark-300 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Messages Per Batch
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={batchSize}
                onChange={e => setBatchSize(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
              <p className="text-xs text-dark-500 mt-1">How many messages to send before pausing</p>
            </div>

            <div>
              <label className="text-sm font-medium text-dark-300 mb-2 flex items-center gap-2">
                <Timer className="w-4 h-4" />
                Delay Between Batches (seconds)
              </label>
              <input
                type="number"
                min="10"
                max="7200"
                value={batchDelay}
                onChange={e => setBatchDelay(Math.max(10, parseInt(e.target.value) || 10))}
                className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
              <div className="flex gap-2 mt-2">
                {[30, 60, 120, 300, 600, 1800, 3600].map(s => (
                  <button
                    key={s}
                    onClick={() => setBatchDelay(s)}
                    className={`text-xs px-2 py-1 rounded-md transition-colors ${
                      batchDelay === s
                        ? 'bg-brand-500 text-white'
                        : 'bg-dark-800 text-dark-400 hover:bg-dark-700'
                    }`}
                  >
                    {s < 60 ? `${s}s` : s < 3600 ? `${s / 60}m` : `${s / 3600}h`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-dark-800/50 rounded-xl p-4 text-center border border-dark-700">
              <Users className="w-5 h-5 text-blue-400 mx-auto mb-2" />
              <p className="text-lg font-bold text-white">{totalContacts}</p>
              <p className="text-xs text-dark-500">Total Contacts</p>
            </div>
            <div className="bg-dark-800/50 rounded-xl p-4 text-center border border-dark-700">
              <Layers className="w-5 h-5 text-purple-400 mx-auto mb-2" />
              <p className="text-lg font-bold text-white">{totalBatches}</p>
              <p className="text-xs text-dark-500">Total Batches</p>
            </div>
            <div className="bg-dark-800/50 rounded-xl p-4 text-center border border-dark-700">
              <Clock className="w-5 h-5 text-amber-400 mx-auto mb-2" />
              <p className="text-lg font-bold text-white">{formatTime(estimatedTime)}</p>
              <p className="text-xs text-dark-500">Estimated Time</p>
            </div>
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 text-xs text-dark-500">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>Each individual message has a 2-second delay between sends. The batch delay is the pause between groups of messages.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-dark-700 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2.5 bg-dark-800 hover:bg-dark-700 text-dark-300 rounded-xl text-sm transition-colors border border-dark-700"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <button
            onClick={onStart}
            disabled={loading || totalContacts === 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-brand-500 to-emerald-500 hover:from-brand-600 hover:to-emerald-600 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-500/20 hover:shadow-brand-500/40"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4" />
                Start Sending Campaign
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
