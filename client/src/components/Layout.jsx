import { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { MessageSquare, LayoutDashboard, FileBarChart, BookTemplate, Plus, Zap, Menu, X } from 'lucide-react'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/campaign/new', icon: Plus, label: 'New Campaign' },
  { path: '/reports', icon: FileBarChart, label: 'Reports' },
  { path: '/templates', icon: BookTemplate, label: 'Templates' },
]

export default function Layout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-72 glass border-r border-dark-700 flex flex-col fixed h-full z-30 transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        {/* Logo */}
        <div className="p-6 border-b border-dark-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold gradient-text">AdmissionMsg</h1>
              <p className="text-xs text-dark-400">WhatsApp Campaign Platform</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-dark-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(path)

            return (
              <NavLink
                key={path}
                to={path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20 glow-green'
                    : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </NavLink>
            )
          })}
        </nav>

        {/* Bottom card */}
        <div className="p-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-brand-500/10 to-cyan-500/10 border border-brand-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-brand-400" />
              <span className="text-sm font-semibold text-brand-400">AI Powered</span>
            </div>
            <p className="text-xs text-dark-400">Messages are enhanced by Cerebras AI for professional communication.</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:ml-72 min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-dark-900/95 backdrop-blur-sm border-b border-dark-800">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl bg-dark-800 border border-dark-700 text-dark-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center">
              <MessageSquare className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white gradient-text">AdmissionMsg</span>
          </div>
        </div>
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
