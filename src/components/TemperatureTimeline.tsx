import { useMemo } from 'react'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'
import type { Lead, Interaction } from '../types'
import { formatDate } from '../utils/dateHelpers'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler)

const TEMP_VALUE: Record<string, number> = { Hot: 3, Warm: 2, Cold: 1 }
const TEMP_COLOR: Record<number, string> = {
    3: '#EF4444',  // Hot red
    2: '#F59E0B',  // Warm amber
    1: '#3B82F6',  // Cold blue
}

interface TemperatureTimelineProps {
    lead: Lead
    interactions: Interaction[]
    compact?: boolean  // smaller version for detail modal
}

/**
 * Per-lead interactive temperature timeline + messaging frequency
 */
export default function TemperatureTimeline({ lead, interactions, compact = false }: TemperatureTimelineProps) {
    const leadInteractions = useMemo(
        () => interactions
            .filter(i => i.leadId === lead.id)
            .sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()),
        [interactions, lead.id]
    )

    // Build timeline data from temperatureHistory + current state
    const timelineData = useMemo(() => {
        const history = lead.temperatureHistory || []
        // If no history, synthesize from creation date
        const points: { date: string; temp: number }[] = []

        if (history.length === 0) {
            // Create initial point from createdAt
            points.push({ date: lead.createdAt, temp: TEMP_VALUE[lead.temperature] || 1 })
        } else {
            for (const h of history) {
                points.push({ date: h.date, temp: TEMP_VALUE[h.temperature] || 1 })
            }
        }

        // Add current state as latest point if different from last
        const now = new Date().toISOString()
        const currentVal = TEMP_VALUE[lead.temperature] || 1
        if (points.length === 0 || points[points.length - 1].temp !== currentVal) {
            points.push({ date: now, temp: currentVal })
        }

        return points
    }, [lead])

    // Weekly message frequency (last 8 weeks)
    const weeklyFrequency = useMemo(() => {
        const weeks: { label: string; outgoing: number; incoming: number }[] = []
        const now = new Date()

        for (let w = 7; w >= 0; w--) {
            const weekStart = new Date(now.getTime() - (w + 1) * 7 * 24 * 60 * 60 * 1000)
            const weekEnd = new Date(now.getTime() - w * 7 * 24 * 60 * 60 * 1000)

            const weekInteractions = leadInteractions.filter(i => {
                const d = new Date(i.occurredAt)
                return d >= weekStart && d < weekEnd
            })

            weeks.push({
                label: formatDate(weekStart, 'MMM dd'),
                outgoing: weekInteractions.filter(i => i.direction === 'Outgoing').length,
                incoming: weekInteractions.filter(i => i.direction === 'Incoming').length,
            })
        }

        return weeks
    }, [leadInteractions])

    // Temperature line chart
    const tempChartData = useMemo(() => ({
        labels: timelineData.map(p => formatDate(p.date, 'MMM dd')),
        datasets: [{
            label: 'Temperature',
            data: timelineData.map(p => p.temp),
            borderColor: (ctx: any) => {
                const raw = ctx.raw as number | undefined
                return raw ? (TEMP_COLOR[raw] || '#94A3B8') : '#94A3B8'
            },
            segment: {
                borderColor: (ctx: any) => {
                    const val = ctx.p1?.parsed?.y
                    return val ? (TEMP_COLOR[val] || '#94A3B8') : '#94A3B8'
                },
            },
            backgroundColor: 'transparent',
            tension: 0.3,
            borderWidth: 3,
            pointRadius: 5,
            pointBackgroundColor: timelineData.map(p => TEMP_COLOR[p.temp] || '#94A3B8'),
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            fill: false,
        }],
    }), [timelineData])

    const tempChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleFont: { family: 'Inter', size: 12 },
                bodyFont: { family: 'Inter', size: 12 },
                padding: 10,
                cornerRadius: 8,
                callbacks: {
                    label: (ctx: any) => {
                        const val = ctx.raw
                        const label = val === 3 ? '🔥 Hot' : val === 2 ? '🌡️ Warm' : '❄️ Cold'
                        return ` ${label}`
                    },
                },
            },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { font: { family: 'Inter', size: 10 }, maxRotation: 45 },
            },
            y: {
                min: 0.5,
                max: 3.5,
                grid: { color: 'rgba(0,0,0,0.04)' },
                ticks: {
                    stepSize: 1,
                    font: { family: 'Inter', size: 10 },
                    callback: (val: number | string) => {
                        const v = Number(val)
                        return v === 3 ? '🔥 Hot' : v === 2 ? '🌡️ Warm' : v === 1 ? '❄️ Cold' : ''
                    },
                },
            },
        },
    }

    // Messaging frequency stacked bar chart
    const freqChartData = useMemo(() => ({
        labels: weeklyFrequency.map(w => w.label),
        datasets: [
            {
                label: '📤 Sent',
                data: weeklyFrequency.map(w => w.outgoing),
                backgroundColor: 'rgba(139, 92, 246, 0.6)',
                borderRadius: 4,
            },
            {
                label: '📥 Received',
                data: weeklyFrequency.map(w => w.incoming),
                backgroundColor: 'rgba(16, 185, 129, 0.6)',
                borderRadius: 4,
            },
        ],
    }), [weeklyFrequency])

    const freqChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'bottom' as const,
                labels: {
                    usePointStyle: true,
                    pointStyle: 'circle',
                    boxWidth: 8,
                    padding: 10,
                    font: { family: 'Inter', size: 10 },
                },
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleFont: { family: 'Inter', size: 12 },
                bodyFont: { family: 'Inter', size: 11 },
                padding: 10,
                cornerRadius: 8,
            },
        },
        scales: {
            x: {
                stacked: true,
                grid: { display: false },
                ticks: { font: { family: 'Inter', size: 10 }, maxRotation: 45 },
            },
            y: {
                stacked: true,
                beginAtZero: true,
                grid: { color: 'rgba(0,0,0,0.04)' },
                ticks: { font: { family: 'Inter', size: 10 }, stepSize: 1 },
            },
        },
    }

    const height = compact ? 140 : 180

    if (leadInteractions.length === 0 && timelineData.length <= 1) {
        return (
            <div className="text-center py-4 text-xs text-slate-400">
                No interaction data yet — temperature history will build over time
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Temperature line */}
            {timelineData.length > 1 && (
                <div>
                    <h4 className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
                        🌡️ Temperature Timeline
                    </h4>
                    <div style={{ height }}>
                        <Line data={tempChartData} options={tempChartOptions} />
                    </div>
                </div>
            )}

            {/* Messaging frequency */}
            {leadInteractions.length > 0 && (
                <div>
                    <h4 className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
                        💬 Weekly Messaging Frequency
                    </h4>
                    <div style={{ height }}>
                        <Bar data={freqChartData} options={freqChartOptions} />
                    </div>
                </div>
            )}

            {/* Response rate stat */}
            {leadInteractions.length > 0 && (
                <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-xl">
                    <div className="text-center flex-1">
                        <p className="text-lg font-bold text-purple-600">{leadInteractions.filter(i => i.direction === 'Outgoing').length}</p>
                        <p className="text-[10px] text-slate-400">📤 Sent</p>
                    </div>
                    <div className="w-px h-8 bg-slate-200" />
                    <div className="text-center flex-1">
                        <p className="text-lg font-bold text-emerald-600">{leadInteractions.filter(i => i.direction === 'Incoming').length}</p>
                        <p className="text-[10px] text-slate-400">📥 Received</p>
                    </div>
                    <div className="w-px h-8 bg-slate-200" />
                    <div className="text-center flex-1">
                        <p className="text-lg font-bold text-slate-700">
                            {(() => {
                                const out = leadInteractions.filter(i => i.direction === 'Outgoing').length
                                const inc = leadInteractions.filter(i => i.direction === 'Incoming').length
                                return out > 0 ? `${((inc / out) * 100).toFixed(0)}%` : '—'
                            })()}
                        </p>
                        <p className="text-[10px] text-slate-400">Response Rate</p>
                    </div>
                </div>
            )}
        </div>
    )
}
