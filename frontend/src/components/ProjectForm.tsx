import { useState, KeyboardEvent } from 'react'
import { ProjectIntent } from '../types'

interface Props {
  onAnalyze: (intent: ProjectIntent) => void
  loading: boolean
}

const DEFAULT: ProjectIntent = {
  projectName: 'Customer Portal Modernization',
  objective: 'Modernize the customer portal and reduce release risk',
  timelineWeeks: 12,
  teamSize: 5,
  knownRisks: ['legacy API dependency', 'limited QA capacity', 'unclear production readiness'],
}

export default function ProjectForm({ onAnalyze, loading }: Props) {
  const [form, setForm] = useState<ProjectIntent>(DEFAULT)
  const [riskInput, setRiskInput] = useState('')

  function addRisk() {
    const trimmed = riskInput.trim()
    if (trimmed && !form.knownRisks.includes(trimmed)) {
      setForm(f => ({ ...f, knownRisks: [...f.knownRisks, trimmed] }))
    }
    setRiskInput('')
  }

  function removeRisk(r: string) {
    setForm(f => ({ ...f, knownRisks: f.knownRisks.filter(x => x !== r) }))
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); addRisk() }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-5">Project Intake</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Project Name</label>
          <input
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            value={form.projectName}
            onChange={e => setForm(f => ({ ...f, projectName: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Timeline (weeks)</label>
            <input
              type="number" min={1} max={52}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              value={form.timelineWeeks}
              onChange={e => setForm(f => ({ ...f, timelineWeeks: Number(e.target.value) }))}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Team Size</label>
            <input
              type="number" min={1} max={50}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              value={form.teamSize}
              onChange={e => setForm(f => ({ ...f, teamSize: Number(e.target.value) }))}
            />
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-slate-400 mb-1">Objective</label>
          <textarea
            rows={2}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
            value={form.objective}
            onChange={e => setForm(f => ({ ...f, objective: e.target.value }))}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-slate-400 mb-1">Known Risks <span className="text-slate-600">(press Enter to add)</span></label>
          <div className="flex gap-2 mb-2">
            <input
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              placeholder="e.g. legacy API dependency"
              value={riskInput}
              onChange={e => setRiskInput(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <button
              onClick={addRisk}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-slate-300 transition-colors"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.knownRisks.map(r => (
              <span
                key={r}
                className="inline-flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-full px-3 py-1 text-xs text-slate-300"
              >
                {r}
                <button onClick={() => removeRisk(r)} className="text-slate-500 hover:text-red-400 transition-colors">×</button>
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-5 flex justify-end">
        <button
          onClick={() => onAnalyze(form)}
          disabled={loading || !form.projectName || !form.objective}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg text-sm font-semibold text-white transition-colors"
        >
          {loading ? 'Analyzing…' : 'Run Analysis'}
        </button>
      </div>
    </div>
  )
}
