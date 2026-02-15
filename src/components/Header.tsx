import { Plus, LayoutGrid, Heart as HeartIcon, Skull, BarChart3, Menu, X, Upload, Download, ClipboardCheck } from 'lucide-react'
import { useState } from 'react'

function DateFlowLogo({ className = 'w-9 h-9' }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="logoBg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#ec4899" />
                    <stop offset="50%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
                <linearGradient id="logoHeart" x1="8" y1="8" x2="24" y2="26" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#fce7f3" />
                </linearGradient>
            </defs>
            <rect width="32" height="32" rx="8" fill="url(#logoBg)" />
            <path d="M16 25.6s-7.2-5.4-9-8.4c-1.2-2-.6-4.8 1.4-6 2-1.2 4.2-.4 5.6 1.2l2 2.4 2-2.4c1.4-1.6 3.6-2.4 5.6-1.2 2 1.2 2.6 4 1.4 6-1.8 3-9 8.4-9 8.4z" fill="url(#logoHeart)" opacity="0.95" />
        </svg>
    )
}

export type Tab = 'funnel' | 'lovers' | 'dead' | 'analytics'

interface HeaderProps {
    activeTab: Tab
    onTabChange: (tab: Tab) => void
    onAddLead: () => void
    onBulkUpload: () => void
    onExport: () => void
    onCheckIn: () => void
}

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'funnel', label: 'Funnel', icon: LayoutGrid },
    { id: 'lovers', label: 'Lovers', icon: HeartIcon },
    { id: 'dead', label: 'Dead Leads', icon: Skull },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
]

export default function Header({ activeTab, onTabChange, onAddLead, onBulkUpload, onExport, onCheckIn }: HeaderProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    return (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <DateFlowLogo className="w-9 h-9 drop-shadow-md" />
                        <div>
                            <h1 className="text-lg font-extrabold leading-tight">
                                <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">DateFlow</span>
                            </h1>
                            <p className="text-[11px] text-slate-400 leading-none hidden sm:block">Your Dating Pipeline</p>
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                        {tabs.map(tab => {
                            const Icon = tab.icon
                            const isActive = activeTab === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => onTabChange(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive
                                        ? 'bg-white text-brand-700 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            )
                        })}
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onCheckIn}
                            title="Weekly check-in"
                            className="p-2.5 text-slate-500 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition hidden sm:flex items-center justify-center"
                        >
                            <ClipboardCheck className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onExport}
                            title="Export all leads as Excel"
                            className="p-2.5 text-slate-500 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition hidden sm:flex items-center justify-center"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onBulkUpload}
                            title="Bulk upload from Excel"
                            className="p-2.5 text-slate-500 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition hidden sm:flex items-center justify-center"
                        >
                            <Upload className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onAddLead}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white rounded-xl text-sm font-semibold shadow-md shadow-purple-500/25 hover:shadow-lg hover:shadow-purple-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Add Lead</span>
                        </button>

                        {/* Mobile menu toggle */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation */}
            {mobileMenuOpen && (
                <nav className="md:hidden border-t border-slate-100 bg-white animate-slide-up">
                    <div className="px-4 py-2 space-y-1">
                        {tabs.map(tab => {
                            const Icon = tab.icon
                            const isActive = activeTab === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        onTabChange(tab.id)
                                        setMobileMenuOpen(false)
                                    }}
                                    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                                        ? 'bg-brand-50 text-brand-700'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            )
                        })}
                        <div className="border-t border-slate-100 mt-1 pt-1">
                            <button
                                onClick={() => { onBulkUpload(); setMobileMenuOpen(false) }}
                                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                            >
                                <Upload className="w-4 h-4" />
                                Bulk Upload
                            </button>
                            <button
                                onClick={() => { onExport(); setMobileMenuOpen(false) }}
                                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                            >
                                <Download className="w-4 h-4" />
                                Export Leads
                            </button>
                        </div>
                    </div>
                </nav>
            )}
        </header>
    )
}
