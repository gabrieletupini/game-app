import { useState, useRef, useCallback } from 'react'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import {
    X,
    Upload,
    FileSpreadsheet,
    Download,
    CheckCircle,
    AlertCircle,
    Loader2,
} from 'lucide-react'
import { useGameStore } from '../store/useGameStore'
import {
    parseExcelFile,
    parsedLeadsToCreateInputs,
    downloadImportTemplate,
    type ParseResult,
} from '../services/excelService'
import { FUNNEL_STAGE_NAMES } from '../utils/constants'

interface BulkUploadModalProps {
    isOpen: boolean
    onClose: () => void
}

type Step = 'upload' | 'preview' | 'done'

export default function BulkUploadModal({ isOpen, onClose }: BulkUploadModalProps) {
    const addLead = useGameStore(state => state.addLead)
    const moveLeadToStage = useGameStore(state => state.moveLeadToStage)
    const addToast = useGameStore(state => state.addToast)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [step, setStep] = useState<Step>('upload')
    const [parseResult, setParseResult] = useState<ParseResult | null>(null)
    const [isParsing, setIsParsing] = useState(false)
    const [isImporting, setIsImporting] = useState(false)
    const [importedCount, setImportedCount] = useState(0)
    const [dragActive, setDragActive] = useState(false)

    const resetState = () => {
        setStep('upload')
        setParseResult(null)
        setIsParsing(false)
        setIsImporting(false)
        setImportedCount(0)
        setDragActive(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleClose = () => {
        resetState()
        onClose()
    }

    const processFile = useCallback(async (file: File) => {
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv',
        ]
        const ext = file.name.split('.').pop()?.toLowerCase()
        if (!validTypes.includes(file.type) && !['xlsx', 'xls', 'csv'].includes(ext || '')) {
            addToast({ type: 'error', title: 'Invalid File', message: 'Please upload an .xlsx, .xls, or .csv file', duration: 4000 })
            return
        }

        setIsParsing(true)
        try {
            const result = await parseExcelFile(file)
            setParseResult(result)
            setStep('preview')
        } catch (err) {
            addToast({ type: 'error', title: 'Parse Error', message: (err as Error).message, duration: 5000 })
        } finally {
            setIsParsing(false)
        }
    }, [addToast])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) processFile(file)
    }

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setDragActive(false)
        const file = e.dataTransfer.files[0]
        if (file) processFile(file)
    }, [processFile])

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setDragActive(true)
    }

    const handleDragLeave = () => setDragActive(false)

    const handleImport = async () => {
        if (!parseResult) return

        setIsImporting(true)
        const inputs = parsedLeadsToCreateInputs(parseResult.leads)
        let imported = 0

        for (const input of inputs) {
            // Find the target stage from parsed data
            const parsed = parseResult.leads.find(l => l.name === input.name && l.isValid)
            const targetStage = parsed?.funnelStage || 'Stage1'

            addLead(input)

            // If the target stage isn't Stage1, move the lead after creation
            if (targetStage !== 'Stage1') {
                // Get the most recently added lead (last in the store)
                const leads = useGameStore.getState().leads
                const newLead = leads[leads.length - 1]
                if (newLead) {
                    moveLeadToStage(newLead.id, targetStage)
                }
            }

            imported++
            setImportedCount(imported)
        }

        setStep('done')
        setIsImporting(false)

        addToast({
            type: 'success',
            title: `${imported} Leads Imported!`,
            message: `Successfully imported ${imported} leads into your funnel`,
            duration: 4000,
        })
    }

    return (
        <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
            <DialogBackdrop className="fixed inset-0 bg-black/40 backdrop-blur-sm modal-backdrop" />

            <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
                <DialogPanel className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden modal-content flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
                        <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <FileSpreadsheet className="w-5 h-5 text-brand-500" />
                            Bulk Upload Leads
                        </DialogTitle>
                        <button
                            onClick={handleClose}
                            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {/* ── STEP 1: UPLOAD ── */}
                        {step === 'upload' && (
                            <div className="space-y-6">
                                {/* Drop zone */}
                                <div
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`
                    border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all
                    ${dragActive
                                            ? 'border-brand-500 bg-brand-50'
                                            : 'border-slate-300 bg-slate-50 hover:border-brand-400 hover:bg-brand-50/50'
                                        }
                  `}
                                >
                                    {isParsing ? (
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
                                            <p className="text-sm font-medium text-slate-600">Parsing file...</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-14 h-14 bg-brand-100 rounded-2xl flex items-center justify-center">
                                                <Upload className="w-7 h-7 text-brand-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-700">
                                                    Drop your Excel file here or click to browse
                                                </p>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    Supports .xlsx, .xls, and .csv files
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </div>

                                {/* Download template */}
                                <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-700">Need a template?</p>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            Download a pre-formatted Excel template with field guide
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            downloadImportTemplate()
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition flex-shrink-0"
                                    >
                                        <Download className="w-4 h-4" />
                                        Template
                                    </button>
                                </div>

                                {/* Format hints */}
                                <div className="text-xs text-slate-400 space-y-2">
                                    <p className="font-semibold text-slate-500">Expected columns:</p>
                                    <p>Name (required), Origin Platform, Communication Platform, Country, Personality Traits, Notes, Personality Score (1-10), Aesthetics Score (1-10), Dating Intention, Funnel Stage, Origin / How We Met</p>

                                    {/* SELECT fields - must pick from options */}
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2.5">
                                        <p className="font-bold text-amber-700 text-[13px]">🔘 SELECT fields — pick from these exact options:</p>

                                        <div>
                                            <p className="font-semibold text-amber-700 mb-1">📍 Origin Platform <span className="font-normal text-amber-600">(where she comes from)</span>:</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {['🔥 Tinder', '💛 Bumble', '💜 Hinge', '📸 Instagram', '👥 Facebook', '💬 WhatsApp', '🌍 Offline', '📱 Other'].map(p => (
                                                    <span key={p} className="bg-white border border-amber-200 text-amber-800 px-2 py-0.5 rounded-md font-medium">{p}</span>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <p className="font-semibold text-amber-700 mb-1">💬 Communication Platform <span className="font-normal text-amber-600">(where you're talking now)</span>:</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {['🔥 Tinder', '💛 Bumble', '💜 Hinge', '📸 Instagram', '👥 Facebook', '💬 WhatsApp', '🌍 Offline', '📱 Other'].map(p => (
                                                    <span key={`comm-${p}`} className="bg-white border border-purple-200 text-purple-800 px-2 py-0.5 rounded-md font-medium">{p}</span>
                                                ))}
                                            </div>
                                            <p className="text-[11px] text-amber-600 mt-1 italic">If empty, defaults to Origin Platform</p>
                                        </div>

                                        <div>
                                            <p className="font-semibold text-amber-700 mb-1">🎯 Funnel Stage:</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {['👋 Initial Contact', '💬 Qualified Interest', '☕ Real-World Interaction', '💜 Intimacy & Connection', '❤️ Lover', '🧊 Cold Leads'].map(s => (
                                                    <span key={s} className="bg-white border border-amber-200 text-amber-800 px-2 py-0.5 rounded-md font-medium">{s}</span>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <p className="font-semibold text-amber-700 mb-1">💘 Dating Intention:</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {['⚡ Short Term', '💍 Long Term', '💞 Long Term Open to Short', '🎉 Casual', '🧭 Exploring', '🤷 Undecided'].map(i => (
                                                    <span key={i} className="bg-white border border-amber-200 text-amber-800 px-2 py-0.5 rounded-md font-medium">{i}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* FREE TEXT fields */}
                                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                                        <p className="font-bold text-slate-600 text-[13px] mb-1">✏️ FREE TEXT fields — write anything:</p>
                                        <p className="text-slate-500">Name, Country, Personality Traits, Notes, Origin / How We Met</p>
                                    </div>

                                    {/* NUMBER fields */}
                                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                                        <p className="font-bold text-slate-600 text-[13px] mb-1">🔢 NUMBER fields — 1 to 10:</p>
                                        <p className="text-slate-500">Personality Score, Aesthetics Score (defaults to 5 if empty)</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── STEP 2: PREVIEW ── */}
                        {step === 'preview' && parseResult && (
                            <div className="space-y-4">
                                {/* Summary */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                                        <p className="text-2xl font-bold text-slate-900">{parseResult.totalRows}</p>
                                        <p className="text-xs text-slate-500">Total Rows</p>
                                    </div>
                                    <div className="bg-emerald-50 rounded-xl p-3 text-center">
                                        <p className="text-2xl font-bold text-emerald-600">{parseResult.validCount}</p>
                                        <p className="text-xs text-emerald-600">Valid</p>
                                    </div>
                                    <div className={`rounded-xl p-3 text-center ${parseResult.errorCount > 0 ? 'bg-red-50' : 'bg-slate-50'}`}>
                                        <p className={`text-2xl font-bold ${parseResult.errorCount > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                                            {parseResult.errorCount}
                                        </p>
                                        <p className={`text-xs ${parseResult.errorCount > 0 ? 'text-red-500' : 'text-slate-400'}`}>Errors</p>
                                    </div>
                                </div>

                                {/* Errors */}
                                {parseResult.errors.length > 0 && (
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                                        <p className="text-xs font-semibold text-red-700 mb-1">Issues found:</p>
                                        <ul className="text-xs text-red-600 space-y-0.5">
                                            {parseResult.errors.slice(0, 10).map((err, i) => (
                                                <li key={i}>• {err}</li>
                                            ))}
                                            {parseResult.errors.length > 10 && (
                                                <li>... and {parseResult.errors.length - 10} more</li>
                                            )}
                                        </ul>
                                    </div>
                                )}

                                {/* Preview table */}
                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                    <div className="overflow-x-auto max-h-[40vh]">
                                        <table className="w-full text-xs">
                                            <thead className="bg-slate-50 sticky top-0">
                                                <tr>
                                                    <th className="px-3 py-2.5 text-left font-semibold text-slate-600 w-8">#</th>
                                                    <th className="px-3 py-2.5 text-left font-semibold text-slate-600 w-8"></th>
                                                    <th className="px-3 py-2.5 text-left font-semibold text-slate-600">Name</th>
                                                    <th className="px-3 py-2.5 text-left font-semibold text-slate-600">📍 Origin</th>
                                                    <th className="px-3 py-2.5 text-left font-semibold text-slate-600">💬 Talking On</th>
                                                    <th className="px-3 py-2.5 text-left font-semibold text-slate-600">Country</th>
                                                    <th className="px-3 py-2.5 text-left font-semibold text-slate-600">Pers</th>
                                                    <th className="px-3 py-2.5 text-left font-semibold text-slate-600">Aesth</th>
                                                    <th className="px-3 py-2.5 text-left font-semibold text-slate-600">Avg</th>
                                                    <th className="px-3 py-2.5 text-left font-semibold text-slate-600">Intention</th>
                                                    <th className="px-3 py-2.5 text-left font-semibold text-slate-600">Stage</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {parseResult.leads.map((lead, idx) => (
                                                    <tr
                                                        key={idx}
                                                        className={`${lead.isValid ? '' : 'bg-red-50/50'}`}
                                                    >
                                                        <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
                                                        <td className="px-3 py-2">
                                                            {lead.isValid ? (
                                                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                                            ) : (
                                                                <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2 font-medium text-slate-900 whitespace-nowrap">{lead.name || '—'}</td>
                                                        <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{lead.platformOrigin}</td>
                                                        <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{(lead.communicationPlatform || [lead.platformOrigin]).join(', ')}</td>
                                                        <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{lead.countryOrigin || '—'}</td>
                                                        <td className="px-3 py-2 text-slate-600">{lead.qualificationScore}</td>
                                                        <td className="px-3 py-2 text-slate-600">{lead.aestheticsScore}</td>
                                                        <td className="px-3 py-2 font-medium text-brand-600">
                                                            {((lead.qualificationScore + lead.aestheticsScore) / 2).toFixed(1)}
                                                        </td>
                                                        <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                                                            {lead.datingIntention || 'Undecided'}
                                                        </td>
                                                        <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                                                            {FUNNEL_STAGE_NAMES[lead.funnelStage] || lead.funnelStage}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={resetState}
                                        className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleImport}
                                        disabled={parseResult.validCount === 0 || isImporting}
                                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-purple-600 text-white text-sm font-semibold shadow-md shadow-brand-500/25 hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isImporting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Importing {importedCount}/{parseResult.validCount}...
                                            </>
                                        ) : (
                                            <>Import {parseResult.validCount} Leads</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── STEP 3: DONE ── */}
                        {step === 'done' && (
                            <div className="text-center py-8 space-y-4">
                                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto">
                                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Import Complete!</h3>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Successfully imported <strong>{importedCount}</strong> leads into your funnel.
                                    </p>
                                </div>
                                <button
                                    onClick={handleClose}
                                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-purple-600 text-white text-sm font-semibold shadow-md shadow-brand-500/25 hover:shadow-lg transition"
                                >
                                    Done
                                </button>
                            </div>
                        )}
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    )
}
