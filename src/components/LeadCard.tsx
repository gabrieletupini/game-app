import { useState, useRef, useEffect } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Lead, FunnelStage } from '../types'
import { PLATFORM_ICONS, INTENTION_CONFIG, FUNNEL_STAGE_NAMES } from '../utils/constants'
import { getDaysSince } from '../utils/dateHelpers'
import { useGameStore } from '../store/useGameStore'
import { getTemperaturePercent } from './TemperatureBoard'

interface LeadCardProps {
    lead: Lead
    onClick?: (lead: Lead) => void
    isDragOverlay?: boolean
}

function getTemperatureClass(temp: string) {
    switch (temp) {
        case 'Hot': return 'temp-hot'
        case 'Warm': return 'temp-warm'
        default: return 'temp-cold'
    }
}

function getTemperatureEmoji(temp: string) {
    switch (temp) {
        case 'Hot': return '🔥'
        case 'Warm': return '🌡️'
        default: return '❄️'
    }
}

function getAccentColor(temp: string) {
    switch (temp) {
        case 'Hot': return 'bg-red-400'
        case 'Warm': return 'bg-amber-400'
        default: return 'bg-blue-400'
    }
}

function ScoreLabel({ score }: { score: number }) {
    const color = score >= 8 ? 'text-emerald-600' : score >= 5 ? 'text-amber-600' : 'text-red-500'
    return (
        <span className={`text-xs font-bold ${color}`}>
            {score}<span className="text-slate-400 font-medium">/10</span>
        </span>
    )
}

export default function LeadCard({ lead, onClick, isDragOverlay }: LeadCardProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: lead.id,
        data: { lead },
    })
    const moveLeadToStage = useGameStore(state => state.moveLeadToStage)
    const addToast = useGameStore(state => state.addToast)

    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
    const menuRef = useRef<HTMLDivElement>(null)

    // Close context menu on click outside
    useEffect(() => {
        if (!contextMenu) return
        const handleClick = () => setContextMenu(null)
        document.addEventListener('click', handleClick)
        return () => document.removeEventListener('click', handleClick)
    }, [contextMenu])

    const handleContextMenu = (e: React.MouseEvent) => {
        if (isDragOverlay) return
        e.preventDefault()
        e.stopPropagation()
        setContextMenu({ x: e.clientX, y: e.clientY })
    }

    const handleMoveTo = (stage: FunnelStage) => {
        if (lead.funnelStage === stage) return
        moveLeadToStage(lead.id, stage)
        setContextMenu(null)
        if (stage === 'Lover') {
            addToast({ type: 'success', title: '❤️ New Lover!', message: `${lead.name} promoted to Lover`, duration: 3000 })
        } else if (stage === 'Dead') {
            addToast({ type: 'info', title: '🧊 Lead Archived', message: `${lead.name} moved to Cold Leads`, duration: 3000 })
        } else {
            addToast({ type: 'info', title: 'Lead Moved', message: `${lead.name} moved to ${FUNNEL_STAGE_NAMES[stage]}`, duration: 2000 })
        }
    }

    const CONTEXT_MENU_ITEMS: { stage: FunnelStage; label: string; emoji: string; color: string }[] = [
        { stage: 'Stage1', label: FUNNEL_STAGE_NAMES.Stage1, emoji: '1️⃣', color: 'hover:bg-blue-50 hover:text-blue-700' },
        { stage: 'Stage2', label: FUNNEL_STAGE_NAMES.Stage2, emoji: '2️⃣', color: 'hover:bg-violet-50 hover:text-violet-700' },
        { stage: 'Stage3', label: FUNNEL_STAGE_NAMES.Stage3, emoji: '3️⃣', color: 'hover:bg-amber-50 hover:text-amber-700' },
        { stage: 'Stage4', label: FUNNEL_STAGE_NAMES.Stage4, emoji: '4️⃣', color: 'hover:bg-emerald-50 hover:text-emerald-700' },
        { stage: 'Lover', label: 'Lover', emoji: '❤️', color: 'hover:bg-pink-50 hover:text-pink-700' },
        { stage: 'Dead', label: 'Cold Leads', emoji: '🧊', color: 'hover:bg-blue-50 hover:text-blue-700' },
    ]

    const style = transform
        ? { transform: CSS.Translate.toString(transform) }
        : undefined

    const daysSince = lead.lastInteractionDate
        ? getDaysSince(lead.lastInteractionDate)
        : getDaysSince(lead.createdAt)

    const platformIcon = PLATFORM_ICONS[lead.platformOrigin] || '📱'
    const commPlatforms = lead.communicationPlatform?.length ? lead.communicationPlatform : [lead.platformOrigin]

    return (
        <div
            ref={isDragOverlay ? undefined : setNodeRef}
            style={isDragOverlay ? undefined : style}
            {...(isDragOverlay ? {} : listeners)}
            {...(isDragOverlay ? {} : attributes)}
            onClick={(e) => {
                e.stopPropagation()
                onClick?.(lead)
            }}
            onContextMenu={handleContextMenu}
            className={`
        relative bg-white rounded-xl border border-slate-200 p-3 cursor-grab active:cursor-grabbing
        lead-card-hover select-none overflow-hidden group
        ${isDragging ? 'opacity-40 shadow-none' : 'shadow-sm'}
        ${isDragOverlay ? 'drag-overlay' : ''}
      `}
        >
            {/* Right-click context menu */}
            {contextMenu && (
                <div
                    ref={menuRef}
                    className="fixed z-[9999] bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 min-w-[200px] animate-fade-in"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={e => e.stopPropagation()}
                >
                    <p className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Move to…</p>
                    {CONTEXT_MENU_ITEMS.filter(item => item.stage !== lead.funnelStage).map(item => (
                        <button
                            key={item.stage}
                            onClick={(e) => { e.stopPropagation(); handleMoveTo(item.stage) }}
                            className={`w-full text-left px-3 py-2 text-sm font-medium text-slate-700 flex items-center gap-2 transition-colors ${item.color}`}
                        >
                            <span>{item.emoji}</span>
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
            {/* Temperature accent bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${getAccentColor(lead.temperature)} rounded-l-xl`} />

            <div className="flex items-start gap-3 pl-2">
                {/* Avatar */}
                <div className="flex-shrink-0">
                    {lead.profilePhotoUrl ? (
                        <img
                            src={lead.profilePhotoUrl}
                            alt={lead.name}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shadow">
                            {lead.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-slate-900 truncate">{lead.name}</h4>
                        {lead.instagramUrl && (
                            <a
                                href={lead.instagramUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="flex-shrink-0 text-pink-400 hover:text-pink-600 transition"
                                title="Instagram profile"
                            >
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                            </a>
                        )}
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${getTemperatureClass(lead.temperature)}`}>
                            {getTemperatureEmoji(lead.temperature)} {getTemperaturePercent(lead)}%
                        </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500" title={`Origin: ${lead.platformOrigin}`}>
                            📍{platformIcon}
                        </span>
                        {!(commPlatforms.length === 1 && commPlatforms[0] === lead.platformOrigin) && (
                            <span className="text-xs text-slate-500" title={`Talking on: ${commPlatforms.join(', ')}`}>
                                💬{commPlatforms.map(p => PLATFORM_ICONS[p] || '📱').join('')}
                            </span>
                        )}
                        <span className="text-xs text-slate-500">
                            {lead.platformOrigin}{!(commPlatforms.length === 1 && commPlatforms[0] === lead.platformOrigin) ? ` → ${commPlatforms.join(', ')}` : ''}
                        </span>
                        {lead.countryOrigin && (
                            <span className="text-xs text-slate-400">• {lead.countryOrigin}</span>
                        )}
                    </div>

                    {lead.datingIntention && lead.datingIntention !== 'Undecided' && (
                        <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-1 ${INTENTION_CONFIG[lead.datingIntention]?.bg || ''} ${INTENTION_CONFIG[lead.datingIntention]?.color || ''}`}>
                            {INTENTION_CONFIG[lead.datingIntention]?.emoji} {lead.datingIntention}
                        </span>
                    )}

                    <div className="flex items-center justify-between mt-2">
                        <ScoreLabel score={Math.round(((lead.qualificationScore || 5) + (lead.aestheticsScore || 5)) / 2)} />
                        <span className={`text-[10px] font-medium ${daysSince > 7 ? 'text-red-500' : daysSince > 3 ? 'text-amber-500' : 'text-emerald-500'
                            }`}>
                            {daysSince === 0 ? 'Today' : `${daysSince}d ago`}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Minimal version for tables
export function LeadCardCompact({ lead, onClick }: { lead: Lead; onClick?: (lead: Lead) => void }) {
    const daysSince = lead.lastInteractionDate
        ? getDaysSince(lead.lastInteractionDate)
        : getDaysSince(lead.createdAt)

    const platformIcon = PLATFORM_ICONS[lead.platformOrigin] || '📱'
    const commPlatforms = lead.communicationPlatform?.length ? lead.communicationPlatform : [lead.platformOrigin]

    return (
        <div
            onClick={() => onClick?.(lead)}
            className="bg-white rounded-xl border border-slate-200 p-4 cursor-pointer lead-card-hover shadow-sm"
        >
            <div className="flex items-start gap-3">
                {lead.profilePhotoUrl ? (
                    <img
                        src={lead.profilePhotoUrl}
                        alt={lead.name}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow"
                    />
                ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow">
                        {lead.name.charAt(0).toUpperCase()}
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-900 truncate">{lead.name}</h4>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getTemperatureClass(lead.temperature)}`}>
                            {getTemperatureEmoji(lead.temperature)} {getTemperaturePercent(lead)}%
                        </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">
                        📍{platformIcon} {lead.platformOrigin}
                        {!(commPlatforms.length === 1 && commPlatforms[0] === lead.platformOrigin) && ` → 💬 ${commPlatforms.join(', ')}`}
                        {lead.countryOrigin && ` • ${lead.countryOrigin}`}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                        <ScoreLabel score={Math.round(((lead.qualificationScore || 5) + (lead.aestheticsScore || 5)) / 2)} />
                        <span className={`text-xs font-medium ${daysSince > 7 ? 'text-red-500' : daysSince > 3 ? 'text-amber-500' : 'text-emerald-500'
                            }`}>
                            {daysSince === 0 ? 'Today' : `${daysSince}d ago`}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
