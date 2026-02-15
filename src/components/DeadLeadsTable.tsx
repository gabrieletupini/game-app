import { useState } from 'react'
import { Skull, RotateCcw, Trash2, MessageSquare, Check, X } from 'lucide-react'
import { useGameStore } from '../store/useGameStore'
import { FUNNEL_STAGE_NAMES } from '../utils/constants'
import type { Lead } from '../types'

interface DeadLeadsTableProps {
    onSelectLead: (lead: Lead) => void
}

export default function DeadLeadsTable({ onSelectLead }: DeadLeadsTableProps) {
    const leads = useGameStore(state => state.leads)
    const moveLeadToStage = useGameStore(state => state.moveLeadToStage)
    const updateLead = useGameStore(state => state.updateLead)
    const deleteLead = useGameStore(state => state.deleteLead)
    const addToast = useGameStore(state => state.addToast)

    const [editingNotesId, setEditingNotesId] = useState<string | null>(null)
    const [notesValue, setNotesValue] = useState('')

    const deadLeads = leads
        .filter(l => l.funnelStage === 'Dead')
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

    const handleRevive = (lead: Lead, e: React.MouseEvent) => {
        e.stopPropagation()
        // Revive to the stage it died from, or Stage1 if unknown
        const targetStage = lead.deadFromStage && lead.deadFromStage !== 'Dead' ? lead.deadFromStage : 'Stage1'
        moveLeadToStage(lead.id, targetStage)
        addToast({
            type: 'success',
            title: 'Lead Revived!',
            message: `${lead.name} moved back to ${FUNNEL_STAGE_NAMES[targetStage] || targetStage}`,
            duration: 2000,
        })
    }

    const handlePermanentDelete = (lead: Lead, e: React.MouseEvent) => {
        e.stopPropagation()
        deleteLead(lead.id)
    }

    const startEditNotes = (lead: Lead, e: React.MouseEvent) => {
        e.stopPropagation()
        setEditingNotesId(lead.id)
        setNotesValue(lead.deadNotes || '')
    }

    const saveNotes = (leadId: string) => {
        updateLead(leadId, { deadNotes: notesValue.trim() || undefined } as any)
        setEditingNotesId(null)
        setNotesValue('')
        addToast({ type: 'success', title: 'Notes Saved', message: 'Dead lead notes updated', duration: 1500 })
    }

    const cancelEditNotes = () => {
        setEditingNotesId(null)
        setNotesValue('')
    }

    function getStageColor(stage?: string) {
        switch (stage) {
            case 'Stage1': return 'bg-blue-100 text-blue-700 border-blue-200'
            case 'Stage2': return 'bg-violet-100 text-violet-700 border-violet-200'
            case 'Stage3': return 'bg-amber-100 text-amber-700 border-amber-200'
            case 'Stage4': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
            case 'Lover': return 'bg-pink-100 text-pink-700 border-pink-200'
            default: return 'bg-slate-100 text-slate-600 border-slate-200'
        }
    }

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                    <Skull className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Dead Leads</h2>
                    <p className="text-sm text-slate-500">{deadLeads.length} archived {deadLeads.length === 1 ? 'lead' : 'leads'} • Right-click any card in the funnel to send here</p>
                </div>
            </div>

            {deadLeads.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Skull className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="font-semibold text-slate-700">No dead leads</h3>
                    <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                        Right-click any card in the kanban, or drag it to the Dead zone to archive it.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {deadLeads.map(lead => (
                        <div key={lead.id} className="relative group">
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
                                {/* Top section: lead card + stage badge */}
                                <div className="p-4 pb-2">
                                    <div className="flex items-start gap-3">
                                        {/* Avatar */}
                                        {lead.profilePhotoUrl ? (
                                            <img src={lead.profilePhotoUrl} alt={lead.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow flex-shrink-0" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-white font-bold text-lg shadow flex-shrink-0">
                                                {lead.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="font-semibold text-slate-900 truncate cursor-pointer hover:text-brand-600 transition" onClick={() => onSelectLead(lead)}>
                                                    {lead.name}
                                                </h4>
                                                {lead.deadFromStage && (
                                                    <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStageColor(lead.deadFromStage)}`}>
                                                        ☠️ Died in {FUNNEL_STAGE_NAMES[lead.deadFromStage] || lead.deadFromStage}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-500 mt-0.5">
                                                📍 {lead.platformOrigin}
                                                {lead.communicationPlatform && lead.communicationPlatform !== lead.platformOrigin && ` → 💬 ${lead.communicationPlatform}`}
                                                {lead.countryOrigin ? ` • ${lead.countryOrigin}` : ''}
                                            </p>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex gap-1 flex-shrink-0">
                                            <button
                                                onClick={(e) => startEditNotes(lead, e)}
                                                title="Add/edit notes"
                                                className="p-1.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-400 hover:text-amber-600 hover:border-amber-300 transition"
                                            >
                                                <MessageSquare className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={(e) => handleRevive(lead, e)}
                                                title={`Revive to ${lead.deadFromStage ? FUNNEL_STAGE_NAMES[lead.deadFromStage] || 'Stage 1' : 'Stage 1'}`}
                                                className="p-1.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-300 transition"
                                            >
                                                <RotateCcw className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={(e) => handlePermanentDelete(lead, e)}
                                                title="Delete permanently"
                                                className="p-1.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-300 transition"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Notes section */}
                                {editingNotesId === lead.id ? (
                                    <div className="px-4 pb-4">
                                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                                            <textarea
                                                value={notesValue}
                                                onChange={e => setNotesValue(e.target.value)}
                                                placeholder="Why did this lead go dead? Write your notes here..."
                                                rows={3}
                                                autoFocus
                                                className="w-full text-sm bg-transparent border-none outline-none resize-none text-slate-700 placeholder-slate-400"
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter' && e.metaKey) saveNotes(lead.id)
                                                    if (e.key === 'Escape') cancelEditNotes()
                                                }}
                                            />
                                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200">
                                                <span className="text-[10px] text-slate-400">⌘ Enter to save • Esc to cancel</span>
                                                <div className="flex gap-1.5">
                                                    <button onClick={cancelEditNotes} className="p-1 text-slate-400 hover:text-slate-600 transition"><X className="w-4 h-4" /></button>
                                                    <button onClick={() => saveNotes(lead.id)} className="p-1 text-emerald-500 hover:text-emerald-700 transition"><Check className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : lead.deadNotes ? (
                                    <div className="px-4 pb-4 cursor-pointer" onClick={(e) => startEditNotes(lead, e)}>
                                        <div className="bg-amber-50/60 rounded-xl px-3 py-2 border border-amber-100">
                                            <p className="text-xs text-amber-800/80 line-clamp-2">📝 {lead.deadNotes}</p>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
