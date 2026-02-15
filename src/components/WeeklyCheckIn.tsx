import { useState, useMemo } from 'react'
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import { CheckCircle, XCircle, MessageCircle, X } from 'lucide-react'
import { useGameStore } from '../store/useGameStore'
import { PLATFORM_ICONS } from '../utils/constants'
import { getDaysSince } from '../utils/dateHelpers'

interface WeeklyCheckInProps {
    isOpen: boolean
    onClose: () => void
}

export default function WeeklyCheckIn({ isOpen, onClose }: WeeklyCheckInProps) {
    const leads = useGameStore(state => state.leads)
    const addInteraction = useGameStore(state => state.addInteraction)
    const addToast = useGameStore(state => state.addToast)

    // Active leads that are not Dead or Lover
    const activeLeads = useMemo(
        () => leads
            .filter(l => l.funnelStage !== 'Dead' && l.funnelStage !== 'Lover')
            .sort((a, b) => {
                // Sort: coldest first (most needing attention)
                const tempOrder = { Cold: 0, Warm: 1, Hot: 2 }
                return tempOrder[a.temperature] - tempOrder[b.temperature]
            }),
        [leads]
    )

    // Track which leads the user has already answered
    const [responded, setResponded] = useState<Record<string, 'yes' | 'no'>>({})

    const handleResponse = (leadId: string, didRespond: boolean) => {
        if (didRespond) {
            // Log an incoming message interaction
            addInteraction({
                leadId,
                type: 'Message',
                direction: 'Incoming',
                notes: '✅ Confirmed response in weekly check-in',
                occurredAt: new Date().toISOString(),
            })
        }
        setResponded(prev => ({ ...prev, [leadId]: didRespond ? 'yes' : 'no' }))
    }

    const answeredCount = Object.keys(responded).length
    const allDone = answeredCount === activeLeads.length

    const handleFinish = () => {
        const yesCount = Object.values(responded).filter(v => v === 'yes').length
        const noCount = Object.values(responded).filter(v => v === 'no').length

        // Save this week as checked in
        const weekKey = getISOWeek(new Date())
        localStorage.setItem('dateflow_lastCheckInWeek', weekKey)

        addToast({
            type: 'success',
            title: '📋 Weekly Check-In Complete',
            message: `${yesCount} responded, ${noCount} silent. Temperatures updated!`,
            duration: 4000,
        })
        onClose()
    }

    if (!isOpen) return null

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <DialogBackdrop className="fixed inset-0 bg-black/40 backdrop-blur-sm modal-backdrop" />
            <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
                <DialogPanel className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden modal-content">
                    {/* Header */}
                    <div className="px-6 pt-6 pb-4 border-b border-slate-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    📋 Weekly Check-In
                                </h2>
                                <p className="text-xs text-slate-500 mt-1">
                                    Did your leads respond this week? This updates their temperature.
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        {/* Progress */}
                        <div className="mt-3 flex items-center gap-3">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-300"
                                    style={{ width: `${activeLeads.length > 0 ? (answeredCount / activeLeads.length) * 100 : 0}%` }}
                                />
                            </div>
                            <span className="text-xs font-medium text-slate-500">
                                {answeredCount}/{activeLeads.length}
                            </span>
                        </div>
                    </div>

                    {/* Lead list */}
                    <div className="overflow-y-auto max-h-[55vh] px-6 py-3">
                        {activeLeads.length === 0 ? (
                            <div className="text-center py-8 text-sm text-slate-400">
                                No active leads to check in on
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {activeLeads.map(lead => {
                                    const answer = responded[lead.id]
                                    const daysSince = lead.lastResponseDate
                                        ? getDaysSince(lead.lastResponseDate)
                                        : lead.lastInteractionDate
                                            ? getDaysSince(lead.lastInteractionDate)
                                            : getDaysSince(lead.createdAt)
                                    const tempEmoji = lead.temperature === 'Hot' ? '🔥' : lead.temperature === 'Warm' ? '🌡️' : '❄️'

                                    return (
                                        <div
                                            key={lead.id}
                                            className={`flex items-center gap-3 p-3 rounded-xl border transition ${answer === 'yes'
                                                    ? 'bg-emerald-50 border-emerald-200'
                                                    : answer === 'no'
                                                        ? 'bg-red-50/50 border-red-200'
                                                        : 'bg-white border-slate-100 hover:border-slate-200'
                                                }`}
                                        >
                                            {/* Avatar */}
                                            {lead.profilePhotoUrl ? (
                                                <img
                                                    src={lead.profilePhotoUrl}
                                                    alt={lead.name}
                                                    className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                                    {lead.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-sm font-semibold text-slate-800 truncate">{lead.name}</span>
                                                    <span className="text-xs">{tempEmoji}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-[11px] text-slate-400">
                                                        {PLATFORM_ICONS[lead.platformOrigin]} {lead.platformOrigin}
                                                    </span>
                                                    <span className="text-[11px] text-slate-300">•</span>
                                                    <span className={`text-[11px] font-medium ${daysSince > 7 ? 'text-red-500' : daysSince > 3 ? 'text-amber-500' : 'text-slate-400'}`}>
                                                        {daysSince === 0 ? 'Today' : `${daysSince}d since last response`}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Buttons */}
                                            {answer ? (
                                                <div className="flex items-center gap-1.5">
                                                    {answer === 'yes' ? (
                                                        <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                                                            <CheckCircle className="w-4 h-4" /> Responded
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs font-medium text-red-500 flex items-center gap-1">
                                                            <XCircle className="w-4 h-4" /> Silent
                                                        </span>
                                                    )}
                                                    <button
                                                        onClick={() => setResponded(prev => {
                                                            const copy = { ...prev }
                                                            delete copy[lead.id]
                                                            return copy
                                                        })}
                                                        className="text-[10px] text-slate-400 hover:text-slate-600 underline ml-1"
                                                    >
                                                        undo
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        onClick={() => handleResponse(lead.id, true)}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600 transition"
                                                    >
                                                        <MessageCircle className="w-3 h-3" /> Yes
                                                    </button>
                                                    <button
                                                        onClick={() => handleResponse(lead.id, false)}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 text-xs font-medium hover:bg-slate-50 transition"
                                                    >
                                                        No
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                        <div className="flex items-center justify-between">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-white transition"
                            >
                                Skip for now
                            </button>
                            <button
                                onClick={handleFinish}
                                disabled={answeredCount === 0}
                                className={`px-5 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${answeredCount > 0
                                        ? 'bg-brand-500 text-white hover:bg-brand-600'
                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    }`}
                            >
                                {allDone ? '✅ All Done!' : `Save (${answeredCount} answered)`}
                            </button>
                        </div>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    )
}

/** Get the ISO week string like "2026-W07" */
function getISOWeek(date: Date): string {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
    const week1 = new Date(d.getFullYear(), 0, 4)
    const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
    return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

/** Check if weekly check-in should be shown (once per ISO week, on Monday or later) */
export function shouldShowWeeklyCheckIn(): boolean {
    const now = new Date()
    const day = now.getDay() // 0=Sun, 1=Mon
    // Only show on Monday (1) or later in the week
    if (day === 0) return false // Not on Sunday

    const currentWeek = getISOWeek(now)
    const lastCheckedWeek = localStorage.getItem('dateflow_lastCheckInWeek')

    return lastCheckedWeek !== currentWeek
}
