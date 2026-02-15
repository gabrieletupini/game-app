import { useMemo } from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { useGameStore } from '../store/useGameStore'

ChartJS.register(ArcElement, Tooltip, Legend)

const PLATFORM_COLORS: Record<string, string> = {
    Tinder: '#FF6B6B',
    Bumble: '#FFC107',
    Instagram: '#E1306C',
    Facebook: '#1877F2',
    WhatsApp: '#25D366',
    Offline: '#6B7280',
    Other: '#9CA3AF',
}

const PLATFORM_EMOJIS: Record<string, string> = {
    Tinder: '🔥',
    Bumble: '💛',
    Instagram: '📸',
    Facebook: '👥',
    WhatsApp: '💬',
    Offline: '🌍',
    Other: '📱',
}

export default function OriginChart() {
    const getOriginDistribution = useGameStore(state => state.getOriginDistribution)
    const distribution = getOriginDistribution()

    const chartData = useMemo(() => {
        if (distribution.length === 0) return null

        return {
            labels: distribution.map(d => d.platform),
            datasets: [
                {
                    data: distribution.map(d => d.count),
                    backgroundColor: distribution.map(d => PLATFORM_COLORS[d.platform] || '#9CA3AF'),
                    borderColor: '#ffffff',
                    borderWidth: 3,
                    hoverBorderWidth: 4,
                    hoverOffset: 8,
                },
            ],
        }
    }, [distribution])

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
            legend: {
                display: false,
            },
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

    if (!chartData || distribution.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Lead Origins</h3>
                <div className="flex items-center justify-center h-48 text-sm text-slate-400">
                    Add leads to see origin distribution
                </div>
            </div>
        )
    }

    const totalLeads = distribution.reduce((sum, d) => sum + d.count, 0)

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Lead Origins</h3>

            <div className="flex items-center gap-6">
                {/* Chart */}
                <div className="relative w-44 h-44 flex-shrink-0">
                    <Doughnut data={chartData} options={chartOptions} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-slate-900">{totalLeads}</span>
                        <span className="text-[11px] text-slate-400">total</span>
                    </div>
                </div>

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
                                    {PLATFORM_EMOJIS[d.platform]} {d.platform}
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
    )
}
