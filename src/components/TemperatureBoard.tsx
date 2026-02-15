import { useState, useMemo, useCallback } from 'react'
import { Thermometer, HelpCircle, CheckCircle2, XCircle, X, MessageSquare } from 'lucide-react'
import { useGameStore } from '../store/useGameStore'
import { PLATFORM_ICONS, FUNNEL_STAGE_NAMES } from '../utils/constants'
import type { Lead } from '../types'

/** Back-calculate a virtual reference date that would produce the given percentage right now.
 *  pct = 100 * exp(-k * days) → days = -ln(pct/100) / k  */
function refDateForPercent(pct: number): string {
    const clamped = Math.max(1, Math.min(100, pct)) // avoid ln(0)
    const k = 0.173
    const daysBack = -Math.log(clamped / 100) / k
    return new Date(Date.now() - daysBack * 86_400_000).toISOString()
}

/** Calculate temperature as 0–100% based on exponential decay.
 *  Uses temperatureRefDate (manual anchor) if present, otherwise lastResponseDate.
 *  Decay continues naturally regardless of how the reference date was set. */
export function getTemperaturePercent(lead: Lead): number {
    const ref = lead.temperatureRefDate || lead.lastResponseDate || lead.lastInteractionDate || lead.createdAt
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
    const updateLead = useGameStore(state => state.updateLead)
    const [showHelp, setShowHelp] = useState(false)
    const [sortBy, setSortBy] = useState<'temp' | 'name' | 'stage'>('temp')
    const [editingNotes, setEditingNotes] = useState<string | null>(null)
    const [notesValue, setNotesValue] = useState('')
    const [editingTemp, setEditingTemp] = useState<string | null>(null)
    const [tempInputValue, setTempInputValue] = useState('')
    const [editingDays, setEditingDays] = useState<string | null>(null)
    const [daysInputValue, setDaysInputValue] = useState('')

    const handleTempEdit = useCallback((leadId: string, currentPct: number, e: React.MouseEvent) => {
        e.stopPropagation()
        setEditingTemp(leadId)
        setTempInputValue(String(currentPct))
    }, [])

    const commitTempEdit = useCallback((leadId: string) => {
        const val = parseInt(tempInputValue, 10)
        if (!isNaN(val) && val >= 0 && val <= 100) {
            // Back-calculate a virtual reference date so the decay continues naturally
            updateLead(leadId, { temperatureRefDate: refDateForPercent(val) })
        }
        setEditingTemp(null)
    }, [tempInputValue, updateLead])

    const handleDaysEdit = useCallback((leadId: string, currentDays: number, e: React.MouseEvent) => {
        e.stopPropagation()
        setEditingDays(leadId)
        setDaysInputValue(String(currentDays))
    }, [])

    const commitDaysEdit = useCallback((leadId: string) => {
        const val = parseInt(daysInputValue, 10)
        if (!isNaN(val) && val >= 0) {
            const newDate = new Date(Date.now() - val * 86_400_000).toISOString()
            updateLead(leadId, { lastResponseDate: newDate })
        }
        setEditingDays(null)
    }, [daysInputValue, updateLead])

    const openNotes = useCallback((leadId: string, current: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setEditingNotes(leadId)
        setNotesValue(current)
    }, [])

    const saveNotes = useCallback(() => {
        if (editingNotes) {
            updateLead(editingNotes, { temperatureNotes: notesValue })
            setEditingNotes(null)
        }
    }, [editingNotes, notesValue, updateLead])

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
                        <div className="sm:col-span-2 mt-1 pt-3 border-t border-slate-200">
                            <p className="font-semibold text-slate-700 mb-1">✏️ Everything is Editable</p>
                            <ul className="space-y-1 text-xs">
                                <li>• Click the <span className="font-bold">percentage</span> or <span className="font-bold">days</span> to edit them — decay continues from your new value</li>
                                <li>• Click <MessageSquare className="w-3 h-3 text-slate-400 inline" /> to add <span className="font-bold">notes</span> (e.g. why it got cold)</li>
                                <li>• An <span className="font-bold">incoming response</span> resets everything automatically</li>
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
                        // Days since last REAL response (independent of temperature)
                        const realRef = lead.lastResponseDate || lead.lastInteractionDate || lead.createdAt
                        const days = Math.max(0, Math.floor((Date.now() - new Date(realRef).getTime()) / (1000 * 60 * 60 * 24)))

                        return (
                            <div
                                key={lead.id}
                                className={`rounded-xl border transition-all hover:shadow-md ${getTempBg(pct)}`}
                            >
                                <div
                                    onClick={() => onSelectLead(lead)}
                                    className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 cursor-pointer"
                                >
                                    {/* Check-in indicator — more prominent */}
                                    <div className="flex-shrink-0" title={checkedIn ? 'Responded this week ✅' : 'No response this week'}>
                                        {checkedIn ? (
                                            <div className="flex items-center gap-1.5 bg-emerald-100 border border-emerald-300 rounded-lg px-2 py-1">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                <span className="text-[10px] font-bold text-emerald-700 hidden sm:inline">Checked in</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-lg px-2 py-1">
                                                <XCircle className="w-4 h-4 text-slate-400" />
                                                <span className="text-[10px] font-medium text-slate-400 hidden sm:inline">No reply</span>
                                            </div>
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
                                        {/* Temperature bar (display only) */}
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <div className="flex-1 h-2.5 bg-white/60 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full bg-gradient-to-r ${getTempBarColor(pct)} transition-all duration-500`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1" onClick={e => e.stopPropagation()}>
                                            {editingDays === lead.id ? (
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        autoFocus
                                                        type="number"
                                                        min={0}
                                                        className="w-10 text-center text-[11px] font-bold bg-white border-2 border-brand-400 rounded-md px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-brand-500/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        value={daysInputValue}
                                                        onChange={e => setDaysInputValue(e.target.value)}
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter') commitDaysEdit(lead.id)
                                                            if (e.key === 'Escape') setEditingDays(null)
                                                        }}
                                                        onBlur={() => commitDaysEdit(lead.id)}
                                                    />
                                                    <span className="text-[11px] text-slate-400">days since last response</span>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={(e) => handleDaysEdit(lead.id, days, e)}
                                                    className={`text-[11px] font-medium hover:underline hover:decoration-dotted cursor-text transition ${days > 7 ? 'text-red-500' : days > 3 ? 'text-amber-500' : 'text-slate-400'}`}
                                                    title="Click to edit days since last response"
                                                >
                                                    {days === 0 ? 'Responded today' : `${days}d since last response`}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Notes button */}
                                    <button
                                        onClick={(e) => openNotes(lead.id, lead.temperatureNotes || '', e)}
                                        className={`flex-shrink-0 p-1.5 rounded-lg transition ${lead.temperatureNotes ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'}`}
                                        title={lead.temperatureNotes ? `Notes: ${lead.temperatureNotes}` : 'Add temperature notes'}
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                    </button>

                                    {/* Temperature % — CLICKABLE to edit */}
                                    <div className="flex-shrink-0 text-right" onClick={(e) => e.stopPropagation()}>
                                        {editingTemp === lead.id ? (
                                            <div className="flex items-center gap-1">
                                                <input
                                                    autoFocus
                                                    type="number"
                                                    min={0}
                                                    max={100}
                                                    className="w-14 text-right text-lg font-bold bg-white border-2 border-brand-400 rounded-lg px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-brand-500/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    value={tempInputValue}
                                                    onChange={e => setTempInputValue(e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') commitTempEdit(lead.id)
                                                        if (e.key === 'Escape') setEditingTemp(null)
                                                    }}
                                                    onBlur={() => commitTempEdit(lead.id)}
                                                />
                                                <span className="text-sm font-bold text-slate-400">%</span>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={(e) => handleTempEdit(lead.id, pct, e)}
                                                className={`text-lg sm:text-xl font-bold ${getTempColor(pct)} hover:underline hover:decoration-dotted cursor-text transition`}
                                                title="Click to edit temperature"
                                            >
                                                {pct}%
                                            </button>
                                        )}
                                        <div className="text-[10px] text-slate-500">
                                            {getTempLabel(pct)}
                                        </div>
                                    </div>
                                </div>

                                {/* Temperature notes preview */}
                                {lead.temperatureNotes && editingNotes !== lead.id && (
                                    <div
                                        className="px-4 pb-3 -mt-1 cursor-pointer"
                                        onClick={(e) => openNotes(lead.id, lead.temperatureNotes || '', e)}
                                    >
                                        <p className="text-xs text-slate-500 italic bg-white/50 rounded-lg px-3 py-1.5 border border-slate-200/50">
                                            📝 {lead.temperatureNotes}
                                        </p>
                                    </div>
                                )}

                                {/* Inline notes editor */}
                                {editingNotes === lead.id && (
                                    <div className="px-4 pb-3 -mt-1" onClick={e => e.stopPropagation()}>
                                        <textarea
                                            autoFocus
                                            className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                                            rows={2}
                                            placeholder="Why did the temperature change? e.g. 'She went on vacation', 'Ghosted after date'…"
                                            value={notesValue}
                                            onChange={e => setNotesValue(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveNotes() }
                                                if (e.key === 'Escape') setEditingNotes(null)
                                            }}
                                        />
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <button
                                                onClick={saveNotes}
                                                className="text-[11px] font-semibold text-white bg-brand-500 hover:bg-brand-600 px-3 py-1 rounded-lg transition"
                                            >Save</button>
                                            <button
                                                onClick={() => setEditingNotes(null)}
                                                className="text-[11px] font-medium text-slate-500 hover:text-slate-700 px-3 py-1 rounded-lg transition"
                                            >Cancel</button>
                                            {notesValue && (
                                                <button
                                                    onClick={() => { setNotesValue(''); updateLead(lead.id, { temperatureNotes: '' }); setEditingNotes(null) }}
                                                    className="text-[11px] font-medium text-red-500 hover:text-red-700 px-3 py-1 rounded-lg transition ml-auto"
                                                >Clear</button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
