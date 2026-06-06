import { useState } from 'react'
import { Evidence } from '../types'

interface Props { evidence: Evidence }

type Tab = 'signals' | 'jira' | 'github' | 'wiki'

export default function EvidencePanel({ evidence }: Props) {
  const [tab, setTab] = useState<Tab>('signals')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'signals', label: 'Key Signals' },
    { id: 'jira', label: 'Jira' },
    { id: 'github', label: 'GitHub' },
    { id: 'wiki', label: 'Wiki' },
  ]

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Evidence</h2>
      <div className="flex gap-1 mb-5 border-b border-slate-800">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm transition-colors border-b-2 -mb-px ${
              tab === t.id
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'signals' && (
        <ul className="space-y-2">
          {evidence.signals.map((s, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="text-amber-400 mt-0.5 shrink-0">⚠</span>
              <span className="text-slate-300">{s}</span>
            </li>
          ))}
        </ul>
      )}

      {tab === 'jira' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Open Tickets', value: evidence.jira.openTickets },
              { label: 'Blocked', value: evidence.jira.blockedTickets, warn: true },
              { label: 'Critical Blockers', value: evidence.jira.criticalBlockers.length, warn: true },
            ].map(m => (
              <div key={m.label} className="bg-slate-800 rounded-lg p-3 text-center">
                <p className={`text-2xl font-bold ${m.warn && m.value > 0 ? 'text-red-400' : 'text-slate-200'}`}>{m.value}</p>
                <p className="text-xs text-slate-400 mt-1">{m.label}</p>
              </div>
            ))}
          </div>
          {evidence.jira.velocityTrend.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 mb-2">Sprint Velocity</p>
              <div className="flex gap-2 items-end h-12">
                {evidence.jira.velocityTrend.map((v, i) => {
                  const max = Math.max(...evidence.jira.velocityTrend)
                  const pct = (v / max) * 100
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs text-slate-400">{v}</span>
                      <div className="w-full bg-blue-500 rounded-sm" style={{ height: `${pct}%` }} />
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {evidence.jira.allBlockers.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 mb-2">Active Blockers</p>
              <div className="space-y-2">
                {evidence.jira.allBlockers.map(b => (
                  <div key={b.id} className="flex items-start justify-between text-xs bg-slate-800 rounded px-3 py-2">
                    <div className="flex gap-2">
                      <span className={`font-mono ${b.priority === 'critical' ? 'text-red-400' : 'text-amber-400'}`}>{b.id}</span>
                      <span className="text-slate-300">{b.title}</span>
                    </div>
                    <span className="text-slate-500 shrink-0 ml-2">{b.days_open}d</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'github' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Test Coverage', value: `${evidence.github.testCoverage}%`, warn: evidence.github.testCoverage < 70 },
              { label: 'CI Pass Rate', value: `${evidence.github.ciPassRate}%`, warn: evidence.github.ciPassRate < 90 },
              { label: 'Open PRs', value: evidence.github.openPRs, warn: false },
            ].map(m => (
              <div key={m.label} className="bg-slate-800 rounded-lg p-3 text-center">
                <p className={`text-2xl font-bold ${m.warn ? 'text-amber-400' : 'text-slate-200'}`}>{m.value}</p>
                <p className="text-xs text-slate-400 mt-1">{m.label}</p>
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-2">Risk Signals</p>
            <ul className="space-y-1">
              {evidence.github.riskSignals.map((s, i) => (
                <li key={i} className="text-xs text-slate-300 flex gap-2">
                  <span className="text-amber-400">▸</span>{s}
                </li>
              ))}
            </ul>
          </div>
          {evidence.github.openPRDetails.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 mb-2">Open Pull Requests</p>
              {evidence.github.openPRDetails.map(pr => (
                <div key={pr.id} className="flex items-center justify-between text-xs bg-slate-800 rounded px-3 py-2 mb-1">
                  <span className="text-slate-300">#{pr.id} {pr.title}</span>
                  <div className="flex gap-2 text-slate-500 shrink-0 ml-2">
                    <span>{pr.days_open}d</span>
                    <span className={pr.review_status === 'approved' ? 'text-green-400' : 'text-amber-400'}>{pr.review_status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'wiki' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800 rounded-lg p-4 text-center">
            <p className={`text-4xl font-bold ${evidence.wiki.uncompletedItems > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {evidence.wiki.uncompletedItems}
            </p>
            <p className="text-xs text-slate-400 mt-1">Uncompleted Readiness Items</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 text-center">
            <p className={`text-4xl font-bold ${evidence.wiki.pendingDecisions > 0 ? 'text-amber-400' : 'text-green-400'}`}>
              {evidence.wiki.pendingDecisions}
            </p>
            <p className="text-xs text-slate-400 mt-1">Pending / TBD Decisions</p>
          </div>
        </div>
      )}
    </div>
  )
}
