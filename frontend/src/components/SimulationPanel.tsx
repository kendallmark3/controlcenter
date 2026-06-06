import { useState } from 'react'
import { Simulation } from '../types'
import EvidenceTag from './EvidenceTag'

interface Props {
  simulations: Simulation[]
}

const SEV_STYLE = {
  high:   'border-red-700 text-red-300',
  medium: 'border-amber-700 text-amber-300',
  low:    'border-green-700 text-green-300',
}

export default function SimulationPanel({ simulations }: Props) {
  const [active, setActive] = useState(0)
  const sim = simulations[active]

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <p className="text-xs text-slate-400 uppercase tracking-widest mb-4">Simulation — What If?</p>

      <div className="flex flex-wrap gap-2 mb-5">
        {simulations.map((s, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`text-xs px-2.5 py-1 rounded border transition-all ${
              i === active
                ? SEV_STYLE[s.severity] + ' bg-slate-800'
                : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'
            }`}
          >
            {s.scenario.length > 30 ? s.scenario.slice(0, 28) + '…' : s.scenario}
          </button>
        ))}
      </div>

      {sim && (
        <div className="space-y-3 border-t border-slate-800 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-100">{sim.scenario}</p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{sim.impact}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className={`text-xs font-mono px-1.5 py-0.5 rounded border ${SEV_STYLE[sim.severity]}`}>
                {sim.severity.toUpperCase()}
              </span>
              <p className="text-xs text-slate-500 mt-1">+{sim.deltaRisk} risk</p>
            </div>
          </div>

          {sim.evidence.length > 0 && (
            <div>
              <p className="text-xs text-slate-600 mb-1">Why this is plausible:</p>
              <div className="flex flex-wrap gap-1">
                {sim.evidence.map((e, i) => (
                  <EvidenceTag key={i} ref={e} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
