import { useState, useMemo } from 'react'
import { Thermometer, HelpCircle, CheckCircle2, XCircle, X } from 'lucide-react'
import { useGameStore } from '../store/useGameStore'
import { PLATFORM_ICONS, FUNNEL_STAGE_NAMES } from '../utils/constants'
import type { Lead } from '../types'

/** Calculate temperature as 0–100% based on days since last incoming response.
 *  100% = just responded, decays exponentially: ~70% at 3 days, ~35% at 7 days, ~0% at 14+ days */
export function getTemperaturePercent(lead: Lead): number {
    const ref = lead.lastResponseDate || lead.lastInteractionDate || lead.createdAt
    const days = Math.max(0, (Date.now() - new Date(ref).getTime()) / (1000 * 60 * 60 * 24))
    // Exponential decay: half-life ~4 days → k = ln(2)/4 ≈ 0.173
    const pct = 100 * Math.exp(-0.173 * days)
    return Math.max(0, Math.min(100, Math.round(pct)))
}

/** Get color gradient class from percentage */
function getTempColor(pct: number): string {
    if (pct >= 70) return 'text-red-500'
    if (pct >= 35) return 'text-amber-500'
    return 'text-blue-500'
}

function getTempBarColor(pct: number): string {
    if (pct >= 70) return 'from-red-500 to-orange-400'
    if (pct >= 35) return 'from-amber-500 to-yellow-400'
    return 'from-blue-500 to-cyan-400'
}

function getTempLabel(pct: number): string {
    if (pct >= 70) return '🔥 Hot'
    if (pct >= 35) return '🌡️ Warm'
    return '❄️ Cold'
}

function getTempBg(pct: number): string {
    if (pct >= 70) return 'bg-red-50 border-red-200'
    if (pct >= 35) return 'bg-amber-50 border-amber-200'
    return 'bg-blue-50 border-blue-200'
}

/** Check if a lead had an incoming interaction this ISO week */
function hadContactThisWeek(lead: Lead, interactions: { leadId: string; direction: string; occurredAt: string }[]): boolean {
    const now = new Date()
    // Get Monday of current week
    const monday = new Date(now)
    const day = monday.getDay()
    const diff = day === 0 ? -6 : 1 - day
    monday.setDate(monday.getDate() + diff)
    monday.setHours(0, 0, 0, 0)

    return interactions.some(i =>
        i.leadId === lead.id &&
        i.direction === 'Incoming' &&
        new Date(i.occurredAt) >= monday
    )
}

interface TemperatureBoardProps {
    onSelectLead: (lead: Lead) => void
}

export default function TemperatureBoard({ onSelectLead }: TemperatureBoardProps) {
    const leads = useGameStore(state => state.leads)
    const interactions = useGameStore(state => state.interactions)
    const [showHelp, setShowHelp] = useState(false)
    const [sortBy, setSortBy] = useState<'temp' | 'name' | 'stage'>('temp')

    const activeLeads = useMemo(() => {
        const active = leads.filter(l => l.funnelStage !== 'Dead' && l.funnelStage !== 'Lover')
        const withTemp = active.map(l => ({
            lead: l,
            pct: getTemperaturePercent(l),
            checkedIn: hadContactThisWeek(l, interactions),
        }))

        switch (sortBy) {
            case 'name':
                return withTemp.sort((a, b) => a.lead.name.localeCompare(b.lead.name))
            case 'stage':
                return withTemp.sort((a, b) => {
                    const order = { Stage1: 0, Stage2: 1, Stage3: 2, Stage4: 3, Lover: 4, Dead: 5 }
                    return (order[a.lead.funnelStage] || 0) - (order[b.lead.funnelStage] || 0)
                })
            default:
                return withTemp.sort((a, b) => a.pct - b.pct) // coldest first
        }
    }, [leads, interactions, sortBy])

    const avgTemp = activeLeads.length > 0
        ? Math.round(activeLeads.reduce((sum, l) => sum + l.pct, 0) / activeLeads.length)
        : 0

    const checkedInCount = activeLeads.filter(l => l.checkedIn).length
    const hotCount = activeLeads.filter(l => l.pct >= 70).length
    const warmCount = activeLeads.filter(l => l.pct >= 35 && l.pct < 70).length
    const coldCount = activeLeads.filter(l => l.pct < 35).length

    return (
        <div className="space-y-6">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-red-500 via-amber-500 to-blue-500 rounded-xl shadow-lg">
                        <Thermometer className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Temperature Dashboard</h2>
                        <p className="text-xs text-slate-500">Track engagement decay across all active leads</p>
                    </div>
                    <button
                        onClick={() => setShowHelp(!showHelp)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
                        title="How temperature works"
                    >
                        <HelpCircle className="w-5 h-5" />
                    </button>
                </div>

                {/* Sort control */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Sort by:</span>
                    {(['temp', 'name', 'stage'] as const).map(s => (
                        <button
                            key={s}
                            onClick={() => setSortBy(s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${sortBy === s ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            {s === 'temp' ? '🌡️ Temperature' : s === 'name' ? '🔤 Name' : '📊 Stage'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Help explainer */}
            {showHelp && (
                <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border border-slate-200 p-5 relative">
                    <button onClick={() => setShowHelp(false)} className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                    </button>
                    <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-brand-500" /> How Temperature Works
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4 text-sm text-slate-600">
                        <div>
                            <p className="font-semibold text-slate-700 mb-1">📈 The Decay System</p>
                            <ul className="space-y-1 text-xs">
                                <li>• Temperature starts at <span className="font-bold text-red-500">100%</span> when a lead responds</li>
                                <li>• It naturally decays every day without contact</li>
                                <li>• After ~3 days → drops to <span className="font-bold text-amber-500">~60%</span></li>
                                <li>• After ~7 days → drops to <span className="font-bold text-blue-500">~30%</span></li>
                                <li>• After 14+ days → approaches <span className="font-bold text-blue-400">0%</span></li>
                            </ul>
                        </div>
                        <div>
                            <p className="font-semibold text-slate-700 mb-1">♻️ How to Reset</p>
                            <ul className="space-y-1 text-xs">
                                <li>• An <span className="font-bold">incoming response</span> resets temp to 100%</li>
                                <li>• Use the <span className="font-bold">weekly check-in</span> to mark who responded</li>
                                <li>• Or log an incoming interaction on the lead's detail page</li>
                                <li>• <CheckCircle2 className="w-3 h-3 text-emerald-500 inline" /> = responded this week</li>
                                <li>• <XCircle className="w-3 h-3 text-slate-300 inline" /> = no response this week yet</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                    <div className={`text-2xl font-bold ${getTempColor(avgTemp)}`}>{avgTemp}%</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Avg Temperature</div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                    <div className="text-2xl font-bold text-emerald-500">{checkedInCount}<span className="text-sm text-slate-400">/{activeLeads.length}</span></div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Checked In This Week</div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                    <div className="text-2xl font-bold text-red-500">{hotCount}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">🔥 Hot (&ge;70%)</div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                    <div className="text-2xl font-bold text-amber-500">{warmCount}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">🌡️ Warm (35-69%)</div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                    <div className="text-2xl font-bold text-blue-500">{coldCount}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">❄️ Cold (&lt;35%)</div>
                </div>
            </div>

            {/* Lead list */}
            {activeLeads.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                    <Thermometer className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No active leads to track</p>
                    <p className="text-sm mt-1">Add leads to start monitoring their temperature</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {activeLeads.map(({ lead, pct, checkedIn }) => {
                        const ref = lead.lastResponseDate || lead.lastInteractionDate || lead.createdAt
                        const days = Math.max(0, Math.floor((Date.now() - new Date(ref).getTime()) / (1000 * 60 * 60 * 24)))

                        return (
                            <div
                                key={lead.id}
                                onClick={() => onSelectLead(lead)}
                                className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${getTempBg(pct)}`}
                            >
                                {/* Check-in indicator */}
                                <div className="flex-shrink-0" title={checkedIn ? 'Responded this week ✅' : 'No response this week'}>
                                    {checkedIn ? (
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-slate-300" />
                                    )}
                                </div>

                                {/* Avatar */}
                                <div className="flex-shrink-0">
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
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-slate-800 truncate">{lead.name}</span>
                                        <span className="text-[10px] text-slate-400 hidden sm:inline">
                                            {PLATFORM_ICONS[lead.platformOrigin]} {FUNNEL_STAGE_NAMES[lead.funnelStage]}
                                        </span>
                                    </div>
                                    {/* Temperature bar */}
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <div className="flex-1 h-2 bg-white/60 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full bg-gradient-to-r ${getTempBarColor(pct)} transition-all duration-500`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[11px] font-medium ${days > 7 ? 'text-red-500' : days > 3 ? 'text-amber-500' : 'text-slate-400'}`}>
                                            {days === 0 ? 'Responded today' : `${days}d since last response`}
                                        </span>
                                    </div>
                                </div>

                                {/* Temperature % */}
                                <div className="flex-shrink-0 text-right">
                                    <div className={`text-lg sm:text-xl font-bold ${getTempColor(pct)}`}>
                                        {pct}%
                                    </div>
                                    <div className="text-[10px] text-slate-500">
                                        {getTempLabel(pct)}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
