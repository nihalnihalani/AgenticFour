import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Shield, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import StatsCard from '../components/StatsCard';
import ViolationChart from '../components/ViolationChart';
import { DashboardStats } from '../types';
import PerplexityStatus from '../components/PerplexityStatus';
import Neo4jStatus from '../components/Neo4jStatus';
import { apiService } from '../api/apiService';
import EmptyState from '../components/EmptyState';
import Graph from '../components/Graph';
import { BarChart3 } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalInteractions: 0,
    flaggedInteractions: 0,
    averageSeverity: 0,
    topViolations: [],
    agentActivity: []
  });

  useEffect(() => {
    const fetchStats = async () => {
      const dashboardStats = await apiService.getDashboardStats();
      setStats(dashboardStats);
    };

    fetchStats();
    // Auto-refresh removed - data updates only on manual page refresh
  }, []);

  const flaggedPercentage = stats.totalInteractions > 0 
    ? ((stats.flaggedInteractions / stats.totalInteractions) * 100).toFixed(1)
    : '0';

  const approvedPercentage = stats.totalInteractions > 0 
    ? (((stats.totalInteractions - stats.flaggedInteractions) / stats.totalInteractions) * 100).toFixed(1)
    : '0';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 space-y-8 bg-white min-h-screen"
    >
      <div className="flex items-center justify-between border-b border-gray-200 pb-6">
        <h1 className="text-2xl font-semibold text-black">Dashboard</h1>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span className="text-sm text-gray-600">System Online</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Interactions"
          value={stats.totalInteractions}
          icon={Activity}
          color="blue"
        />
        <StatsCard
          title="Flagged Interactions"
          value={stats.flaggedInteractions}
          change={`${flaggedPercentage}% of total`}
          icon={AlertTriangle}
          color="red"
        />
        <StatsCard
          title="Approved Interactions"
          value={stats.totalInteractions - stats.flaggedInteractions}
          change={`${approvedPercentage}% of total`}
          icon={CheckCircle}
          color="green"
        />
        <StatsCard
          title="Avg Severity Score"
          value={stats.averageSeverity.toFixed(1)}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerplexityStatus />
        <Neo4jStatus />
      </div>

      <Graph />

      {stats.topViolations.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Violation Analysis</h2>
          <ViolationChart violations={stats.topViolations} />
        </div>
      )}

      {stats.totalInteractions === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <EmptyState
            icon={BarChart3}
            title="No data available"
            description="Start testing prompts in the Live Monitor to see analytics and violation patterns here."
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Agents</h3>
          <div className="space-y-3">
            {[
              { name: 'PolicyEnforcerAgent', status: 'active', color: 'green' },
              { name: 'VerifierAgent', status: 'active', color: 'green' },
              { name: 'AuditLogger', status: 'active', color: 'green' },
              { name: 'ResponseAgent', status: 'active', color: 'green' },
              { name: 'FeedbackAgent', status: 'active', color: 'green' },
            ].map((agent, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-gray-900">
                    {agent.name.replace('Agent', '').replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${agent.color === 'green' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <span className="text-sm text-gray-600 capitalize">{agent.status}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {[
              { action: 'PII detected in medical query', time: '2 min ago', severity: 'high' },
              { action: 'Bias flagged in response', time: '5 min ago', severity: 'medium' },
              { action: 'Clean interaction approved', time: '8 min ago', severity: 'low' },
              { action: 'Audit log generated', time: '12 min ago', severity: 'low' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  activity.severity === 'high' ? 'bg-red-100 text-red-800' :
                  activity.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {activity.severity}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;