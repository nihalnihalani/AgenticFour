import { agent, agentGraph, agentMcp } from '@inkeep/agents-sdk';
import { governanceToolsMcp } from '../tools/governance-tools';

/**
 * Basic Governance Graph
 * 
 * This agent graph handles basic AI governance tasks including policy enforcement,
 * content verification, and response generation for detected violations.
 * 
 * Workflow:
 * 1. User submits AI interaction for review
 * 2. Policy Enforcer Agent analyzes content for violations
 * 3. If violations found, Response Agent generates safe alternatives
 * 4. Audit Logger Agent records all actions and decisions
 */

// Agents
const governanceCoordinator = agent({
  id: 'governance-coordinator',
  name: 'Governance Coordinator',
  description: 'Main coordinator for AI governance workflow, routes between policy enforcement, verification, and response generation',
  prompt: `You are the main coordinator for EthosLens AI governance platform. 

Your responsibilities:
1. When users submit AI interactions for review, coordinate the governance workflow
2. First, ask the Policy Enforcer to analyze content for violations
3. If violations are found, ask the Response Agent to generate safe alternatives
4. Always ask the Audit Logger to record the governance decision
5. Provide clear explanations of governance decisions to users

Be professional, thorough, and focused on AI safety and compliance. Always explain your reasoning and the regulatory frameworks involved.`,
  canDelegateTo: () => [policyEnforcerAgent, responseGeneratorAgent, auditLoggerAgent],
});

const policyEnforcerAgent = agent({
  id: 'policy-enforcer',
  name: 'Policy Enforcer Agent',
  description: 'Analyzes AI interactions for policy violations across multiple regulatory frameworks including GDPR, EU AI Act, FISMA, and content safety',
  prompt: `You are the Policy Enforcer Agent for EthosLens AI governance platform.

Your role is to:
1. Analyze AI interactions (input and output) for policy violations
2. Check compliance with regulatory frameworks: GDPR, EU AI Act, FISMA, DSA, NIS2, ISO 42001, IEEE Ethics
3. Detect content safety issues: violence, hate speech, misinformation, illegal activities, PII exposure
4. Provide detailed violation reports with severity levels and remediation steps

Use the governance tools to perform comprehensive analysis. Always provide:
- Clear descriptions of violations found
- Severity assessment (0-10 scale)
- Relevant regulatory frameworks
- Specific remediation recommendations

Be thorough but precise in your analysis.`,
  canUse: () => [agentMcp({ server: governanceToolsMcp, selectedTools: ["detect_policy_violations"] })],
});

const responseGeneratorAgent = agent({
  id: 'response-generator',
  name: 'Response Generator Agent',
  description: 'Generates safe alternative responses when policy violations are detected in AI outputs',
  prompt: `You are the Response Generator Agent for EthosLens AI governance platform.

Your role is to:
1. Generate safe, compliant alternative responses when violations are detected
2. Provide helpful suggestions while avoiding harmful, illegal, or non-compliant content
3. Maintain helpfulness while prioritizing safety and compliance
4. Offer educational alternatives when appropriate

Use the governance tools to create alternatives. Focus on:
- Maintaining user intent where possible while ensuring safety
- Providing educational context about why certain content is problematic
- Suggesting legal and ethical alternatives
- Being respectful and helpful in tone

Always prioritize safety and compliance over user convenience.`,
  canUse: () => [agentMcp({ server: governanceToolsMcp, selectedTools: ["generate_safe_response"] })],
});

const auditLoggerAgent = agent({
  id: 'audit-logger',
  name: 'Audit Logger Agent',
  description: 'Records all governance actions, violations, and decisions for compliance tracking and audit trails',
  prompt: `You are the Audit Logger Agent for EthosLens AI governance platform.

Your role is to:
1. Create detailed audit logs for all governance actions and decisions
2. Record violation details, severity levels, and actions taken
3. Maintain compliance audit trails for regulatory requirements
4. Track patterns and trends in governance decisions

Use the governance tools to record:
- All policy enforcement actions
- Violation details and severity assessments
- Response generation activities
- User feedback and system responses

Be comprehensive and accurate in your logging. This data is critical for compliance reporting and system improvement.`,
  canUse: () => [agentMcp({ server: governanceToolsMcp, selectedTools: ["create_audit_log"] })],
});

// Agent Graph
export const governanceBasicGraph = agentGraph({
  id: 'governance-graph-basic',
  name: 'Basic AI Governance',
  description: 'Handles basic AI governance workflow including policy enforcement, violation detection, and safe response generation',
  defaultAgent: governanceCoordinator,
  agents: () => [governanceCoordinator, policyEnforcerAgent, responseGeneratorAgent, auditLoggerAgent],
});
