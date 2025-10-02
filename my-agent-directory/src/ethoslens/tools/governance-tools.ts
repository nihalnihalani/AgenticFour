import { mcpTool } from '@inkeep/agents-sdk';

export const governanceToolsMcp = mcpTool({
  id: 'ethoslens-governance',
  name: 'EthosLens Governance',
  serverUrl: 'http://localhost:3001/mcp',
  imageUrl: 'https://cdn.iconscout.com/icon/free/png-256/free-shield-check-icon-download-in-svg-png-gif-file-formats--security-protection-verified-safety-pack-user-interface-icons-1316223.png?f=webp',
});