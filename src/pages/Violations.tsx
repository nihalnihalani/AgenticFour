import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  AlertTriangle, 
  Shield, 
  AlertCircle, 
  XCircle,
  Calendar,
  Download,
  Eye,
  Clock
} from 'lucide-react';
import { Violation } from '../types';
import { format } from 'date-fns';
import EmptyState from '../components/EmptyState';
import ViolationChart from '../components/ViolationChart';

interface ViolationWithContext extends Violation {
  interactionId: string;
  timestamp: Date;
  input: string;
  output: string;
  status: string;
}

const Violations: React.FC = () => {
  const [violations, setViolations] = useState<ViolationWithContext[]>([]);
  const [filteredViolations, setFilteredViolations] = useState<ViolationWithContext[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [frameworkFilter, setFrameworkFilter] = useState('all');
  const [selectedViolation, setSelectedViolation] = useState<ViolationWithContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchViolations = async () => {
      setIsLoading(true);
      try {
        // Fetch interactions from new backend
        const response = await fetch('http://localhost:4000/api/interactions');
        if (response.ok) {
          const interactions = await response.json();
          const allViolations: ViolationWithContext[] = [];

          interactions.forEach((interaction: any) => {
            interaction.violations?.forEach((violation: any) => {
              allViolations.push({
                ...violation,
                interactionId: interaction.id,
                timestamp: new Date(interaction.timestamp),
                input: interaction.input,
                output: interaction.output,
                status: interaction.status
              });
            });
          });

          // Sort by timestamp (newest first)
          allViolations.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
          
          setViolations(allViolations);
          setFilteredViolations(allViolations);
        }
      } catch (error) {
        console.error('Error fetching violations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchViolations();
    // Auto-refresh removed - data updates only on manual page refresh
  }, []);

  useEffect(() => {
    let filtered = [...violations];

    if (searchTerm) {
      filtered = filtered.filter(violation => 
        violation.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        violation.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        violation.input.toLowerCase().includes(searchTerm.toLowerCase()) ||
        violation.output.toLowerCase().includes(searchTerm.toLowerCase()) ||
        violation.interactionId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(violation => violation.type === typeFilter);
    }

    if (severityFilter !== 'all') {
      const severityRanges = {
        low: [0, 3],
        medium: [3, 6],
        high: [6, 8],
        critical: [8, 10]
      };
      const [min, max] = severityRanges[severityFilter as keyof typeof severityRanges];
      filtered = filtered.filter(violation => violation.severity >= min && violation.severity < max);
    }

    if (frameworkFilter !== 'all') {
      filtered = filtered.filter(violation => 
        violation.regulatoryFramework?.toLowerCase().includes(frameworkFilter.toLowerCase())
      );
    }

    setFilteredViolations(filtered);
  }, [violations, searchTerm, typeFilter, severityFilter, frameworkFilter]);

  const getViolationTypeColor = (type: string) => {
    const colors = {
      pii: 'bg-red-100 text-red-800 border-red-200',
      gdpr: 'bg-blue-100 text-blue-800 border-blue-200',
      fisma: 'bg-purple-100 text-purple-800 border-purple-200',
      eu_ai_act: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      dsa: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      nis2: 'bg-teal-100 text-teal-800 border-teal-200',
      iso_42001: 'bg-green-100 text-green-800 border-green-200',
      ieee_ethics: 'bg-pink-100 text-pink-800 border-pink-200',
      misinformation: 'bg-orange-100 text-orange-800 border-orange-200',
      bias: 'bg-violet-100 text-violet-800 border-violet-200',
      hallucination: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      hate_speech: 'bg-red-200 text-red-900 border-red-300',
      compliance: 'bg-slate-100 text-slate-800 border-slate-200'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 8) return 'bg-red-100 text-red-800';
    if (severity >= 6) return 'bg-orange-100 text-orange-800';
    if (severity >= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getSeverityLabel = (severity: number) => {
    if (severity >= 8) return 'Critical';
    if (severity >= 6) return 'High';
    if (severity >= 3) return 'Medium';
    return 'Low';
  };

  const getViolationIcon = (type: string) => {
    switch (type) {
      case 'pii':
      case 'gdpr':
        return <Shield className="h-4 w-4" />;
      case 'fisma':
      case 'nis2':
        return <Shield className="h-4 w-4" />;
      case 'eu_ai_act':
      case 'iso_42001':
      case 'ieee_ethics':
        return <AlertCircle className="h-4 w-4" />;
      case 'dsa':
        return <XCircle className="h-4 w-4" />;
      case 'misinformation':
        return <AlertCircle className="h-4 w-4" />;
      case 'bias':
        return <AlertTriangle className="h-4 w-4" />;
      case 'hallucination':
        return <AlertTriangle className="h-4 w-4" />;
      case 'hate_speech':
      case 'compliance':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const uniqueTypes = [...new Set(violations.map(v => v.type))];
  const uniqueFrameworks = [...new Set(violations.map(v => v.regulatoryFramework).filter(Boolean))];

  // Calculate statistics
  const stats = {
    total: violations.length,
    critical: violations.filter(v => v.severity >= 8).length,
    high: violations.filter(v => v.severity >= 6 && v.severity < 8).length,
    medium: violations.filter(v => v.severity >= 3 && v.severity < 6).length,
    low: violations.filter(v => v.severity < 3).length
  };

  const violationCounts = violations.reduce((counts, violation) => {
    counts[violation.type] = (counts[violation.type] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);

  const topViolations = Object.entries(violationCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading violations...</p>
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
        <h1 className="text-2xl font-bold text-gray-900">Violations</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">{violations.length} total violations</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export Report</span>
          </motion.button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-gray-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Critical</p>
              <p className="text-2xl font-semibold text-red-600">{stats.critical}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">High</p>
              <p className="text-2xl font-semibold text-orange-600">{stats.high}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Medium</p>
              <p className="text-2xl font-semibold text-yellow-600">{stats.medium}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low</p>
              <p className="text-2xl font-semibold text-green-600">{stats.low}</p>
            </div>
            <Shield className="h-8 w-8 text-green-400" />
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      {topViolations.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Violation Analysis</h2>
          <ViolationChart violations={topViolations} />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search violations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>
                  {type.toUpperCase().replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Severity</option>
              <option value="critical">Critical (8-10)</option>
              <option value="high">High (6-8)</option>
              <option value="medium">Medium (3-6)</option>
              <option value="low">Low (0-3)</option>
            </select>
            <select
              value={frameworkFilter}
              onChange={(e) => setFrameworkFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Frameworks</option>
              {uniqueFrameworks.map(framework => (
                <option key={framework} value={framework}>
                  {framework}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Violations List */}
        {filteredViolations.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="No violations found"
            description="No violations match your current filters. Try adjusting your search criteria or submit some prompts to generate violation data."
          />
        ) : (
          <div className="space-y-4">
            {filteredViolations.map((violation, index) => (
              <motion.div
                key={`${violation.interactionId}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedViolation(violation)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={`p-2 rounded-lg ${getViolationTypeColor(violation.type)}`}>
                      {getViolationIcon(violation.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{violation.description}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getViolationTypeColor(violation.type)}`}>
                          {violation.type.toUpperCase().replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{violation.reason}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{format(violation.timestamp, 'MMM dd, yyyy HH:mm')}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>ID: {violation.interactionId}</span>
                        </div>
                        {violation.regulatoryFramework && (
                          <div className="flex items-center space-x-1">
                            <Shield className="h-3 w-3" />
                            <span>{violation.regulatoryFramework}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(violation.severity)}`}>
                        {getSeverityLabel(violation.severity)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {violation.severity.toFixed(1)}/10
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Confidence</div>
                      <div className="text-sm font-medium text-gray-900">
                        {(violation.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                    <Eye className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Violation Detail Modal */}
      {selectedViolation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedViolation(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start space-x-3">
                  <div className={`p-3 rounded-lg ${getViolationTypeColor(selectedViolation.type)}`}>
                    {getViolationIcon(selectedViolation.type)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      {selectedViolation.description}
                    </h2>
                    <div className="flex items-center space-x-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getViolationTypeColor(selectedViolation.type)}`}>
                        {selectedViolation.type.toUpperCase().replace(/_/g, ' ')}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(selectedViolation.severity)}`}>
                        {getSeverityLabel(selectedViolation.severity)} ({selectedViolation.severity.toFixed(1)}/10)
                      </span>
                      <span className="text-sm text-gray-600">
                        Confidence: {(selectedViolation.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedViolation(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Violation Details</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Reason:</span>
                        <p className="text-sm text-gray-600 mt-1">{selectedViolation.reason}</p>
                      </div>
                      {selectedViolation.regulatoryFramework && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Regulatory Framework:</span>
                          <p className="text-sm text-gray-600 mt-1">{selectedViolation.regulatoryFramework}</p>
                        </div>
                      )}
                      {selectedViolation.complianceLevel && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Compliance Level:</span>
                          <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                            selectedViolation.complianceLevel === 'critical' ? 'bg-red-100 text-red-800' :
                            selectedViolation.complianceLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                            selectedViolation.complianceLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {selectedViolation.complianceLevel.toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-sm font-medium text-gray-700">Interaction ID:</span>
                        <p className="text-sm text-gray-600 mt-1 font-mono">{selectedViolation.interactionId}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Timestamp:</span>
                        <p className="text-sm text-gray-600 mt-1">{format(selectedViolation.timestamp, 'MMM dd, yyyy HH:mm:ss')}</p>
                      </div>
                    </div>
                  </div>

                  {selectedViolation.remediationSteps && selectedViolation.remediationSteps.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Remediation Steps</h3>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <ul className="space-y-2">
                          {selectedViolation.remediationSteps.map((step, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                                {index + 1}
                              </span>
                              <span className="text-sm text-blue-800">{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Input Content</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedViolation.input}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Output Content</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedViolation.output}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Status</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedViolation.status === 'blocked' ? 'bg-red-100 text-red-800' :
                        selectedViolation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {selectedViolation.status.toUpperCase()}
                      </span>
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

export default Violations;