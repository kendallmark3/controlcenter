import { useState } from 'react'
import { ProjectIntent } from '../types'

interface Props {
  onAnalyze: (intent: ProjectIntent) => void
  loading: boolean
}

export default function ProjectForm({ onAnalyze, loading }: Props) {
  const [form, setForm] = useState<ProjectIntent>({
    projectName: 'Customer Portal Modernization',
    objective: 'Modernize the customer portal and reduce release risk',
    timelineWeeks: 12,
    teamSize: 5,
    knownRisks: ['legacy API dependency', 'limited QA capacity', 'unclear production readiness'],
  })
  const [risksText, setRisksText] = useState(form.knownRisks.join('\n'))

  function set<K extends keyof ProjectIntent>(k: K, v: ProjectIntent[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    onAnalyze({ ...form, knownRisks: risksText.split('\n').map(s => s.trim()).filter(Boolean) })
  }

  return (
    <form onSubmit={submit} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400 uppercase tracking-widest">Project Intent</p>
        <span className="text-xs text-slate-600">All fields are used to derive evidence and risk</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs text-slate-500">Project Name</label>
          <input
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-600"
            value={form.projectName}
            onChange={e => set('projectName', e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-500">Objective</label>
          <input
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-600"
            value={form.objective}
            onChange={e => set('objective', e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-500">Timeline (weeks)</label>
          <input
            type="number" min={1} max={104}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-600"
            value={form.timelineWeeks}
            onChange={e => set('timelineWeeks', parseInt(e.target.value) || 12)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-500">Team Size</label>
          <input
            type="number" min={1} max={50}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-600"
            value={form.teamSize}
            onChange={e => set('teamSize', parseInt(e.target.value) || 5)}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-slate-500">Known Risks (one per line)</label>
        <textarea
          rows={3}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-600 resize-none"
          value={risksText}
          onChange={e => setRisksText(e.target.value)}
          placeholder="legacy API dependency&#10;limited QA capacity&#10;unclear production readiness"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-700 hover:bg-blue-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
      >
        {loading ? 'Analyzing…' : 'Run Analysis'}
      </button>
    </form>
  )
}
