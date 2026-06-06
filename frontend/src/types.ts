export interface ProjectIntent {
  projectName: string
  objective: string
  timelineWeeks: number
  teamSize: number
  knownRisks: string[]
}

export interface RiskScores {
  overall: number
  delivery: number
  dependency: number
  technicalComplexity: number
  teamCapacity: number
}

export interface Simulation {
  scenario: string
  impact: string
  deltaRisk: number
  severity: 'high' | 'medium' | 'low'
}

export interface Evidence {
  jira: {
    velocityTrend: number[]
    openTickets: number
    blockedTickets: number
    criticalBlockers: { id: string; title: string; priority: string; days_open: number }[]
    allBlockers: { id: string; title: string; priority: string; days_open: number }[]
  }
  github: {
    testCoverage: number
    ciPassRate: number
    openPRs: number
    riskSignals: string[]
    openPRDetails: { id: number; title: string; days_open: number; review_status: string }[]
  }
  wiki: {
    uncompletedItems: number
    pendingDecisions: number
  }
  signals: string[]
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
  evidence: Evidence
  riskScores: RiskScores
  simulations: Simulation[]
  topRisks: string[]
  recommendations: string[]
  executiveSummary: string
}
