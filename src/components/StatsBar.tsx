import { Users, Heart, TrendingUp, Snowflake } from 'lucide-react'
import { useGameStore } from '../store/useGameStore'

export default function StatsBar() {
    const getFunnelStats = useGameStore(state => state.getFunnelStats)
    const stats = getFunnelStats()

    const items = [
        {
            label: 'Active Leads',
            value: stats.total - stats.dead,
            icon: Users,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
        },
        {
            label: 'Lovers',
            value: stats.lovers,
            icon: Heart,
            color: 'text-rose-600',
            bg: 'bg-rose-50',
        },
        {
            label: 'Conversion',
            value: `${stats.conversionRate.toFixed(1)}%`,
            icon: TrendingUp,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
        },
        {
            label: 'Cold Leads',
            value: stats.dead,
            icon: Snowflake,
            color: 'text-blue-500',
            bg: 'bg-blue-50',
        },
    ]

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {items.map(item => {
                const Icon = item.icon
                return (
                    <div
                        key={item.label}
                        className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3"
                    >
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
    )
}
