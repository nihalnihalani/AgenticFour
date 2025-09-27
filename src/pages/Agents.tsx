import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  Settings, 
  Play, 
  Pause,
  RotateCcw,
  TrendingUp,
  Clock,
  Zap
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'error';
  description: string;
  actionsPerformed: number;
  violationsDetected: number;
  lastActivity: Date;
  uptime: string;
  accuracy: number;
}

const Agents: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAgentData = async () => {
      setIsLoading(true);
      try {
        // Fetch interactions to calculate agent statistics
        const response = await fetch('http://localhost:4000/api/interactions');
        if (response.ok) {
          const interactions = await response.json();
          
          // Generate agent data based on interactions
          const agentStats = calculateAgentStats(interactions);
          setAgents(agentStats);
        }
      } catch (error) {
        console.error('Error fetching agent data:', error);
        // Fallback to static data if backend is unavailable
        setAgents(getStaticAgentData());
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgentData();
  }, []);

  const calculateAgentStats = (interactions: any[]): Agent[] => {
    const totalInteractions = interactions.length;
    const totalViolations = interactions.reduce((sum, i) => sum + (i.violations?.length || 0), 0);
    const blockedInteractions = interactions.filter(i => i.status === 'blocked').length;
    
    return [
      {
        id: 'policy-enforcer',
        name: 'Policy Enforcer Agent',
        type: 'Governance',
        status: 'active' as const,
        description: 'Analyzes content for policy violations and enforces compliance rules',
        actionsPerformed: totalInteractions,
        violationsDetected: totalViolations,
        lastActivity: new Date(),
        uptime: '99.8%',
        accuracy: totalInteractions > 0 ? ((totalInteractions - blockedInteractions) / totalInteractions * 100) : 95
      },
      {
        id: 'verifier-agent',
        name: 'Verifier Agent',
        type: 'Validation',
        status: 'active' as const,
        description: 'Validates AI responses and ensures quality standards',
        actionsPerformed: totalInteractions,
        violationsDetected: Math.floor(totalViolations * 0.3),
        lastActivity: new Date(),
        uptime: '99.9%',
        accuracy: 97.2
      },
      {
        id: 'audit-logger',
        name: 'Audit Logger',
        type: 'Monitoring',
        status: 'active' as const,
        description: 'Records all interactions and maintains compliance audit trails',
        actionsPerformed: totalInteractions * 2, // Logs both input and output
        violationsDetected: 0,
        lastActivity: new Date(),
        uptime: '100%',
        accuracy: 99.9
      },
      {
        id: 'response-agent',
        name: 'Response Agent',
        type: 'Processing',
        status: 'active' as const,
        description: 'Manages AI response generation and content filtering',
        actionsPerformed: totalInteractions,
        violationsDetected: Math.floor(totalViolations * 0.2),
        lastActivity: new Date(),
        uptime: '99.7%',
        accuracy: 94.8
      },
      {
        id: 'feedback-agent',
        name: 'Feedback Agent',
        type: 'Learning',
        status: 'active' as const,
        description: 'Processes user feedback and improves system accuracy',
        actionsPerformed: Math.floor(totalInteractions * 0.4),
        violationsDetected: 0,
        lastActivity: new Date(),
        uptime: '99.5%',
        accuracy: 92.1
      }
    ];
  };

  const getStaticAgentData = (): Agent[] => {
    return [
      {
        id: 'policy-enforcer',
        name: 'Policy Enforcer Agent',
        type: 'Governance',
        status: 'active' as const,
        description: 'Analyzes content for policy violations and enforces compliance rules',
        actionsPerformed: 1247,
        violationsDetected: 89,
        lastActivity: new Date(),
        uptime: '99.8%',
        accuracy: 95.3
      },
      {
        id: 'verifier-agent',
        name: 'Verifier Agent',
        type: 'Validation',
        status: 'active' as const,
        description: 'Validates AI responses and ensures quality standards',
        actionsPerformed: 1247,
        violationsDetected: 27,
        lastActivity: new Date(),
        uptime: '99.9%',
        accuracy: 97.2
      },
      {
        id: 'audit-logger',
        name: 'Audit Logger',
        type: 'Monitoring',
        status: 'active' as const,
        description: 'Records all interactions and maintains compliance audit trails',
        actionsPerformed: 2494,
        violationsDetected: 0,
        lastActivity: new Date(),
        uptime: '100%',
        accuracy: 99.9
      },
      {
        id: 'response-agent',
        name: 'Response Agent',
        type: 'Processing',
        status: 'active' as const,
        description: 'Manages AI response generation and content filtering',
        actionsPerformed: 1247,
        violationsDetected: 18,
        lastActivity: new Date(),
        uptime: '99.7%',
        accuracy: 94.8
      },
      {
        id: 'feedback-agent',
        name: 'Feedback Agent',
        type: 'Learning',
        status: 'active' as const,
        description: 'Processes user feedback and improves system accuracy',
        actionsPerformed: 498,
        violationsDetected: 0,
        lastActivity: new Date(),
        uptime: '99.5%',
        accuracy: 92.1
      }
    ];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'inactive':
        return <Pause className="h-5 w-5 text-gray-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-blue-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Governance':
        return <Shield className="h-5 w-5 text-blue-600" />;
      case 'Validation':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'Monitoring':
        return <Activity className="h-5 w-5 text-purple-600" />;
      case 'Processing':
        return <Zap className="h-5 w-5 text-orange-600" />;
      case 'Learning':
        return <TrendingUp className="h-5 w-5 text-indigo-600" />;
      default:
        return <Settings className="h-5 w-5 text-gray-600" />;
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 95) return 'text-green-600';
    if (accuracy >= 90) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading agents...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">AI Governance Agents</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-sm text-gray-600">{agents.filter(a => a.status === 'active').length} active agents</span>
          </div>
        </div>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedAgent(agent)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getTypeIcon(agent.type)}
                <div>
                  <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                  <p className="text-sm text-gray-500">{agent.type}</p>
                </div>
              </div>
              {getStatusIcon(agent.status)}
            </div>

            <p className="text-sm text-gray-600 mb-4">{agent.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500">Actions Performed</p>
                <p className="text-lg font-semibold text-gray-900">{agent.actionsPerformed.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Violations Detected</p>
                <p className="text-lg font-semibold text-red-600">{agent.violationsDetected}</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3 text-gray-400" />
                <span className="text-gray-500">Uptime: {agent.uptime}</span>
              </div>
              <div className={`font-medium ${getAccuracyColor(agent.accuracy)}`}>
                {agent.accuracy.toFixed(1)}% accuracy
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedAgent(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-3">
                  {getTypeIcon(selectedAgent.type)}
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedAgent.name}</h2>
                    <p className="text-gray-500">{selectedAgent.type} Agent</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Status & Performance</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Status:</span>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(selectedAgent.status)}
                          <span className="text-sm font-medium capitalize">{selectedAgent.status}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Uptime:</span>
                        <span className="text-sm font-medium">{selectedAgent.uptime}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Accuracy:</span>
                        <span className={`text-sm font-medium ${getAccuracyColor(selectedAgent.accuracy)}`}>
                          {selectedAgent.accuracy.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Activity Statistics</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Actions Performed:</span>
                        <span className="text-sm font-medium">{selectedAgent.actionsPerformed.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Violations Detected:</span>
                        <span className="text-sm font-medium text-red-600">{selectedAgent.violationsDetected}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Last Activity:</span>
                        <span className="text-sm font-medium">
                          {selectedAgent.lastActivity.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4">
                      {selectedAgent.description}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Agent Controls</h3>
                    <div className="space-y-2">
                      <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                        <Play className="h-4 w-4" />
                        <span>Restart Agent</span>
                      </button>
                      <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                        <Settings className="h-4 w-4" />
                        <span>Configure Settings</span>
                      </button>
                      <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <RotateCcw className="h-4 w-4" />
                        <span>Reset Statistics</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Agents;
