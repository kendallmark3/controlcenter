import { Simulation } from '../types'

interface Props { simulations: Simulation[] }

const severityStyle = {
  high: 'border-red-900 bg-red-950/40',
  medium: 'border-amber-900 bg-amber-950/30',
  low: 'border-slate-700 bg-slate-800',
}

const deltaStyle = {
  high: 'text-red-400',
  medium: 'text-amber-400',
  low: 'text-slate-400',
}

export default function SimulationPanel({ simulations }: Props) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-5">What-If Simulations</h2>
      <div className="space-y-3">
        {simulations.map((s, i) => (
          <div key={i} className={`border rounded-lg p-3 ${severityStyle[s.severity]}`}>
            <div className="flex justify-between items-start gap-2 mb-1">
              <p className="text-sm font-medium text-slate-200">{s.scenario}</p>
              <span className={`text-xs font-bold whitespace-nowrap ${deltaStyle[s.severity]}`}>+{s.deltaRisk} risk</span>
            </div>
            <p className="text-xs text-slate-400">{s.impact}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
