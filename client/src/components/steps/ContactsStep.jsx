import { useState, useRef } from "react"
import {
  Upload, Users, ChevronLeft, ChevronRight, Search,
  CheckSquare, Square, Hash, UserCheck, X, Plus,
  Phone, User, FileSpreadsheet
} from "lucide-react"

export default function ContactsStep({ allContacts, selectedContacts, setSelectedContacts, onUpload, onBack, onNext }) {
  const fileRef = useRef(null)
  const [tab, setTab] = useState("bulk")
  const [search, setSearch] = useState("")
  const [pickMode, setPickMode] = useState(null)
  const [pickCount, setPickCount] = useState("")
  const [singlePhone, setSinglePhone] = useState("")
  const [singleName, setSingleName] = useState("")
  const [singleList, setSingleList] = useState([])

  function handleFileChange(e) {
    if (e.target.files?.[0]) { onUpload(e.target.files[0]); setTab("bulk") }
    e.target.value = ""
  }
  function handleSelectAll() { setSelectedContacts([...allContacts]); setPickMode("all") }
  function handlePickCount() {
    const count = parseInt(pickCount)
    if (count > 0 && count <= allContacts.length) { setSelectedContacts(allContacts.slice(0, count)); setPickMode("count") }
  }
  function toggleContact(contact) {
    setPickMode("manual")
    setSelectedContacts(prev => {
      const exists = prev.find(c => c.phone === contact.phone)
      return exists ? prev.filter(c => c.phone !== contact.phone) : [...prev, contact]
    })
  }
  function isSelected(contact) { return selectedContacts.some(c => c.phone === contact.phone) }
  function normalizePhone(raw) {
    let p = raw.trim().replace(/\D/g, "") // strip non-digits
    if (p.length === 10) p = "91" + p      // bare 10-digit → add India code
    return p
  }

  function handleAddSingle() {
    const phone = normalizePhone(singlePhone)
    if (!phone || singleList.find(c => c.phone === phone)) return
    const contact = { phone, name: singleName.trim() || "" }
    const updated = [...singleList, contact]
    setSingleList(updated); setSelectedContacts(updated)
    setSinglePhone(""); setSingleName("")
  }
  function handleRemoveSingle(phone) {
    const updated = singleList.filter(c => c.phone !== phone)
    setSingleList(updated); setSelectedContacts(updated)
  }
  const filtered = allContacts.filter(c =>
    (c.name || "").toLowerCase().includes(search.toLowerCase()) || (c.phone || "").includes(search)
  )

  return (
    <div className="max-w-4xl mx-auto">
      <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} className="hidden" />
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-dark-700">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Select Contacts</h2>
                <p className="text-xs text-dark-400">Upload a CSV/Excel file or enter a single number</p>
              </div>
            </div>
            <div className="flex gap-1 p-1 bg-dark-800 rounded-xl border border-dark-700">
              <button
                onClick={() => { setTab("bulk"); setSelectedContacts([]) }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === "bulk" ? "bg-brand-500 text-white" : "text-dark-400 hover:text-dark-200"}`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Bulk CSV
              </button>
              <button
                onClick={() => { setTab("single"); setSelectedContacts(singleList) }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === "single" ? "bg-brand-500 text-white" : "text-dark-400 hover:text-dark-200"}`}
              >
                <Phone className="w-3.5 h-3.5" /> Single Number
              </button>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {tab === "single" && (
            <>
              <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                <p className="text-xs text-blue-300">Add one or more numbers manually. Each will receive the campaign message.</p>
              </div>
              <div className="flex gap-3 flex-wrap">
                <div className="flex-1 min-w-[140px]">
                  <label className="text-xs text-dark-500 mb-1 block">Name (optional)</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                    <input type="text" value={singleName} onChange={e => setSingleName(e.target.value)} placeholder="e.g. Raj Kumar"
                      className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-brand-500" />
                  </div>
                </div>
                <div className="flex-1 min-w-[160px]">
                  <label className="text-xs text-dark-500 mb-1 block">Phone Number <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                    <input type="tel" value={singlePhone} onChange={e => setSinglePhone(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleAddSingle()} placeholder="e.g. 9876543210 or 919876543210"
                      className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-brand-500" />
                  </div>
                </div>
                <div className="flex items-end">
                  <button onClick={handleAddSingle} disabled={!singlePhone.trim()}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
              </div>
              <p className="text-xs text-dark-500 -mt-2">10-digit numbers get <span className="text-dark-300 font-mono">91</span> prepended automatically. Or enter full number e.g. <span className="text-dark-300 font-mono">919876543210</span></p>
              {singleList.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-dark-500 font-medium uppercase tracking-wider">Added ({singleList.length})</p>
                  {singleList.map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-brand-500/5 border border-brand-500/20 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center text-xs font-bold text-brand-400">{idx + 1}</div>
                        <div>
                          <p className="text-sm text-white">{c.name || "No name"}</p>
                          <p className="text-xs text-dark-400 font-mono">{c.phone}</p>
                        </div>
                      </div>
                      <button onClick={() => handleRemoveSingle(c.phone)} className="p-1.5 hover:bg-red-500/10 rounded-lg text-dark-500 hover:text-red-400 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-dark-800 rounded-xl">
                  <Phone className="w-8 h-8 text-dark-700 mx-auto mb-2" />
                  <p className="text-sm text-dark-600">No numbers added yet</p>
                </div>
              )}
            </>
          )}

          {tab === "bulk" && (
            <>
              {allContacts.length === 0 ? (
                <div onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-dark-700 rounded-xl p-12 text-center cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group">
                  <Upload className="w-10 h-10 text-dark-500 mx-auto mb-3 group-hover:text-blue-400" />
                  <p className="text-sm text-dark-300 font-medium">Upload Contacts File</p>
                  <p className="text-xs text-dark-500 mt-1">Supports CSV and Excel (.xlsx, .xls)</p>
                  <p className="text-xs text-dark-600 mt-3">Columns: Phone/Mobile, Name (optional), Email (optional)</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="bg-dark-800 rounded-xl px-4 py-2 border border-dark-700">
                      <p className="text-xs text-dark-500">Total</p>
                      <p className="text-lg font-bold text-white">{allContacts.length}</p>
                    </div>
                    <div className="bg-brand-500/10 rounded-xl px-4 py-2 border border-brand-500/20">
                      <p className="text-xs text-brand-400">Selected</p>
                      <p className="text-lg font-bold text-brand-400">{selectedContacts.length}</p>
                    </div>
                    <div className="flex-1" />
                    <button onClick={() => fileRef.current?.click()} className="text-xs px-3 py-2 bg-dark-800 hover:bg-dark-700 text-dark-400 rounded-lg border border-dark-700 transition-colors">Re-upload</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button onClick={handleSelectAll} className={`p-4 rounded-xl border text-left transition-all ${pickMode === "all" ? "border-brand-500 bg-brand-500/10" : "border-dark-700 hover:border-dark-600 bg-dark-800/50"}`}>
                      <UserCheck className={`w-5 h-5 mb-2 ${pickMode === "all" ? "text-brand-400" : "text-dark-400"}`} />
                      <p className="text-sm font-medium text-white">Send to All</p>
                      <p className="text-xs text-dark-500 mt-0.5">All {allContacts.length} contacts</p>
                    </button>
                    <div className={`p-4 rounded-xl border text-left transition-all ${pickMode === "count" ? "border-brand-500 bg-brand-500/10" : "border-dark-700 bg-dark-800/50"}`}>
                      <Hash className={`w-5 h-5 mb-2 ${pickMode === "count" ? "text-brand-400" : "text-dark-400"}`} />
                      <p className="text-sm font-medium text-white">Pick Count</p>
                      <div className="flex gap-2 mt-2">
                        <input type="number" min="1" max={allContacts.length} value={pickCount} onChange={e => setPickCount(e.target.value)} placeholder={`1-${allContacts.length}`}
                          className="w-20 bg-dark-800 border border-dark-700 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-brand-500" />
                        <button onClick={handlePickCount} disabled={!pickCount} className="text-xs px-3 py-1 bg-brand-500 text-white rounded-lg disabled:opacity-50">Pick</button>
                      </div>
                    </div>
                    <button onClick={() => { setPickMode("manual"); setSelectedContacts([]) }} className={`p-4 rounded-xl border text-left transition-all ${pickMode === "manual" ? "border-brand-500 bg-brand-500/10" : "border-dark-700 hover:border-dark-600 bg-dark-800/50"}`}>
                      <CheckSquare className={`w-5 h-5 mb-2 ${pickMode === "manual" ? "text-brand-400" : "text-dark-400"}`} />
                      <p className="text-sm font-medium text-white">Manual Select</p>
                      <p className="text-xs text-dark-500 mt-0.5">Pick individually</p>
                    </button>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts..."
                      className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-brand-500" />
                    {search && <button onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-dark-500" /></button>}
                  </div>
                  <div className="max-h-80 overflow-y-auto space-y-1 pr-1">
                    {filtered.map((contact, idx) => (
                      <div key={idx} onClick={() => toggleContact(contact)}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${isSelected(contact) ? "bg-brand-500/10 border border-brand-500/20" : "bg-dark-800/30 border border-transparent hover:bg-dark-800/60"}`}>
                        {isSelected(contact) ? <CheckSquare className="w-4 h-4 text-brand-400 flex-shrink-0" /> : <Square className="w-4 h-4 text-dark-600 flex-shrink-0" />}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-white">{contact.name || "Unknown"}</p>
                          <p className="text-xs text-dark-500">{contact.phone}</p>
                        </div>
                        {contact.email && <p className="text-xs text-dark-600 truncate max-w-[150px]">{contact.email}</p>}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <div className="p-5 border-t border-dark-700 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 px-4 py-2.5 bg-dark-800 hover:bg-dark-700 text-dark-300 rounded-xl text-sm transition-colors border border-dark-700">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <button onClick={onNext} disabled={selectedContacts.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-500/20">
            Configure Batch ({selectedContacts.length} contact{selectedContacts.length !== 1 ? "s" : ""})
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
