import express from 'express';
import cors from 'cors';
import neo4j from 'neo4j-driver';
import { config } from 'dotenv';
import { governanceService } from './src/services/governanceService.js';
config();

const app = express();
const PORT = process.env.PORT || 4000;

// Initialize LlamaIndex with OpenAI
let chatEngine = null;
let neo4jDriver = null;

// Initialize services
async function initializeServices() {
  try {
    // Initialize OpenAI for LlamaIndex
    if (process.env.OPENAI_API_KEY) {
      // LlamaIndex will automatically use OPENAI_API_KEY from environment
      console.log('✅ OpenAI API key configured for LlamaIndex');
    } else {
      console.warn('⚠️ OPENAI_API_KEY not found in environment variables');
    }

    // Initialize Neo4j driver
    if (process.env.NEO4J_URI && process.env.NEO4J_USERNAME && process.env.NEO4J_PASSWORD) {
      neo4jDriver = neo4j.driver(
        process.env.NEO4J_URI,
        neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
      );
      
      // Test connection
      const session = neo4jDriver.session();
      await session.run('RETURN 1');
      await session.close();
      console.log('✅ Neo4j connection established');
    } else {
      console.warn('⚠️ Neo4j configuration incomplete');
    }

    console.log('🎯 All services initialized successfully');
  } catch (error) {
    console.error('❌ Service initialization error:', error);
  }
}

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Vite dev server and potential other frontends
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'EthosLens Agent Backend',
    services: {
      llamaIndex: !!process.env.OPENAI_API_KEY,
      neo4j: !!neo4jDriver,
      copilotKit: !!process.env.COPILOTKIT_PUBLIC_API_KEY
    }
  });
});

// EthosLens Governance Logic (simplified for backend)
class EthosLensGovernance {
  static async processInteraction(prompt, response) {
    const interaction = {
      id: `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      input: prompt,
      output: response,
      timestamp: new Date(),
      violations: [],
      status: 'approved', // Default to approved
      severity: 'low',
      agentActions: []
    };

    // Policy Enforcer Agent - detect violations
    const violations = await this.detectViolations(prompt, response);
    interaction.violations = violations;

    // Determine status based on violations
    if (violations.length > 0) {
      const maxSeverity = Math.max(...violations.map(v => v.severity));
      if (maxSeverity >= 8) {
        interaction.status = 'blocked';
        interaction.severity = 'critical';
      } else if (maxSeverity >= 6) {
        interaction.status = 'pending';
        interaction.severity = 'high';
      } else {
        interaction.status = 'approved';
        interaction.severity = 'medium';
      }
    }

    // Log agent actions
    interaction.agentActions = [
      {
        agent: 'PolicyEnforcerAgent',
        action: 'analyze',
        timestamp: new Date(),
        result: `Found ${violations.length} violations`
      },
      {
        agent: 'VerifierAgent',
        action: 'verify',
        timestamp: new Date(),
        result: `Status: ${interaction.status}`
      }
    ];

    return interaction;
  }

  static async detectViolations(prompt, response) {
    const violations = [];
    const text = `${prompt} ${response}`.toLowerCase();

    console.log('🔍 Analyzing text for violations:', text.substring(0, 200) + '...');

    // Illegal Activities / Hacking Detection (HIGH PRIORITY)
    const hackingPatterns = [
      'hack into', 'hack someone', 'break into', 'unauthorized access',
      'crack password', 'bypass security', 'exploit vulnerability',
      'ddos attack', 'sql injection', 'phishing', 'malware',
      'how to hack', 'hacking tutorial', 'illegal access',
      'steal data', 'breach security', 'network intrusion'
    ];

    // Data Theft / Confidential Information Requests
    const dataTheftPatterns = [
      'share the internal', 'internal database', 'salary database',
      'confidential data', 'proprietary information', 'company secrets',
      'employee records', 'customer database', 'financial records',
      'trade secrets', 'classified information', 'private documents',
      'leak the data', 'access internal', 'company database',
      'sensitive information', 'restricted data', 'internal files'
    ];
    
    const foundHackingPattern = hackingPatterns.find(pattern => text.includes(pattern));
    if (foundHackingPattern) {
      console.log('🚨 HACKING VIOLATION DETECTED:', foundHackingPattern);
      violations.push({
        type: 'illegal_activity',
        description: 'Illegal hacking or cybersecurity violation detected',
        reason: 'Content requests assistance with unauthorized access, hacking, or other illegal activities',
        severity: 9.5,
        confidence: 0.95,
        regulatoryFramework: 'Computer Fraud and Abuse Act'
      });
    } else {
      console.log('ℹ️ No hacking patterns found in:', hackingPatterns.slice(0, 5));
    }

    // Check for data theft / confidential information requests
    const foundDataTheftPattern = dataTheftPatterns.find(pattern => text.includes(pattern));
    if (foundDataTheftPattern) {
      console.log('🚨 DATA THEFT VIOLATION DETECTED:', foundDataTheftPattern);
      violations.push({
        type: 'data_theft',
        description: 'Unauthorized access to confidential information detected',
        reason: 'Content requests access to proprietary, confidential, or sensitive company data',
        severity: 9.0,
        confidence: 0.9,
        regulatoryFramework: 'Data Protection Act'
      });
    } else {
      console.log('ℹ️ No data theft patterns found in:', dataTheftPatterns.slice(0, 5));
    }

    // PII Detection
    if (text.match(/\b\d{3}-\d{2}-\d{4}\b/) || // SSN
        text.match(/\b\d{16}\b/) || // Credit card
        text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/)) { // Email
      violations.push({
        type: 'pii',
        description: 'Personal Identifiable Information detected',
        reason: 'Content contains sensitive personal data',
        severity: 8.5,
        confidence: 0.9,
        regulatoryFramework: 'GDPR'
      });
    }

    // Harmful/Dangerous Content Detection
    const harmfulPatterns = [
      'how to make bomb', 'create explosive', 'make poison',
      'suicide methods', 'self harm', 'hurt someone',
      'kill someone', 'murder', 'violence against',
      'how to kill', 'kill my', 'kill him', 'kill her',
      'murder my', 'murder him', 'murder her',
      'harm my', 'hurt my', 'attack my',
      'assassinate', 'eliminate someone'
    ];
    
    const foundHarmfulPattern = harmfulPatterns.find(pattern => text.includes(pattern));
    if (foundHarmfulPattern) {
      console.log('🚨 HARMFUL CONTENT VIOLATION DETECTED:', foundHarmfulPattern);
      violations.push({
        type: 'harmful_content',
        description: 'Harmful or dangerous content detected',
        reason: 'Content may promote violence, self-harm, or dangerous activities',
        severity: 9.0,
        confidence: 0.9,
        regulatoryFramework: 'Content Safety Guidelines'
      });
    } else {
      console.log('ℹ️ No harmful patterns found in:', harmfulPatterns.slice(0, 5));
    }

    // Bias Detection
    if (text.includes('all women') || text.includes('all men') || 
        text.includes('people of color are') || text.includes('white people are')) {
      violations.push({
        type: 'bias',
        description: 'Potential bias detected',
        reason: 'Content may contain discriminatory language',
        severity: 6.5,
        confidence: 0.7,
        regulatoryFramework: 'IEEE Ethics'
      });
    }

    // Misinformation Detection
    if (text.includes('vaccines cause autism') || text.includes('covid is fake') ||
        text.includes('climate change is a hoax')) {
      violations.push({
        type: 'misinformation',
        description: 'Potential misinformation detected',
        reason: 'Content may spread false information',
        severity: 7.0,
        confidence: 0.8,
        regulatoryFramework: 'DSA'
      });
    }

    console.log(`📊 Total violations detected: ${violations.length}`, violations.map(v => v.type));
    return violations;
  }

  static async saveToNeo4j(interaction) {
    if (!neo4jDriver) return;

    const session = neo4jDriver.session();
    try {
      // Create interaction node
      await session.run(`
        CREATE (i:Interaction {
          id: $id,
          input: $input,
          output: $output,
          timestamp: datetime($timestamp),
          status: $status,
          severity: $severity
        })
      `, {
        id: interaction.id,
        input: interaction.input,
        output: interaction.output,
        timestamp: interaction.timestamp.toISOString(),
        status: interaction.status,
        severity: interaction.severity
      });

      // Create violation nodes and relationships
      for (const violation of interaction.violations) {
        await session.run(`
          MATCH (i:Interaction {id: $interactionId})
          CREATE (v:Violation {
            type: $type,
            description: $description,
            reason: $reason,
            severity: $severity,
            confidence: $confidence,
            framework: $framework
          })
          CREATE (i)-[:HAS_VIOLATION]->(v)
        `, {
          interactionId: interaction.id,
          type: violation.type,
          description: violation.description,
          reason: violation.reason,
          severity: violation.severity,
          confidence: violation.confidence,
          framework: violation.regulatoryFramework || 'Unknown'
        });
      }

      console.log(`💾 Saved interaction ${interaction.id} to Neo4j`);
    } catch (error) {
      console.error('Neo4j save error:', error);
    } finally {
      await session.close();
    }
  }
}

// CopilotKit Integration Endpoint
app.post('/api/copilotkit', async (req, res) => {
  try {
    const { messages, model = 'gpt-3.5-turbo' } = req.body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Get the latest user message
    const userMessage = messages[messages.length - 1];
    const prompt = userMessage.content;

    console.log(`🤖 Processing prompt: ${prompt.substring(0, 100)}...`);

    // Step 1: Generate response using LlamaIndex/OpenAI
    let response;
    try {
      // For now, we'll use OpenAI directly since LlamaIndex setup can be complex
      // In production, you'd use LlamaIndex's ChatEngine here
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });

      const completion = await openai.chat.completions.create({
        model: model,
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7
      });

      response = completion.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API error:', error);
      response = "I apologize, but I'm having trouble generating a response right now. Please try again.";
    }

    // Step 2: Process through EthosLens Governance (now supports both legacy and Inkeep agents)
    const interaction = await governanceService.processInteraction(prompt, response, {
      model,
      timestamp: new Date().toISOString(),
      source: 'copilotkit'
    });

    // Step 3: Save to Neo4j
    await EthosLensGovernance.saveToNeo4j(interaction);

    // Step 4: Return response based on governance decision
    if (interaction.status === 'blocked') {
      // Format violations for display
      const violationList = interaction.violations.map(v => {
        const violationType = v.type.toUpperCase().replace('_', '_');
        return `- **${violationType}**: ${v.description}`;
      }).join('\n');

      const blockedContent = `⚠️ **Content Blocked by EthosLens Governance**

Your request has been blocked due to ${interaction.violations.length} policy violation(s):

${violationList}

Please rephrase your request to comply with our governance policies.`;

      return res.json({
        choices: [{
          message: {
            role: 'assistant',
            content: blockedContent
          }
        }],
        usage: { total_tokens: 0 },
        ethosLens: {
          interactionId: interaction.id,
          status: interaction.status,
          violations: interaction.violations,
          severity: interaction.severity
        }
      });
    } else if (interaction.status === 'pending') {
      return res.json({
        choices: [{
          message: {
            role: 'assistant',
            content: `⚠️ **Content Flagged for Review**\n\n${response}\n\n---\n*Note: This response has been flagged by EthosLens governance for potential policy violations and may require human review.*`
          }
        }],
        usage: { total_tokens: response.length },
        ethosLens: {
          interactionId: interaction.id,
          status: interaction.status,
          violations: interaction.violations,
          severity: interaction.severity
        }
      });
    } else {
      // Approved - return normal response
      return res.json({
        choices: [{
          message: {
            role: 'assistant',
            content: response
          }
        }],
        usage: { total_tokens: response.length },
        ethosLens: {
          interactionId: interaction.id,
          status: interaction.status,
          violations: interaction.violations,
          severity: interaction.severity
        }
      });
    }

  } catch (error) {
    console.error('CopilotKit endpoint error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Get interactions endpoint (for dashboard)
app.get('/api/interactions', async (req, res) => {
  if (!neo4jDriver) {
    return res.json([]);
  }

  const session = neo4jDriver.session();
  try {
    const result = await session.run(`
      MATCH (i:Interaction)
      OPTIONAL MATCH (i)-[:HAS_VIOLATION]->(v:Violation)
      RETURN i, collect(v) as violations
      ORDER BY i.timestamp DESC
      LIMIT 50
    `);

    const interactions = result.records.map(record => {
      const interaction = record.get('i').properties;
      const violations = record.get('violations').map(v => v.properties);
      
      return {
        id: interaction.id,
        input: interaction.input,
        output: interaction.output,
        timestamp: new Date(interaction.timestamp),
        status: interaction.status,
        severity: interaction.severity,
        violations: violations
      };
    });

    res.json(interactions);
  } catch (error) {
    console.error('Get interactions error:', error);
    res.status(500).json({ error: 'Failed to fetch interactions' });
  } finally {
    await session.close();
  }
});

// Governance configuration endpoints
app.get('/api/governance/status', async (req, res) => {
  try {
    const status = governanceService.getStatus();
    res.json({
      success: true,
      governance: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting governance status:', error);
    res.status(500).json({ error: 'Failed to get governance status' });
  }
});

app.post('/api/governance/switch', async (req, res) => {
  try {
    const { useInkeep } = req.body;
    
    if (typeof useInkeep !== 'boolean') {
      return res.status(400).json({ error: 'useInkeep must be a boolean' });
    }

    await governanceService.switchAgentType(useInkeep);
    const status = governanceService.getStatus();
    
    res.json({
      success: true,
      message: `Switched to ${status.agentType} agents`,
      governance: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error switching governance type:', error);
    res.status(500).json({ error: 'Failed to switch governance type' });
  }
});

app.get('/api/governance/insights', async (req, res) => {
  try {
    const { timeframe = 'today' } = req.query;
    const insights = await governanceService.getGovernanceInsights(timeframe);
    
    res.json({
      success: true,
      insights,
      timeframe,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting governance insights:', error);
    res.status(500).json({ error: 'Failed to get governance insights' });
  }
});

// Initialize services and start server
initializeServices().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 EthosLens Agent Backend running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🤖 CopilotKit endpoint: http://localhost:${PORT}/api/copilotkit`);
    console.log(`📋 Interactions API: http://localhost:${PORT}/api/interactions`);
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  if (neo4jDriver) {
    await neo4jDriver.close();
  }
  process.exit(0);
});

export default app;
