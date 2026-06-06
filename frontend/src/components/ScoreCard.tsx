interface Props {
  label: string
  value: number
  suffix: string
  color: 'red' | 'amber' | 'green'
  badge: string
}

const colors = {
  red: { value: 'text-red-400', badge: 'bg-red-950 text-red-400 border-red-800', ring: 'border-red-900' },
  amber: { value: 'text-amber-400', badge: 'bg-amber-950 text-amber-400 border-amber-800', ring: 'border-amber-900' },
  green: { value: 'text-green-400', badge: 'bg-green-950 text-green-400 border-green-800', ring: 'border-green-900' },
}

export default function ScoreCard({ label, value, suffix, color, badge }: Props) {
  const c = colors[color]
  return (
    <div className={`bg-slate-900 border ${c.ring} rounded-xl p-5`}>
      <p className="text-xs text-slate-400 uppercase tracking-widest mb-3">{label}</p>
      <div className="flex items-end gap-2 mb-3">
        <span className={`text-6xl font-bold ${c.value}`}>{value}</span>
        <span className="text-slate-500 text-lg mb-2">{suffix}</span>
      </div>
      <span className={`inline-block border rounded-full px-3 py-0.5 text-xs font-semibold ${c.badge}`}>
        {badge}
      </span>
    </div>
  )
}
