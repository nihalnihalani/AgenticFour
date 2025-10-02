import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Zap, Shield, AlertCircle, CheckCircle } from 'lucide-react';

interface GovernanceStatus {
  usingInkeep: boolean;
  inkeepAvailable: boolean;
  agentType: 'inkeep' | 'legacy';
}

const AgentTypeSelector: React.FC = () => {
  const [status, setStatus] = useState<GovernanceStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState(false);

  useEffect(() => {
    fetchGovernanceStatus();
  }, []);

  const fetchGovernanceStatus = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/governance/status');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setStatus(data.governance);
      setError(null);
    } catch (error) {
      console.error('Error fetching governance status:', error);
      setError('Failed to fetch governance status');
    }
  };

  const switchAgentType = async (useInkeep: boolean) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:4000/api/governance/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ useInkeep }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setStatus(data.governance);
      setShowSelector(false);
      
      // Show success message
      console.log(`✅ ${data.message}`);
    } catch (error) {
      console.error('Error switching agent type:', error);
      setError('Failed to switch agent type');
    } finally {
      setIsLoading(false);
    }
  };

  if (!status) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <Settings className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading governance status...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Current Status Display */}
      <motion.div
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg border cursor-pointer transition-all duration-200 ${
          status.agentType === 'inkeep'
            ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
        }`}
        onClick={() => setShowSelector(!showSelector)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {status.agentType === 'inkeep' ? (
          <Zap className="w-4 h-4 text-blue-600" />
        ) : (
          <Shield className="w-4 h-4 text-gray-600" />
        )}
        
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {status.agentType === 'inkeep' ? 'Inkeep Agents' : 'Legacy Agents'}
          </span>
          <span className="text-xs text-gray-500">
            {status.agentType === 'inkeep' ? 'Advanced AI Governance' : 'Traditional Rules-Based'}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          {status.agentType === 'inkeep' && status.inkeepAvailable ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : status.agentType === 'inkeep' && !status.inkeepAvailable ? (
            <AlertCircle className="w-4 h-4 text-yellow-500" />
          ) : (
            <CheckCircle className="w-4 h-4 text-gray-500" />
          )}
          <Settings className="w-4 h-4 text-gray-400" />
        </div>
      </motion.div>

      {/* Selector Dropdown */}
      {showSelector && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full mt-2 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
        >
          <div className="p-3">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Select Agent Type</h3>
            
            {/* Inkeep Agents Option */}
            <motion.button
              className={`w-full p-3 rounded-lg border-2 mb-2 text-left transition-all duration-200 ${
                status.agentType === 'inkeep'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              } ${!status.inkeepAvailable ? 'opacity-60' : ''}`}
              onClick={() => switchAgentType(true)}
              disabled={isLoading || !status.inkeepAvailable}
              whileHover={{ scale: status.inkeepAvailable ? 1.02 : 1 }}
              whileTap={{ scale: status.inkeepAvailable ? 0.98 : 1 }}
            >
              <div className="flex items-center space-x-3">
                <Zap className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <div className="font-medium text-gray-800">Inkeep Agents</div>
                  <div className="text-xs text-gray-600">
                    Advanced AI governance with multi-framework compliance
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    ✓ GDPR, EU AI Act, FISMA compliance ✓ Real-time verification ✓ Smart responses
                  </div>
                </div>
                {status.inkeepAvailable ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                )}
              </div>
            </motion.button>

            {/* Legacy Agents Option */}
            <motion.button
              className={`w-full p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                status.agentType === 'legacy'
                  ? 'border-gray-500 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => switchAgentType(false)}
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-gray-600" />
                <div className="flex-1">
                  <div className="font-medium text-gray-800">Legacy Agents</div>
                  <div className="text-xs text-gray-600">
                    Traditional rules-based governance system
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    ✓ Proven reliability ✓ Fast processing ✓ Deterministic rules
                  </div>
                </div>
                <CheckCircle className="w-5 h-5 text-gray-500" />
              </div>
            </motion.button>

            {/* Status Messages */}
            {!status.inkeepAvailable && (
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                Inkeep agents are not available. Make sure the agent server is running on port 3003.
              </div>
            )}

            {error && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                {error}
              </div>
            )}

            {isLoading && (
              <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                <Settings className="w-4 h-4 inline mr-1 animate-spin" />
                Switching agent type...
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Backdrop */}
      {showSelector && (
        <div
          className="fixed inset-0 bg-black bg-opacity-10 z-40"
          onClick={() => setShowSelector(false)}
        />
      )}
    </div>
  );
};

export default AgentTypeSelector;
