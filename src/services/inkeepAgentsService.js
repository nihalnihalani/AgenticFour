// Inkeep Agents integration service (JS version for Node runtime)

class InkeepAgentsService {
  static instance;

  constructor() {
    this.baseUrl = process.env.VITE_INKEEP_AGENTS_URL || 'http://localhost:3003';
    this.isEnabled = process.env.VITE_USE_INKEEP_AGENTS === 'true';
  }

  static getInstance() {
    if (!InkeepAgentsService.instance) {
      InkeepAgentsService.instance = new InkeepAgentsService();
    }
    return InkeepAgentsService.instance;
  }

  async isAvailable() {
    if (!this.isEnabled) return false;
    const candidates = [
      `${this.baseUrl}/health`,
      `${this.baseUrl}/openapi.json`,
      `${this.baseUrl}/`,
    ];
    for (const url of candidates) {
      try {
        const res = await fetch(url, { method: 'GET' });
        // Some dev servers return 404 on root; treat any HTTP response as availability signal
        if (res.ok || res.status === 404) {
          return true;
        }
      } catch (_) {
        // try next candidate
      }
    }
    return false;
  }

  async processAdvancedGovernance(input, output, context) {
    const response = await fetch(`${this.baseUrl}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        graphId: 'governance-graph-advanced',
        message: `Please perform advanced governance analysis on this AI interaction:\n\nInput: "${input}"\nOutput: "${output}"\n${context ? `Context: ${JSON.stringify(context)}` : ''}`,
      }),
    });
    if (!response.ok) throw new Error(`Inkeep agents API error: ${response.status}`);
    const result = await response.json();
    return this.#parseAdvanced(result);
  }

  async processFeedback(interactionId, feedback) {
    const response = await fetch(`${this.baseUrl}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        graphId: 'compliance-audit-graph',
        message: `Please process user feedback for interaction ${interactionId}:\nType: ${feedback.rating}\n${feedback.comment ? `Comment: ${feedback.comment}` : ''}`,
      }),
    });
    if (!response.ok) throw new Error(`Inkeep agents API error: ${response.status}`);
    const result = await response.json();
    return { feedbackProcessed: true, auditLogCreated: true, raw: result };
  }

  async getGovernanceInsights(timeframe = 'today') {
    const response = await fetch(`${this.baseUrl}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        graphId: 'compliance-audit-graph',
        message: `Provide governance insights for ${timeframe}.`,
      }),
    });
    if (!response.ok) throw new Error(`Inkeep agents API error: ${response.status}`);
    const result = await response.json();
    return { raw: result };
  }

  #parseBasic(response) {
    const content = response.content || response.message || '';
    const hasViolation = /violation|blocked/i.test(content);
    const severity = /critical/i.test(content) ? 'critical' : hasViolation ? 'high' : 'low';
    return {
      violations: hasViolation ? [{ type: 'compliance', description: 'Detected by Inkeep', severity: /critical/i.test(content) ? 9 : 7, confidence: 0.85, reason: 'Inkeep analysis' }] : [],
      agentActions: [{ agentName: 'InkeepGovernanceCoordinator', action: hasViolation ? 'flag' : 'approve', details: content.slice(0, 200) + '...', timestamp: new Date() }],
      status: hasViolation ? (/critical/i.test(content) ? 'blocked' : 'pending') : 'approved',
      severity,
    };
  }

  #parseAdvanced(response) {
    const basic = this.#parseBasic(response);
    return { ...basic, verificationResults: { isAccurate: !/misinformation/i.test(response.content || ''), confidence: 0.85 } };
  }
}

export const inkeepAgentsService = InkeepAgentsService.getInstance();


