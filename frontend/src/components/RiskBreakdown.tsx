import { RiskScores } from '../types'

interface Props { scores: RiskScores }

function Bar({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? 'bg-red-500' : value >= 45 ? 'bg-amber-500' : 'bg-green-500'
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-300">{label}</span>
        <span className={value >= 70 ? 'text-red-400' : value >= 45 ? 'text-amber-400' : 'text-green-400'}>{value}</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

export default function RiskBreakdown({ scores }: Props) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-5">Risk Breakdown</h2>
      <div className="space-y-4">
        <Bar label="Delivery Risk" value={scores.delivery} />
        <Bar label="Dependency Risk" value={scores.dependency} />
        <Bar label="Technical Complexity" value={scores.technicalComplexity} />
        <Bar label="Team Capacity Risk" value={scores.teamCapacity} />
      </div>
    </div>
  )
}
