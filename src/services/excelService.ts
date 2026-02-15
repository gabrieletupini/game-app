import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import type { Lead, PlatformOrigin, FunnelStage, DatingIntention, CreateLeadInput } from '../types'
import { getDaysSince } from '../utils/dateHelpers'
import { FUNNEL_STAGE_NAMES } from '../utils/constants'

const VALID_INTENTIONS: DatingIntention[] = ['Short Term', 'Long Term', 'Long Term Open to Short', 'Casual', 'Exploring', 'Undecided']

// ── Valid options ──

const VALID_PLATFORMS: PlatformOrigin[] = ['Tinder', 'Bumble', 'Hinge', 'Instagram', 'Facebook', 'WhatsApp', 'Offline', 'Other']
const VALID_STAGES: FunnelStage[] = ['Stage1', 'Stage2', 'Stage3', 'Stage4', 'Lover', 'Dead']

const FRIENDLY_STAGES = [
    'Initial Contact',
    'Qualified Interest',
    'Real-World Interaction',
    'Intimacy & Connection',
    'Lover',
    'Dead',
]

// Friendly stage names → internal keys
const STAGE_NAME_TO_KEY: Record<string, FunnelStage> = {
    'initial contact': 'Stage1',
    'stage1': 'Stage1',
    'stage 1': 'Stage1',
    '1': 'Stage1',
    'qualified interest': 'Stage2',
    'stage2': 'Stage2',
    'stage 2': 'Stage2',
    '2': 'Stage2',
    'real-world interaction': 'Stage3',
    'real-world': 'Stage3',
    'stage3': 'Stage3',
    'stage 3': 'Stage3',
    '3': 'Stage3',
    'intimacy & connection': 'Stage4',
    'connection': 'Stage4',
    'stage4': 'Stage4',
    'stage 4': 'Stage4',
    '4': 'Stage4',
    'lover': 'Lover',
    'lovers': 'Lover',
    'dead': 'Dead',
    'dead leads': 'Dead',
    'dead lead': 'Dead',
}

// ── EXPORT ──

export function exportLeadsToExcel(leads: Lead[], filename?: string) {
    const rows = leads.map(lead => {
        const daysSince = lead.lastInteractionDate
            ? getDaysSince(lead.lastInteractionDate)
            : getDaysSince(lead.createdAt)

        const qual = lead.qualificationScore || 5
        const aes = lead.aestheticsScore || 5

        return {
            'ID': lead.id,
            'Name': lead.name,
            'Origin Platform': lead.platformOrigin,
            'Communication Platform': lead.communicationPlatform || lead.platformOrigin,
            'Country': lead.countryOrigin || '',
            'Personality Traits': lead.personalityTraits || '',
            'Notes': lead.notes || '',
            'Qualification Score (1-10)': qual,
            'Aesthetics Score (1-10)': aes,
            'Overall Score': +((qual + aes) / 2).toFixed(1),
            'Dating Intention': lead.datingIntention || 'Undecided',
            'Funnel Stage': FUNNEL_STAGE_NAMES[lead.funnelStage] || lead.funnelStage,
            'Origin / How We Met': lead.originDetails || '',
            'Temperature': lead.temperature,
            'Days Since Last Spoken': daysSince,
            'Last Interaction Date': lead.lastInteractionDate
                ? new Date(lead.lastInteractionDate).toLocaleDateString()
                : '',
            'Created At': new Date(lead.createdAt).toLocaleDateString(),
            'Updated At': new Date(lead.updatedAt).toLocaleDateString(),
        }
    })

    const ws = XLSX.utils.json_to_sheet(rows)

    // Set column widths
    ws['!cols'] = [
        { wch: 38 },  // ID
        { wch: 22 },  // Name
        { wch: 18 },  // Origin Platform
        { wch: 22 },  // Communication Platform
        { wch: 16 },  // Country
        { wch: 30 },  // Personality
        { wch: 30 },  // Notes
        { wch: 14 },  // Qualification Score
        { wch: 14 },  // Aesthetics Score
        { wch: 12 },  // Overall Score
        { wch: 16 },  // Dating Intention
        { wch: 24 },  // Stage
        { wch: 30 },  // Origin
        { wch: 12 },  // Temperature
        { wch: 12 },  // Days since
        { wch: 16 },  // Last interaction
        { wch: 14 },  // Created
        { wch: 14 },  // Updated
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Leads')

    // Also add a template sheet for reference
    const templateRows = [
        {
            'Name': 'Jane Doe',
            'Origin Platform': 'Tinder',
            'Communication Platform': 'WhatsApp',
            'Country': 'USA',
            'Personality Traits': 'Outgoing, loves hiking',
            'Notes': 'Met at coffee shop',
            'Qualification Score (1-10)': 7,
            'Aesthetics Score (1-10)': 8,
            'Funnel Stage': 'Initial Contact',
            'Origin / How We Met': 'Matched on Tinder',
        },
    ]
    const templateWs = XLSX.utils.json_to_sheet(templateRows)
    templateWs['!cols'] = [
        { wch: 22 }, { wch: 18 }, { wch: 22 }, { wch: 16 }, { wch: 30 },
        { wch: 30 }, { wch: 14 }, { wch: 14 }, { wch: 24 }, { wch: 30 },
    ]
    XLSX.utils.book_append_sheet(wb, templateWs, 'Import Template')

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const name = filename || `game-leads-${new Date().toISOString().split('T')[0]}.xlsx`
    saveAs(blob, name)
}

// ── DOWNLOAD TEMPLATE ──

export function downloadImportTemplate() {
    // ── Example rows (one per funnel stage) — no reference row, clean data only ──
    const templateRows = [
        {
            'Name': 'Jane Doe',
            'Origin Platform': 'Tinder',
            'Communication Platform': 'WhatsApp',
            'Country': 'USA',
            'Personality Traits': 'Outgoing, loves hiking',
            'Notes': 'Met through mutual friend',
            'Qualification Score (1-10)': 7,
            'Aesthetics Score (1-10)': 8,
            'Dating Intention': 'Short Term',
            'Funnel Stage': 'Initial Contact',
            'Origin / How We Met': 'Matched on Tinder',
        },
        {
            'Name': 'Maria Garcia',
            'Origin Platform': 'Instagram',
            'Communication Platform': 'Instagram',
            'Country': 'Spain',
            'Personality Traits': 'Creative, photographer',
            'Notes': 'DM conversation about travel',
            'Qualification Score (1-10)': 8,
            'Aesthetics Score (1-10)': 9,
            'Dating Intention': 'Long Term',
            'Funnel Stage': 'Qualified Interest',
            'Origin / How We Met': 'Found through explore page',
        },
        {
            'Name': 'Sofia Rossi',
            'Origin Platform': 'Bumble',
            'Communication Platform': 'WhatsApp',
            'Country': 'Italy',
            'Personality Traits': 'Chill, foodie',
            'Notes': 'Had coffee last week',
            'Qualification Score (1-10)': 7,
            'Aesthetics Score (1-10)': 8,
            'Dating Intention': 'Casual',
            'Funnel Stage': 'Real-World Interaction',
            'Origin / How We Met': 'Bumble match, met at café',
        },
        {
            'Name': 'Emma Wilson',
            'Origin Platform': 'Offline',
            'Communication Platform': 'WhatsApp',
            'Country': 'UK',
            'Personality Traits': 'Ambitious, witty',
            'Notes': 'Strong connection, seeing regularly',
            'Qualification Score (1-10)': 9,
            'Aesthetics Score (1-10)': 9,
            'Dating Intention': 'Long Term',
            'Funnel Stage': 'Intimacy & Connection',
            'Origin / How We Met': 'Friend of a friend at a party',
        },
        {
            'Name': 'Ana Costa',
            'Origin Platform': 'Hinge',
            'Communication Platform': 'WhatsApp',
            'Country': 'Brazil',
            'Personality Traits': 'Fun, spontaneous',
            'Notes': 'Together for 3 months',
            'Qualification Score (1-10)': 9,
            'Aesthetics Score (1-10)': 10,
            'Dating Intention': 'Long Term',
            'Funnel Stage': 'Lover',
            'Origin / How We Met': 'Met through travel group',
        },
        {
            'Name': 'Lisa Chen',
            'Origin Platform': 'Facebook',
            'Communication Platform': 'Facebook',
            'Country': 'Canada',
            'Personality Traits': 'Quiet, bookworm',
            'Notes': 'Stopped replying after 2nd date',
            'Qualification Score (1-10)': 6,
            'Aesthetics Score (1-10)': 7,
            'Dating Intention': 'Exploring',
            'Funnel Stage': 'Dead',
            'Origin / How We Met': 'Facebook dating',
        },
    ]

    const ws = XLSX.utils.json_to_sheet(templateRows)
    ws['!cols'] = [
        { wch: 22 }, // Name
        { wch: 18 }, // Origin Platform
        { wch: 22 }, // Communication Platform
        { wch: 16 }, // Country
        { wch: 30 }, // Personality Traits
        { wch: 30 }, // Notes
        { wch: 14 }, // Qualification
        { wch: 14 }, // Aesthetics
        { wch: 18 }, // Dating Intention
        { wch: 26 }, // Funnel Stage
        { wch: 30 }, // Origin
    ]

    // Header comments — hover any header to see instructions
    const headerComments: Record<string, string> = {
        'A1': '✏️ FREE TEXT — Type any name',
        'B1': `📍 SELECT ONE — Where she comes from:\n${VALID_PLATFORMS.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\nDefault: Other`,
        'C1': `💬 SELECT ONE — Where you're talking now:\n${VALID_PLATFORMS.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\nDefault: same as Origin`,
        'D1': '✏️ FREE TEXT — Any country name',
        'E1': '✏️ FREE TEXT — Comma-separated personality traits',
        'F1': '✏️ FREE TEXT — Any notes you want to remember',
        'G1': '🔢 NUMBER 1-10 — Personality/vibe score (default: 5)',
        'H1': '🔢 NUMBER 1-10 — Physical attraction score (default: 5)',
        'I1': `🔘 SELECT ONE:\n${VALID_INTENTIONS.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}\n\nDefault: Undecided`,
        'J1': `🔘 SELECT ONE:\n${FRIENDLY_STAGES.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nDefault: Initial Contact`,
        'K1': '✏️ FREE TEXT — How/where you met this person',
    }
    for (const [cell, text] of Object.entries(headerComments)) {
        if (!ws[cell]) continue
        ws[cell].c = [{ a: 'Game App', t: text }]
    }

    // ────────────────────────────────────────
    // SHEET 2: Field Guide — clear separation of SELECT vs FREE TEXT
    // ────────────────────────────────────────
    const helpRows = [
        { Field: 'Name', 'Input Type': '✏️ FREE TEXT', Required: 'Yes', Description: 'Name of the person', 'Valid Options / Format': 'Any text' },
        { Field: 'Origin Platform', 'Input Type': '🔘 SELECT', Required: 'No', Description: 'Where you found/met her', 'Valid Options / Format': VALID_PLATFORMS.join(', ') },
        { Field: 'Communication Platform', 'Input Type': '🔘 SELECT', Required: 'No', Description: 'Where you\'re currently talking', 'Valid Options / Format': VALID_PLATFORMS.join(', ') + ' (defaults to Origin Platform)' },
        { Field: 'Country', 'Input Type': '✏️ FREE TEXT', Required: 'No', Description: 'Country of origin', 'Valid Options / Format': 'Any text (e.g. Italy, USA, Brazil)' },
        { Field: 'Personality Traits', 'Input Type': '✏️ FREE TEXT', Required: 'No', Description: 'Comma-separated personality traits', 'Valid Options / Format': 'Any text (e.g. "Funny, smart, outgoing")' },
        { Field: 'Notes', 'Input Type': '✏️ FREE TEXT', Required: 'No', Description: 'Any notes to remember about her', 'Valid Options / Format': 'Any text' },
        { Field: 'Qualification Score', 'Input Type': '🔢 NUMBER', Required: 'No', Description: 'Personality / vibe / compatibility score', 'Valid Options / Format': 'Number 1 to 10 (defaults to 5)' },
        { Field: 'Aesthetics Score', 'Input Type': '🔢 NUMBER', Required: 'No', Description: 'Looks / physical attraction score', 'Valid Options / Format': 'Number 1 to 10 (defaults to 5)' },
        { Field: 'Dating Intention', 'Input Type': '🔘 SELECT', Required: 'No', Description: 'What kind of relationship (same as in-app pills)', 'Valid Options / Format': VALID_INTENTIONS.join(', ') },
        { Field: 'Funnel Stage', 'Input Type': '🔘 SELECT', Required: 'No', Description: 'Which stage she is in (same as in-app columns)', 'Valid Options / Format': FRIENDLY_STAGES.join(', ') },
        { Field: 'Origin / How We Met', 'Input Type': '✏️ FREE TEXT', Required: 'No', Description: 'How you met this person', 'Valid Options / Format': 'Any text' },
    ]
    const helpWs = XLSX.utils.json_to_sheet(helpRows)
    helpWs['!cols'] = [{ wch: 24 }, { wch: 16 }, { wch: 10 }, { wch: 50 }, { wch: 56 }]

    // ────────────────────────────────────────
    // SHEET 3: Valid Options — one sheet with ALL pre-selection lists
    // ────────────────────────────────────────
    // Build side-by-side lists for all 3 select fields
    const maxRows = Math.max(VALID_PLATFORMS.length, FRIENDLY_STAGES.length, VALID_INTENTIONS.length)
    const optionsRows: Record<string, string>[] = []
    for (let i = 0; i < maxRows; i++) {
        optionsRows.push({
            '📱 Platform (SELECT)': VALID_PLATFORMS[i] || '',
            '  ': '',  // spacer
            '🎯 Funnel Stage (SELECT)': FRIENDLY_STAGES[i] || '',
            '   ': '', // spacer
            '💘 Dating Intention (SELECT)': VALID_INTENTIONS[i] || '',
        })
    }
    const optionsWs = XLSX.utils.json_to_sheet(optionsRows)
    optionsWs['!cols'] = [
        { wch: 28 }, // Platform
        { wch: 3 },  // spacer
        { wch: 30 }, // Stage
        { wch: 3 },  // spacer
        { wch: 32 }, // Intention
    ]
    // Add comments explaining each column
    if (optionsWs['A1']) optionsWs['A1'].c = [{ a: 'Game App', t: 'Copy one of these exactly into the Platform column on the Leads sheet' }]
    if (optionsWs['C1']) optionsWs['C1'].c = [{ a: 'Game App', t: 'Copy one of these exactly into the Funnel Stage column on the Leads sheet' }]
    if (optionsWs['E1']) optionsWs['E1'].c = [{ a: 'Game App', t: 'Copy one of these exactly into the Dating Intention column on the Leads sheet' }]

    // ────────────────────────────────────────
    // SHEET 4: Stage Reference — detailed description of each funnel stage
    // ────────────────────────────────────────
    const stageRefRows = [
        { '#': 1, 'Stage Name (use this in Excel)': 'Initial Contact', 'Description': '👋 First match or DM — she knows you exist' },
        { '#': 2, 'Stage Name (use this in Excel)': 'Qualified Interest', 'Description': '💬 Active back-and-forth conversation, exchanging info' },
        { '#': 3, 'Stage Name (use this in Excel)': 'Real-World Interaction', 'Description': "☕ You've met in person or had a real-time call/video" },
        { '#': 4, 'Stage Name (use this in Excel)': 'Intimacy & Connection', 'Description': '💜 Deep emotional or physical connection established' },
        { '#': 5, 'Stage Name (use this in Excel)': 'Lover', 'Description': '❤️ Official or ongoing relationship' },
        { '#': 6, 'Stage Name (use this in Excel)': 'Dead', 'Description': '💀 Ghosted, rejected, or no longer pursuing' },
    ]
    const stageRefWs = XLSX.utils.json_to_sheet(stageRefRows)
    stageRefWs['!cols'] = [{ wch: 4 }, { wch: 32 }, { wch: 56 }]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Leads')
    XLSX.utils.book_append_sheet(wb, helpWs, 'Field Guide')
    XLSX.utils.book_append_sheet(wb, optionsWs, '✅ Valid Options')
    XLSX.utils.book_append_sheet(wb, stageRefWs, 'Stage Reference')

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    saveAs(blob, 'game-import-template.xlsx')
}

// ── PARSE / IMPORT ──

export interface ParsedLead {
    name: string
    platformOrigin: PlatformOrigin
    communicationPlatform: PlatformOrigin
    countryOrigin: string
    personalityTraits: string
    notes: string
    qualificationScore: number
    aestheticsScore: number
    datingIntention: DatingIntention
    funnelStage: FunnelStage
    originDetails: string
    isValid: boolean
    errors: string[]
}

export interface ParseResult {
    leads: ParsedLead[]
    totalRows: number
    validCount: number
    errorCount: number
    errors: string[]
}

function normalizeString(val: unknown): string {
    if (val === null || val === undefined) return ''
    return String(val).trim()
}

function parsePlatform(val: unknown): PlatformOrigin {
    const str = normalizeString(val).toLowerCase()
    const match = VALID_PLATFORMS.find(p => p.toLowerCase() === str)
    return match || 'Other'
}

function parseStage(val: unknown): FunnelStage {
    const str = normalizeString(val).toLowerCase()
    // Try direct match first
    const directMatch = VALID_STAGES.find(s => s.toLowerCase() === str)
    if (directMatch) return directMatch
    // Try friendly name match
    return STAGE_NAME_TO_KEY[str] || 'Stage1'
}

function parseScore(val: unknown): number {
    const num = Number(val)
    if (isNaN(num)) return 5
    return Math.max(1, Math.min(10, Math.round(num)))
}

function parseIntention(val: unknown): DatingIntention {
    const str = normalizeString(val).toLowerCase()
    if (!str) return 'Undecided'
    const match = VALID_INTENTIONS.find(i => i.toLowerCase() === str)
    if (match) return match
    // Fuzzy matching
    if (str.includes('long') && str.includes('short')) return 'Long Term Open to Short'
    if (str.includes('open to short')) return 'Long Term Open to Short'
    if (str.includes('short')) return 'Short Term'
    if (str.includes('long')) return 'Long Term'
    if (str.includes('casual')) return 'Casual'
    if (str.includes('explor')) return 'Exploring'
    return 'Undecided'
}

export function parseExcelFile(file: File): Promise<ParseResult> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer)
                const workbook = XLSX.read(data, { type: 'array' })

                // Read the first sheet
                const sheetName = workbook.SheetNames[0]
                if (!sheetName) {
                    resolve({ leads: [], totalRows: 0, validCount: 0, errorCount: 0, errors: ['No sheets found in file'] })
                    return
                }

                const sheet = workbook.Sheets[sheetName]
                const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet)

                if (rawRows.length === 0) {
                    resolve({ leads: [], totalRows: 0, validCount: 0, errorCount: 0, errors: ['Sheet is empty'] })
                    return
                }

                const globalErrors: string[] = []
                const parsedLeads: ParsedLead[] = []

                rawRows.forEach((row, idx) => {
                    const rowNum = idx + 2 // Excel row (1-indexed + header)
                    const errors: string[] = []

                    // Find the name column (flexible header matching)
                    const name = normalizeString(
                        row['Name'] ?? row['name'] ?? row['NAME'] ?? row['Lead Name'] ?? row['lead name'] ?? ''
                    )

                    if (!name) {
                        errors.push(`Row ${rowNum}: Name is required`)
                    }

                    const parsedOriginPlatform = parsePlatform(
                        row['Origin Platform'] ?? row['origin platform'] ?? row['Platform'] ?? row['platform'] ?? row['PLATFORM'] ?? row['Platform Origin'] ?? ''
                    )

                    const lead: ParsedLead = {
                        name,
                        platformOrigin: parsedOriginPlatform,
                        communicationPlatform: parsePlatform(
                            row['Communication Platform'] ?? row['communication platform'] ?? row['Comm Platform'] ?? row['Talking On'] ?? ''
                        ) || parsedOriginPlatform,
                        countryOrigin: normalizeString(
                            row['Country'] ?? row['country'] ?? row['COUNTRY'] ?? row['Country Origin'] ?? ''
                        ),
                        personalityTraits: normalizeString(
                            row['Personality Traits'] ?? row['personality traits'] ?? row['Personality'] ?? row['Traits'] ?? ''
                        ),
                        notes: normalizeString(
                            row['Notes'] ?? row['notes'] ?? row['NOTES'] ?? row['Comments'] ?? ''
                        ),
                        qualificationScore: parseScore(
                            row['Qualification Score (1-10)'] ?? row['Qualification Score'] ?? row['Qualification'] ?? 5
                        ),
                        aestheticsScore: parseScore(
                            row['Aesthetics Score (1-10)'] ?? row['Aesthetics Score'] ?? row['Aesthetics'] ?? row['Looks'] ?? 5
                        ),
                        datingIntention: parseIntention(
                            row['Dating Intention'] ?? row['dating intention'] ?? row['Intention'] ?? row['intention'] ?? ''
                        ),
                        funnelStage: parseStage(
                            row['Funnel Stage'] ?? row['Stage'] ?? row['stage'] ?? row['Funnel'] ?? ''
                        ),
                        originDetails: normalizeString(
                            row['Origin / How We Met'] ?? row['Origin'] ?? row['origin'] ?? row['How We Met'] ?? row['How we met'] ?? ''
                        ),
                        isValid: errors.length === 0,
                        errors,
                    }

                    if (errors.length > 0) {
                        globalErrors.push(...errors)
                    }

                    parsedLeads.push(lead)
                })

                resolve({
                    leads: parsedLeads,
                    totalRows: rawRows.length,
                    validCount: parsedLeads.filter(l => l.isValid).length,
                    errorCount: parsedLeads.filter(l => !l.isValid).length,
                    errors: globalErrors,
                })
            } catch (err) {
                reject(new Error(`Failed to parse Excel file: ${(err as Error).message}`))
            }
        }

        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsArrayBuffer(file)
    })
}

// Convert parsed leads to CreateLeadInput objects
export function parsedLeadsToCreateInputs(parsed: ParsedLead[]): CreateLeadInput[] {
    return parsed
        .filter(l => l.isValid)
        .map(l => ({
            name: l.name,
            platformOrigin: l.platformOrigin,
            communicationPlatform: l.communicationPlatform || l.platformOrigin,
            countryOrigin: l.countryOrigin || undefined,
            personalityTraits: l.personalityTraits || undefined,
            notes: l.notes || undefined,
            qualificationScore: l.qualificationScore,
            aestheticsScore: l.aestheticsScore,
            datingIntention: l.datingIntention,
            funnelStage: l.funnelStage,
            originDetails: l.originDetails || undefined,
        }))
}
