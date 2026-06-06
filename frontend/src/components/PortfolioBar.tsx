import { AnalysisResult } from '../types'

const RISK_COLORS = {
  HIGH: 'border-red-600 bg-red-950/40',
  MEDIUM: 'border-amber-600 bg-amber-950/30',
  LOW: 'border-green-600 bg-green-950/30',
}
const RISK_DOT = {
  HIGH: 'bg-red-500',
  MEDIUM: 'bg-amber-500',
  LOW: 'bg-green-500',
}

interface Props {
  projects: AnalysisResult[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
}

export default function PortfolioBar({ projects, activeId, onSelect, onNew }: Props) {
  if (projects.length === 0) return null

  return (
    <div className="border-b border-slate-800 bg-slate-900/60 px-6 py-3">
      <div className="max-w-7xl mx-auto">
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Portfolio</p>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {projects.map((p) => (
            <button
              key={p.projectId}
              onClick={() => onSelect(p.projectId)}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-medium transition-all ${
                activeId === p.projectId
                  ? RISK_COLORS[p.riskLabel] + ' opacity-100'
                  : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${RISK_DOT[p.riskLabel]}`} />
              <span className="text-slate-200">{p.projectName}</span>
              <span className="text-slate-400">{p.riskScore}</span>
            </button>
          ))}
          <button
            onClick={onNew}
            className="flex-shrink-0 px-3 py-1.5 rounded border border-dashed border-slate-600 text-xs text-slate-500 hover:border-slate-500 hover:text-slate-400 transition-all"
          >
            + New Project
          </button>
        </div>
      </div>
    </div>
  )
}
