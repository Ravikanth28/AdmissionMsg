import { useEffect, useState } from 'react'
import { getTemplates, deleteTemplate } from '../api'
import toast from 'react-hot-toast'
import {
  BookTemplate, Trash2, Calendar, MessageSquare,
  Image, Video, FileText, File
} from 'lucide-react'

export default function Templates() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    try {
      const res = await getTemplates()
      setTemplates(res.data.templates || [])
    } catch (err) {
      console.error('Failed to load templates:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this template?')) return
    try {
      await deleteTemplate(id)
      setTemplates(prev => prev.filter(t => t.id !== id))
      toast.success('Template deleted')
    } catch (err) {
      toast.error('Failed to delete template')
    }
  }

  function getMediaIcon(type) {
    switch (type) {
      case 'image': return Image
      case 'video': return Video
      case 'pdf': return FileText
      default: return File
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
        <h1 className="text-3xl font-bold text-white">Message Templates</h1>
        <p className="text-dark-400 mt-1">Reuse saved message templates across campaigns</p>
      </div>

      {templates.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <BookTemplate className="w-12 h-12 text-dark-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-dark-300 mb-2">No templates saved</h3>
          <p className="text-dark-500">Save a template when composing a campaign to reuse it later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map(template => (
            <div key={template.id} className="glass rounded-2xl p-5 hover:border-dark-600 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-white font-medium">{template.name}</h3>
                  <p className="text-xs text-dark-500 flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(template.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="p-1.5 hover:bg-red-500/10 rounded-lg text-dark-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-dark-800/50 rounded-xl mb-3">
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-dark-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-dark-300 line-clamp-3">
                    {template.message_text || 'No message'}
                  </p>
                </div>
              </div>

              {template.media && template.media.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {template.media.map(m => {
                    const Icon = getMediaIcon(m.media_type)
                    return (
                      <div key={m.id} className="flex items-center gap-1.5 text-xs bg-dark-800/50 px-2 py-1 rounded-lg text-dark-400">
                        <Icon className="w-3 h-3" />
                        {m.file_name}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
