import { useState } from 'react'
import { AnalysisResult, ProjectIntent } from './types'
import ProjectForm from './components/ProjectForm'
import RiskBreakdown from './components/RiskBreakdown'
import SimulationPanel from './components/SimulationPanel'
import EvidencePanel from './components/EvidencePanel'
import InterventionPanel from './components/InterventionPanel'
import ConfidenceTrend from './components/ConfidenceTrend'
import PortfolioBar from './components/PortfolioBar'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function App() {
  const [projects, setProjects] = useState<AnalysisResult[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const result = projects.find(p => p.projectId === activeId) ?? null

  async function handleAnalyze(intent: ProjectIntent) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/intent/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(intent),
      })
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const data: AnalysisResult = await res.json()
      setProjects(prev => {
        const updated = prev.filter(p => p.projectId !== data.projectId)
        return [...updated, data]
      })
      setActiveId(data.projectId)
      setShowForm(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to connect to backend')
    } finally {
      setLoading(false)
    }
  }

  const RISK_BANNER = result ? {
    HIGH:   'border-red-700 bg-red-950/20',
    MEDIUM: 'border-amber-700 bg-amber-950/20',
    LOW:    'border-green-700 bg-green-950/20',
  }[result.riskLabel] : ''

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900 px-6 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex gap-0.5">
              <div className="w-1 h-6 bg-blue-500 rounded-full" />
              <div className="w-1 h-6 bg-blue-700 rounded-full" />
              <div className="w-1 h-6 bg-blue-900 rounded-full" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-widest text-white uppercase">Enterprise Control Center</h1>
              <p className="text-xs text-slate-500">Intent · Evidence · Simulation · Decision</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {result && (
              <button
                onClick={() => setShowForm(f => !f)}
                className="text-xs text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-500 rounded px-2.5 py-1 transition-all"
              >
                {showForm ? 'Hide Form' : 'New Analysis'}
              </button>
            )}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Mock Mode
            </div>
          </div>
        </div>
      </header>

      {/* Portfolio Bar */}
      <PortfolioBar
        projects={projects}
        activeId={activeId}
        onSelect={(id) => { setActiveId(id); setShowForm(false) }}
        onNew={() => setShowForm(true)}
      />

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* Project Form */}
        {showForm && (
          <ProjectForm onAnalyze={handleAnalyze} loading={loading} />
        )}

        {error && (
          <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-red-300 text-sm">
            {error} — Make sure the backend is running on port 8000.
          </div>
        )}

        {loading && (
          <div className="text-center py-12 space-y-3">
            <div className="flex items-center justify-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0ms]" />
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:150ms]" />
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
            <p className="text-slate-500 text-sm">Running agents — gathering evidence…</p>
          </div>
        )}

        {result && (
          <>
            {/* Project header */}
            <div className={`rounded-xl border p-4 flex items-center justify-between ${RISK_BANNER}`}>
              <div>
                <h2 className="text-lg font-semibold text-white">{result.projectName}</h2>
                <p className="text-sm text-slate-400 mt-0.5">{result.plan.objective}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Executive Summary</p>
                <p className="text-xs text-slate-300 max-w-xs leading-relaxed mt-1">{result.executiveSummary}</p>
              </div>
            </div>

            {/* Row 1: Risk + Confidence */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <RiskBreakdown scores={result.riskScores} />
              <ConfidenceTrend
                velocityTrend={result.evidence.capacity?.velocityTrend ?? result.evidence.jira.velocityTrend}
                confidenceScore={result.confidenceScore}
                riskLabel={result.riskLabel}
              />
            </div>

            {/* Row 2: Interventions (risks + recommendations) */}
            <InterventionPanel
              recommendations={result.recommendations}
              topRisks={result.topRisks}
            />

            {/* Row 3: Evidence Sources */}
            <EvidencePanel evidence={result.evidence} />

            {/* Row 4: Simulation */}
            <SimulationPanel simulations={result.simulations} />

            {/* Row 5: Plan */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <p className="text-xs text-slate-400 uppercase tracking-widest mb-4">Planner Output</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Constraints', items: result.plan.constraints },
                  { label: 'Assumptions', items: result.plan.assumptions },
                  { label: 'Open Questions', items: result.plan.questions },
                ].map(({ label, items }) => (
                  <div key={label}>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">{label}</p>
                    <ul className="space-y-1.5">
                      {items.map((item, i) => (
                        <li key={i} className="flex gap-2 text-xs text-slate-400">
                          <span className="text-slate-600 flex-shrink-0 mt-0.5">—</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {!result && !loading && !showForm && (
          <div className="text-center py-20 text-slate-600">
            <p className="text-4xl mb-3">◈</p>
            <p className="text-sm">Select a project from the portfolio or run a new analysis</p>
          </div>
        )}
      </main>
    </div>
  )
}
