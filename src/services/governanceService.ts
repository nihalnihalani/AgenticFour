import { LLMInteraction, AgentAction, Violation } from '../types';
import { agents } from '../agents';
import { inkeepAgentsService } from './inkeepAgentsService';

/**
 * Unified governance service that can use either legacy agents or Inkeep agents
 * Provides seamless switching between implementations
 */
export class GovernanceService {
  private static instance: GovernanceService;
  private useInkeepAgents: boolean;
  private inkeepAvailable: boolean = false;

  constructor() {
    this.useInkeepAgents = process.env.VITE_USE_INKEEP_AGENTS === 'true';
    this.checkInkeepAvailability();
  }

  static getInstance(): GovernanceService {
    if (!GovernanceService.instance) {
      GovernanceService.instance = new GovernanceService();
    }
    return GovernanceService.instance;
  }

  private async checkInkeepAvailability() {
    this.inkeepAvailable = await inkeepAgentsService.isAvailable();
    console.log(`🤖 Inkeep agents ${this.inkeepAvailable ? 'available' : 'not available'}`);
  }

  /**
   * Process an AI interaction through the governance system
   */
  async processInteraction(input: string, output: string, context?: any): Promise<LLMInteraction> {
    const interactionId = `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🛡️ Processing interaction ${interactionId} with ${this.shouldUseInkeep() ? 'Inkeep' : 'legacy'} agents`);

    const interaction: LLMInteraction = {
      id: interactionId,
      input,
      output,
      timestamp: new Date(),
      status: 'pending',
      severity: 'low',
      violations: [],
      agentActions: []
    };

    try {
      if (this.shouldUseInkeep()) {
        await this.processWithInkeepAgents(interaction, context);
      } else {
        await this.processWithLegacyAgents(interaction);
      }
    } catch (error) {
      console.error('Error in governance processing:', error);
      
      // Fallback to legacy agents if Inkeep fails
      if (this.shouldUseInkeep()) {
        console.log('🔄 Falling back to legacy agents');
        await this.processWithLegacyAgents(interaction);
      }
    }

    // Determine final status and severity
    this.determineFinalStatus(interaction);

    return interaction;
  }

  /**
   * Process user feedback on governance decisions
   */
  async processFeedback(interactionId: string, feedback: {
    rating: 'positive' | 'negative' | 'report';
    comment?: string;
  }): Promise<void> {
    try {
      if (this.shouldUseInkeep()) {
        await inkeepAgentsService.processFeedback(interactionId, feedback);
        console.log(`📝 Feedback processed through Inkeep agents for ${interactionId}`);
      } else {
        // Legacy feedback processing
        console.log(`📝 Feedback processed through legacy system for ${interactionId}:`, feedback);
      }
    } catch (error) {
      console.error('Error processing feedback:', error);
    }
  }

  /**
   * Get governance insights and analytics
   */
  async getGovernanceInsights(timeframe: string = 'today'): Promise<any> {
    try {
      if (this.shouldUseInkeep()) {
        return await inkeepAgentsService.getGovernanceInsights(timeframe);
      } else {
        // Return mock insights for legacy system
        return {
          totalInteractions: 100,
          totalViolations: 8,
          blockedCount: 2,
          approvalRate: '94%',
          topViolationTypes: ['PII', 'Misinformation', 'Bias'],
          complianceStatus: {
            gdpr: 'compliant',
            contentSafety: 'compliant'
          },
          trends: {
            violationTrend: 'stable',
            complianceTrend: 'improving'
          }
        };
      }
    } catch (error) {
      console.error('Error getting governance insights:', error);
      throw error;
    }
  }

  /**
   * Check if we should use Inkeep agents
   */
  private shouldUseInkeep(): boolean {
    return this.useInkeepAgents && this.inkeepAvailable;
  }

  /**
   * Process interaction using Inkeep agents
   */
  private async processWithInkeepAgents(interaction: LLMInteraction, context?: any): Promise<void> {
    try {
      // Use advanced governance for more comprehensive analysis
      const result = await inkeepAgentsService.processAdvancedGovernance(
        interaction.input,
        interaction.output,
        context
      );

      // Merge results into interaction
      interaction.violations.push(...result.violations);
      interaction.agentActions.push(...result.agentActions);
      
      // Add Inkeep-specific agent actions
      interaction.agentActions.push({
        agentName: 'InkeepIntegration',
        action: 'log',
        details: `Processed through Inkeep Advanced Governance with ${result.violations.length} violations detected`,
        timestamp: new Date()
      });

      console.log(`✅ Inkeep processing complete: ${result.violations.length} violations, status: ${result.status}`);
    } catch (error) {
      console.error('Error processing with Inkeep agents:', error);
      throw error;
    }
  }

  /**
   * Process interaction using legacy agents
   */
  private async processWithLegacyAgents(interaction: LLMInteraction): Promise<void> {
    try {
      // Process with each legacy agent
      const policyActions = await agents.policyEnforcer.process(interaction);
      interaction.agentActions.push(...policyActions);

      const verifierActions = await agents.verifier.process(interaction);
      interaction.agentActions.push(...verifierActions);

      const responseActions = await agents.responseAgent.process(interaction);
      interaction.agentActions.push(...responseActions);

      const auditActions = await agents.auditLogger.process(interaction);
      interaction.agentActions.push(...auditActions);

      const feedbackActions = await agents.feedbackAgent.process(interaction);
      interaction.agentActions.push(...feedbackActions);

      console.log(`✅ Legacy processing complete: ${interaction.violations.length} violations detected`);
    } catch (error) {
      console.error('Error processing with legacy agents:', error);
      throw error;
    }
  }

  /**
   * Determine the final status and severity based on violations
   */
  private determineFinalStatus(interaction: LLMInteraction): void {
    if (interaction.violations.length === 0) {
      interaction.status = 'approved';
      interaction.severity = 'low';
      return;
    }

    const maxSeverity = Math.max(...interaction.violations.map(v => v.severity));
    const criticalViolations = interaction.violations.filter(v => v.severity >= 9);
    const highViolations = interaction.violations.filter(v => v.severity >= 7);

    if (criticalViolations.length > 0) {
      interaction.status = 'blocked';
      interaction.severity = 'critical';
    } else if (highViolations.length > 0) {
      interaction.status = 'pending';
      interaction.severity = 'high';
    } else if (maxSeverity >= 5) {
      interaction.status = 'pending';
      interaction.severity = 'medium';
    } else {
      interaction.status = 'approved';
      interaction.severity = 'low';
    }
  }

  /**
   * Get current configuration status
   */
  getStatus(): {
    usingInkeep: boolean;
    inkeepAvailable: boolean;
    agentType: 'inkeep' | 'legacy';
  } {
    return {
      usingInkeep: this.useInkeepAgents,
      inkeepAvailable: this.inkeepAvailable,
      agentType: this.shouldUseInkeep() ? 'inkeep' : 'legacy'
    };
  }

  /**
   * Switch between Inkeep and legacy agents
   */
  async switchAgentType(useInkeep: boolean): Promise<void> {
    this.useInkeepAgents = useInkeep;
    if (useInkeep) {
      await this.checkInkeepAvailability();
    }
    console.log(`🔄 Switched to ${this.shouldUseInkeep() ? 'Inkeep' : 'legacy'} agents`);
  }
}

export const governanceService = GovernanceService.getInstance();
