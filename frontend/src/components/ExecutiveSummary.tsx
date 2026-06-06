interface Props {
  summary: string
  plan: {
    objective: string
    constraints: string[]
    assumptions: string[]
    questions: string[]
  }
}

export default function ExecutiveSummary({ summary, plan }: Props) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Executive Summary</h2>
        <p className="text-sm text-slate-300 leading-relaxed">{summary}</p>
      </div>
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">Key Constraints</p>
        <ul className="space-y-1">
          {plan.constraints.map((c, i) => (
            <li key={i} className="text-xs text-slate-400 flex gap-2">
              <span className="text-slate-600">—</span>{c}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">Open Questions</p>
        <ul className="space-y-1">
          {plan.questions.map((q, i) => (
            <li key={i} className="text-xs text-slate-400 flex gap-2">
              <span className="text-blue-500">?</span>{q}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
