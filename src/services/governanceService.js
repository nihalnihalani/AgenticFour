// Unified governance service (JS runtime for Node server)
import { inkeepAgentsService } from './inkeepAgentsService.js';

class GovernanceService {
  static instance;
  useInkeepAgents;
  inkeepAvailable = false;

  constructor() {
    this.useInkeepAgents = process.env.VITE_USE_INKEEP_AGENTS === 'true';
    this.#checkInkeepAvailability();
  }

  static getInstance() {
    if (!GovernanceService.instance) {
      GovernanceService.instance = new GovernanceService();
    }
    return GovernanceService.instance;
  }

  async #checkInkeepAvailability() {
    this.inkeepAvailable = await inkeepAgentsService.isAvailable();
  }

  async processInteraction(input, output, context) {
    const interaction = {
      id: `interaction_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      input,
      output,
      timestamp: new Date(),
      status: 'pending',
      severity: 'low',
      violations: [],
      agentActions: [],
    };

    const useInkeep = this.useInkeepAgents && this.inkeepAvailable;
    try {
      if (useInkeep) {
        const result = await inkeepAgentsService.processAdvancedGovernance(input, output, context);
        interaction.violations.push(...(result.violations || []));
        interaction.agentActions.push(...(result.agentActions || []));
      } else {
        // Minimal legacy fallback: approve by default
        interaction.agentActions.push({ agentName: 'Legacy', action: 'log', details: 'Legacy fallback used', timestamp: new Date() });
      }
    } catch (e) {
      interaction.agentActions.push({ agentName: 'GovernanceService', action: 'log', details: `Processing error: ${e.message}`, timestamp: new Date() });
    }

    // Finalize status
    if (interaction.violations.length === 0) {
      interaction.status = 'approved';
      interaction.severity = 'low';
    } else if (interaction.violations.some(v => v.severity >= 9)) {
      interaction.status = 'blocked';
      interaction.severity = 'critical';
    } else if (interaction.violations.some(v => v.severity >= 7)) {
      interaction.status = 'pending';
      interaction.severity = 'high';
    } else {
      interaction.status = 'pending';
      interaction.severity = 'medium';
    }

    return interaction;
  }

  getStatus() {
    return {
      usingInkeep: this.useInkeepAgents,
      inkeepAvailable: this.inkeepAvailable,
      agentType: this.useInkeepAgents && this.inkeepAvailable ? 'inkeep' : 'legacy',
    };
  }

  async switchAgentType(useInkeep) {
    this.useInkeepAgents = !!useInkeep;
    if (this.useInkeepAgents) await this.#checkInkeepAvailability();
  }

  async getGovernanceInsights(timeframe = 'today') {
    if (this.useInkeepAgents && this.inkeepAvailable) {
      return await inkeepAgentsService.getGovernanceInsights(timeframe);
    }
    return { totalInteractions: 0, totalViolations: 0, blockedCount: 0, approvalRate: '100%' };
  }
}

export const governanceService = GovernanceService.getInstance();


