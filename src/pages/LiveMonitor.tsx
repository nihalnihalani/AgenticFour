import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CopilotSidebar } from "@copilotkit/react-ui";
import { useCopilotReadable, useCopilotAction } from "@copilotkit/react-core";
import InteractionCard from '../components/InteractionCard';
import PromptTester from '../components/PromptTester';
import AgentTypeSelector from '../components/AgentTypeSelector';
import { LLMInteraction } from '../types';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/Toast';
import EmptyState from '../components/EmptyState';
import { Activity, RefreshCw, MessageSquare, Bot, Zap } from 'lucide-react';

const LiveMonitor: React.FC = () => {
  const [interactions, setInteractions] = useState<LLMInteraction[]>([]);
  const [showCopilot, setShowCopilot] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const toast = useToast();

  // Make interactions data available to CopilotKit
  useCopilotReadable({
    description: "Current AI governance interactions and violations",
    value: interactions.map(interaction => ({
      id: interaction.id,
      status: interaction.status,
      violationCount: interaction.violations.length,
      severity: interaction.severity,
      timestamp: interaction.timestamp
    }))
  });

  // Add CopilotKit action for getting governance insights
  useCopilotAction({
    name: "getGovernanceInsights",
    description: "Get insights about AI governance violations and trends",
    parameters: [
      {
        name: "timeframe",
        type: "string",
        description: "Time frame for analysis (e.g., 'last hour', 'today', 'this week')",
      }
    ],
    handler: async ({ timeframe }) => {
      const now = new Date();
      let cutoffTime = new Date();
      
      switch (timeframe) {
        case 'last hour':
          cutoffTime.setHours(now.getHours() - 1);
          break;
        case 'today':
          cutoffTime.setHours(0, 0, 0, 0);
          break;
        case 'this week':
          cutoffTime.setDate(now.getDate() - 7);
          break;
        default:
          cutoffTime.setHours(now.getHours() - 24);
      }

      const recentInteractions = interactions.filter(i => i.timestamp >= cutoffTime);
      const totalViolations = recentInteractions.reduce((sum, i) => sum + i.violations.length, 0);
      const blockedCount = recentInteractions.filter(i => i.status === 'blocked').length;
      
      return {
        totalInteractions: recentInteractions.length,
        totalViolations,
        blockedCount,
        approvalRate: recentInteractions.length > 0 ? 
          ((recentInteractions.length - blockedCount) / recentInteractions.length * 100).toFixed(1) + '%' : '0%',
        topViolationTypes: [...new Set(recentInteractions.flatMap(i => i.violations.map(v => v.type)))]
      };
    }
  });

  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const response = await fetch('http://localhost:4000/health');
        if (response.ok) {
          setBackendStatus('connected');
        } else {
          setBackendStatus('error');
        }
      } catch (error) {
        console.error('Backend health check failed:', error);
        setBackendStatus('error');
      }
    };

    const fetchInteractions = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/interactions');
        if (response.ok) {
          const data = await response.json();
          setInteractions(data);
        }
      } catch (error) {
        console.error('Error fetching interactions:', error);
      }
    };

    // Check backend status and fetch interactions
    checkBackendStatus();
    fetchInteractions();
  }, []);

  const handlePromptSubmit = async (prompt: string) => {
    setIsLoading(true);
    
    try {
      console.log('🤖 Submitting prompt to backend:', prompt.substring(0, 100) + '...');
      
      // Send prompt to our CopilotKit-compatible backend
      const response = await fetch('http://localhost:4000/api/copilotkit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: prompt }
          ],
          model: 'gpt-3.5-turbo'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Backend response:', result);

      // Extract EthosLens governance data
      const ethosLens = result.ethosLens;
      if (ethosLens) {
        // Create interaction object from backend response
        const interaction: LLMInteraction = {
          id: ethosLens.interactionId,
          input: prompt,
          output: result.choices[0]?.message?.content || 'No response generated',
          timestamp: new Date(),
          status: ethosLens.status,
          severity: ethosLens.severity,
          violations: ethosLens.violations || [],
          agentActions: [],
          userFeedback: undefined
        };

        // Add to interactions list
        setInteractions(prev => [interaction, ...prev]);

        // Show appropriate toast based on governance decision
        if (ethosLens.status === 'blocked') {
          toast.error('Prompt Blocked', `${ethosLens.violations.length} violation(s) detected`);
        } else if (ethosLens.status === 'pending') {
          toast.warning('Prompt Flagged', 'Content requires review');
        } else {
          toast.success('Prompt Approved', 'No violations detected');
        }
      }

    } catch (error) {
      console.error('Error processing prompt:', error);
      toast.error('Processing Failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/interactions');
      if (response.ok) {
        const data = await response.json();
        setInteractions(data);
        toast.success('Refreshed', 'Interactions updated successfully');
      }
    } catch (error) {
      toast.error('Refresh Failed', 'Unable to fetch latest interactions');
    }
  };

  const handleInteractionAction = async (id: string, action: string, rating?: 'positive' | 'negative' | 'flag') => {
    if (action === 'feedback' && rating) {
      // Only update feedback, don't change status
      setInteractions(prev => 
        prev.map(interaction => 
          interaction.id === id 
            ? { 
                ...interaction, 
                userFeedback: {
                  rating: rating === 'flag' ? 'report' : rating,
                  timestamp: new Date()
                }
              }
            : interaction
        )
      );
      toast.success('Feedback Submitted', 'Thank you for your feedback!');
      return;
    }
    
    // Handle approve/block actions
    if (action === 'approve' || action === 'block') {
      const newStatus = action === 'approve' ? 'approved' as const : 'blocked' as const;
      
      // Update status immediately for UI feedback
      setInteractions(prev => 
        prev.map(interaction => 
          interaction.id === id 
            ? { ...interaction, status: newStatus }
            : interaction
        )
      );
      
      if (action === 'approve') {
        toast.success('Interaction Approved', 'Content has been approved for use');
      } else {
        toast.error('Interaction Blocked', 'Content has been blocked due to violations');
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 space-y-8 bg-white min-h-screen"
    >
      <div className="flex items-center justify-between border-b border-gray-200 pb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-semibold text-black">Live Monitor</h1>
          <AgentTypeSelector />
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowCopilot(!showCopilot)}
            className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            title="Open AI Assistant"
          >
            <Bot className="h-4 w-4" />
            <span>AI Assistant</span>
          </button>
          <button
            onClick={handleManualRefresh}
            className="flex items-center space-x-2 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            title="Refresh interactions"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span className="text-sm text-gray-600">Manual refresh only</span>
          </div>
        </div>
      </div>
      
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
      
      {/* Direct Prompt Testing */}
      <PromptTester onSubmit={handlePromptSubmit} isLoading={isLoading} />
      
      {/* CopilotKit Integration */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Bot className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">EthosLens AI Assistant</h3>
          </div>
          <button
            onClick={() => setShowCopilot(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Open Chat</span>
          </button>
        </div>
        <p className="text-gray-600 mb-4">
          Ask me about governance insights, violation patterns, or get help with AI safety analysis. 
          I can analyze your data and provide recommendations.
        </p>
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2 text-sm text-blue-600">
            <MessageSquare className="h-4 w-4" />
            <span>Try asking: "What are the most common violations today?" or "Analyze the approval rate trends"</span>
          </div>
          <div className="text-xs text-gray-500">
            Backend: {window.location.protocol}//{window.location.hostname}:4000 
            <span className={`ml-2 px-2 py-1 rounded text-xs ${
              backendStatus === 'connected' ? 'bg-green-100 text-green-700' :
              backendStatus === 'error' ? 'bg-red-100 text-red-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {backendStatus === 'connected' ? '✓ Connected' :
               backendStatus === 'error' ? '✗ Error' : '⏳ Checking...'}
            </span> | 
            CopilotKit: {showCopilot ? 'Active' : 'Inactive'}
          </div>
        </div>
        
        {showCopilot && (
          <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">AI Assistant Active</span>
              <button
                onClick={() => setShowCopilot(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-gray-500">
              The AI assistant sidebar is now open. Look for the chat interface on the right side of your screen.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Recent Interactions ({interactions.length})
        </h2>
        
        {interactions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <EmptyState
              icon={Activity}
              title="No interactions yet"
              description="Submit a prompt above to test the AI governance system and see how our agents analyze and respond to different types of content."
              action={{
                label: "Try a Sample Prompt",
                onClick: () => {
                  // This would scroll to the prompt tester
                  document.querySelector('textarea')?.focus();
                }
              }}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {interactions.map((interaction) => (
              <InteractionCard
                key={interaction.id}
                interaction={interaction}
                onAction={handleInteractionAction}
              />
            ))}
          </div>
        )}
      </div>

      {/* CopilotKit Sidebar */}
      {showCopilot && (
        <CopilotSidebar
          instructions="You are an AI governance expert assistant for EthosLens. Help users understand their AI safety data, analyze violation patterns, and provide insights about compliance trends. You can access real-time governance data and provide actionable recommendations. Use the getGovernanceInsights action to analyze data when users ask about trends, statistics, or patterns."
          labels={{
            title: "EthosLens AI Assistant",
            initial: "Hi! I'm your AI governance assistant. I can help you analyze violations, understand compliance trends, and provide insights about your AI safety data. What would you like to know?",
            placeholder: "Ask about governance insights, violation patterns, or compliance trends..."
          }}
          defaultOpen={true}
          clickOutsideToClose={true}
          onSetOpen={(open) => {
            if (!open) setShowCopilot(false);
          }}
        />
      )}
    </motion.div>
  );
};

export default LiveMonitor;