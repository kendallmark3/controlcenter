interface Props { recommendations: string[] }

export default function RecommendationsPanel({ recommendations }: Props) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-5">Recommended Actions</h2>
      <ol className="space-y-3">
        {recommendations.map((r, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-900 border border-blue-700 text-blue-300 text-xs flex items-center justify-center font-bold">
              {i + 1}
            </span>
            <p className="text-sm text-slate-300 leading-relaxed">{r}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}
