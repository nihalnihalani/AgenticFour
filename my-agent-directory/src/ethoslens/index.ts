import { governanceBasicGraph } from './graphs/governance-basic.js';
import { governanceAdvancedGraph } from './graphs/governance-advanced.js';
import { complianceGraph } from './graphs/compliance-audit.js';
import { project } from '@inkeep/agents-sdk';

export const ethosLensProject = project({
  id: 'ethoslens',
  name: 'EthosLens AI Governance Platform',
  description: 'AI governance platform providing real-time compliance monitoring, violation detection, and policy enforcement for AI systems',
  graphs: () => [governanceBasicGraph, governanceAdvancedGraph, complianceGraph],
  models: {
    'base': {
      'model': 'openai/gpt-4.1-2025-04-14'
    },
    'compliance': {
      'model': 'openai/gpt-4.1-2025-04-14'
    },
    'audit': {
      'model': 'openai/gpt-4.1-mini-2025-04-14'
    }
  }
});
