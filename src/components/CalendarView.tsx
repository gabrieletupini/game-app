import { useMemo, useState } from 'react'
import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isToday,
    isBefore,
    addMonths,
    subMonths,
    format,
    parseISO,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Droplets, Check, Plus } from 'lucide-react'
import { useGameStore } from '../store/useGameStore'
import type { Lead } from '../types'
import { getStartOfDay } from '../utils/dateHelpers'
import { getWaterCountThisWeek, getPlantHealth, WEEKLY_GOAL } from '../utils/gardenHelpers'

interface CalendarViewProps {
    onSelectLead: (lead: Lead) => void
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function Avatar({ lead, size = 'sm', planned = false }: { lead: Lead; size?: 'xs' | 'sm' | 'md'; planned?: boolean }) {
    const dim = size === 'md' ? 'w-9 h-9 text-sm' : size === 'sm' ? 'w-7 h-7 text-xs' : 'w-5 h-5 text-[9px]'
    const ring = planned ? 'ring-1 ring-dashed ring-slate-400 opacity-70' : 'ring-2 ring-white'
    return lead.profilePhotoUrl ? (
        <img src={lead.profilePhotoUrl} alt={lead.name} className={`${dim} rounded-full object-cover ${ring} shadow-sm`} />
    ) : (
        <div className={`${dim} rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-semibold ${ring} shadow-sm`}>
            {lead.name.charAt(0).toUpperCase()}
        </div>
    )
}

export default function CalendarView({ onSelectLead }: CalendarViewProps) {
    const leads = useGameStore(state => state.leads)
    const interactions = useGameStore(state => state.interactions)
    const waterLead = useGameStore(state => state.waterLead)
    const deleteInteraction = useGameStore(state => state.deleteInteraction)
    const addToast = useGameStore(state => state.addToast)

    const [viewMonth, setViewMonth] = useState<Date>(() => startOfMonth(new Date()))
    const [selectedDay, setSelectedDay] = useState<Date | null>(() => getStartOfDay(new Date()))

    const leadById = useMemo(() => {
        const map = new Map<string, Lead>()
        leads.forEach(l => map.set(l.id, l))
        return map
    }, [leads])

    // Active connections (not archived / not lovers) — the ones we're building
    const activeLeads = useMemo(
        () => leads.filter(l => l.funnelStage !== 'Dead' && l.funnelStage !== 'Lover'),
        [leads]
    )

    // Map each day (toDateString) -> { leadId -> count } from logged interactions
    const dayMap = useMemo(() => {
        const map = new Map<string, Map<string, number>>()
        interactions.forEach(i => {
            const d = parseISO(i.occurredAt)
            if (isNaN(d.getTime())) return
            const key = d.toDateString()
            if (!map.has(key)) map.set(key, new Map())
            const inner = map.get(key)!
            inner.set(i.leadId, (inner.get(i.leadId) || 0) + 1)
        })
        return map
    }, [interactions])

    const calendarDays = useMemo(() => {
        const gridStart = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 })
        const gridEnd = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 1 })
        return eachDayOfInterval({ start: gridStart, end: gridEnd })
    }, [viewMonth])

    const today = getStartOfDay(new Date())

    // Connections talked to on a given day (deduped), with whether it's planned (future)
    const leadsForDay = (day: Date) => {
        const inner = dayMap.get(day.toDateString())
        if (!inner) return [] as Lead[]
        return Array.from(inner.keys())
            .map(id => leadById.get(id))
            .filter((l): l is Lead => Boolean(l))
    }

    const hasWatering = (day: Date, leadId: string) => {
        return (dayMap.get(day.toDateString())?.get(leadId) || 0) > 0
    }

    const removeWateringsOnDay = (day: Date, leadId: string) => {
        interactions
            .filter(i => i.leadId === leadId && parseISO(i.occurredAt).toDateString() === day.toDateString())
            .forEach(i => deleteInteraction(i.id))
    }

    const waterOnDay = (day: Date, lead: Lead) => {
        // Keep the time-of-day so multiple waterings on the same day stay distinct,
        // but anchor the date to the selected day.
        const now = new Date()
        const stamp = new Date(day)
        stamp.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds())
        waterLead(lead.id, stamp.toISOString())
        const future = isBefore(today, getStartOfDay(day))
        addToast({
            type: 'success',
            title: future ? `🗓️ Planned ${lead.name}` : `💧 Watered ${lead.name}`,
            duration: 1800,
        })
    }

    // Garden strip — least-nurtured first so neglected connections rise to the top
    const garden = useMemo(() => {
        return activeLeads
            .map(l => ({ lead: l, count: getWaterCountThisWeek(interactions, l.id) }))
            .sort((a, b) => a.count - b.count || a.lead.name.localeCompare(b.lead.name))
    }, [activeLeads, interactions])

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            {/* Calendar */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
                {/* Month nav */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-900">{format(viewMonth, 'MMMM yyyy')}</h2>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setViewMonth(m => subMonths(m, 1))}
                            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition"
                            title="Previous month"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => { setViewMonth(startOfMonth(new Date())); setSelectedDay(getStartOfDay(new Date())) }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                        >
                            Today
                        </button>
                        <button
                            onClick={() => setViewMonth(m => addMonths(m, 1))}
                            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition"
                            title="Next month"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                    {WEEKDAYS.map(d => (
                        <div key={d} className="text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-1">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map(day => {
                        const inMonth = isSameMonth(day, viewMonth)
                        const dayLeads = leadsForDay(day)
                        const isSelected = selectedDay && isSameDay(day, selectedDay)
                        const planned = isBefore(today, getStartOfDay(day))
                        return (
                            <button
                                key={day.toISOString()}
                                onClick={() => setSelectedDay(getStartOfDay(day))}
                                className={`min-h-[64px] sm:min-h-[84px] rounded-lg border p-1.5 text-left transition flex flex-col gap-1
                                    ${inMonth ? 'bg-white' : 'bg-slate-50/60'}
                                    ${isSelected ? 'border-brand-400 ring-2 ring-brand-200' : 'border-slate-100 hover:border-slate-300'}
                                `}
                            >
                                <span className={`text-xs font-medium inline-flex items-center justify-center w-5 h-5 rounded-full
                                    ${isToday(day) ? 'bg-brand-500 text-white' : inMonth ? 'text-slate-600' : 'text-slate-300'}`}>
                                    {format(day, 'd')}
                                </span>
                                <div className="flex flex-wrap gap-0.5">
                                    {dayLeads.slice(0, 4).map(l => (
                                        <Avatar key={l.id} lead={l} size="xs" planned={planned} />
                                    ))}
                                    {dayLeads.length > 4 && (
                                        <span className="text-[9px] text-slate-400 font-semibold self-center">+{dayLeads.length - 4}</span>
                                    )}
                                </div>
                            </button>
                        )
                    })}
                </div>

                {/* Selected-day panel */}
                {selectedDay && (
                    <div className="mt-5 border-t border-slate-100 pt-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-slate-900">
                                {isBefore(today, selectedDay) ? '🗓️ Plan to talk on ' : '💧 Talked to on '}
                                {format(selectedDay, 'EEE, MMM d')}
                            </h3>
                        </div>
                        {activeLeads.length === 0 ? (
                            <p className="text-sm text-slate-400 py-4 text-center">Add connections from the Funnel first.</p>
                        ) : (
                            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                                {activeLeads.map(lead => {
                                    const done = hasWatering(selectedDay, lead.id)
                                    return (
                                        <div
                                            key={lead.id}
                                            className={`flex items-center gap-3 p-2 rounded-xl border transition ${done ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100 hover:border-slate-200'}`}
                                        >
                                            <button onClick={() => onSelectLead(lead)} className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
                                                <Avatar lead={lead} size="sm" />
                                                <span className="text-sm font-medium text-slate-800 truncate">{lead.name}</span>
                                            </button>
                                            {done ? (
                                                <button
                                                    onClick={() => removeWateringsOnDay(selectedDay, lead.id)}
                                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition"
                                                    title="Tap to undo"
                                                >
                                                    <Check className="w-3.5 h-3.5" /> Done
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => waterOnDay(selectedDay, lead)}
                                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:border-emerald-300 hover:text-emerald-700 transition"
                                                >
                                                    <Plus className="w-3.5 h-3.5" /> {isBefore(today, selectedDay) ? 'Plan' : 'Water'}
                                                </button>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Garden strip */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 h-fit">
                <div className="flex items-center gap-2 mb-1">
                    <Droplets className="w-4 h-4 text-sky-500" />
                    <h3 className="text-sm font-bold text-slate-900">Your Garden</h3>
                </div>
                <p className="text-xs text-slate-400 mb-4">Water each connection {WEEKLY_GOAL}× this week. Everyday better 🌱</p>

                {garden.length === 0 ? (
                    <p className="text-sm text-slate-400 py-4 text-center">No active connections yet.</p>
                ) : (
                    <div className="space-y-1.5">
                        {garden.map(({ lead, count }) => {
                            const health = getPlantHealth(count)
                            return (
                                <div key={lead.id} className={`flex items-center gap-2.5 p-2 rounded-xl ${health.bgClass}`}>
                                    <button onClick={() => onSelectLead(lead)} className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
                                        <Avatar lead={lead} size="sm" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-slate-800 truncate">{lead.name}</p>
                                            <p className={`text-[11px] font-medium ${health.textClass}`}>
                                                {health.emoji} {count}/{WEEKLY_GOAL} this week
                                            </p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => { waterLead(lead.id); addToast({ type: 'success', title: `💧 Watered ${lead.name}`, duration: 1800 }) }}
                                        className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:border-sky-300 hover:text-sky-700 transition shadow-sm"
                                        title="Log a chat today"
                                    >
                                        💧
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
