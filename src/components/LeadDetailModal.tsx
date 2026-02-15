import { useState, useCallback, useRef } from 'react'
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import {
    X,
    Edit3,
    Trash2,
    ArrowRight,
    MessageCircle,
    Phone,
    Coffee,
    Users,
    FileText,
    Heart,
    Skull,
    Save,
    Clock,
    Upload,
} from 'lucide-react'
import { useGameStore } from '../store/useGameStore'
import type { Lead, FunnelStage, DatingIntention, InteractionType, InteractionDirection, PlatformOrigin } from '../types'
import { PLATFORM_ICONS, FUNNEL_STAGE_NAMES, INTENTION_CONFIG } from '../utils/constants'
import { getDaysSince, formatDate } from '../utils/dateHelpers'

interface LeadDetailModalProps {
    lead: Lead
    onClose: () => void
}

const STAGES: FunnelStage[] = ['Stage1', 'Stage2', 'Stage3', 'Stage4', 'Lover', 'Dead']

const ALL_PLATFORMS: PlatformOrigin[] = ['Tinder', 'Bumble', 'Hinge', 'Instagram', 'Facebook', 'WhatsApp', 'Offline', 'Other']

const interactionTypeIcons: Record<InteractionType, React.ElementType> = {
    Message: MessageCircle,
    Call: Phone,
    Date: Coffee,
    Meeting: Users,
    Other: FileText,
}

export default function LeadDetailModal({ lead, onClose }: LeadDetailModalProps) {
    const {
        updateLead,
        deleteLead,
        moveLeadToStage,
        addInteraction,
        getInteractionsByLeadId,
        addToast,
    } = useGameStore()

    const interactions = getInteractionsByLeadId(lead.id)
    const [isEditing, setIsEditing] = useState(false)
    const [activeSection, setActiveSection] = useState<'details' | 'interactions'>('details')
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    // Photo editing
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [editPhoto, setEditPhoto] = useState<string | null>(null) // null = unchanged

    const processImageFile = useCallback((file: File) => {
        if (!file.type.startsWith('image/')) return
        if (file.size > 5 * 1024 * 1024) return
        const reader = new FileReader()
        reader.onload = () => {
            const base64 = reader.result as string
            setEditPhoto(base64)
        }
        reader.readAsDataURL(file)
    }, [])

    const handlePaste = useCallback((e: React.ClipboardEvent) => {
        if (!isEditing) return
        const items = e.clipboardData?.items
        if (!items) return
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                e.preventDefault()
                const file = item.getAsFile()
                if (file) processImageFile(file)
                return
            }
        }
    }, [isEditing, processImageFile])

    // Edit form state
    const [editForm, setEditForm] = useState({
        name: lead.name,
        platformOrigin: lead.platformOrigin as PlatformOrigin,
        communicationPlatform: (lead.communicationPlatform?.length ? lead.communicationPlatform : [lead.platformOrigin]) as PlatformOrigin[],
        countryOrigin: lead.countryOrigin || '',
        personalityTraits: lead.personalityTraits || '',
        notes: lead.notes || '',
        qualificationScore: lead.qualificationScore || 5,
        aestheticsScore: lead.aestheticsScore || 5,
        datingIntention: (lead.datingIntention || 'Undecided') as DatingIntention,
        originDetails: lead.originDetails || '',
    })

    // New interaction state
    const [newInteraction, setNewInteraction] = useState({
        type: 'Message' as InteractionType,
        direction: 'Outgoing' as InteractionDirection,
        notes: '',
    })

    const daysSince = lead.lastInteractionDate
        ? getDaysSince(lead.lastInteractionDate)
        : getDaysSince(lead.createdAt)

    const handleSaveEdit = () => {
        updateLead(lead.id, {
            name: editForm.name.trim(),
            profilePhotoUrl: editPhoto !== null ? editPhoto : undefined, // only update if changed
            platformOrigin: editForm.platformOrigin,
            communicationPlatform: editForm.communicationPlatform,
            countryOrigin: editForm.countryOrigin.trim() || undefined,
            personalityTraits: editForm.personalityTraits.trim() || undefined,
            notes: editForm.notes.trim() || undefined,
            qualificationScore: editForm.qualificationScore,
            aestheticsScore: editForm.aestheticsScore,
            datingIntention: editForm.datingIntention,
            originDetails: editForm.originDetails.trim() || undefined,
        })
        setIsEditing(false)
        setEditPhoto(null)
        addToast({ type: 'success', title: 'Lead Updated', message: `${editForm.name} has been updated`, duration: 2000 })
    }

    const handleDelete = () => {
        deleteLead(lead.id)
        onClose()
    }

    const handleStageChange = (stage: FunnelStage) => {
        moveLeadToStage(lead.id, stage)
        if (stage === 'Lover') {
            addToast({ type: 'success', title: '❤️ New Lover!', message: `${lead.name} promoted to Lover`, duration: 3000 })
        }
        onClose()
    }

    const handleAddInteraction = (e: React.FormEvent) => {
        e.preventDefault()
        addInteraction({
            leadId: lead.id,
            type: newInteraction.type,
            direction: newInteraction.direction,
            notes: newInteraction.notes.trim() || undefined,
            occurredAt: new Date().toISOString(),
        })
        setNewInteraction({ type: 'Message', direction: 'Outgoing', notes: '' })
        addToast({ type: 'success', title: 'Interaction Added', duration: 2000 })
    }

    const platformIcon = PLATFORM_ICONS[lead.platformOrigin] || '📱'
    const commPlatforms = lead.communicationPlatform?.length ? lead.communicationPlatform : [lead.platformOrigin]
    const tempEmoji = lead.temperature === 'Hot' ? '🔥' : lead.temperature === 'Warm' ? '🌡️' : '❄️'
    const tempClass = lead.temperature === 'Hot' ? 'temp-hot' : lead.temperature === 'Warm' ? 'temp-warm' : 'temp-cold'

    return (
        <Dialog open={true} onClose={onClose} className="relative z-50">
            <DialogBackdrop className="fixed inset-0 bg-black/40 backdrop-blur-sm modal-backdrop" />

            <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
                <DialogPanel onPaste={handlePaste} className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto modal-content">
                    {/* Header */}
                    <div className="relative px-6 pt-6 pb-4">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-start gap-4">
                            {/* Avatar */}
                            {lead.profilePhotoUrl ? (
                                <img
                                    src={lead.profilePhotoUrl}
                                    alt={lead.name}
                                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-brand-100 shadow-md"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold text-xl shadow-md">
                                    {lead.name.charAt(0).toUpperCase()}
                                </div>
                            )}

                            <div className="flex-1 min-w-0">
                                <h2 className="text-xl font-bold text-slate-900 truncate pr-8">{lead.name}</h2>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="text-sm text-slate-500" title="Origin Platform">
                                        📍 {platformIcon} {lead.platformOrigin}
                                    </span>
                                    {lead.communicationPlatform?.length && !(lead.communicationPlatform.length === 1 && lead.communicationPlatform[0] === lead.platformOrigin) && (
                                        <span className="text-sm text-slate-500" title="Communication Platform">
                                            • 💬 {commPlatforms.map(p => `${PLATFORM_ICONS[p] || '📱'} ${p}`).join(', ')}
                                        </span>
                                    )}
                                    {lead.countryOrigin && (
                                        <span className="text-sm text-slate-400">• {lead.countryOrigin}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tempClass}`}>
                                        {tempEmoji} {lead.temperature}
                                    </span>
                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">
                                        Score: {(((lead.qualificationScore || 5) + (lead.aestheticsScore || 5)) / 2).toFixed(1)}/10
                                    </span>
                                    {lead.datingIntention && lead.datingIntention !== 'Undecided' && (
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${INTENTION_CONFIG[lead.datingIntention]?.bg || 'bg-slate-50'} ${INTENTION_CONFIG[lead.datingIntention]?.color || 'text-slate-500'}`}>
                                            {INTENTION_CONFIG[lead.datingIntention]?.emoji} {lead.datingIntention}
                                        </span>
                                    )}
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${daysSince > 7 ? 'bg-red-50 text-red-600' : daysSince > 3 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                                        }`}>
                                        <Clock className="w-3 h-3 inline mr-0.5" />
                                        {daysSince === 0 ? 'Today' : `${daysSince}d ago`}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Stage badge */}
                        <div className="mt-3 flex items-center justify-between">
                            <span className="text-xs text-slate-500">
                                Current Stage: <strong className="text-slate-700">{FUNNEL_STAGE_NAMES[lead.funnelStage] || lead.funnelStage}</strong>
                            </span>
                        </div>
                    </div>

                    {/* Section Tabs */}
                    <div className="flex border-b border-slate-100 px-6">
                        <button
                            onClick={() => setActiveSection('details')}
                            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${activeSection === 'details'
                                ? 'border-brand-500 text-brand-700'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Details
                        </button>
                        <button
                            onClick={() => setActiveSection('interactions')}
                            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${activeSection === 'interactions'
                                ? 'border-brand-500 text-brand-700'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Interactions ({interactions.length})
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-4">
                        {activeSection === 'details' && (
                            <div className="space-y-4">
                                {isEditing ? (
                                    /* Edit Mode */
                                    <>
                                        {/* Photo edit */}
                                        <div className="flex items-center gap-4">
                                            {(editPhoto || lead.profilePhotoUrl) ? (
                                                <div className="relative group">
                                                    <img
                                                        src={editPhoto || lead.profilePhotoUrl}
                                                        alt={lead.name}
                                                        className="w-14 h-14 rounded-full object-cover ring-2 ring-brand-200 shadow"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditPhoto('')}
                                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="w-14 h-14 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-brand-400 hover:text-brand-500 transition cursor-pointer"
                                                >
                                                    <Upload className="w-4 h-4" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-xs font-medium text-slate-600">Profile Photo</p>
                                                <p className="text-[11px] text-slate-400">Click to upload or <span className="font-semibold text-brand-500">⌘V paste</span></p>
                                            </div>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                onChange={e => { const f = e.target.files?.[0]; if (f) processImageFile(f) }}
                                                className="hidden"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-slate-500">Name</label>
                                            <input
                                                type="text"
                                                value={editForm.name}
                                                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-slate-500">Country</label>
                                            <input
                                                type="text"
                                                value={editForm.countryOrigin}
                                                onChange={e => setEditForm(f => ({ ...f, countryOrigin: e.target.value }))}
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400"
                                            />
                                        </div>
                                        {/* Platform pickers */}
                                        <div>
                                            <label className="text-xs font-medium text-slate-500 mb-1.5 block">📍 Origin Platform</label>
                                            <div className="flex flex-wrap gap-1.5">
                                                {ALL_PLATFORMS.map(p => (
                                                    <button
                                                        key={p}
                                                        type="button"
                                                        onClick={() => setEditForm(f => ({ ...f, platformOrigin: p }))}
                                                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition ${editForm.platformOrigin === p ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                                    >
                                                        {PLATFORM_ICONS[p] || '📱'} {p}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-slate-500 mb-1.5 block">💬 Communication Platform <span className="text-[10px] text-slate-400">(multi)</span></label>
                                            <div className="flex flex-wrap gap-1.5">
                                                {ALL_PLATFORMS.map(p => {
                                                    const selected = editForm.communicationPlatform.includes(p)
                                                    return (
                                                        <button
                                                            key={p}
                                                            type="button"
                                                            onClick={() => setEditForm(f => {
                                                                const updated = selected
                                                                    ? f.communicationPlatform.filter(x => x !== p)
                                                                    : [...f.communicationPlatform, p]
                                                                return { ...f, communicationPlatform: updated.length > 0 ? updated : f.communicationPlatform }
                                                            })}
                                                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition ${selected ? 'border-purple-400 bg-purple-50 text-purple-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                                        >
                                                            {PLATFORM_ICONS[p] || '📱'} {p}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 rounded-xl p-3 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-semibold text-slate-700">Overall Score</label>
                                                <span className="text-xs font-bold text-brand-600">
                                                    {((editForm.qualificationScore + editForm.aestheticsScore) / 2).toFixed(1)}/10
                                                </span>
                                            </div>
                                            <div>
                                                <div className="flex items-center justify-between">
                                                    <label className="text-xs font-medium text-slate-500">🧠 Personality</label>
                                                    <span className="text-xs font-bold text-brand-600">{editForm.qualificationScore}/10</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min={1}
                                                    max={10}
                                                    value={editForm.qualificationScore}
                                                    onChange={e => setEditForm(f => ({ ...f, qualificationScore: parseInt(e.target.value) }))}
                                                    className="w-full mt-1"
                                                />
                                            </div>
                                            <div>
                                                <div className="flex items-center justify-between">
                                                    <label className="text-xs font-medium text-slate-500">✨ Aesthetics</label>
                                                    <span className="text-xs font-bold text-purple-600">{editForm.aestheticsScore}/10</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min={1}
                                                    max={10}
                                                    value={editForm.aestheticsScore}
                                                    onChange={e => setEditForm(f => ({ ...f, aestheticsScore: parseInt(e.target.value) }))}
                                                    className="w-full mt-1 accent-purple-500"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-slate-500 mb-1.5 block">Dating Intention</label>
                                            <div className="flex flex-wrap gap-1.5">
                                                {(Object.keys(INTENTION_CONFIG) as DatingIntention[]).map(intention => {
                                                    const cfg = INTENTION_CONFIG[intention]
                                                    const sel = editForm.datingIntention === intention
                                                    return (
                                                        <button
                                                            key={intention}
                                                            type="button"
                                                            onClick={() => setEditForm(f => ({ ...f, datingIntention: intention }))}
                                                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition ${sel ? `${cfg.bg} ${cfg.border} ${cfg.color}` : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                                                }`}
                                                        >
                                                            {cfg.emoji} {intention}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-slate-500">Personality Traits</label>
                                            <p className="text-[10px] text-slate-400 mt-0.5">Comma-separated keywords</p>
                                            <input
                                                type="text"
                                                value={editForm.personalityTraits}
                                                onChange={e => setEditForm(f => ({ ...f, personalityTraits: e.target.value }))}
                                                placeholder="e.g. Liberal, Joyful, Creative"
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-slate-500">Origin Details</label>
                                            <input
                                                type="text"
                                                value={editForm.originDetails}
                                                onChange={e => setEditForm(f => ({ ...f, originDetails: e.target.value }))}
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-slate-500">Notes</label>
                                            <textarea
                                                value={editForm.notes}
                                                onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                                                rows={3}
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 resize-none"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setIsEditing(false)}
                                                className="flex-1 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSaveEdit}
                                                className="flex-1 py-2 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition flex items-center justify-center gap-2"
                                            >
                                                <Save className="w-4 h-4" /> Save
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    /* View Mode */
                                    <>
                                        {/* Platforms */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">📍 Origin Platform</h4>
                                                <p className="text-sm text-slate-700 mt-1">{PLATFORM_ICONS[lead.platformOrigin] || '📱'} {lead.platformOrigin}</p>
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">💬 Talking On</h4>
                                                <p className="text-sm text-slate-700 mt-1">
                                                    {(lead.communicationPlatform?.length ? lead.communicationPlatform : [lead.platformOrigin]).map(p => `${PLATFORM_ICONS[p] || '📱'} ${p}`).join(', ')}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Country */}
                                        <div>
                                            <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Country</h4>
                                            <p className="text-sm text-slate-700 mt-1">{lead.countryOrigin || <span className="text-slate-400 italic">Not set</span>}</p>
                                        </div>

                                        {/* Scores breakdown */}
                                        <div className="bg-slate-50 rounded-xl p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-xs font-semibold text-slate-700">Scores</h4>
                                                <span className="text-xs font-bold text-brand-600">
                                                    Overall: {(((lead.qualificationScore || 5) + (lead.aestheticsScore || 5)) / 2).toFixed(1)}/10
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-slate-500">🧠 Personality</span>
                                                    <span className="text-xs font-bold text-brand-600">{lead.qualificationScore || 5}/10</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-slate-500">✨ Aesthetics</span>
                                                    <span className="text-xs font-bold text-purple-600">{lead.aestheticsScore || 5}/10</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Intention */}
                                        <div>
                                            <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Dating Intention</h4>
                                            {lead.datingIntention && lead.datingIntention !== 'Undecided' ? (
                                                <span className={`inline-flex items-center gap-1.5 text-sm font-medium mt-1 px-2.5 py-1 rounded-lg ${INTENTION_CONFIG[lead.datingIntention]?.bg || 'bg-slate-50'} ${INTENTION_CONFIG[lead.datingIntention]?.color || 'text-slate-500'}`}>
                                                    {INTENTION_CONFIG[lead.datingIntention]?.emoji} {lead.datingIntention}
                                                </span>
                                            ) : (
                                                <p className="text-sm text-slate-400 italic mt-1">Undecided</p>
                                            )}
                                        </div>

                                        {/* Personality */}
                                        <div>
                                            <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Personality Traits</h4>
                                            {lead.personalityTraits ? (
                                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                    {lead.personalityTraits.split(',').map(t => t.trim()).filter(Boolean).map(trait => (
                                                        <span key={trait} className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-pink-50 text-pink-700 border border-pink-200">
                                                            💫 {trait}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-slate-400 italic mt-1">Not set</p>
                                            )}
                                        </div>

                                        {/* How you met */}
                                        <div>
                                            <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">How you met</h4>
                                            <p className="text-sm text-slate-700 mt-1">{lead.originDetails || <span className="text-slate-400 italic">Not set</span>}</p>
                                        </div>

                                        {/* Notes */}
                                        <div>
                                            <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Notes</h4>
                                            <p className="text-sm text-slate-700 mt-1">{lead.notes || <span className="text-slate-400 italic">No notes</span>}</p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 pt-2">
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                                            >
                                                <Edit3 className="w-4 h-4" /> Edit All Fields
                                            </button>
                                            <button
                                                onClick={() => setShowDeleteConfirm(true)}
                                                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 transition"
                                            >
                                                <Trash2 className="w-4 h-4" /> Delete
                                            </button>
                                        </div>
                                    </>
                                )}

                                {/* Move to Stage — always visible */}
                                <div className="pt-2">
                                    <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Move to Stage</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {STAGES.map(stage => {
                                            const isCurrentStage = lead.funnelStage === stage
                                            const isLover = stage === 'Lover'
                                            const isDead = stage === 'Dead'
                                            return (
                                                <button
                                                    key={stage}
                                                    onClick={() => !isCurrentStage && handleStageChange(stage)}
                                                    disabled={isCurrentStage}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${isCurrentStage
                                                        ? 'bg-brand-100 text-brand-700 cursor-default'
                                                        : isLover
                                                            ? 'border border-rose-200 text-rose-600 hover:bg-rose-50'
                                                            : isDead
                                                                ? 'border border-slate-200 text-slate-500 hover:bg-slate-50'
                                                                : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    {isLover && <Heart className="w-3 h-3" />}
                                                    {isDead && <Skull className="w-3 h-3" />}
                                                    {!isLover && !isDead && <ArrowRight className="w-3 h-3" />}
                                                    {FUNNEL_STAGE_NAMES[stage] || stage}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'interactions' && (
                            <div className="space-y-4">
                                {/* Add Interaction Form */}
                                <form onSubmit={handleAddInteraction} className="bg-slate-50 rounded-xl p-4 space-y-3">
                                    <h4 className="text-sm font-semibold text-slate-700">Log Interaction</h4>
                                    <div className="flex gap-2">
                                        {(['Message', 'Call', 'Date', 'Meeting', 'Other'] as InteractionType[]).map(type => {
                                            const Icon = interactionTypeIcons[type]
                                            return (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => setNewInteraction(s => ({ ...s, type }))}
                                                    className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs transition flex-1 ${newInteraction.type === type
                                                        ? 'bg-brand-100 text-brand-700 font-medium'
                                                        : 'text-slate-500 hover:bg-slate-100'
                                                        }`}
                                                >
                                                    <Icon className="w-4 h-4" />
                                                    {type}
                                                </button>
                                            )
                                        })}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setNewInteraction(s => ({ ...s, direction: 'Outgoing' }))}
                                            className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${newInteraction.direction === 'Outgoing'
                                                ? 'bg-brand-100 text-brand-700'
                                                : 'bg-white border border-slate-200 text-slate-500'
                                                }`}
                                        >
                                            📤 Outgoing
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setNewInteraction(s => ({ ...s, direction: 'Incoming' }))}
                                            className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${newInteraction.direction === 'Incoming'
                                                ? 'bg-brand-100 text-brand-700'
                                                : 'bg-white border border-slate-200 text-slate-500'
                                                }`}
                                        >
                                            📥 Incoming
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        value={newInteraction.notes}
                                        onChange={e => setNewInteraction(s => ({ ...s, notes: e.target.value }))}
                                        placeholder="Quick note (optional)"
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                                    />
                                    <button
                                        type="submit"
                                        className="w-full py-2 rounded-lg bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition"
                                    >
                                        Log Interaction
                                    </button>
                                </form>

                                {/* Interaction History */}
                                <div className="space-y-2">
                                    {interactions.length === 0 ? (
                                        <p className="text-sm text-slate-400 text-center py-4">No interactions yet</p>
                                    ) : (
                                        [...interactions]
                                            .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
                                            .map(interaction => {
                                                const Icon = interactionTypeIcons[interaction.type] || FileText
                                                return (
                                                    <div key={interaction.id} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-100">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                                                            <Icon className="w-4 h-4 text-slate-500" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-medium text-slate-700">{interaction.type}</span>
                                                                <span className="text-xs text-slate-400">
                                                                    {interaction.direction === 'Outgoing' ? '📤' : '📥'} {interaction.direction}
                                                                </span>
                                                            </div>
                                                            {interaction.notes && (
                                                                <p className="text-xs text-slate-500 mt-0.5">{interaction.notes}</p>
                                                            )}
                                                            <p className="text-[11px] text-slate-400 mt-1">
                                                                {formatDate(interaction.occurredAt, 'MMM dd, yyyy HH:mm')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )
                                            })
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Delete Confirmation */}
                    {showDeleteConfirm && (
                        <div className="px-6 pb-4">
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                <p className="text-sm font-medium text-red-800">Delete {lead.name}?</p>
                                <p className="text-xs text-red-600 mt-1">This action cannot be undone. All interactions will also be deleted.</p>
                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="flex-1 py-2 rounded-lg border border-red-200 text-sm font-medium text-red-700 hover:bg-red-100 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogPanel>
            </div>
        </Dialog>
    )
}
