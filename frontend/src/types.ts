export interface ProjectIntent {
  projectName: string
  objective: string
  timelineWeeks: number
  teamSize: number
  knownRisks: string[]
  jiraProjectKey?: string
  githubRepo?: string
  confluenceSpace?: string
}

export type EvidenceSource = 'jira' | 'github' | 'confluence' | 'capacity' | 'docs'

export interface EvidenceRef {
  source: EvidenceSource
  refId: string
  title: string
  url?: string
  signal: string
}

export interface TracedRisk {
  description: string
  severity: 'high' | 'medium' | 'low'
  evidence: EvidenceRef[]
}

export interface TracedRecommendation {
  action: string
  rationale: string
  priority: 'critical' | 'high' | 'medium'
  evidence: EvidenceRef[]
}

export interface RiskScores {
  overall: number
  delivery: number
  dependency: number
  technicalComplexity: number
  teamCapacity: number
  dimensionEvidence: {
    delivery: EvidenceRef[]
    dependency: EvidenceRef[]
    technicalComplexity: EvidenceRef[]
    teamCapacity: EvidenceRef[]
  }
}

export interface Simulation {
  scenario: string
  impact: string
  deltaRisk: number
  severity: 'high' | 'medium' | 'low'
  evidence: EvidenceRef[]
}

export interface EvidenceData {
  jira: {
    velocityTrend: number[]
    openTickets: number
    blockedTickets: number
    criticalBlockers: { id: string; title: string; priority: string; assignee?: string; days_open: number }[]
    allBlockers: { id: string; title: string; priority: string; assignee?: string; days_open: number }[]
  }
  github: {
    testCoverage: number
    ciPassRate: number
    openPRs: number
    riskSignals: string[]
    openPRDetails: { id: number; title: string; days_open: number; review_status: string }[]
  }
  confluence: {
    openDecisions: { id: string; title: string; status: string }[]
    productionReadiness: { checklist: { item: string; done: boolean }[] }
    unfinishedItems: { item: string; done: boolean }[]
    knownDependencies: { id: string; name: string; owner: string; note?: string }[]
  }
  capacity: {
    teamSizeNominal: number
    teamSizeEffective: number
    qaAllocation: number
    velocityTrend: number[]
    offRoster: string[]
  }
  signals: string[]
  refs: Record<string, EvidenceRef[]>
}

export interface AnalysisResult {
  projectId: string
  projectName: string
  riskScore: number
  confidenceScore: number
  riskLabel: 'HIGH' | 'MEDIUM' | 'LOW'
  plan: {
    objective: string
    constraints: string[]
    assumptions: string[]
    questions: string[]
  }
  evidence: EvidenceData
  riskScores: RiskScores
  simulations: Simulation[]
  topRisks: TracedRisk[]
  recommendations: TracedRecommendation[]
  executiveSummary: string
}
