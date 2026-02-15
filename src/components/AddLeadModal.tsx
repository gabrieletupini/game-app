import { useState, useRef, useCallback } from 'react'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { X, Upload, Trash2 } from 'lucide-react'
import { useGameStore } from '../store/useGameStore'
import type { PlatformOrigin, DatingIntention, CreateLeadInput } from '../types'
import { INTENTION_CONFIG } from '../utils/constants'

interface AddLeadModalProps {
    isOpen: boolean
    onClose: () => void
}

const PLATFORMS: PlatformOrigin[] = ['Tinder', 'Bumble', 'Hinge', 'Instagram', 'Facebook', 'WhatsApp', 'Offline', 'Other']
const PLATFORM_EMOJIS: Record<PlatformOrigin, string> = {
    Tinder: '🔥',
    Bumble: '💛',
    Hinge: '💜',
    Instagram: '📸',
    Facebook: '👥',
    WhatsApp: '💬',
    Offline: '🌍',
    Other: '📱',
}

export default function AddLeadModal({ isOpen, onClose }: AddLeadModalProps) {
    const addLead = useGameStore(state => state.addLead)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [form, setForm] = useState<CreateLeadInput>({
        name: '',
        platformOrigin: 'Tinder',
        communicationPlatform: 'WhatsApp',
        countryOrigin: '',
        personalityTraits: '',
        notes: '',
        qualificationScore: 5,
        aestheticsScore: 5,
        datingIntention: 'Undecided',
        originDetails: '',
        profilePhotoUrl: '',
    })

    const [photoPreview, setPhotoPreview] = useState<string | null>(null)

    const processImageFile = useCallback((file: File) => {
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'].includes(file.type)) {
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            return
        }

        const reader = new FileReader()
        reader.onload = () => {
            const base64 = reader.result as string
            setPhotoPreview(base64)
            setForm(f => ({ ...f, profilePhotoUrl: base64 }))
        }
        reader.readAsDataURL(file)
    }, [])

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) processImageFile(file)
    }

    const handlePaste = useCallback((e: React.ClipboardEvent) => {
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
    }, [processImageFile])

    const removePhoto = () => {
        setPhotoPreview(null)
        setForm(f => ({ ...f, profilePhotoUrl: '' }))
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.name.trim()) return

        addLead({
            ...form,
            name: form.name.trim(),
        })

        // Reset
        setForm({
            name: '',
            platformOrigin: 'Tinder',
            communicationPlatform: 'WhatsApp',
            countryOrigin: '',
            personalityTraits: '',
            notes: '',
            qualificationScore: 5,
            aestheticsScore: 5,
            datingIntention: 'Undecided',
            originDetails: '',
            profilePhotoUrl: '',
        })
        setPhotoPreview(null)
        onClose()
    }

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <DialogBackdrop className="fixed inset-0 bg-black/40 backdrop-blur-sm modal-backdrop" />

            <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
                <DialogPanel className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto modal-content">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                        <DialogTitle className="text-lg font-bold text-slate-900">
                            Add New Lead
                        </DialogTitle>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} onPaste={handlePaste} className="p-6 space-y-5">
                        {/* Photo Upload */}
                        <div className="flex items-center gap-4">
                            {photoPreview ? (
                                <div className="relative group">
                                    <img
                                        src={photoPreview}
                                        alt="Preview"
                                        className="w-16 h-16 rounded-full object-cover ring-2 ring-brand-200 shadow"
                                    />
                                    <button
                                        type="button"
                                        onClick={removePhoto}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            ) : (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-16 h-16 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-brand-400 hover:text-brand-500 transition cursor-pointer"
                                >
                                    <Upload className="w-5 h-5" />
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-medium text-slate-700">Profile Photo</p>
                                <p className="text-xs text-slate-400">Click to upload or <span className="font-semibold text-brand-500">⌘V paste</span> from clipboard</p>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handlePhotoUpload}
                                className="hidden"
                            />
                        </div>

                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Name <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="Enter her name"
                                required
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition"
                            />
                        </div>

                        {/* Origin Platform */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">📍 Origin Platform</label>
                            <p className="text-[11px] text-slate-400 mb-2">Where did you find her?</p>
                            <div className="grid grid-cols-4 gap-2">
                                {PLATFORMS.map(platform => (
                                    <button
                                        key={platform}
                                        type="button"
                                        onClick={() => setForm(f => ({ ...f, platformOrigin: platform }))}
                                        className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 text-xs font-medium transition-all ${form.platformOrigin === platform
                                            ? 'border-brand-500 bg-brand-50 text-brand-700'
                                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                            }`}
                                    >
                                        <span className="text-lg">{PLATFORM_EMOJIS[platform]}</span>
                                        {platform}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Communication Platform */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">💬 Communication Platform</label>
                            <p className="text-[11px] text-slate-400 mb-2">Where are you talking now?</p>
                            <div className="grid grid-cols-4 gap-2">
                                {PLATFORMS.map(platform => (
                                    <button
                                        key={platform}
                                        type="button"
                                        onClick={() => setForm(f => ({ ...f, communicationPlatform: platform }))}
                                        className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 text-xs font-medium transition-all ${form.communicationPlatform === platform
                                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                            }`}
                                    >
                                        <span className="text-lg">{PLATFORM_EMOJIS[platform]}</span>
                                        {platform}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Country */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Country</label>
                            <input
                                type="text"
                                value={form.countryOrigin}
                                onChange={e => setForm(f => ({ ...f, countryOrigin: e.target.value }))}
                                placeholder="e.g. Italy, USA, Brazil"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition"
                            />
                        </div>

                        {/* Scores */}
                        <div className="space-y-4 bg-slate-50 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-slate-700">Overall Score</span>
                                <span className="text-sm font-bold text-brand-600">
                                    {((form.qualificationScore || 5) + (form.aestheticsScore || 5)) / 2}/10
                                </span>
                            </div>

                            {/* Personality Score */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-sm font-medium text-slate-700">🧠 Personality</label>
                                    <span className="text-xs font-bold text-brand-600">{form.qualificationScore}/10</span>
                                </div>
                                <input
                                    type="range"
                                    min={1}
                                    max={10}
                                    value={form.qualificationScore}
                                    onChange={e => setForm(f => ({ ...f, qualificationScore: parseInt(e.target.value) }))}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                                    <span>Low</span>
                                    <span>Medium</span>
                                    <span>Excellent</span>
                                </div>
                            </div>

                            {/* Aesthetics Score */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-sm font-medium text-slate-700">✨ Aesthetics</label>
                                    <span className="text-xs font-bold text-purple-600">{form.aestheticsScore}/10</span>
                                </div>
                                <input
                                    type="range"
                                    min={1}
                                    max={10}
                                    value={form.aestheticsScore}
                                    onChange={e => setForm(f => ({ ...f, aestheticsScore: parseInt(e.target.value) }))}
                                    className="w-full accent-purple-500"
                                />
                                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                                    <span>Low</span>
                                    <span>Medium</span>
                                    <span>Stunning</span>
                                </div>
                            </div>
                        </div>

                        {/* Dating Intention */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Dating Intention</label>
                            <div className="flex flex-wrap gap-2">
                                {(Object.keys(INTENTION_CONFIG) as DatingIntention[]).map(intention => {
                                    const config = INTENTION_CONFIG[intention]
                                    const isSelected = form.datingIntention === intention
                                    return (
                                        <button
                                            key={intention}
                                            type="button"
                                            onClick={() => setForm(f => ({ ...f, datingIntention: intention }))}
                                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-xs font-medium transition-all ${isSelected
                                                ? `${config.bg} ${config.border} ${config.color}`
                                                : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                                }`}
                                        >
                                            <span>{config.emoji}</span>
                                            {intention}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Personality Traits */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Personality Traits</label>
                            <input
                                type="text"
                                value={form.personalityTraits}
                                onChange={e => setForm(f => ({ ...f, personalityTraits: e.target.value }))}
                                placeholder="e.g. Outgoing, creative, loves hiking"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition"
                            />
                        </div>

                        {/* Origin Details */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">How did you meet?</label>
                            <input
                                type="text"
                                value={form.originDetails}
                                onChange={e => setForm(f => ({ ...f, originDetails: e.target.value }))}
                                placeholder="e.g. Matched on Tinder, met at a coffee shop"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition"
                            />
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
                            <textarea
                                value={form.notes}
                                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                placeholder="Anything else to remember..."
                                rows={3}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition resize-none"
                            />
                        </div>

                        {/* Submit */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-purple-600 text-white text-sm font-semibold shadow-md shadow-brand-500/25 hover:shadow-lg transition"
                            >
                                Add Lead
                            </button>
                        </div>
                    </form>
                </DialogPanel>
            </div>
        </Dialog>
    )
}
