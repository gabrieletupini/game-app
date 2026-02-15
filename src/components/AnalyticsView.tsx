import { useMemo } from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'
import { useGameStore } from '../store/useGameStore'
import { Users, Heart, TrendingUp, Flame, Thermometer, Snowflake, Calendar } from 'lucide-react'
import OriginChart from './OriginChart'

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

export default function AnalyticsView() {
    const leads = useGameStore(state => state.leads)
    const interactions = useGameStore(state => state.interactions)
    const getFunnelStats = useGameStore(state => state.getFunnelStats)
    const getTemperatureDistribution = useGameStore(state => state.getTemperatureDistribution)

    const stats = getFunnelStats()
    const tempDist = getTemperatureDistribution()

    const activeLeads = leads.filter(l => l.funnelStage !== 'Dead')

    // Funnel visualization data
    const funnelData = useMemo(() => ({
        labels: ['Stage 1', 'Stage 2', 'Stage 3', 'Stage 4'],
        datasets: [{
            data: [stats.stage1, stats.stage2, stats.stage3, stats.stage4],
            backgroundColor: [
                'rgba(59, 130, 246, 0.7)',
                'rgba(16, 185, 129, 0.7)',
                'rgba(245, 158, 11, 0.7)',
                'rgba(139, 92, 246, 0.7)',
            ],
            borderColor: [
                'rgba(59, 130, 246, 1)',
                'rgba(16, 185, 129, 1)',
                'rgba(245, 158, 11, 1)',
                'rgba(139, 92, 246, 1)',
            ],
            borderWidth: 1,
            borderRadius: 8,
        }],
    }), [stats])

    const funnelOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
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
                grid: { display: false },
                ticks: { font: { family: 'Inter', size: 12 } },
            },
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(0,0,0,0.05)' },
                ticks: { font: { family: 'Inter', size: 11 }, stepSize: 1 },
            },
        },
    }

    // Temperature chart data
    const tempData = useMemo(() => {
        const hot = tempDist.find(t => t.temperature === 'Hot')?.count || 0
        const warm = tempDist.find(t => t.temperature === 'Warm')?.count || 0
        const cold = tempDist.find(t => t.temperature === 'Cold')?.count || 0

        return {
            labels: ['Hot', 'Warm', 'Cold'],
            datasets: [{
                data: [hot, warm, cold],
                backgroundColor: ['#EF4444', '#F59E0B', '#3B82F6'],
                borderColor: '#ffffff',
                borderWidth: 3,
                hoverOffset: 6,
            }],
        }
    }, [tempDist])

    const tempOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleFont: { family: 'Inter', size: 13, weight: 600 as const },
                bodyFont: { family: 'Inter', size: 12 },
                padding: 12,
                cornerRadius: 10,
            },
        },
    }

    // Recent activity
    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const newLeadsThisMonth = leads.filter(l => new Date(l.createdAt) >= thisMonth).length
    const interactionsThisWeek = interactions.filter(i => new Date(i.occurredAt) >= thisWeek).length

    const avgScore = activeLeads.length > 0
        ? (activeLeads.reduce((sum, l) => sum + (l.qualificationScore || 5), 0) / activeLeads.length).toFixed(1)
        : '0'

    return (
        <div className="space-y-6">
            {/* Title */}
            <div>
                <h2 className="text-xl font-bold text-slate-900">Analytics</h2>
                <p className="text-sm text-slate-500">Overview of your dating pipeline</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    { label: 'Active Leads', value: activeLeads.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Lovers', value: stats.lovers, icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50' },
                    { label: 'New This Month', value: newLeadsThisMonth, icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Avg Score', value: avgScore, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
                ].map(item => {
                    const Icon = item.icon
                    return (
                        <div key={item.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
                            <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                                <Icon className={`w-5 h-5 ${item.color}`} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900 leading-none">{item.value}</p>
                                <p className="text-xs text-slate-500 mt-1">{item.label}</p>
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Funnel Bar Chart */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h3 className="text-sm font-bold text-slate-900 mb-4">Funnel Distribution</h3>
                    {activeLeads.length === 0 ? (
                        <div className="flex items-center justify-center h-48 text-sm text-slate-400">
                            Add leads to see funnel data
                        </div>
                    ) : (
                        <div className="h-48">
                            <Bar data={funnelData} options={funnelOptions} />
                        </div>
                    )}
                </div>

                {/* Temperature Distribution */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h3 className="text-sm font-bold text-slate-900 mb-4">Temperature Distribution</h3>
                    {activeLeads.length === 0 ? (
                        <div className="flex items-center justify-center h-48 text-sm text-slate-400">
                            Add leads to see temperature data
                        </div>
                    ) : (
                        <div className="flex items-center gap-6">
                            <div className="relative w-36 h-36 flex-shrink-0">
                                <Doughnut data={tempData} options={tempOptions} />
                            </div>
                            <div className="flex-1 space-y-3">
                                {[
                                    { label: 'Hot', emoji: '🔥', icon: Flame, color: 'text-red-500', bg: 'bg-red-50', count: tempDist.find(t => t.temperature === 'Hot')?.count || 0 },
                                    { label: 'Warm', emoji: '🌡️', icon: Thermometer, color: 'text-amber-500', bg: 'bg-amber-50', count: tempDist.find(t => t.temperature === 'Warm')?.count || 0 },
                                    { label: 'Cold', emoji: '❄️', icon: Snowflake, color: 'text-blue-500', bg: 'bg-blue-50', count: tempDist.find(t => t.temperature === 'Cold')?.count || 0 },
                                ].map(item => (
                                    <div key={item.label} className="flex items-center gap-3">
                                        <div className={`w-8 h-8 ${item.bg} rounded-lg flex items-center justify-center`}>
                                            <span className="text-sm">{item.emoji}</span>
                                        </div>
                                        <span className="text-sm text-slate-600 flex-1">{item.label}</span>
                                        <span className="text-sm font-bold text-slate-700">{item.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Origin Analytics — full width section */}
            <OriginChart />

            {/* Activity Summary */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Activity Summary</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-slate-100">
                        <span className="text-sm text-slate-600">Total Leads</span>
                        <span className="text-sm font-bold text-slate-900">{stats.total}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-slate-100">
                        <span className="text-sm text-slate-600">Active Leads</span>
                        <span className="text-sm font-bold text-slate-900">{activeLeads.length}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-slate-100">
                        <span className="text-sm text-slate-600">Conversion Rate</span>
                        <span className="text-sm font-bold text-emerald-600">{stats.conversionRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-slate-100">
                        <span className="text-sm text-slate-600">Interactions This Week</span>
                        <span className="text-sm font-bold text-slate-900">{interactionsThisWeek}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-slate-100">
                        <span className="text-sm text-slate-600">Dead Leads</span>
                        <span className="text-sm font-bold text-slate-500">{stats.dead}</span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                        <span className="text-sm text-slate-600">Total Interactions</span>
                        <span className="text-sm font-bold text-slate-900">{interactions.length}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
