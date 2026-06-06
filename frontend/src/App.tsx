import { useState } from 'react'
import { AnalysisResult, ProjectIntent } from './types'
import ProjectForm from './components/ProjectForm'
import ScoreCard from './components/ScoreCard'
import RiskBreakdown from './components/RiskBreakdown'
import SimulationPanel from './components/SimulationPanel'
import EvidencePanel from './components/EvidencePanel'
import RecommendationsPanel from './components/RecommendationsPanel'
import ExecutiveSummary from './components/ExecutiveSummary'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function App() {
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      setResult(await res.json())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to connect to backend')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-blue-500 rounded-full" />
            <div>
              <h1 className="text-lg font-semibold tracking-wide text-white">Enterprise Control Center</h1>
              <p className="text-xs text-slate-400">Intent → Evidence → Simulation → Decision</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            Mock Mode Active
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Intake Form */}
        <ProjectForm onAnalyze={handleAnalyze} loading={loading} />

        {error && (
          <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-red-300 text-sm">
            {error} — Make sure the backend is running on port 8000.
          </div>
        )}

        {result && (
          <>
            {/* Score row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ScoreCard
                label="Risk Score"
                value={result.riskScore}
                suffix="/100"
                color={result.riskScore >= 70 ? 'red' : result.riskScore >= 45 ? 'amber' : 'green'}
                badge={result.riskLabel}
              />
              <ScoreCard
                label="Confidence Score"
                value={result.confidenceScore}
                suffix="%"
                color={result.confidenceScore >= 70 ? 'green' : result.confidenceScore >= 45 ? 'amber' : 'red'}
                badge={result.confidenceScore >= 70 ? 'STRONG' : result.confidenceScore >= 45 ? 'MODERATE' : 'WEAK'}
              />
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">Top Risks</p>
                <ul className="space-y-2">
                  {result.topRisks.map((r, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-300">
                      <span className="text-red-400 mt-0.5">▸</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Risk breakdown + Simulations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <RiskBreakdown scores={result.riskScores} />
              <SimulationPanel simulations={result.simulations} />
            </div>

            {/* Evidence */}
            <EvidencePanel evidence={result.evidence} />

            {/* Recommendations + Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <RecommendationsPanel recommendations={result.recommendations} />
              <ExecutiveSummary
                summary={result.executiveSummary}
                plan={result.plan}
              />
            </div>
          </>
        )}
      </main>
    </div>
  )
}
