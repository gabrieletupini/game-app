import { useState } from 'react'
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
    closestCenter,
} from '@dnd-kit/core'
import { useGameStore } from '../store/useGameStore'
import type { Lead, FunnelStage } from '../types'
import StageColumn, { DeadDropZone, LoverDropZone } from './StageColumn'
import LeadCard from './LeadCard'

const ACTIVE_STAGES: FunnelStage[] = ['Stage1', 'Stage2', 'Stage3', 'Stage4']

interface KanbanBoardProps {
    onSelectLead: (lead: Lead) => void
}

export default function KanbanBoard({ onSelectLead }: KanbanBoardProps) {
    const leads = useGameStore(state => state.leads)
    const moveLeadToStage = useGameStore(state => state.moveLeadToStage)
    const addToast = useGameStore(state => state.addToast)

    const [activeLead, setActiveLead] = useState<Lead | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    )

    const handleDragStart = (event: DragStartEvent) => {
        const lead = leads.find(l => l.id === event.active.id)
        setActiveLead(lead || null)
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (!over) {
            setActiveLead(null)
            return
        }

        const leadId = active.id as string
        const targetId = over.id as string
        const lead = leads.find(l => l.id === leadId)

        if (!lead) {
            setActiveLead(null)
            return
        }

        const validTargets = [...ACTIVE_STAGES, 'Dead', 'Lover'] as string[]

        if (validTargets.includes(targetId) && lead.funnelStage !== targetId) {
            moveLeadToStage(leadId, targetId as FunnelStage)

            if (targetId === 'Lover') {
                addToast({
                    type: 'success',
                    title: '❤️ New Lover!',
                    message: `${lead.name} has been promoted to Lover`,
                    duration: 3000,
                })
            } else if (targetId === 'Dead') {
                addToast({
                    type: 'info',
                    title: '💀 Lead Archived',
                    message: `${lead.name} moved to Dead Leads`,
                    duration: 3000,
                })
            }
        }

        setActiveLead(null)
    }

    const handleDragCancel = () => {
        setActiveLead(null)
    }

    // Group leads by stage
    const leadsByStage = ACTIVE_STAGES.reduce((acc, stage) => {
        acc[stage] = leads.filter(l => l.funnelStage === stage)
        return acc
    }, {} as Record<FunnelStage, Lead[]>)

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            {/* Kanban Columns */}
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x">
                {ACTIVE_STAGES.map(stage => (
                    <StageColumn
                        key={stage}
                        stage={stage}
                        leads={leadsByStage[stage]}
                        onSelectLead={onSelectLead}
                    />
                ))}
            </div>

            {/* Drop zones - visible during drag */}
            {activeLead && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-slide-up">
                    <LoverDropZone />
                    <DeadDropZone />
                </div>
            )}

            {/* Drag Overlay */}
            <DragOverlay dropAnimation={null}>
                {activeLead && (
                    <div className="w-[280px]">
                        <LeadCard lead={activeLead} isDragOverlay />
                    </div>
                )}
            </DragOverlay>
        </DndContext>
    )
}
