interface Props {
  velocityTrend: number[]
  confidenceScore: number
  riskLabel: 'HIGH' | 'MEDIUM' | 'LOW'
}

export default function ConfidenceTrend({ velocityTrend, confidenceScore, riskLabel }: Props) {
  const maxV = Math.max(...velocityTrend, 1)
  const confColor = confidenceScore >= 70 ? 'text-green-400' : confidenceScore >= 45 ? 'text-amber-400' : 'text-red-400'
  const confLabel = confidenceScore >= 70 ? 'STRONG' : confidenceScore >= 45 ? 'MODERATE' : 'WEAK'

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400 uppercase tracking-widest">Confidence</p>
        <span className="text-xs text-slate-500">{confLabel}</span>
      </div>

      <div className="flex items-end gap-1">
        <span className={`text-4xl font-bold tabular-nums ${confColor}`}>{confidenceScore}</span>
        <span className="text-slate-500 text-lg mb-1">%</span>
      </div>

      {velocityTrend.length >= 2 && (
        <div>
          <p className="text-xs text-slate-500 mb-2">Sprint velocity trend</p>
          <div className="flex items-end gap-2">
            {velocityTrend.map((v, i) => {
              const pct = Math.round((v / maxV) * 100)
              const isLast = i === velocityTrend.length - 1
              const declining = i > 0 && v < velocityTrend[i - 1]
              return (
                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                  <span className="text-xs text-slate-400 tabular-nums">{v}</span>
                  <div
                    className={`w-full rounded-t transition-all ${
                      declining ? 'bg-red-700/60' : 'bg-blue-700/60'
                    } ${isLast ? 'opacity-70' : ''}`}
                    style={{ height: `${Math.max(8, pct * 0.6)}px` }}
                  />
                  <span className="text-xs text-slate-600">S{i + 1}</span>
                </div>
              )
            })}
          </div>
          {velocityTrend[velocityTrend.length - 1] < velocityTrend[0] && (
            <p className="text-xs text-red-400 mt-2">
              ↓ {Math.round((1 - velocityTrend[velocityTrend.length - 1] / velocityTrend[0]) * 100)}% decline — delivery trajectory at risk
            </p>
          )}
        </div>
      )}
    </div>
  )
}
