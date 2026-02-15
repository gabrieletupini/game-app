import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Lead } from '../types'
import { PLATFORM_ICONS, INTENTION_CONFIG } from '../utils/constants'
import { getDaysSince } from '../utils/dateHelpers'

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

function ScoreDots({ score }: { score: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: 10 }, (_, i) => (
                <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full ${i < score ? 'bg-brand-500' : 'bg-slate-200'
                        }`}
                />
            ))}
        </div>
    )
}

export default function LeadCard({ lead, onClick, isDragOverlay }: LeadCardProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: lead.id,
        data: { lead },
    })

    const style = transform
        ? { transform: CSS.Translate.toString(transform) }
        : undefined

    const daysSince = lead.lastInteractionDate
        ? getDaysSince(lead.lastInteractionDate)
        : getDaysSince(lead.createdAt)

    const platformIcon = PLATFORM_ICONS[lead.platformOrigin] || '📱'

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
            className={`
        relative bg-white rounded-xl border border-slate-200 p-3 cursor-grab active:cursor-grabbing
        lead-card-hover select-none overflow-hidden group
        ${isDragging ? 'opacity-40 shadow-none' : 'shadow-sm'}
        ${isDragOverlay ? 'drag-overlay' : ''}
      `}
        >
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
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shadow">
                            {lead.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-slate-900 truncate">{lead.name}</h4>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${getTemperatureClass(lead.temperature)}`}>
                            {getTemperatureEmoji(lead.temperature)}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500">
                            {platformIcon} {lead.platformOrigin}
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
                        <ScoreDots score={Math.round(((lead.qualificationScore || 5) + (lead.aestheticsScore || 5)) / 2)} />
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
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow">
                        {lead.name.charAt(0).toUpperCase()}
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-900 truncate">{lead.name}</h4>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getTemperatureClass(lead.temperature)}`}>
                            {getTemperatureEmoji(lead.temperature)} {lead.temperature}
                        </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {platformIcon} {lead.platformOrigin}
                        {lead.countryOrigin && ` • ${lead.countryOrigin}`}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                        <ScoreDots score={Math.round(((lead.qualificationScore || 5) + (lead.aestheticsScore || 5)) / 2)} />
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
