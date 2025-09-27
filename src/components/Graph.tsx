import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Network, 
  Maximize2, 
  Minimize2,
  RefreshCw, 
  Eye,
  EyeOff,
  Database,
  Activity,
  AlertTriangle,
  Users,
  FileText
} from 'lucide-react';
import { apiService } from '../api/apiService';

interface GraphNode {
  id: string;
  label: string;
  type: string;
  properties: any;
  color: string;
  size: number;
}

interface GraphLink {
  source: string;
  target: string;
  type: string;
  properties?: any;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

const Graph: React.FC = () => {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [ForceGraph2D, setForceGraph2D] = useState<any>(null);
  const [isGraphLoading, setIsGraphLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  // Load the 2D force graph library
  useEffect(() => {
    import('react-force-graph-2d').then((module) => {
      setForceGraph2D(() => module.default);
      setIsGraphLoading(false);
    }).catch(() => {
      setIsGraphLoading(false);
    });
  }, []);

  // Fetch graph data
  const fetchGraphData = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Fetching graph data for visualization...');
      const data = await apiService.getGraphData();
      console.log('Graph data received:', data);
      setGraphData(data);
      setError(null);
    } catch (err) {
      setError('Failed to load graph data');
      console.error('Graph data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load only - auto-refresh removed
  useEffect(() => {
    fetchGraphData();
    // Auto-refresh removed - data updates only on manual page refresh
  }, [fetchGraphData]);

  // Get node color based on type
  const getNodeColor = useCallback((node: GraphNode) => {
    const colors: Record<string, string> = {
      'Interaction': '#4A90E2',
      'Violation': '#E74C3C',
      'AgentAction': '#2ECC71',
      'UserFeedback': '#F39C12',
      'AuditLog': '#9B59B6',
      'Settings': '#95A5A6'
    };
    return colors[node.type] || '#95A5A6';
  }, []);

  // Get link color based on type
  const getLinkColor = useCallback((link: GraphLink) => {
    const colors: Record<string, string> = {
      'HAS_VIOLATION': '#E74C3C',
      'PROCESSED_BY': '#2ECC71',
      'TRIGGERED_ACTION': '#F39C12',
      'HAS_FEEDBACK': '#3498DB',
      'AUDITS': '#9B59B6',
      'default': '#888888'
    };
    return colors[link.type] || colors.default;
  }, []);

  // Handle node click
  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node as GraphNode);
    console.log('Node clicked:', node);
  }, []);

  // Get node type icon
  const getNodeTypeIcon = (type: string) => {
    switch (type) {
      case 'Interaction':
        return <Activity className="h-4 w-4" />;
      case 'Violation':
        return <AlertTriangle className="h-4 w-4" />;
      case 'AgentAction':
        return <Users className="h-4 w-4" />;
      case 'UserFeedback':
        return <FileText className="h-4 w-4" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  // Get statistics
  const stats = React.useMemo(() => {
    const nodeTypes: { [key: string]: number } = {};
    const linkTypes: { [key: string]: number } = {};
    
    graphData.nodes.forEach(node => {
      nodeTypes[node.type] = (nodeTypes[node.type] || 0) + 1;
    });
    
    graphData.links.forEach(link => {
      linkTypes[link.type] = (linkTypes[link.type] || 0) + 1;
    });
    
    return { nodeTypes, linkTypes };
  }, [graphData]);

  // Dynamic sizing based on container and viewport
  const graphHeight = isFullscreen ? window.innerHeight : dimensions.height;

  // Update dimensions when container size changes or fullscreen toggles
  useEffect(() => {
    const updateDimensions = () => {
      if (isFullscreen) {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight
        });
      } else {
        // Calculate available width from the graph container itself
        const graphContainer = containerRef.current;
        if (graphContainer) {
          const containerRect = graphContainer.getBoundingClientRect();
          const availableWidth = containerRect.width || graphContainer.offsetWidth;
          const availableHeight = Math.max(500, window.innerHeight * 0.7); // Min 500px, max 70% of viewport
          
          setDimensions({
            width: availableWidth > 0 ? availableWidth : window.innerWidth - (showControls ? 400 : 100),
            height: availableHeight
          });
        } else {
          // Fallback: calculate based on viewport and sidebar
          const sidebarWidth = showControls ? 320 : 0; // 320px for sidebar + padding
          const padding = 100; // General padding
          
          setDimensions({
            width: window.innerWidth - sidebarWidth - padding,
            height: Math.max(500, window.innerHeight * 0.7)
          });
        }
      }
    };

    // Delay initial calculation to ensure DOM is ready
    const timeoutId = setTimeout(updateDimensions, 100);

    // Update on window resize
    const handleResize = () => {
      setTimeout(updateDimensions, 50); // Small delay to ensure layout is complete
    };

    window.addEventListener('resize', handleResize);
    
    // Use ResizeObserver to watch for container size changes
    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        setTimeout(updateDimensions, 50);
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [isFullscreen, showControls]);

  // Render the 2D graph component
  const renderGraph = () => {
    if (isGraphLoading || !ForceGraph2D) {
      return (
        <div 
          className="flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg absolute inset-0"
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading Graph...</p>
          </div>
        </div>
      );
    }

    if (!ForceGraph2D) {
      return (
        <div 
          className="flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg absolute inset-0"
        >
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-red-600 text-xl">⚠️</span>
            </div>
            <p className="text-sm text-red-600">Graph library failed to load</p>
          </div>
        </div>
      );
    }

    if (graphData.nodes.length === 0) {
      return (
        <div 
          className="flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg absolute inset-0"
        >
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-gray-500 text-xl">📊</span>
            </div>
            <p className="text-sm text-gray-600">No graph data available</p>
            <p className="text-xs text-gray-400 mt-1">Process some interactions to see the graph</p>
          </div>
        </div>
      );
    }

    return (
      <div 
        ref={containerRef}
        className="bg-white border border-gray-200 rounded-lg overflow-hidden absolute inset-0"
      >
        <ForceGraph2D
          graphData={graphData}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="#ffffff"
          
          // Node styling
          nodeColor={getNodeColor}
          nodeVal={(node: any) => {
            if (node.type === 'Violation') {
              return Math.max(4, (node.properties?.severity || 5) * 0.8);
            }
            return node.type === 'Interaction' ? 8 : 6;
          }}
          nodeLabel={(node: any) => `
            <div style="
              background: rgba(0,0,0,0.8); 
              color: white; 
              padding: 8px 12px; 
              border-radius: 6px; 
              font-size: 12px;
              max-width: 200px;
            ">
              <strong>${node.type}</strong><br/>
              ${node.label}<br/>
              <small style="opacity: 0.8;">Click for details</small>
            </div>
          `}
          
          // Link styling
          linkColor={getLinkColor}
          linkWidth={2}
          linkDirectionalArrowLength={6}
          linkDirectionalArrowRelPos={1}
          linkLabel={(link: any) => `
            <div style="
              background: rgba(0,0,0,0.8); 
              color: white; 
              padding: 6px 10px; 
              border-radius: 4px; 
              font-size: 11px;
            ">
              ${link.type}
            </div>
          `}
          
          // Interactions
          onNodeClick={handleNodeClick}
          
          // Physics
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
          warmupTicks={100}
          cooldownTicks={200}
          
          // Node canvas rendering for better performance
          nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
            const label = node.label;
            const fontSize = 12/globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;
            
            // Draw node circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.val || 5, 0, 2 * Math.PI, false);
            ctx.fillStyle = getNodeColor(node);
            ctx.fill();
            
            // Draw border
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2/globalScale;
            ctx.stroke();
            
            // Draw label
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#333333';
            ctx.fillText(label, node.x, node.y + (node.val || 5) + fontSize + 2);
          }}
        />
      </div>
    );
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-200 rounded-lg p-6"
      >
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Knowledge Graph...</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-200 rounded-lg p-6"
      >
        <div className="flex items-center justify-center h-96 text-red-600">
          <AlertTriangle className="h-6 w-6 mr-2" />
          <span>{error}</span>
        </div>
      </motion.div>
    );
  }

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'relative'}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-200 rounded-lg overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Network className="h-5 w-5 text-black" />
            <h3 className="text-lg font-semibold text-black">Knowledge Graph</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>{graphData.nodes.length} nodes</span>
              <span>•</span>
              <span>{graphData.links.length} relationships</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Controls toggle */}
            <button
              onClick={() => setShowControls(!showControls)}
              className="p-1 text-gray-400 hover:text-black transition-colors"
              title="Toggle info panel"
            >
              {showControls ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            
            {/* Manual refresh */}
            <button
              onClick={fetchGraphData}
              className="p-1 text-gray-400 hover:text-black transition-colors"
              title="Refresh graph"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            
            {/* Fullscreen toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1 text-gray-400 hover:text-black transition-colors"
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex" style={{ height: graphHeight }}>
          {/* Main Graph Area */}
          <div className="flex-1 relative">
            {renderGraph()}
          </div>

          {/* Side Panel */}
          {showControls && (
            <div className="w-80 border-l border-gray-200 bg-gray-50 p-4 overflow-y-auto flex-shrink-0">
              {/* Statistics */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Graph Statistics</h4>
                <div className="space-y-2">
                  <div className="text-xs">
                    <span className="text-gray-500">Total Nodes:</span>
                    <span className="ml-2 font-medium">{graphData.nodes.length}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-gray-500">Total Relationships:</span>
                    <span className="ml-2 font-medium">{graphData.links.length}</span>
                  </div>
                </div>
              </div>

              {/* Node Types */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Node Types</h4>
                <div className="space-y-2">
                  {Object.entries(stats.nodeTypes).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center space-x-2">
                        {getNodeTypeIcon(type)}
                        <span className="text-xs text-gray-700">{type}</span>
                      </div>
                      <span className="text-xs font-medium text-black">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Relationship Types */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Relationships</h4>
                <div className="space-y-2">
                  {Object.entries(stats.linkTypes).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between p-2 bg-white rounded border">
                      <span className="text-xs text-gray-700">{type}</span>
                      <span className="text-xs font-medium text-black">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Node Details */}
              {selectedNode && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Selected Node</h4>
                  <div className="bg-white rounded border p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      {getNodeTypeIcon(selectedNode.type)}
                      <span className="text-sm font-medium text-black">{selectedNode.type}</span>
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      <strong>Label:</strong> {selectedNode.label}
                    </div>
                    <div className="text-xs text-gray-600">
                      <strong>ID:</strong> {selectedNode.id}
                    </div>
                  </div>
                </div>
              )}

              {/* Legend */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Legend</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>Interactions</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span>Violations</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Agent Actions</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Graph;
