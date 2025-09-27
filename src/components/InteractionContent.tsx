import React from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Shield,
  AlertCircle,
  XCircle,
  AlertOctagon,
  Zap,
  AlertTriangle
} from 'lucide-react';

import { Violation } from '../types';

interface InteractionContentProps {
  input: string;
  output: string;
  violations: Violation[];
}

const InteractionContent: React.FC<InteractionContentProps> = ({ 
  input, 
  output, 
  violations 
}) => {
  const getViolationColor = (type: string) => {
    switch (type) {
      case 'pii':
        return 'bg-gradient-to-r from-red-50 to-red-100 text-red-800 border-red-200';
      case 'gdpr':
        return 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 border-blue-200';
      case 'fisma':
        return 'bg-gradient-to-r from-purple-50 to-purple-100 text-purple-800 border-purple-200';
      case 'eu_ai_act':
        return 'bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-800 border-indigo-200';
      case 'dsa':
        return 'bg-gradient-to-r from-cyan-50 to-cyan-100 text-cyan-800 border-cyan-200';
      case 'nis2':
        return 'bg-gradient-to-r from-teal-50 to-teal-100 text-teal-800 border-teal-200';
      case 'iso_42001':
        return 'bg-gradient-to-r from-green-50 to-green-100 text-green-800 border-green-200';
      case 'ieee_ethics':
        return 'bg-gradient-to-r from-pink-50 to-pink-100 text-pink-800 border-pink-200';
      case 'misinformation':
        return 'bg-gradient-to-r from-orange-50 to-orange-100 text-orange-800 border-orange-200';
      case 'bias':
        return 'bg-gradient-to-r from-violet-50 to-violet-100 text-violet-800 border-violet-200';
      case 'hallucination':
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800 border-yellow-200';
      case 'hate_speech':
        return 'bg-gradient-to-r from-red-100 to-red-200 text-red-900 border-red-300';
      case 'compliance':
        return 'bg-gradient-to-r from-slate-50 to-slate-100 text-slate-800 border-slate-200';
      default:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 border-gray-200';
    }
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
        return <AlertOctagon className="h-4 w-4" />;
      case 'hallucination':
        return <Zap className="h-4 w-4" />;
      case 'hate_speech':
        return <AlertTriangle className="h-4 w-4" />;
      case 'compliance':
        return <Shield className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Input */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Input</h4>
        <div className="bg-gray-50 rounded-lg p-3 border">
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{input}</p>
        </div>
      </div>

      {/* Output */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Output</h4>
        <div className="bg-gray-50 rounded-lg p-3 border">
          {output.includes('⚠️ **Content Blocked by EthosLens Governance**') ? (
            <div className="text-sm text-gray-800 prose prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  // Custom styling for blocked content
                  h1: ({children}) => <h1 className="text-lg font-bold text-red-600 mb-3">{children}</h1>,
                  h2: ({children}) => <h2 className="text-base font-semibold text-red-600 mb-2">{children}</h2>,
                  strong: ({children}) => <strong className="font-semibold text-red-700">{children}</strong>,
                  ul: ({children}) => <ul className="list-disc list-inside space-y-1 ml-4 text-red-800">{children}</ul>,
                  li: ({children}) => <li className="text-red-800">{children}</li>,
                  p: ({children}) => <p className="text-gray-700 mb-2 last:mb-0">{children}</p>
                }}
              >
                {output}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{output}</p>
          )}
        </div>
      </div>

      {/* Violations */}
      {violations.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Violations ({violations.length})
          </h4>
          <div className="space-y-2">
            {violations.map((violation, index) => (
              <div
                key={index}
                className={`flex items-start space-x-3 p-3 rounded-lg border ${getViolationColor(violation.type)}`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getViolationIcon(violation.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium uppercase tracking-wide">
                      {violation.type.replace('_', ' ')}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-white/60 rounded-full font-medium">
                      Severity: {violation.severity}/10
                    </span>
                  </div>
                  <p className="text-sm opacity-90 mb-1">{violation.description}</p>
                  {violation.regulatoryFramework && (
                    <p className="text-xs opacity-75 font-medium">
                      Regulation: {violation.regulatoryFramework}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractionContent;
