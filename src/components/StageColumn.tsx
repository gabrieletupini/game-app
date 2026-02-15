import { useDroppable } from '@dnd-kit/core'
import type { Lead, FunnelStage } from '../types'
import LeadCard from './LeadCard'

interface StageColumnProps {
    stage: FunnelStage
    leads: Lead[]
    onSelectLead: (lead: Lead) => void
}

const stageConfig: Record<string, { label: string; color: string; bgColor: string; borderColor: string; emoji: string }> = {
    Stage1: {
        label: 'Initial Contact',
        color: 'text-blue-700',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        emoji: '👋',
    },
    Stage2: {
        label: 'Qualified Interest',
        color: 'text-emerald-700',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        emoji: '💬',
    },
    Stage3: {
        label: 'Real-World',
        color: 'text-amber-700',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        emoji: '☕',
    },
    Stage4: {
        label: 'Connection',
        color: 'text-purple-700',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        emoji: '💜',
    },
}

export default function StageColumn({ stage, leads, onSelectLead }: StageColumnProps) {
    const { setNodeRef, isOver } = useDroppable({ id: stage })
    const config = stageConfig[stage] || stageConfig.Stage1

    const sortedLeads = [...leads].sort(
        (a, b) => (b.qualificationScore || 5) - (a.qualificationScore || 5)
    )

    return (
        <div
            ref={setNodeRef}
            className={`
        flex-1 min-w-[260px] max-w-[340px] rounded-2xl border-2 border-dashed
        transition-all duration-200 stage-column flex flex-col
        ${isOver ? 'drop-target-active' : `bg-slate-50/50 ${config.borderColor}`}
      `}
        >
            {/* Header */}
            <div className={`px-4 py-3 rounded-t-xl ${config.bgColor}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">{config.emoji}</span>
                        <h3 className={`text-sm font-bold ${config.color}`}>{config.label}</h3>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full bg-white/80 ${config.color}`}>
                        {leads.length}
                    </span>
                </div>
            </div>

            {/* Cards */}
            <div className="flex-1 p-3 space-y-2.5 overflow-y-auto">
                {sortedLeads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                        <p className="text-sm">No leads yet</p>
                        <p className="text-xs mt-1">Drag cards here</p>
                    </div>
                ) : (
                    sortedLeads.map(lead => (
                        <LeadCard key={lead.id} lead={lead} onClick={onSelectLead} />
                    ))
                )}
            </div>
        </div>
    )
}

// Special "Cold Leads" drop zone that appears during drag
export function DeadDropZone() {
    const { setNodeRef, isOver } = useDroppable({ id: 'Dead' })

    return (
        <div
            ref={setNodeRef}
            className={`
        mt-4 p-4 rounded-2xl border-2 border-dashed transition-all duration-200 text-center
        ${isOver
                    ? 'border-blue-400 bg-blue-50 dead-zone-pulse'
                    : 'border-slate-300 bg-slate-50 hover:border-slate-400'
                }
      `}
        >
            <div className="flex items-center justify-center gap-2">
                <span className="text-xl">🧊</span>
                <span className={`text-sm font-semibold ${isOver ? 'text-blue-600' : 'text-slate-500'}`}>
                    Drop here to move to Cold Leads
                </span>
            </div>
        </div>
    )
}

// Special "Lover" drop zone
export function LoverDropZone() {
    const { setNodeRef, isOver } = useDroppable({ id: 'Lover' })

    return (
        <div
            ref={setNodeRef}
            className={`
        mt-4 p-4 rounded-2xl border-2 border-dashed transition-all duration-200 text-center
        ${isOver
                    ? 'border-rose-400 bg-rose-50'
                    : 'border-slate-300 bg-slate-50 hover:border-slate-400'
                }
      `}
        >
            <div className="flex items-center justify-center gap-2">
                <span className="text-xl">❤️</span>
                <span className={`text-sm font-semibold ${isOver ? 'text-rose-600' : 'text-slate-500'}`}>
                    Drop here to promote to Lover
                </span>
            </div>
        </div>
    )
}
