import { EvidenceData } from '../types'

interface Props {
  evidence: EvidenceData
}

function Pill({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${ok ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
      {label}
    </span>
  )
}

export default function EvidencePanel({ evidence }: Props) {
  const { jira, github, confluence, capacity } = evidence

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <p className="text-xs text-slate-400 uppercase tracking-widest mb-4">Evidence Sources</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* JIRA */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-blue-400">JIRA</span>
            <span className="text-xs text-slate-500">{jira.openTickets} open · {jira.blockedTickets} blocked</span>
          </div>
          {jira.allBlockers.slice(0, 3).map((b) => (
            <div key={b.id} className="text-xs space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${b.priority === 'critical' ? 'bg-red-500' : 'bg-amber-500'}`} />
                <span className="font-mono text-slate-400">{b.id}</span>
                <span className={`text-xs ${b.priority === 'critical' ? 'text-red-400' : 'text-amber-400'}`}>
                  {b.priority}
                </span>
              </div>
              <p className="text-slate-400 pl-3 leading-tight">{b.title}</p>
              <p className="text-slate-600 pl-3">{b.assignee ?? 'unassigned'} · {b.days_open}d open</p>
            </div>
          ))}
          {jira.velocityTrend.length > 0 && (
            <p className="text-xs text-slate-500">
              Velocity: {jira.velocityTrend.join(' → ')} pts
            </p>
          )}
        </div>

        {/* GITHUB */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-purple-400">GITHUB</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Pill label={`${github.testCoverage}% cov`} ok={github.testCoverage >= 70} />
            <Pill label={`${github.ciPassRate}% CI`} ok={github.ciPassRate >= 90} />
            <Pill label={`${github.openPRs} PRs`} ok={github.openPRs < 5} />
          </div>
          {github.openPRDetails.slice(0, 2).map((pr) => (
            <div key={pr.id} className="text-xs space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-slate-400">PR#{pr.id}</span>
                <span className={`${pr.days_open > 7 ? 'text-red-400' : 'text-slate-500'}`}>{pr.days_open}d</span>
              </div>
              <p className="text-slate-400 leading-tight">{pr.title}</p>
              <p className="text-slate-600">{pr.review_status}</p>
            </div>
          ))}
        </div>

        {/* CONFLUENCE */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-cyan-400">CONFLUENCE</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Pill label={`${confluence.unfinishedItems.length} readiness`} ok={confluence.unfinishedItems.length === 0} />
            <Pill label={`${confluence.openDecisions.length} decisions`} ok={confluence.openDecisions.length === 0} />
          </div>
          {confluence.openDecisions.map((adr) => (
            <div key={adr.id} className="text-xs space-y-0.5">
              <span className="font-mono text-slate-400">{adr.id}</span>
              <p className="text-slate-400 leading-tight">{adr.title}</p>
              <p className="text-amber-500">{adr.status}</p>
            </div>
          ))}
          {confluence.unfinishedItems.slice(0, 2).map((item, i) => (
            <p key={i} className="text-xs text-slate-500 flex gap-1.5">
              <span className="text-red-500">☐</span>
              <span>{item.item}</span>
            </p>
          ))}
        </div>

        {/* CAPACITY */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-amber-400">CAPACITY</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Pill label={`${capacity.teamSizeEffective}/${capacity.teamSizeNominal} active`} ok={capacity.teamSizeEffective === capacity.teamSizeNominal} />
            <Pill label={`QA ${Math.round(capacity.qaAllocation * 100)}%`} ok={capacity.qaAllocation >= 0.75} />
          </div>
          {capacity.offRoster.length > 0 && (
            <p className="text-xs text-red-400">{capacity.offRoster.join(', ')} — unavailable</p>
          )}
          {capacity.velocityTrend.length > 0 && (
            <p className="text-xs text-slate-500">
              Velocity: {capacity.velocityTrend.join(' → ')} pts/sprint
            </p>
          )}
        </div>

      </div>

      {evidence.signals.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-800">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Signals</p>
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            {evidence.signals.map((s, i) => (
              <p key={i} className="text-xs text-slate-400 flex gap-1.5">
                <span className="text-slate-600">—</span>
                <span>{s}</span>
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
