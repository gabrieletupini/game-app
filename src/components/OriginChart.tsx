import { useMemo } from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'
import { useGameStore } from '../store/useGameStore'
import type { FunnelStage, PlatformOrigin } from '../types'

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const PLATFORM_COLORS: Record<string, string> = {
    Tinder: '#FF6B6B',
    Bumble: '#FFC107',
    Hinge: '#7B5EBF',
    Instagram: '#E1306C',
    Facebook: '#1877F2',
    WhatsApp: '#25D366',
    Offline: '#6B7280',
    Other: '#9CA3AF',
}

const PLATFORM_EMOJIS: Record<string, string> = {
    Tinder: '🔥',
    Bumble: '💛',
    Hinge: '💜',
    Instagram: '📸',
    Facebook: '👥',
    WhatsApp: '💬',
    Offline: '🌍',
    Other: '📱',
}

const STAGE_COLORS: Record<string, string> = {
    Stage1: 'rgba(59, 130, 246, 0.75)',
    Stage2: 'rgba(16, 185, 129, 0.75)',
    Stage3: 'rgba(245, 158, 11, 0.75)',
    Stage4: 'rgba(139, 92, 246, 0.75)',
    Lover: 'rgba(236, 72, 153, 0.75)',
    Dead: 'rgba(148, 163, 184, 0.5)',
}

const STAGE_LABELS: Record<string, string> = {
    Stage1: 'Stage 1',
    Stage2: 'Stage 2',
    Stage3: 'Stage 3',
    Stage4: 'Stage 4',
    Lover: 'Lover',
    Dead: 'Dead',
}

const ALL_STAGES: FunnelStage[] = ['Stage1', 'Stage2', 'Stage3', 'Stage4', 'Lover', 'Dead']

export default function OriginChart() {
    const leads = useGameStore(state => state.leads)
    const getOriginDistribution = useGameStore(state => state.getOriginDistribution)
    const distribution = getOriginDistribution()

    // Doughnut chart data
    const doughnutData = useMemo(() => {
        if (distribution.length === 0) return null
        return {
            labels: distribution.map(d => d.platform),
            datasets: [{
                data: distribution.map(d => d.count),
                backgroundColor: distribution.map(d => PLATFORM_COLORS[d.platform] || '#9CA3AF'),
                borderColor: '#ffffff',
                borderWidth: 3,
                hoverBorderWidth: 4,
                hoverOffset: 8,
            }],
        }
    }, [distribution])

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleFont: { family: 'Inter', size: 13, weight: 600 as const },
                bodyFont: { family: 'Inter', size: 12 },
                padding: 12,
                cornerRadius: 10,
                displayColors: true,
                boxPadding: 4,
                callbacks: {
                    label: (context: any) => {
                        const value = context.raw
                        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
                        const percentage = ((value / total) * 100).toFixed(1)
                        return ` ${value} leads (${percentage}%)`
                    },
                },
            },
        },
    }

    // Stacked bar: origin × stage
    const stackedBarData = useMemo(() => {
        // Get platforms sorted by count desc
        const platforms = distribution
            .sort((a, b) => b.count - a.count)
            .map(d => d.platform)
        if (platforms.length === 0) return null

        // For each stage, count per platform (including dead for the full picture)
        const datasets = ALL_STAGES.map(stage => ({
            label: STAGE_LABELS[stage],
            data: platforms.map(p =>
                leads.filter(l => l.platformOrigin === p && l.funnelStage === stage).length
            ),
            backgroundColor: STAGE_COLORS[stage],
            borderRadius: 4,
            borderSkipped: false as const,
        }))

        return {
            labels: platforms.map(p => `${PLATFORM_EMOJIS[p] || '📱'} ${p}`),
            datasets,
        }
    }, [leads, distribution])

    const stackedBarOptions = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y' as const,
        plugins: {
            legend: {
                display: true,
                position: 'bottom' as const,
                labels: {
                    usePointStyle: true,
                    pointStyle: 'circle',
                    boxWidth: 8,
                    padding: 12,
                    font: { family: 'Inter', size: 11 },
                },
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleFont: { family: 'Inter', size: 13, weight: 600 as const },
                bodyFont: { family: 'Inter', size: 12 },
                padding: 12,
                cornerRadius: 10,
            },
        },
        scales: {
            x: {
                stacked: true,
                grid: { color: 'rgba(0,0,0,0.04)' },
                ticks: { font: { family: 'Inter', size: 11 }, stepSize: 1 },
            },
            y: {
                stacked: true,
                grid: { display: false },
                ticks: { font: { family: 'Inter', size: 12 } },
            },
        },
    }

    // Per-origin performance stats
    const originStats = useMemo(() => {
        const platforms = [...new Set(leads.map(l => l.platformOrigin))] as PlatformOrigin[]
        return platforms.map(platform => {
            const platformLeads = leads.filter(l => l.platformOrigin === platform)
            const active = platformLeads.filter(l => l.funnelStage !== 'Dead')
            const lovers = platformLeads.filter(l => l.funnelStage === 'Lover')
            const dead = platformLeads.filter(l => l.funnelStage === 'Dead')
            const avgScore = active.length > 0
                ? active.reduce((sum, l) => sum + (((l.qualificationScore || 5) + (l.aestheticsScore || 5)) / 2), 0) / active.length
                : 0
            const conversionRate = platformLeads.length > 0
                ? (lovers.length / platformLeads.length) * 100
                : 0
            const deathRate = platformLeads.length > 0
                ? (dead.length / platformLeads.length) * 100
                : 0
            return {
                platform,
                total: platformLeads.length,
                active: active.length,
                lovers: lovers.length,
                dead: dead.length,
                avgScore,
                conversionRate,
                deathRate,
            }
        }).sort((a, b) => b.total - a.total)
    }, [leads])

    if (distribution.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="text-sm font-bold text-slate-900 mb-4">📍 Lead Origins</h3>
                <div className="flex items-center justify-center h-48 text-sm text-slate-400">
                    Add leads to see origin distribution
                </div>
            </div>
        )
    }

    const totalLeads = distribution.reduce((sum, d) => sum + d.count, 0)
    const bestOrigin = originStats.length > 0
        ? originStats.reduce((best, o) => o.conversionRate > best.conversionRate ? o : best, originStats[0])
        : null

    return (
        <div className="space-y-6">
            {/* Row 1: Doughnut + Legend side by side */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="text-sm font-bold text-slate-900 mb-4">📍 Lead Origins</h3>
                <div className="flex items-center gap-6">
                    {/* Doughnut */}
                    {doughnutData && (
                        <div className="relative w-44 h-44 flex-shrink-0">
                            <Doughnut data={doughnutData} options={doughnutOptions} />
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-bold text-slate-900">{totalLeads}</span>
                                <span className="text-[11px] text-slate-400">active</span>
                            </div>
                        </div>
                    )}

                    {/* Legend */}
                    <div className="flex-1 space-y-2">
                        {distribution
                            .sort((a, b) => b.count - a.count)
                            .map(d => (
                                <div key={d.platform} className="flex items-center gap-2.5">
                                    <div
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: PLATFORM_COLORS[d.platform] || '#9CA3AF' }}
                                    />
                                    <span className="text-sm text-slate-600 flex-1">
                                        {PLATFORM_EMOJIS[d.platform] || '📱'} {d.platform}
                                    </span>
                                    <span className="text-sm font-semibold text-slate-700">{d.count}</span>
                                    <span className="text-xs text-slate-400 w-10 text-right">
                                        {d.percentage.toFixed(0)}%
                                    </span>
                                </div>
                            ))}
                    </div>
                </div>
            </div>

            {/* Row 2: Stacked Bar — Origin × Stage Breakdown */}
            {stackedBarData && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h3 className="text-sm font-bold text-slate-900 mb-1">📊 Origin × Stage Breakdown</h3>
                    <p className="text-xs text-slate-400 mb-4">See how leads from each platform progress through your funnel</p>
                    <div style={{ height: Math.max(180, distribution.length * 44) }}>
                        <Bar data={stackedBarData} options={stackedBarOptions} />
                    </div>
                </div>
            )}

            {/* Row 3: Performance Table */}
            {originStats.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h3 className="text-sm font-bold text-slate-900 mb-1">🏆 Origin Performance</h3>
                    <p className="text-xs text-slate-400 mb-4">Compare conversion rates and quality across platforms</p>

                    {/* Best origin callout */}
                    {bestOrigin && bestOrigin.lovers > 0 && (
                        <div className="mb-4 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2">
                            <span className="text-sm">🥇</span>
                            <span className="text-xs font-medium text-emerald-700">
                                Best converter: <strong>{PLATFORM_EMOJIS[bestOrigin.platform] || '📱'} {bestOrigin.platform}</strong> — {bestOrigin.conversionRate.toFixed(0)}% reached Lover
                            </span>
                        </div>
                    )}

                    <div className="overflow-x-auto -mx-2">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-2">Platform</th>
                                    <th className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-2 text-center">Total</th>
                                    <th className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-2 text-center">Active</th>
                                    <th className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-2 text-center">❤️ Lovers</th>
                                    <th className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-2 text-center">💀 Dead</th>
                                    <th className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-2 text-center">Avg Score</th>
                                    <th className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-2 text-center">Conv %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {originStats.map(o => (
                                    <tr key={o.platform} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                                        <td className="px-2 py-2.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PLATFORM_COLORS[o.platform] || '#9CA3AF' }} />
                                                <span className="text-sm font-medium text-slate-700">{PLATFORM_EMOJIS[o.platform] || '📱'} {o.platform}</span>
                                            </div>
                                        </td>
                                        <td className="px-2 py-2.5 text-center text-sm font-semibold text-slate-700">{o.total}</td>
                                        <td className="px-2 py-2.5 text-center text-sm text-slate-600">{o.active}</td>
                                        <td className="px-2 py-2.5 text-center text-sm font-semibold text-rose-600">{o.lovers}</td>
                                        <td className="px-2 py-2.5 text-center text-sm text-slate-400">{o.dead}</td>
                                        <td className="px-2 py-2.5 text-center">
                                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${o.avgScore >= 7 ? 'bg-emerald-50 text-emerald-600' : o.avgScore >= 5 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'}`}>
                                                {o.avgScore.toFixed(1)}
                                            </span>
                                        </td>
                                        <td className="px-2 py-2.5 text-center">
                                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${o.conversionRate > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                                                {o.conversionRate.toFixed(0)}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
