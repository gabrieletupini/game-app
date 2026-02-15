import { useState, useMemo } from 'react'
import { Search, ArrowUpDown, ChevronDown, ChevronUp, Filter } from 'lucide-react'
import { useGameStore } from '../store/useGameStore'
import type { Lead, DatingIntention, FunnelStage, PlatformOrigin } from '../types'
import { FUNNEL_STAGE_NAMES, PLATFORM_ICONS, INTENTION_CONFIG } from '../utils/constants'
import { getDaysSince } from '../utils/dateHelpers'
import { getTemperaturePercent } from './TemperatureBoard'

const ALL_INTENTIONS: (DatingIntention | 'All')[] = ['All', 'Short Term', 'Long Term', 'Long Term Open to Short', 'Casual', 'Exploring', 'Undecided']

type QualRange = 'All' | '1-3' | '4-6' | '7' | '8-10'
const QUAL_RANGES: { key: QualRange; label: string; emoji: string; min: number; max: number; color: string; bg: string; border: string }[] = [
    { key: 'All', label: 'All', emoji: '🎯', min: 0, max: 10, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-300' },
    { key: '1-3', label: 'Low (1–3)', emoji: '🔻', min: 1, max: 3, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    { key: '4-6', label: 'Mid (4–6)', emoji: '➖', min: 4, max: 6, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    { key: '7', label: 'High (7)', emoji: '🔺', min: 7, max: 7, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { key: '8-10', label: 'Elite (8–10)', emoji: '👑', min: 8, max: 10, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
]

type TempRange = 'All' | 'hot' | 'warm' | 'cold'
const TEMP_RANGES: { key: TempRange; label: string; emoji: string; min: number; max: number; color: string; bg: string; border: string }[] = [
    { key: 'All', label: 'All', emoji: '🌡️', min: 0, max: 100, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-300' },
    { key: 'hot', label: 'Hot (≥70%)', emoji: '🔥', min: 70, max: 100, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    { key: 'warm', label: 'Warm (35–69%)', emoji: '🌡️', min: 35, max: 69, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    { key: 'cold', label: 'Cold (<35%)', emoji: '❄️', min: 0, max: 34, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
]

type SortKey = 'name' | 'overall' | 'qualification' | 'aesthetics' | 'daysSince' | 'stage' | 'intention' | 'platform' | 'commPlatform' | 'temperature'
type SortDir = 'asc' | 'desc'

interface PriorityTableProps {
    onSelectLead: (lead: Lead) => void
}

export default function PriorityTable({ onSelectLead }: PriorityTableProps) {
    const leads = useGameStore(state => state.leads)

    // Only show active funnel leads (not Lover/Dead)
    const activeLeads = leads.filter(l =>
        l.funnelStage !== 'Lover' && l.funnelStage !== 'Dead'
    )

    const [intentionFilter, setIntentionFilter] = useState<DatingIntention | 'All'>('All')
    const [qualFilter, setQualFilter] = useState<QualRange>('All')
    const [tempFilter, setTempFilter] = useState<TempRange>('All')
    const [platformFilter, setPlatformFilter] = useState<PlatformOrigin | 'All'>('All')
    const [stageFilter, setStageFilter] = useState<FunnelStage | 'All'>('All')
    const [countryFilter, setCountryFilter] = useState<string>('All')
    const [traitFilter, setTraitFilter] = useState<string>('All')
    const [search, setSearch] = useState('')
    const [sortKey, setSortKey] = useState<SortKey>('overall')
    const [sortDir, setSortDir] = useState<SortDir>('desc')

    // Collect unique platforms and stages from active leads
    const allPlatforms = useMemo(() => {
        const set = new Set<PlatformOrigin>()
        activeLeads.forEach(l => set.add(l.platformOrigin))
        return Array.from(set).sort()
    }, [activeLeads])

    const ACTIVE_STAGES: { key: FunnelStage; label: string }[] = [
        { key: 'Stage1', label: FUNNEL_STAGE_NAMES.Stage1 },
        { key: 'Stage2', label: FUNNEL_STAGE_NAMES.Stage2 },
        { key: 'Stage3', label: FUNNEL_STAGE_NAMES.Stage3 },
        { key: 'Stage4', label: FUNNEL_STAGE_NAMES.Stage4 },
    ]

    // Collect unique countries and trait keywords from all active leads
    const allCountries = useMemo(() => {
        const set = new Set<string>()
        activeLeads.forEach(l => {
            if (l.countryOrigin?.trim()) set.add(l.countryOrigin.trim())
        })
        return Array.from(set).sort()
    }, [activeLeads])

    const allTraits = useMemo(() => {
        const set = new Set<string>()
        activeLeads.forEach(l => {
            if (l.personalityTraits) {
                l.personalityTraits.split(',').map(t => t.trim()).filter(Boolean).forEach(t => set.add(t))
            }
        })
        return Array.from(set).sort()
    }, [activeLeads])

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        } else {
            setSortKey(key)
            setSortDir('desc')
        }
    }

    const activeFilters = (intentionFilter !== 'All' ? 1 : 0) + (qualFilter !== 'All' ? 1 : 0) + (tempFilter !== 'All' ? 1 : 0) + (platformFilter !== 'All' ? 1 : 0) + (stageFilter !== 'All' ? 1 : 0) + (countryFilter !== 'All' ? 1 : 0) + (traitFilter !== 'All' ? 1 : 0) + (search.trim() ? 1 : 0)

    const filteredAndSorted = useMemo(() => {
        let result = activeLeads

        // Filter by intention
        if (intentionFilter !== 'All') {
            result = result.filter(l => (l.datingIntention || 'Undecided') === intentionFilter)
        }

        // Filter by qualification range
        if (qualFilter !== 'All') {
            const range = QUAL_RANGES.find(r => r.key === qualFilter)
            if (range) {
                result = result.filter(l => {
                    const q = l.qualificationScore || 5
                    return q >= range.min && q <= range.max
                })
            }
        }

        // Filter by origin platform
        if (platformFilter !== 'All') {
            result = result.filter(l => l.platformOrigin === platformFilter)
        }

        // Filter by funnel stage
        if (stageFilter !== 'All') {
            result = result.filter(l => l.funnelStage === stageFilter)
        }

        // Filter by temperature range
        if (tempFilter !== 'All') {
            const range = TEMP_RANGES.find(r => r.key === tempFilter)
            if (range) {
                result = result.filter(l => {
                    const pct = getTemperaturePercent(l)
                    return pct >= range.min && pct <= range.max
                })
            }
        }

        // Filter by country
        if (countryFilter !== 'All') {
            result = result.filter(l => (l.countryOrigin || '').trim() === countryFilter)
        }

        // Filter by personality trait keyword
        if (traitFilter !== 'All') {
            result = result.filter(l => {
                const traits = (l.personalityTraits || '').split(',').map(t => t.trim().toLowerCase())
                return traits.includes(traitFilter.toLowerCase())
            })
        }

        // Filter by search
        if (search.trim()) {
            const q = search.toLowerCase()
            result = result.filter(l =>
                l.name.toLowerCase().includes(q) ||
                l.platformOrigin.toLowerCase().includes(q) ||
                (l.communicationPlatform || []).some(p => p.toLowerCase().includes(q)) ||
                (l.countryOrigin || '').toLowerCase().includes(q) ||
                (l.personalityTraits || '').toLowerCase().includes(q)
            )
        }

        // Sort
        result = [...result].sort((a, b) => {
            const dir = sortDir === 'asc' ? 1 : -1
            switch (sortKey) {
                case 'name':
                    return dir * a.name.localeCompare(b.name)
                case 'overall': {
                    const aScore = ((a.qualificationScore || 5) + (a.aestheticsScore || 5)) / 2
                    const bScore = ((b.qualificationScore || 5) + (b.aestheticsScore || 5)) / 2
                    return dir * (aScore - bScore)
                }
                case 'qualification':
                    return dir * ((a.qualificationScore || 5) - (b.qualificationScore || 5))
                case 'aesthetics':
                    return dir * ((a.aestheticsScore || 5) - (b.aestheticsScore || 5))
                case 'daysSince': {
                    const aDays = getDaysSince(a.lastInteractionDate || a.createdAt)
                    const bDays = getDaysSince(b.lastInteractionDate || b.createdAt)
                    return dir * (aDays - bDays)
                }
                case 'stage': {
                    const stageOrder = { Stage1: 1, Stage2: 2, Stage3: 3, Stage4: 4, Lover: 5, Dead: 6 }
                    return dir * ((stageOrder[a.funnelStage] || 0) - (stageOrder[b.funnelStage] || 0))
                }
                case 'intention':
                    return dir * ((a.datingIntention || 'Undecided').localeCompare(b.datingIntention || 'Undecided'))
                case 'platform':
                    return dir * a.platformOrigin.localeCompare(b.platformOrigin)
                case 'commPlatform':
                    return dir * ((a.communicationPlatform?.[0] || a.platformOrigin).localeCompare(b.communicationPlatform?.[0] || b.platformOrigin))
                case 'temperature':
                    return dir * (getTemperaturePercent(a) - getTemperaturePercent(b))
                default:
                    return 0
            }
        })

        return result
    }, [activeLeads, intentionFilter, qualFilter, tempFilter, platformFilter, stageFilter, countryFilter, traitFilter, search, sortKey, sortDir])

    if (activeLeads.length === 0) return null

    const SortHeader = ({ label, sortKeyName, className = '' }: { label: string; sortKeyName: SortKey; className?: string }) => (
        <th
            className={`px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 transition select-none ${className}`}
            onClick={() => handleSort(sortKeyName)}
        >
            <div className="flex items-center gap-1">
                {label}
                {sortKey === sortKeyName ? (
                    sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-30" />
                )}
            </div>
        </th>
    )

    return (
        <div className="mt-8">
            {/* Section header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Filter className="w-5 h-5 text-brand-500" />
                        Lead Board
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Filter by stage, origin, intention, temperature &amp; more • Sort by any column • Click a row to open</p>
                </div>
                <div className="flex items-center gap-3">
                    {activeFilters > 0 && (
                        <button
                            onClick={() => { setIntentionFilter('All'); setQualFilter('All'); setTempFilter('All'); setPlatformFilter('All'); setStageFilter('All'); setCountryFilter('All'); setTraitFilter('All'); setSearch('') }}
                            className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 transition"
                        >
                            ✕ Clear {activeFilters} filter{activeFilters > 1 ? 's' : ''}
                        </button>
                    )}
                    <span className="text-xs text-slate-400">{filteredAndSorted.length} lead{filteredAndSorted.length !== 1 ? 's' : ''}</span>
                </div>
            </div>

            {/* Filter section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-4 space-y-3">

                {/* Row 1: Intention filter */}
                <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">💬 Dating Intention</p>
                    <div className="flex flex-wrap items-center gap-2">
                        {ALL_INTENTIONS.map(intention => {
                            const isAll = intention === 'All'
                            const isActive = intentionFilter === intention
                            const cfg = isAll ? null : INTENTION_CONFIG[intention]
                            const count = isAll
                                ? activeLeads.length
                                : activeLeads.filter(l => (l.datingIntention || 'Undecided') === intention).length

                            return (
                                <button
                                    key={intention}
                                    onClick={() => setIntentionFilter(intention)}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border-2 ${isActive
                                        ? isAll
                                            ? 'border-brand-500 bg-brand-50 text-brand-700'
                                            : `${cfg?.border} ${cfg?.bg} ${cfg?.color}`
                                        : 'border-slate-200 text-slate-500 hover:border-slate-300 bg-white'
                                        }`}
                                >
                                    {!isAll && <span>{cfg?.emoji}</span>}
                                    {intention}
                                    <span className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/60' : 'bg-slate-100'}`}>
                                        {count}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100" />

                {/* Row 2: Qualification range filter */}
                <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">🧠 Personality Score Range</p>
                    <div className="flex flex-wrap items-center gap-2">
                        {QUAL_RANGES.map(range => {
                            const isActive = qualFilter === range.key
                            const isAll = range.key === 'All'
                            const count = isAll
                                ? activeLeads.length
                                : activeLeads.filter(l => {
                                    const q = l.qualificationScore || 5
                                    return q >= range.min && q <= range.max
                                }).length

                            return (
                                <button
                                    key={range.key}
                                    onClick={() => setQualFilter(range.key)}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border-2 ${isActive
                                        ? isAll
                                            ? 'border-brand-500 bg-brand-50 text-brand-700'
                                            : `${range.border} ${range.bg} ${range.color}`
                                        : 'border-slate-200 text-slate-500 hover:border-slate-300 bg-white'
                                        }`}
                                >
                                    <span>{range.emoji}</span>
                                    {range.label}
                                    <span className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/60' : 'bg-slate-100'}`}>
                                        {count}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100" />

                {/* Row 3: Temperature range filter */}
                <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">🌡️ Temperature Range</p>
                    <div className="flex flex-wrap items-center gap-2">
                        {TEMP_RANGES.map(range => {
                            const isActive = tempFilter === range.key
                            const isAll = range.key === 'All'
                            const count = isAll
                                ? activeLeads.length
                                : activeLeads.filter(l => {
                                    const pct = getTemperaturePercent(l)
                                    return pct >= range.min && pct <= range.max
                                }).length

                            return (
                                <button
                                    key={range.key}
                                    onClick={() => setTempFilter(range.key)}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border-2 ${isActive
                                        ? isAll
                                            ? 'border-brand-500 bg-brand-50 text-brand-700'
                                            : `${range.border} ${range.bg} ${range.color}`
                                        : 'border-slate-200 text-slate-500 hover:border-slate-300 bg-white'
                                        }`}
                                >
                                    <span>{range.emoji}</span>
                                    {range.label}
                                    <span className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/60' : 'bg-slate-100'}`}>
                                        {count}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100" />

                {/* Row 4: Origin Platform filter */}
                {allPlatforms.length > 0 && (
                    <>
                        <div>
                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">📍 Origin Platform</p>
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    onClick={() => setPlatformFilter('All')}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border-2 ${platformFilter === 'All' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-500 hover:border-slate-300 bg-white'}`}
                                >
                                    All
                                    <span className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full ${platformFilter === 'All' ? 'bg-white/60' : 'bg-slate-100'}`}>{activeLeads.length}</span>
                                </button>
                                {allPlatforms.map(platform => {
                                    const count = activeLeads.filter(l => l.platformOrigin === platform).length
                                    const icon = PLATFORM_ICONS[platform] || '📱'
                                    return (
                                        <button
                                            key={platform}
                                            onClick={() => setPlatformFilter(platform)}
                                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border-2 ${platformFilter === platform ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-slate-300 bg-white'}`}
                                        >
                                            {icon} {platform}
                                            <span className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full ${platformFilter === platform ? 'bg-white/60' : 'bg-slate-100'}`}>{count}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                        <div className="border-t border-slate-100" />
                    </>
                )}

                {/* Row 5: Funnel Stage filter */}
                <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">📊 Funnel Stage</p>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => setStageFilter('All')}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border-2 ${stageFilter === 'All' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-500 hover:border-slate-300 bg-white'}`}
                        >
                            All
                            <span className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full ${stageFilter === 'All' ? 'bg-white/60' : 'bg-slate-100'}`}>{activeLeads.length}</span>
                        </button>
                        {ACTIVE_STAGES.map(({ key, label }) => {
                            const count = activeLeads.filter(l => l.funnelStage === key).length
                            const stageColors: Record<string, string> = {
                                Stage1: 'border-blue-400 bg-blue-50 text-blue-700',
                                Stage2: 'border-violet-400 bg-violet-50 text-violet-700',
                                Stage3: 'border-amber-400 bg-amber-50 text-amber-700',
                                Stage4: 'border-emerald-400 bg-emerald-50 text-emerald-700',
                            }
                            return (
                                <button
                                    key={key}
                                    onClick={() => setStageFilter(key)}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border-2 ${stageFilter === key ? stageColors[key] : 'border-slate-200 text-slate-500 hover:border-slate-300 bg-white'}`}
                                >
                                    {label}
                                    <span className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full ${stageFilter === key ? 'bg-white/60' : 'bg-slate-100'}`}>{count}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100" />

                {/* Row 6: Country filter */}
                {allCountries.length > 0 && (
                    <>
                        <div>
                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">🌍 Country</p>
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    onClick={() => setCountryFilter('All')}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border-2 ${countryFilter === 'All' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-500 hover:border-slate-300 bg-white'}`}
                                >
                                    All
                                    <span className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full ${countryFilter === 'All' ? 'bg-white/60' : 'bg-slate-100'}`}>{activeLeads.length}</span>
                                </button>
                                {allCountries.map(country => {
                                    const count = activeLeads.filter(l => (l.countryOrigin || '').trim() === country).length
                                    return (
                                        <button
                                            key={country}
                                            onClick={() => setCountryFilter(country)}
                                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border-2 ${countryFilter === country ? 'border-teal-400 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-500 hover:border-slate-300 bg-white'}`}
                                        >
                                            🌍 {country}
                                            <span className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full ${countryFilter === country ? 'bg-white/60' : 'bg-slate-100'}`}>{count}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                        <div className="border-t border-slate-100" />
                    </>
                )}

                {/* Row 5: Personality Trait keyword filter */}
                {allTraits.length > 0 && (
                    <>
                        <div>
                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">💫 Personality Trait</p>
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    onClick={() => setTraitFilter('All')}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border-2 ${traitFilter === 'All' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-500 hover:border-slate-300 bg-white'}`}
                                >
                                    All
                                    <span className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full ${traitFilter === 'All' ? 'bg-white/60' : 'bg-slate-100'}`}>{activeLeads.length}</span>
                                </button>
                                {allTraits.map(trait => {
                                    const count = activeLeads.filter(l => {
                                        const traits = (l.personalityTraits || '').split(',').map(t => t.trim().toLowerCase())
                                        return traits.includes(trait.toLowerCase())
                                    }).length
                                    return (
                                        <button
                                            key={trait}
                                            onClick={() => setTraitFilter(trait)}
                                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border-2 ${traitFilter === trait ? 'border-pink-400 bg-pink-50 text-pink-700' : 'border-slate-200 text-slate-500 hover:border-slate-300 bg-white'}`}
                                        >
                                            💫 {trait}
                                            <span className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full ${traitFilter === trait ? 'bg-white/60' : 'bg-slate-100'}`}>{count}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                        <div className="border-t border-slate-100" />
                    </>
                )}

                {/* Row 6: Search */}
                <div className="relative max-w-xs">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name, platform, country..."
                        className="pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs w-full focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50/80 border-b border-slate-100">
                            <tr>
                                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-8">#</th>
                                <SortHeader label="Name" sortKeyName="name" />
                                <SortHeader label="Intention" sortKeyName="intention" />
                                <SortHeader label="Overall" sortKeyName="overall" />
                                <SortHeader label="🧠 Pers" sortKeyName="qualification" />
                                <SortHeader label="✨ Aesth" sortKeyName="aesthetics" />
                                <SortHeader label="Stage" sortKeyName="stage" />
                                <SortHeader label="🌡️ Temp" sortKeyName="temperature" />
                                <SortHeader label="📍 Origin" sortKeyName="platform" />
                                <SortHeader label="💬 Talking On" sortKeyName="commPlatform" />
                                <SortHeader label="Last Contact" sortKeyName="daysSince" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredAndSorted.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="px-4 py-8 text-center text-sm text-slate-400">
                                        No leads match your filters
                                    </td>
                                </tr>
                            ) : (
                                filteredAndSorted.map((lead, idx) => {
                                    const qual = lead.qualificationScore || 5
                                    const aes = lead.aestheticsScore || 5
                                    const overall = (qual + aes) / 2
                                    const daysSince = getDaysSince(lead.lastInteractionDate || lead.createdAt)
                                    const intention = lead.datingIntention || 'Undecided'
                                    const intentionCfg = INTENTION_CONFIG[intention]
                                    const platformIcon = PLATFORM_ICONS[lead.platformOrigin] || '📱'
                                    const commPlatforms = lead.communicationPlatform?.length ? lead.communicationPlatform : [lead.platformOrigin]
                                    const commPlatformIcons = commPlatforms.map(p => PLATFORM_ICONS[p] || '📱')

                                    return (
                                        <tr
                                            key={lead.id}
                                            onClick={() => onSelectLead(lead)}
                                            className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                                        >
                                            <td className="px-3 py-3 text-slate-400 text-xs">{idx + 1}</td>
                                            <td className="px-3 py-3">
                                                <div className="flex items-center gap-2.5">
                                                    {lead.profilePhotoUrl ? (
                                                        <img
                                                            src={lead.profilePhotoUrl}
                                                            alt={lead.name}
                                                            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-semibold text-xs">
                                                            {lead.name.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-semibold text-slate-900 text-sm">{lead.name}</p>
                                                        {lead.countryOrigin && (
                                                            <p className="text-[11px] text-slate-400">{lead.countryOrigin}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${intentionCfg.bg} ${intentionCfg.color}`}>
                                                    {intentionCfg.emoji} {intention}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3">
                                                <span className="font-bold text-brand-600">{overall.toFixed(1)}</span>
                                            </td>
                                            <td className="px-3 py-3 text-slate-600">{qual}</td>
                                            <td className="px-3 py-3 text-slate-600">{aes}</td>
                                            <td className="px-3 py-3">
                                                <span className="text-xs font-medium text-slate-600">
                                                    {FUNNEL_STAGE_NAMES[lead.funnelStage] || lead.funnelStage}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3">
                                                {(() => {
                                                    const pct = getTemperaturePercent(lead)
                                                    const color = pct >= 70 ? 'text-red-500' : pct >= 35 ? 'text-amber-500' : 'text-blue-500'
                                                    const emoji = pct >= 70 ? '🔥' : pct >= 35 ? '🌡️' : '❄️'
                                                    return (
                                                        <span className={`text-xs font-bold ${color}`}>
                                                            {emoji} {pct}%
                                                        </span>
                                                    )
                                                })()}
                                            </td>
                                            <td className="px-3 py-3 text-slate-600 whitespace-nowrap">
                                                {platformIcon} {lead.platformOrigin}
                                            </td>
                                            <td className="px-3 py-3 text-slate-600 whitespace-nowrap">
                                                {commPlatforms.map((p, i) => (
                                                    <span key={p}>{i > 0 ? ', ' : ''}{commPlatformIcons[i]} {p}</span>
                                                ))}
                                            </td>
                                            <td className="px-3 py-3">
                                                <span className={`text-xs font-medium ${daysSince > 7 ? 'text-red-500' : daysSince > 3 ? 'text-amber-500' : 'text-emerald-500'
                                                    }`}>
                                                    {daysSince === 0 ? 'Today' : `${daysSince}d ago`}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
