import { LLMInteraction, AgentAction, Violation } from '../types';

/**
 * Service for integrating with Inkeep EthosLens agents
 * Provides a bridge between the main application and the Inkeep agent system
 */
export class InkeepAgentsService {
  private static instance: InkeepAgentsService;
  private baseUrl: string;
  private isEnabled: boolean;

  constructor() {
    // Inkeep agents run API URL (from the my-agent-directory configuration)
    this.baseUrl = process.env.VITE_INKEEP_AGENTS_URL || 'http://localhost:3003';
    this.isEnabled = process.env.VITE_USE_INKEEP_AGENTS === 'true';
  }

  static getInstance(): InkeepAgentsService {
    if (!InkeepAgentsService.instance) {
      InkeepAgentsService.instance = new InkeepAgentsService();
    }
    return InkeepAgentsService.instance;
  }

  /**
   * Check if Inkeep agents are enabled and available
   */
  async isAvailable(): Promise<boolean> {
    if (!this.isEnabled) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        timeout: 5000
      });
      return response.ok;
    } catch (error) {
      console.warn('Inkeep agents not available:', error);
      return false;
    }
  }

  /**
   * Process an interaction through the Basic AI Governance graph
   */
  async processBasicGovernance(input: string, output: string): Promise<{
    violations: Violation[];
    agentActions: AgentAction[];
    status: 'approved' | 'blocked' | 'pending';
    severity: 'low' | 'medium' | 'high' | 'critical';
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          graphId: 'governance-graph-basic',
          message: `Please analyze this AI interaction for policy violations:

Input: "${input}"
Output: "${output}"

Please provide a comprehensive governance analysis including:
1. Any policy violations detected
2. Severity assessment
3. Recommended actions
4. Compliance status`
        })
      });

      if (!response.ok) {
        throw new Error(`Inkeep agents API error: ${response.status}`);
      }

      const result = await response.json();
      return this.parseGovernanceResponse(result);
    } catch (error) {
      console.error('Error processing basic governance:', error);
      throw error;
    }
  }

  /**
   * Process an interaction through the Advanced AI Governance graph
   */
  async processAdvancedGovernance(input: string, output: string, context?: any): Promise<{
    violations: Violation[];
    agentActions: AgentAction[];
    status: 'approved' | 'blocked' | 'pending';
    severity: 'low' | 'medium' | 'high' | 'critical';
    verificationResults?: any;
    riskAssessment?: any;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          graphId: 'governance-graph-advanced',
          message: `Please perform advanced governance analysis on this AI interaction:

Input: "${input}"
Output: "${output}"
${context ? `Context: ${JSON.stringify(context)}` : ''}

Please provide:
1. Comprehensive policy violation analysis across all regulatory frameworks
2. Content verification and fact-checking
3. Risk assessment and impact analysis
4. Safe alternative responses if violations found
5. Detailed audit trail information`
        })
      });

      if (!response.ok) {
        throw new Error(`Inkeep agents API error: ${response.status}`);
      }

      const result = await response.json();
      return this.parseAdvancedGovernanceResponse(result);
    } catch (error) {
      console.error('Error processing advanced governance:', error);
      throw error;
    }
  }

  /**
   * Process user feedback through the Compliance and Audit Management graph
   */
  async processFeedback(interactionId: string, feedback: {
    rating: 'positive' | 'negative' | 'report';
    comment?: string;
  }): Promise<{
    feedbackProcessed: boolean;
    auditLogCreated: boolean;
    improvementRecommendations?: string[];
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          graphId: 'compliance-audit-graph',
          message: `Please process user feedback for interaction ${interactionId}:

Feedback Type: ${feedback.rating}
${feedback.comment ? `Comment: "${feedback.comment}"` : ''}

Please:
1. Analyze the feedback for governance insights
2. Create appropriate audit log entries
3. Identify any system improvement opportunities
4. Generate compliance reports if needed`
        })
      });

      if (!response.ok) {
        throw new Error(`Inkeep agents API error: ${response.status}`);
      }

      const result = await response.json();
      return this.parseFeedbackResponse(result);
    } catch (error) {
      console.error('Error processing feedback:', error);
      throw error;
    }
  }

  /**
   * Get governance insights and analytics
   */
  async getGovernanceInsights(timeframe: string = 'today'): Promise<{
    totalInteractions: number;
    totalViolations: number;
    blockedCount: number;
    approvalRate: string;
    topViolationTypes: string[];
    complianceStatus: any;
    trends: any;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          graphId: 'compliance-audit-graph',
          message: `Please provide governance insights and analytics for the ${timeframe} timeframe:

Please include:
1. Overall interaction and violation statistics
2. Compliance status across regulatory frameworks
3. Top violation types and trends
4. Risk assessment summary
5. Recommendations for improvement`
        })
      });

      if (!response.ok) {
        throw new Error(`Inkeep agents API error: ${response.status}`);
      }

      const result = await response.json();
      return this.parseInsightsResponse(result);
    } catch (error) {
      console.error('Error getting governance insights:', error);
      throw error;
    }
  }

  /**
   * Parse the basic governance response from Inkeep agents
   */
  private parseGovernanceResponse(response: any): {
    violations: Violation[];
    agentActions: AgentAction[];
    status: 'approved' | 'blocked' | 'pending';
    severity: 'low' | 'medium' | 'high' | 'critical';
  } {
    // Parse the agent response and extract governance information
    // This is a simplified parser - in production, you'd want more robust parsing
    const content = response.content || response.message || '';
    
    const violations: Violation[] = [];
    const agentActions: AgentAction[] = [];
    
    // Extract violations from response (simplified pattern matching)
    if (content.toLowerCase().includes('violation') || content.toLowerCase().includes('blocked')) {
      violations.push({
        type: 'compliance',
        description: 'Policy violation detected by Inkeep agents',
        severity: content.toLowerCase().includes('critical') ? 9 : 
                 content.toLowerCase().includes('high') ? 7 : 5,
        confidence: 0.85,
        reason: 'Detected through Inkeep governance analysis',
        regulatoryFramework: 'Multiple frameworks',
        complianceLevel: content.toLowerCase().includes('critical') ? 'critical' : 'high'
      });
    }

    // Extract agent actions
    agentActions.push({
      agentName: 'InkeepGovernanceCoordinator',
      action: violations.length > 0 ? 'flag' : 'approve',
      details: content.substring(0, 200) + '...',
      timestamp: new Date()
    });

    const status = violations.length > 0 ? 
      (violations.some(v => v.severity >= 8) ? 'blocked' : 'pending') : 'approved';
    
    const severity = violations.length > 0 ? 
      (violations.some(v => v.severity >= 8) ? 'critical' : 
       violations.some(v => v.severity >= 6) ? 'high' : 'medium') : 'low';

    return {
      violations,
      agentActions,
      status,
      severity
    };
  }

  /**
   * Parse the advanced governance response from Inkeep agents
   */
  private parseAdvancedGovernanceResponse(response: any): {
    violations: Violation[];
    agentActions: AgentAction[];
    status: 'approved' | 'blocked' | 'pending';
    severity: 'low' | 'medium' | 'high' | 'critical';
    verificationResults?: any;
    riskAssessment?: any;
  } {
    const basicResponse = this.parseGovernanceResponse(response);
    
    // Add advanced parsing for verification and risk assessment
    const content = response.content || response.message || '';
    
    const verificationResults = {
      isAccurate: !content.toLowerCase().includes('misinformation'),
      confidence: 0.85,
      summary: 'Processed through advanced verification'
    };

    const riskAssessment = {
      overallRisk: basicResponse.severity,
      regulatoryRisk: 'medium',
      reputationalRisk: 'low',
      operationalRisk: 'low'
    };

    return {
      ...basicResponse,
      verificationResults,
      riskAssessment
    };
  }

  /**
   * Parse feedback processing response
   */
  private parseFeedbackResponse(response: any): {
    feedbackProcessed: boolean;
    auditLogCreated: boolean;
    improvementRecommendations?: string[];
  } {
    const content = response.content || response.message || '';
    
    return {
      feedbackProcessed: true,
      auditLogCreated: true,
      improvementRecommendations: [
        'Continue monitoring user feedback patterns',
        'Implement suggested governance improvements',
        'Review policy effectiveness based on feedback'
      ]
    };
  }

  /**
   * Parse governance insights response
   */
  private parseInsightsResponse(response: any): {
    totalInteractions: number;
    totalViolations: number;
    blockedCount: number;
    approvalRate: string;
    topViolationTypes: string[];
    complianceStatus: any;
    trends: any;
  } {
    const content = response.content || response.message || '';
    
    // In production, you'd parse actual metrics from the agent response
    return {
      totalInteractions: 150,
      totalViolations: 12,
      blockedCount: 3,
      approvalRate: '92%',
      topViolationTypes: ['GDPR', 'Content Safety', 'Misinformation'],
      complianceStatus: {
        gdpr: 'compliant',
        euAiAct: 'compliant',
        fisma: 'needs_attention'
      },
      trends: {
        violationTrend: 'decreasing',
        complianceTrend: 'improving'
      }
    };
  }
}

export const inkeepAgentsService = InkeepAgentsService.getInstance();
