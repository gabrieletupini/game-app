import { Heart, RotateCcw, Skull } from 'lucide-react'
import { useGameStore } from '../store/useGameStore'
import { LeadCardCompact } from './LeadCard'
import type { Lead } from '../types'

interface LoversTableProps {
    onSelectLead: (lead: Lead) => void
}

export default function LoversTable({ onSelectLead }: LoversTableProps) {
    const leads = useGameStore(state => state.leads)
    const moveLeadToStage = useGameStore(state => state.moveLeadToStage)
    const addToast = useGameStore(state => state.addToast)

    const lovers = leads
        .filter(l => l.funnelStage === 'Lover')
        .sort((a, b) => (b.qualificationScore || 5) - (a.qualificationScore || 5))

    const handleMoveBack = (lead: Lead, e: React.MouseEvent) => {
        e.stopPropagation()
        moveLeadToStage(lead.id, 'Stage4')
        addToast({
            type: 'info',
            title: 'Moved Back',
            message: `${lead.name} moved back to Stage 4`,
            duration: 2000,
        })
    }

    const handleMoveToDead = (lead: Lead, e: React.MouseEvent) => {
        e.stopPropagation()
        moveLeadToStage(lead.id, 'Dead')
        addToast({
            type: 'info',
            title: '🧊 Lead Archived',
            message: `${lead.name} moved to Cold Leads`,
            duration: 2000,
        })
    }

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                    <Heart className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Lovers</h2>
                    <p className="text-sm text-slate-500">{lovers.length} {lovers.length === 1 ? 'person' : 'people'} in your inner circle</p>
                </div>
            </div>

            {lovers.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                    <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Heart className="w-8 h-8 text-rose-400" />
                    </div>
                    <h3 className="font-semibold text-slate-700">No lovers yet</h3>
                    <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                        When you promote a lead to Lover status from Stage 4, they&apos;ll appear here.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lovers.map(lead => (
                        <div key={lead.id} className="relative group">
                            <LeadCardCompact lead={lead} onClick={onSelectLead} />
                            {/* Quick actions overlay */}
                            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => handleMoveBack(lead, e)}
                                    title="Move back to funnel"
                                    className="p-1.5 bg-white rounded-lg shadow-md border border-slate-200 text-slate-500 hover:text-brand-600 transition"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={(e) => handleMoveToDead(lead, e)}
                                    title="Move to cold leads"
                                    className="p-1.5 bg-white rounded-lg shadow-md border border-slate-200 text-slate-500 hover:text-red-600 transition"
                                >
                                    <Skull className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
