import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  createCampaign, getCampaign, updateCampaign, uploadMedia, deleteMedia,
  enhanceMessage, uploadContacts, saveContacts, sendCampaign, getCampaignStatus,
  getTemplates, loadTemplate, saveTemplate, pauseCampaign
} from '../api'
import StepIndicator from '../components/StepIndicator'
import ComposeStep from '../components/steps/ComposeStep'
import ReviewStep from '../components/steps/ReviewStep'
import ContactsStep from '../components/steps/ContactsStep'
import BatchStep from '../components/steps/BatchStep'
import SendingStep from '../components/steps/SendingStep'

const STEPS = [
  { id: 1, label: 'Compose', description: 'Write message & add media' },
  { id: 2, label: 'Review', description: 'Preview & confirm content' },
  { id: 3, label: 'Contacts', description: 'Upload & select numbers' },
  { id: 4, label: 'Batch Settings', description: 'Configure sending' },
  { id: 5, label: 'Send', description: 'Monitor progress' },
]

export default function NewCampaign() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [campaignId, setCampaignId] = useState(id || null)
  const [campaignName, setCampaignName] = useState('')
  const [messageText, setMessageText] = useState('')
  const [mediaFiles, setMediaFiles] = useState([])
  const [allContacts, setAllContacts] = useState([])
  const [selectedContacts, setSelectedContacts] = useState([])
  const [batchSize, setBatchSize] = useState(10)
  const [batchDelay, setBatchDelay] = useState(60)
  const [loading, setLoading] = useState(false)
  const [sendingStatus, setSendingStatus] = useState(null)
  const [templates, setTemplates] = useState([])

  // Load existing campaign
  useEffect(() => {
    if (id) {
      loadCampaign(id)
    }
    loadTemplates()
  }, [id])

  async function loadCampaign(campaignId) {
    try {
      setLoading(true)
      const res = await getCampaign(campaignId)
      const { campaign, media, contacts } = res.data
      setCampaignId(campaign.id)
      setCampaignName(campaign.name)
      setMessageText(campaign.message_text || '')
      setMediaFiles(media || [])
      setBatchSize(campaign.batch_size || 10)
      setBatchDelay(campaign.batch_delay_seconds || 60)
      if (contacts?.length) {
        setAllContacts(contacts)
        setSelectedContacts(contacts)
      }
      if (campaign.status === 'sending') {
        setStep(5)
        startStatusPolling(campaign.id)
      }
    } catch (err) {
      toast.error('Failed to load campaign')
    } finally {
      setLoading(false)
    }
  }

  async function loadTemplates() {
    try {
      const res = await getTemplates()
      setTemplates(res.data.templates || [])
    } catch (err) {
      console.error('Failed to load templates')
    }
  }

  // Ensure campaign exists
  async function ensureCampaign() {
    if (campaignId) return campaignId
    try {
      const name = campaignName || `Campaign ${new Date().toLocaleDateString()}`
      const res = await createCampaign({ name, messageText })
      const newId = res.data.campaign.id
      setCampaignId(newId)
      setCampaignName(name)
      return newId
    } catch (err) {
      toast.error('Failed to create campaign')
      throw err
    }
  }

  // Media upload handler
  async function handleMediaUpload(file) {
    try {
      const cId = await ensureCampaign()
      const formData = new FormData()
      formData.append('file', file)
      formData.append('campaignId', cId)
      
      const res = await uploadMedia(formData)
      setMediaFiles(prev => [...prev, res.data.media])
      toast.success(`${file.name} uploaded`)
    } catch (err) {
      const msg = err.response?.data?.error || `Failed to upload ${file.name}`
      toast.error(msg)
    }
  }

  // Media delete handler
  async function handleMediaDelete(mediaId) {
    try {
      await deleteMedia(mediaId)
      setMediaFiles(prev => prev.filter(m => m.id !== mediaId))
      toast.success('Media removed')
    } catch (err) {
      toast.error('Failed to remove media')
    }
  }

  // AI Enhance
  async function handleEnhance() {
    if (!messageText.trim()) {
      toast.error('Write a message first to use AI Enhance')
      return
    }
    try {
      setLoading(true)
      const res = await enhanceMessage({ message: messageText, context: campaignName })
      setMessageText(res.data.enhanced)
      toast.success('Message enhanced by AI')
    } catch (err) {
      toast.error('AI enhancement failed')
    } finally {
      setLoading(false)
    }
  }

  // Save message
  async function handleSaveMessage() {
    try {
      const cId = await ensureCampaign()
      await updateCampaign(cId, { messageText, name: campaignName })
    } catch (err) {
      toast.error('Failed to save')
    }
  }

  // Contact upload
  async function handleContactUpload(file) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await uploadContacts(formData)
      setAllContacts(res.data.contacts || [])
      setSelectedContacts(res.data.contacts || [])
      toast.success(`${res.data.totalContacts} contacts loaded`)
    } catch (err) {
      toast.error('Failed to process contacts file')
    }
  }

  // Save contacts to campaign
  async function handleSaveContacts() {
    try {
      const cId = await ensureCampaign()
      await saveContacts({ campaignId: cId, contacts: selectedContacts })
      toast.success(`${selectedContacts.length} contacts saved`)
    } catch (err) {
      toast.error('Failed to save contacts')
    }
  }

  // Load template
  async function handleLoadTemplate(templateId) {
    try {
      const cId = await ensureCampaign()
      const res = await loadTemplate(templateId, { campaignId: cId })
      setMessageText(res.data.messageText)
      // Reload media
      const campRes = await getCampaign(cId)
      setMediaFiles(campRes.data.media || [])
      toast.success('Template loaded')
    } catch (err) {
      toast.error('Failed to load template')
    }
  }

  // Save as template
  async function handleSaveAsTemplate(name) {
    try {
      const cId = await ensureCampaign()
      await saveTemplate({ name, messageText, campaignId: cId })
      await loadTemplates()
      toast.success('Template saved')
    } catch (err) {
      toast.error('Failed to save template')
    }
  }

  // Start sending
  async function handleStartSending() {
    try {
      setLoading(true)
      const cId = await ensureCampaign()
      
      // Save batch settings
      await updateCampaign(cId, { batchSize, batchDelaySeconds: batchDelay })
      
      // Save contacts
      await saveContacts({ campaignId: cId, contacts: selectedContacts })
      
      // Start send
      const res = await sendCampaign(cId)
      toast.success('Campaign sending started!')
      setStep(5)
      startStatusPolling(cId)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start sending')
    } finally {
      setLoading(false)
    }
  }

  // Pause
  async function handlePause() {
    try {
      await pauseCampaign(campaignId)
      toast.success('Campaign paused')
    } catch (err) {
      toast.error('Failed to pause')
    }
  }

  // Status polling
  function startStatusPolling(cId) {
    const poll = async () => {
      try {
        const res = await getCampaignStatus(cId)
        setSendingStatus(res.data)
        if (res.data.status === 'sending' && res.data.isActive) {
          setTimeout(poll, 3000)
        }
      } catch (err) {
        console.error('Polling error:', err)
      }
    }
    poll()
  }

  // Navigate steps
  function goNext() {
    if (step === 1) {
      handleSaveMessage()
    }
    if (step === 3) {
      handleSaveContacts()
    }
    setStep(s => Math.min(s + 1, 5))
  }

  function goBack() {
    setStep(s => Math.max(s - 1, 1))
  }

  if (loading && !campaignId) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          {id ? 'Edit Campaign' : 'New Campaign'}
        </h1>
        <p className="text-dark-400 mt-1">
          Create and send professional WhatsApp messages
        </p>
      </div>

      {/* Step Indicator */}
      <StepIndicator steps={STEPS} currentStep={step} />

      {/* Step Content */}
      <div className="mt-8">
        {step === 1 && (
          <ComposeStep
            campaignName={campaignName}
            setCampaignName={setCampaignName}
            messageText={messageText}
            setMessageText={setMessageText}
            mediaFiles={mediaFiles}
            onMediaUpload={handleMediaUpload}
            onMediaDelete={handleMediaDelete}
            onEnhance={handleEnhance}
            loading={loading}
            templates={templates}
            onLoadTemplate={handleLoadTemplate}
            onSaveAsTemplate={handleSaveAsTemplate}
            onNext={goNext}
          />
        )}
        {step === 2 && (
          <ReviewStep
            messageText={messageText}
            setMessageText={setMessageText}
            mediaFiles={mediaFiles}
            campaignName={campaignName}
            onBack={goBack}
            onNext={goNext}
            onSaveMessage={handleSaveMessage}
          />
        )}
        {step === 3 && (
          <ContactsStep
            allContacts={allContacts}
            selectedContacts={selectedContacts}
            setSelectedContacts={setSelectedContacts}
            onUpload={handleContactUpload}
            onBack={goBack}
            onNext={goNext}
          />
        )}
        {step === 4 && (
          <BatchStep
            batchSize={batchSize}
            setBatchSize={setBatchSize}
            batchDelay={batchDelay}
            setBatchDelay={setBatchDelay}
            totalContacts={selectedContacts.length}
            onBack={goBack}
            onStart={handleStartSending}
            loading={loading}
          />
        )}
        {step === 5 && (
          <SendingStep
            status={sendingStatus}
            onPause={handlePause}
            campaignId={campaignId}
            selectedContacts={selectedContacts}
          />
        )}
      </div>
    </div>
  )
}
