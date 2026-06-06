import { TracedRecommendation, TracedRisk } from '../types'
import EvidenceTag from './EvidenceTag'

const PRIORITY_STYLE = {
  critical: { badge: 'bg-red-900 text-red-300 border-red-700', bar: 'bg-red-500', dot: 'bg-red-500' },
  high:     { badge: 'bg-amber-900/60 text-amber-300 border-amber-700', bar: 'bg-amber-500', dot: 'bg-amber-400' },
  medium:   { badge: 'bg-blue-900/40 text-blue-300 border-blue-800', bar: 'bg-blue-600', dot: 'bg-blue-400' },
}
const SEVERITY_DOT: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-green-500',
}

interface Props {
  recommendations: TracedRecommendation[]
  topRisks: TracedRisk[]
}

export default function InterventionPanel({ recommendations, topRisks }: Props) {
  return (
    <div className="space-y-4">
      {/* Top Risks */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <p className="text-xs text-slate-400 uppercase tracking-widest mb-4">Top Risks</p>
        <div className="space-y-3">
          {topRisks.map((risk, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-start gap-2">
                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${SEVERITY_DOT[risk.severity]}`} />
                <span className="text-sm text-slate-200">{risk.description}</span>
              </div>
              {risk.evidence.length > 0 && (
                <div className="ml-3.5 flex flex-wrap gap-1">
                  {risk.evidence.map((e, j) => (
                    <EvidenceTag key={j} item={e} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Interventions */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <p className="text-xs text-slate-400 uppercase tracking-widest mb-4">Recommended Interventions</p>
        <div className="space-y-4">
          {recommendations.map((rec, i) => {
            const s = PRIORITY_STYLE[rec.priority]
            return (
              <div key={i} className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className={`w-1 h-full min-h-[1rem] rounded-full flex-shrink-0 mt-1 ${s.dot}`} />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start gap-2 flex-wrap">
                      <span className={`text-xs px-1.5 py-0.5 rounded border font-mono ${s.badge}`}>
                        {rec.priority.toUpperCase()}
                      </span>
                      <span className="text-sm text-slate-100 font-medium">{rec.action}</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{rec.rationale}</p>
                  </div>
                </div>
                {rec.evidence.length > 0 && (
                  <div className="ml-4 flex flex-wrap gap-1">
                    <span className="text-xs text-slate-600 mr-1 self-center">Based on:</span>
                    {rec.evidence.map((e, j) => (
                      <EvidenceTag key={j} item={e} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
