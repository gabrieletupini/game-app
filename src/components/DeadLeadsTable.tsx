import { Skull, RotateCcw, Trash2 } from 'lucide-react'
import { useGameStore } from '../store/useGameStore'
import { LeadCardCompact } from './LeadCard'
import type { Lead } from '../types'

interface DeadLeadsTableProps {
    onSelectLead: (lead: Lead) => void
}

export default function DeadLeadsTable({ onSelectLead }: DeadLeadsTableProps) {
    const leads = useGameStore(state => state.leads)
    const moveLeadToStage = useGameStore(state => state.moveLeadToStage)
    const deleteLead = useGameStore(state => state.deleteLead)
    const addToast = useGameStore(state => state.addToast)

    const deadLeads = leads
        .filter(l => l.funnelStage === 'Dead')
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

    const handleRevive = (lead: Lead, e: React.MouseEvent) => {
        e.stopPropagation()
        moveLeadToStage(lead.id, 'Stage1')
        addToast({
            type: 'success',
            title: 'Lead Revived!',
            message: `${lead.name} moved back to Stage 1`,
            duration: 2000,
        })
    }

    const handlePermanentDelete = (lead: Lead, e: React.MouseEvent) => {
        e.stopPropagation()
        deleteLead(lead.id)
    }

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                    <Skull className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Dead Leads</h2>
                    <p className="text-sm text-slate-500">{deadLeads.length} archived {deadLeads.length === 1 ? 'lead' : 'leads'}</p>
                </div>
            </div>

            {deadLeads.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Skull className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="font-semibold text-slate-700">No dead leads</h3>
                    <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                        Leads that go cold will appear here when you archive them.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {deadLeads.map(lead => (
                        <div key={lead.id} className="relative group opacity-75 hover:opacity-100 transition-opacity">
                            <LeadCardCompact lead={lead} onClick={onSelectLead} />
                            {/* Quick actions overlay */}
                            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => handleRevive(lead, e)}
                                    title="Revive lead"
                                    className="p-1.5 bg-white rounded-lg shadow-md border border-slate-200 text-slate-500 hover:text-emerald-600 transition"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={(e) => handlePermanentDelete(lead, e)}
                                    title="Delete permanently"
                                    className="p-1.5 bg-white rounded-lg shadow-md border border-slate-200 text-slate-500 hover:text-red-600 transition"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
