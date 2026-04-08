import { useState } from 'react'
import {
  ChevronLeft, ChevronRight, Edit3, Check, Image as ImageIcon,
  Video, FileText, File, Eye, MessageSquare
} from 'lucide-react'

export default function ReviewStep({ messageText, setMessageText, mediaFiles, campaignName, onBack, onNext, onSaveMessage }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(messageText)

  function handleSaveEdit() {
    setMessageText(editText)
    onSaveMessage()
    setIsEditing(false)
  }

  function getMediaIcon(type) {
    switch (type) {
      case 'image': return ImageIcon
      case 'video': return Video
      case 'pdf': return FileText
      default: return File
    }
  }

  function getMediaColor(type) {
    switch (type) {
      case 'image': return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
      case 'video': return 'text-purple-400 bg-purple-500/10 border-purple-500/20'
      case 'pdf': return 'text-red-400 bg-red-500/10 border-red-500/20'
      default: return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="glass rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-dark-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
              <Eye className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Review Campaign</h2>
              <p className="text-xs text-dark-400">Review your message and attachments before selecting contacts</p>
            </div>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-800 hover:bg-dark-700 text-dark-300 rounded-lg text-sm transition-colors border border-dark-700"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit
            </button>
          )}
        </div>

        <div className="p-5 space-y-5">
          {/* Campaign name */}
          <div>
            <label className="text-xs text-dark-500 uppercase tracking-wider font-medium">Campaign</label>
            <p className="text-white mt-1">{campaignName || 'Untitled Campaign'}</p>
          </div>

          {/* Message */}
          <div>
            <label className="text-xs text-dark-500 uppercase tracking-wider font-medium mb-2 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              Message
            </label>
            {isEditing ? (
              <div className="mt-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={8}
                  className="w-full bg-dark-800 border border-brand-500/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleSaveEdit}
                    className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium"
                  >
                    <Check className="w-4 h-4" />
                    Save Changes
                  </button>
                  <button
                    onClick={() => { setIsEditing(false); setEditText(messageText) }}
                    className="px-4 py-2 bg-dark-700 text-dark-300 rounded-lg text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-2 p-4 bg-dark-800/50 rounded-xl border border-dark-700">
                <p className="text-sm text-dark-200 whitespace-pre-wrap leading-relaxed">{messageText}</p>
              </div>
            )}
          </div>

          {/* Attachments */}
          {mediaFiles.length > 0 && (
            <div>
              <label className="text-xs text-dark-500 uppercase tracking-wider font-medium mb-2 block">
                Attachments ({mediaFiles.length})
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                {mediaFiles.map(media => {
                  const type = media.mediaType || media.media_type
                  const Icon = getMediaIcon(type)
                  const colors = getMediaColor(type)
                  const name = media.fileName || media.file_name

                  return (
                    <div key={media.id} className={`flex items-center gap-3 p-3 rounded-xl border ${colors}`}>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white truncate">{name}</p>
                        <p className="text-xs text-dark-500 capitalize">{type}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* WhatsApp preview */}
          <div>
            <label className="text-xs text-dark-500 uppercase tracking-wider font-medium mb-2 block">
              WhatsApp Preview
            </label>
            <div className="max-w-sm">
              <div className="phone-frame">
                <div className="wa-chat-bg rounded-[1.5rem] p-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-white/5 mb-3">
                    <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center">
                      <span className="text-xs text-brand-400">A</span>
                    </div>
                    <p className="text-xs text-white font-medium">AdmissionMsg</p>
                  </div>

                  {mediaFiles.filter(m => (m.mediaType || m.media_type) === 'image').length > 0 && (
                    <div className="bg-[#005c4b] rounded-xl rounded-tl-sm p-1 max-w-[85%] ml-auto mb-1">
                      <div className="bg-dark-700/50 rounded-lg h-32 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-dark-500" />
                      </div>
                      {messageText && (
                        <p className="text-xs text-white/90 p-2 leading-relaxed">
                          {messageText.length > 150 ? messageText.substring(0, 150) + '...' : messageText}
                        </p>
                      )}
                    </div>
                  )}

                  {mediaFiles.filter(m => (m.mediaType || m.media_type) === 'image').length === 0 && messageText && (
                    <div className="bg-[#005c4b] rounded-xl rounded-tl-sm p-3 max-w-[85%] ml-auto">
                      <p className="text-xs text-white/90 whitespace-pre-wrap leading-relaxed">
                        {messageText.length > 200 ? messageText.substring(0, 200) + '...' : messageText}
                      </p>
                    </div>
                  )}

                  {mediaFiles.filter(m => (m.mediaType || m.media_type) !== 'image').map(m => (
                    <div key={m.id} className="bg-[#005c4b] rounded-lg p-2 mt-1 max-w-[85%] ml-auto">
                      <p className="text-[10px] text-white/70">📎 {m.fileName || m.file_name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-dark-700 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2.5 bg-dark-800 hover:bg-dark-700 text-dark-300 rounded-xl text-sm transition-colors border border-dark-700"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Compose
          </button>
          <button
            onClick={onNext}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-brand-500/20"
          >
            Select Contacts
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
