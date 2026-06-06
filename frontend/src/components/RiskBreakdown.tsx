import { RiskScores } from '../types'
import EvidenceTag from './EvidenceTag'

interface Props {
  scores: RiskScores
}

const DIMENSIONS = [
  { key: 'delivery' as const,            label: 'Delivery' },
  { key: 'dependency' as const,          label: 'Dependency' },
  { key: 'technicalComplexity' as const, label: 'Complexity' },
  { key: 'teamCapacity' as const,        label: 'Capacity' },
]

function bar(value: number) {
  if (value >= 70) return 'bg-red-600'
  if (value >= 45) return 'bg-amber-500'
  return 'bg-green-600'
}

export default function RiskBreakdown({ scores }: Props) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs text-slate-400 uppercase tracking-widest">Risk Breakdown</p>
        <div className="flex items-center gap-2">
          <span className="text-3xl font-bold tabular-nums text-white">{scores.overall}</span>
          <span className={`text-xs px-2 py-0.5 rounded font-mono font-semibold ${
            scores.overall >= 70 ? 'bg-red-900 text-red-300' : scores.overall >= 45 ? 'bg-amber-900 text-amber-300' : 'bg-green-900 text-green-300'
          }`}>
            {scores.overall >= 70 ? 'HIGH' : scores.overall >= 45 ? 'MEDIUM' : 'LOW'}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {DIMENSIONS.map(({ key, label }) => {
          const val = scores[key]
          const ev = scores.dimensionEvidence?.[key] ?? []
          return (
            <div key={key} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">{label}</span>
                <span className="tabular-nums font-semibold text-slate-200">{val}</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${bar(val)}`}
                  style={{ width: `${val}%` }}
                />
              </div>
              {ev.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {ev.slice(0, 2).map((e, i) => (
                    <EvidenceTag key={i} item={e} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
