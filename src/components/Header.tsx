import { Plus, LayoutGrid, Heart as HeartIcon, Snowflake, BarChart3, Thermometer, Menu, X, Upload, Download, ClipboardCheck, LogOut } from 'lucide-react'
import { useState } from 'react'
import { useGameStore } from '../store/useGameStore'
import { useAuth } from '../contexts/AuthContext'
import type { SyncStatus } from '../services/firestoreService'

function DateFlowLogo({ className = 'w-9 h-9' }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="logoGrad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
            </defs>
            {/* Heart nucleus */}
            <path d="M16 23s-6.8-4.8-8.2-7.6c-1-1.7-.4-4.2 1.3-5.2 1.7-1 3.6-.3 4.9 1.1l2 2.2 2-2.2c1.3-1.4 3.2-2.1 4.9-1.1 1.7 1 2.3 3.5 1.3 5.2C22.8 18.2 16 23 16 23z"
                fill="url(#logoGrad)" />
            {/* Diagonal orbit */}
            <ellipse cx="16" cy="16" rx="14.5" ry="5.5"
                transform="rotate(-30 16 16)"
                stroke="url(#logoGrad)" strokeWidth="1.2" fill="none" opacity="0.45" />
            {/* Orbiting particle */}
            <circle cx="23" cy="7.5" r="2.4" fill="url(#logoGrad)" opacity="0.9" />
        </svg>
    )
}

function SyncIndicator() {
    const syncStatus = useGameStore(state => state.syncStatus)
    const syncError = useGameStore(state => state.syncError)
    const [showTooltip, setShowTooltip] = useState(false)

    const config: Record<SyncStatus, { color: string; pulse: boolean; label: string }> = {
        connecting: { color: 'bg-amber-400', pulse: true, label: 'Connecting to cloud...' },
        synced: { color: 'bg-emerald-400', pulse: false, label: 'Synced — data is saved to cloud' },
        error: { color: 'bg-red-500', pulse: true, label: syncError ? `Sync error: ${syncError}` : 'Sync error — data only saved locally' },
        offline: { color: 'bg-slate-400', pulse: false, label: 'Offline — data saved locally' },
    }

    const { color, pulse, label } = config[syncStatus]

    return (
        <div className="relative" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
            <div className={`w-2.5 h-2.5 rounded-full ${color} ${pulse ? 'animate-pulse' : ''} cursor-help`} />
            {showTooltip && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg whitespace-nowrap z-50 shadow-lg">
                    {label}
                    <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-slate-800 rotate-45" />
                </div>
            )}
        </div>
    )
}

export type Tab = 'funnel' | 'temperature' | 'lovers' | 'dead' | 'analytics'

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
    { id: 'temperature', label: 'Temp', icon: Thermometer },
    { id: 'lovers', label: 'Lovers', icon: HeartIcon },
    { id: 'dead', label: 'Cold Leads', icon: Snowflake },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
]

export default function Header({ activeTab, onTabChange, onAddLead, onBulkUpload, onExport, onCheckIn }: HeaderProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const { logout, user } = useAuth()

    return (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <DateFlowLogo className="w-9 h-9 drop-shadow-md" />
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-extrabold leading-tight">
                                    <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">DateFlow</span>
                                </h1>
                                <SyncIndicator />
                            </div>
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
                            onClick={logout}
                            title={user?.email ? `Logout (${user.email})` : 'Logout'}
                            className="flex items-center gap-1.5 px-3 py-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-200 transition"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="text-xs font-medium hidden sm:inline">Logout</span>
                        </button>
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
                            <button
                                onClick={() => { logout(); setMobileMenuOpen(false) }}
                                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:text-red-600 hover:bg-red-50"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    </div>
                </nav>
            )}
        </header>
    )
}
