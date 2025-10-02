# EthosLens + Inkeep Agents Integration Setup

This guide walks you through setting up the integrated EthosLens system with both legacy and Inkeep agents.

## 🚀 Quick Start

### 1. Environment Variables

Add these environment variables to your `.env` file:

```bash
# Inkeep Agents Configuration
VITE_USE_INKEEP_AGENTS=true
VITE_INKEEP_AGENTS_URL=http://localhost:3003
VITE_COPILOTKIT_PUBLIC_API_KEY=ck_pub_a21c9b4bd5dbd3edd0c9e4edbded8100

# Existing OpenAI, Neo4j, and other configs...
OPENAI_API_KEY=your_openai_api_key_here
NEO4J_URI=neo4j://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_neo4j_password
```

### 2. Start the Inkeep Agents System

```bash
# Navigate to the agents directory
cd my-agent-directory

# Start the Inkeep agents server
pnpm run dev:apis
```

This will start:
- **Manage API** on port 3002
- **Run API** on port 3003 (this is what the main app connects to)

### 3. Start the Main Application

```bash
# In the main project directory
npm run dev:full
```

This starts:
- **Backend** on port 4000
- **Frontend** on port 5174

## 🛡️ Features

### Agent Type Switching

The application now supports seamless switching between:

1. **Inkeep Agents** (Advanced AI Governance)
   - Multi-framework compliance (GDPR, EU AI Act, FISMA, DSA, NIS2, ISO 42001, IEEE Ethics)
   - Real-time content verification
   - Intelligent response generation
   - Advanced risk assessment
   - Comprehensive audit logging

2. **Legacy Agents** (Traditional Rules-Based)
   - Proven reliability
   - Fast processing
   - Deterministic rules
   - Fallback system

### New API Endpoints

The backend now includes these new endpoints:

- `GET /api/governance/status` - Get current agent configuration
- `POST /api/governance/switch` - Switch between agent types
- `GET /api/governance/insights` - Get governance analytics

### UI Components

- **Agent Type Selector** - Switch between Inkeep and legacy agents
- **Status Indicators** - Show current agent type and availability
- **Enhanced Live Monitor** - Real-time governance with advanced features

## 🔧 Configuration

### Agent Type Selection

You can control which agents are used through:

1. **Environment Variable**: Set `VITE_USE_INKEEP_AGENTS=true/false`
2. **UI Toggle**: Use the Agent Type Selector in the Live Monitor
3. **API Call**: POST to `/api/governance/switch`

### Fallback Behavior

The system automatically falls back to legacy agents if:
- Inkeep agents are not available
- Inkeep API calls fail
- Network issues occur

## 📊 Monitoring

### Agent Status

The system provides real-time status for:
- Current agent type (Inkeep vs Legacy)
- Inkeep agents availability
- Backend connection status
- Governance processing metrics

### Governance Insights

Access comprehensive analytics through:
- CopilotKit integration for natural language queries
- REST API endpoints for programmatic access
- Real-time dashboard updates

## 🚨 Troubleshooting

### Inkeep Agents Not Available

1. **Check if agents server is running**:
   ```bash
   curl http://localhost:3003/health
   ```

2. **Verify database is migrated**:
   ```bash
   cd my-agent-directory
   pnpm run db:migrate
   ```

3. **Check logs**:
   ```bash
   # In my-agent-directory
   pnpm run dev:apis
   ```

### Backend Connection Issues

1. **Check main backend**:
   ```bash
   curl http://localhost:4000/health
   ```

2. **Verify environment variables are set**

3. **Check Neo4j connection**

### Frontend Issues

1. **Clear browser cache**
2. **Check console for errors**
3. **Verify API endpoints are responding**

## 🧪 Testing

### Manual Testing

1. **Start both systems** (main app + Inkeep agents)
2. **Open Live Monitor** at http://localhost:5174
3. **Switch agent types** using the selector
4. **Submit test prompts** and observe governance decisions
5. **Check audit logs** in the dashboard

### API Testing

```bash
# Test governance status
curl http://localhost:4000/api/governance/status

# Switch to Inkeep agents
curl -X POST http://localhost:4000/api/governance/switch \
  -H "Content-Type: application/json" \
  -d '{"useInkeep": true}'

# Get governance insights
curl http://localhost:4000/api/governance/insights?timeframe=today
```

## 📈 Performance

### Inkeep Agents Benefits

- **Advanced Analysis**: Multi-framework compliance checking
- **Real-time Verification**: Content accuracy validation
- **Intelligent Responses**: Context-aware safe alternatives
- **Comprehensive Auditing**: Detailed compliance trails

### Legacy Agents Benefits

- **Speed**: Faster processing for simple rules
- **Reliability**: Proven, deterministic behavior
- **Fallback**: Always available as backup
- **Simplicity**: Easier to debug and maintain

## 🔮 Next Steps

1. **Configure additional regulatory frameworks**
2. **Customize violation detection rules**
3. **Set up monitoring and alerting**
4. **Integrate with external compliance systems**
5. **Add custom agent workflows**

The integration provides a seamless bridge between traditional rule-based governance and advanced AI-powered compliance, giving you the best of both worlds!
