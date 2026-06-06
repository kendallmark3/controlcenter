import { EvidenceRef } from '../types'

const SOURCE_LABELS: Record<string, string> = {
  jira: 'JIRA',
  github: 'GH',
  confluence: 'CONF',
  capacity: 'CAP',
  docs: 'DOC',
}

const SOURCE_COLORS: Record<string, string> = {
  jira: 'text-blue-400 border-blue-800',
  github: 'text-purple-400 border-purple-800',
  confluence: 'text-cyan-400 border-cyan-800',
  capacity: 'text-amber-400 border-amber-800',
  docs: 'text-slate-400 border-slate-700',
}

export default function EvidenceTag({ item: r }: { item: EvidenceRef }) {
  const label = SOURCE_LABELS[r.source] ?? r.source.toUpperCase()
  const color = SOURCE_COLORS[r.source] ?? 'text-slate-400 border-slate-700'

  const inner = (
    <span className={`inline-flex items-center gap-1.5 text-xs border rounded px-1.5 py-0.5 bg-slate-900 ${color}`}>
      <span className="font-mono font-semibold">{label}</span>
      <span className="text-slate-300 font-medium truncate max-w-[140px]" title={r.title}>{r.refId}</span>
      <span className="text-slate-500 hidden sm:inline truncate max-w-[160px]" title={r.signal}>{r.signal}</span>
    </span>
  )

  return r.url
    ? <a href={r.url} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">{inner}</a>
    : inner
}
