import { useState, useRef } from 'react'
import toast from 'react-hot-toast'
import {
  Sparkles, Upload, Image, Video, FileText, File, X, 
  ChevronRight, BookTemplate, Save, Loader2
} from 'lucide-react'

export default function ComposeStep({
  campaignName, setCampaignName, messageText, setMessageText,
  mediaFiles, onMediaUpload, onMediaDelete, onEnhance, loading,
  templates, onLoadTemplate, onSaveAsTemplate, onNext
}) {
  const fileInputRef = useRef(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [uploading, setUploading] = useState(false)

  const SIZE_LIMITS = { image: 10, video: 32, pdf: 10, document: 10 }

  function getFileCategory(file) {
    if (file.type.startsWith('image/')) return 'image'
    if (file.type.startsWith('video/')) return 'video'
    if (file.type === 'application/pdf') return 'pdf'
    return 'document'
  }

  async function handleFileChange(e) {
    const files = Array.from(e.target.files)
    setUploading(true)
    for (const file of files) {
      const cat = getFileCategory(file)
      const limitMB = SIZE_LIMITS[cat]
      if (file.size > limitMB * 1024 * 1024) {
        toast.error(`${file.name} exceeds the ${limitMB} MB limit for ${cat} files`)
        continue
      }
      await onMediaUpload(file)
    }
    setUploading(false)
    e.target.value = ''
  }

  function getMediaIcon(type) {
    switch (type) {
      case 'image': return Image
      case 'video': return Video
      case 'pdf': return FileText
      default: return File
    }
  }

  function getMediaColor(type) {
    switch (type) {
      case 'image': return 'text-blue-400 bg-blue-500/10'
      case 'video': return 'text-purple-400 bg-purple-500/10'
      case 'pdf': return 'text-red-400 bg-red-500/10'
      default: return 'text-amber-400 bg-amber-500/10'
    }
  }

  function formatSize(bytes) {
    if (!bytes) return ''
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main compose area */}
      <div className="lg:col-span-2 space-y-5">
        {/* Campaign Name */}
        <div className="glass rounded-2xl p-5">
          <label className="block text-sm font-medium text-dark-300 mb-2">Campaign Name</label>
          <input
            type="text"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            placeholder="e.g., Admission Batch 2026"
            className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-white placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
          />
        </div>

        {/* Message */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <label className="text-sm font-medium text-dark-300">
              Message Content <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setMessageText(prev => prev + '{{name}}')}
                className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg text-xs font-mono border border-amber-500/20 transition-colors"
                title="Inserts the contact's name at cursor position"
              >
                + {'{{name}}'}
              </button>
              <button
                onClick={onEnhance}
                disabled={loading || !messageText.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-300 rounded-lg text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-purple-500/20"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                AI Enhance
              </button>
            </div>
          </div>
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type your message here... The AI will polish it into a professional format."
            rows={8}
            className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-white placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors resize-none"
          />
          <p className="text-xs text-dark-500 mt-2">
            {messageText.length} characters &middot; WhatsApp supports *bold*, _italic_, ~strikethrough~ &middot; <span className="text-amber-400/70 font-mono">{'{{name}}'}</span> will be replaced with each contact's name
          </p>
        </div>

        {/* Media Upload */}
        <div className="glass rounded-2xl p-5">
          <label className="text-sm font-medium text-dark-300 mb-3 block">
            Attachments <span className="text-dark-500">(optional)</span>
          </label>
          
          {/* Upload area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-dark-700 rounded-xl p-8 text-center cursor-pointer hover:border-brand-500/50 hover:bg-brand-500/5 transition-all group"
          >
            <Upload className="w-8 h-8 text-dark-500 mx-auto mb-3 group-hover:text-brand-400 transition-colors" />
            <p className="text-sm text-dark-400 group-hover:text-dark-300">
              {uploading ? 'Uploading...' : 'Click to upload files'}
            </p>
            <p className="text-xs text-dark-600 mt-1">Images, Videos, PDFs, Documents</p>
            <p className="text-xs text-dark-700 mt-2">
              Max size: Images / PDFs / Docs <span className="text-dark-500">10 MB</span> &nbsp;·&nbsp; Videos <span className="text-dark-500">32 MB</span>
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            accept="image/*,video/*,.pdf,.doc,.docx"
            className="hidden"
          />

          {/* Uploaded files */}
          {mediaFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              {mediaFiles.map(media => {
                const Icon = getMediaIcon(media.mediaType || media.media_type)
                const color = getMediaColor(media.mediaType || media.media_type)
                return (
                  <div key={media.id} className="flex items-center justify-between p-3 bg-dark-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm text-white truncate max-w-[300px]">
                          {media.fileName || media.file_name}
                        </p>
                        <p className="text-xs text-dark-500">
                          {media.mediaType || media.media_type} {media.size || media.file_size ? `• ${formatSize(media.size || media.file_size)}` : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => onMediaDelete(media.id)}
                      className="p-1.5 hover:bg-red-500/10 rounded-lg text-dark-500 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-5">
        {/* Templates */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-dark-300 flex items-center gap-2">
              <BookTemplate className="w-4 h-4" />
              Templates
            </h3>
          </div>
          
          {templates.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {templates.map(t => (
                <button
                  key={t.id}
                  onClick={() => onLoadTemplate(t.id)}
                  className="w-full text-left p-3 bg-dark-800/50 rounded-xl hover:bg-dark-700/50 transition-colors"
                >
                  <p className="text-sm text-white">{t.name}</p>
                  <p className="text-xs text-dark-500 truncate mt-0.5">{t.message_text?.substring(0, 60)}...</p>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-dark-500">No saved templates</p>
          )}

          <div className="border-t border-dark-700 mt-3 pt-3">
            {showSaveTemplate ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  placeholder="Template name..."
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-brand-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { onSaveAsTemplate(templateName); setShowSaveTemplate(false); setTemplateName('') }}
                    disabled={!templateName.trim()}
                    className="flex-1 text-xs px-3 py-1.5 bg-brand-500 text-white rounded-lg disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setShowSaveTemplate(false)}
                    className="text-xs px-3 py-1.5 bg-dark-700 text-dark-300 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowSaveTemplate(true)}
                className="w-full flex items-center justify-center gap-1.5 text-xs px-3 py-2 bg-dark-800/50 text-dark-400 rounded-lg hover:text-brand-400 hover:bg-brand-500/10 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                Save as Template
              </button>
            )}
          </div>
        </div>

        {/* WhatsApp Preview */}
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-medium text-dark-300 mb-3">WhatsApp Preview</h3>
          <div className="phone-frame">
            <div className="wa-chat-bg rounded-[1.5rem] p-4 min-h-[200px]">
              {/* Header */}
              <div className="flex items-center gap-2 pb-3 border-b border-white/5 mb-3">
                <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center">
                  <span className="text-xs text-brand-400">A</span>
                </div>
                <div>
                  <p className="text-xs text-white font-medium">AdmissionMsg</p>
                  <p className="text-[10px] text-dark-500">online</p>
                </div>
              </div>
              
              {/* Message bubble */}
              {messageText && (
                <div className="bg-[#005c4b] rounded-xl rounded-tl-sm p-3 max-w-[90%] ml-auto">
                  <p className="text-xs text-white/90 whitespace-pre-wrap break-words leading-relaxed">
                    {messageText.length > 200 ? messageText.substring(0, 200) + '...' : messageText}
                  </p>
                  <p className="text-[9px] text-white/40 text-right mt-1">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )}
              
              {/* Media indicators */}
              {mediaFiles.length > 0 && (
                <div className="mt-2 space-y-1">
                  {mediaFiles.map(m => (
                    <div key={m.id} className="bg-[#005c4b] rounded-lg p-2 max-w-[90%] ml-auto">
                      <p className="text-[10px] text-white/70 flex items-center gap-1">
                        📎 {m.fileName || m.file_name}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {!messageText && mediaFiles.length === 0 && (
                <p className="text-xs text-dark-600 text-center mt-8">Preview will appear here</p>
              )}
            </div>
          </div>
        </div>

        {/* Next button */}
        <button
          onClick={onNext}
          disabled={!messageText.trim()}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-500/20"
        >
          Continue to Review
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
