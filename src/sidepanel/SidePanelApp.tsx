import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, { 
  Node, 
  Edge, 
  addEdge, 
  Connection, 
  useNodesState, 
  useEdgesState,
  Controls,
  Background,
  MiniMap
} from 'reactflow';
import 'reactflow/dist/style.css';
import KnowledgeGraphSidebar from '../components/KnowledgeGraphSidebar';
import NodeDetailPanel from '../components/NodeDetailPanel';
import SearchInterface from '../components/SearchInterface';
import { Spotlight } from '../components/ui/spotlight';

interface GraphNodeData {
  label: string;
  url?: string;
  summary?: string;
  timestamp?: number;
  importance: number;
  domain?: string;
  contentType?: string;
  connectedPages?: string[];
}

interface GraphNode extends Node<GraphNodeData> {
  type: 'page' | 'concept' | 'author' | 'domain';
}

interface GraphEdgeData {
  strength: number;
  relationship: string;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  data: GraphEdgeData;
  type: 'relates_to' | 'authored_by' | 'part_of' | 'similar_to';
}

const SidePanelApp: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportMainNodeText, setExportMainNodeText] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [allNodes, setAllNodes] = useState<GraphNode[]>([]); // Store all nodes for search
  const [allEdges, setAllEdges] = useState<GraphEdge[]>([]); // Store all edges
  const [hasKnowledgeResults, setHasKnowledgeResults] = useState(false);
  const [filters, setFilters] = useState({
    nodeType: 'all',
    dateRange: 'all',
    domain: 'all'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentZoom, setCurrentZoom] = useState(1); // Track zoom level for dynamic node sizing

  // Popular sites data for widget - below search bar only
  const [popularSites, setPopularSites] = useState([
    { name: 'YouTube', url: 'https://youtube.com', logo: 'https://www.youtube.com/favicon.ico', color: 'from-red-500 to-red-600' },
    { name: 'GitHub', url: 'https://github.com', logo: 'https://github.com/favicon.ico', color: 'from-gray-600 to-gray-700' },
    { name: 'LinkedIn', url: 'https://linkedin.com', logo: 'https://linkedin.com/favicon.ico', color: 'from-blue-600 to-blue-700' },
    { name: 'Twitter', url: 'https://x.com', logo: 'https://x.com/favicon.ico', color: 'from-blue-400 to-blue-500' },
    { name: 'Reddit', url: 'https://reddit.com', logo: 'https://reddit.com/favicon.ico', color: 'from-orange-500 to-orange-600' },
    { name: 'Stack Overflow', url: 'https://stackoverflow.com', logo: 'https://stackoverflow.com/favicon.ico', color: 'from-orange-400 to-yellow-500' },
    { name: 'Wikipedia', url: 'https://wikipedia.org', logo: 'https://wikipedia.org/favicon.ico', color: 'from-gray-500 to-gray-600' },
    { name: 'Google', url: 'https://google.com', logo: 'https://www.google.com/favicon.ico', color: 'from-blue-500 to-green-500' }
  ]);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update node styles when zoom changes
  useEffect(() => {
    if (nodes.length > 0) {
      const updatedNodes = nodes.map(node => ({
        ...node,
        style: getNodeStyle(node.type || 'page', false, allNodes.length, currentZoom)
      }));
      setNodes(updatedNodes);
    }
  }, [currentZoom, allNodes.length]);

  // Load graph data on component mount
  useEffect(() => {
    loadGraphData();
  }, []);

  // Function to add sample data for testing
  const addSampleData = () => {
    const sampleNodes = [
      {
        id: 'sample-1',
        type: 'page',
        position: { x: 100, y: 100 },
        data: {
          label: 'AI Research Paper',
          url: 'https://example.com/ai-paper',
          summary: 'A comprehensive study on machine learning algorithms',
          timestamp: Date.now(),
          importance: 0.8,
          domain: 'example.com',
          contentType: 'article'
        }
      },
      {
        id: 'sample-2',
        type: 'concept',
        position: { x: 300, y: 150 },
        data: {
          label: 'Machine Learning',
          importance: 0.9,
          contentType: 'concept'
        }
      },
      {
        id: 'sample-3',
        type: 'page',
        position: { x: 200, y: 300 },
        data: {
          label: 'Neural Networks Guide',
          url: 'https://example.com/neural-networks',
          summary: 'Understanding neural network architectures',
          timestamp: Date.now() - 86400000,
          importance: 0.7,
          domain: 'example.com',
          contentType: 'tutorial'
        }
      }
    ];

    const sampleEdges = [
      {
        id: 'edge-1',
        source: 'sample-1',
        target: 'sample-2',
        type: 'relates_to',
        data: { strength: 0.8, relationship: 'discusses' }
      },
      {
        id: 'edge-2',
        source: 'sample-2',
        target: 'sample-3',
        type: 'relates_to',
        data: { strength: 0.7, relationship: 'explains' }
      }
    ];

    // Transform for ReactFlow
    const flowNodes = sampleNodes.map(node => ({
      ...node,
      style: getNodeStyle(node.type, false, 0, currentZoom),
      data: {
        ...node.data,
        label: truncateLabel(node.data.label, 30),
        fullLabel: node.data.label // Store full label for tooltip
      },
      // Add tooltip with full text
      title: node.data.label || node.data.summary || 'Knowledge Node'
    }));

    const flowEdges = sampleEdges.map(edge => ({
      ...edge,
      style: getEdgeStyle(edge.data.strength),
      animated: edge.data.strength > 0.7
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
  };

  const loadGraphData = async () => {
    setIsLoading(true);
    try {
      console.log('Loading graph data...');
      chrome.runtime.sendMessage({ type: 'GET_GRAPH_DATA' }, (response) => {
        console.log('Graph data response:', response);
        if (response?.success) {
          const { nodes: graphNodes, edges: graphEdges } = response.data;
          console.log('Received nodes:', graphNodes.length, 'edges:', graphEdges.length);
          
          // Store all nodes and edges for search
          setAllNodes(graphNodes);
          setAllEdges(graphEdges);
          
          // Transform nodes for ReactFlow with scattered positions and dynamic sizing
          const positions: Array<{x: number, y: number}> = [];
          const flowNodes = graphNodes.map((node: any, index: number) => {
            const position = generateScatteredPosition(index, graphNodes.length, positions);
            positions.push(position);
            
            return {
              ...node,
              type: 'default',
              position,
              style: getNodeStyle(node.type, false, graphNodes.length, currentZoom),
              data: {
                ...node.data,
                label: truncateLabel(node.data.label, graphNodes.length <= 50 ? 12 : 8),
                fullLabel: node.data.label // Store full label for tooltip
              },
              // Add tooltip with full text
              title: node.data.label || node.data.summary || 'Knowledge Node'
            };
          });

          // Transform edges for ReactFlow
          const flowEdges = graphEdges.map((edge: any) => ({
            ...edge,
            type: 'default',
            style: getEdgeStyle(edge.data.strength),
            animated: edge.data.strength > 0.7
          }));

          console.log('Setting flowNodes:', flowNodes.length, 'flowEdges:', flowEdges.length);
          setNodes(flowNodes);
          setEdges(flowEdges);
        } else {
          console.error('Failed to get graph data:', response);
        }
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Failed to load graph data:', error);
      setIsLoading(false);
    }
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node as GraphNode);
  }, []);

  // Handle zoom changes to update node sizes
  const onZoomChange = useCallback((zoomLevel: number) => {
    setCurrentZoom(zoomLevel);
  }, []);

  const getNodeStyle = (nodeType: string, isSearchResult = false, nodeCount = 0, zoom = 1) => {
    // Dynamic sizing based on node count and zoom level
    let baseSize;
    if (nodeCount <= 10) {
      baseSize = isSearchResult ? 60 : 30; // Larger for fewer nodes
    } else if (nodeCount <= 50) {
      baseSize = isSearchResult ? 50 : 25; // Medium size
    } else if (nodeCount <= 100) {
      baseSize = isSearchResult ? 40 : 20; // Smaller for many nodes
    } else {
      baseSize = isSearchResult ? 35 : 18; // Still readable for lots of nodes
    }

    // Increase size based on zoom level
    const zoomedSize = Math.max(18, baseSize * zoom);
    const showText = zoomedSize >= 18; // Show text for readable sizes
    
    const baseStyle = {
      width: zoomedSize,
      height: zoomedSize,
      borderRadius: zoomedSize < 30 ? '50%' : '12px', // Round for small nodes, rounded rect for larger
      fontSize: showText ? Math.min(12, Math.max(7, zoomedSize * 0.3)) + 'px' : '0px',
      fontWeight: '600',
      border: '1px solid',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start', // Left align text
      paddingLeft: zoomedSize < 30 ? '0' : '8px', // Add padding for larger nodes
      opacity: isSearchResult ? 1 : 0.8,
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      backdropFilter: 'blur(12px)',
      color: showText ? '#ffffff' : 'transparent',
      cursor: 'pointer',
      boxShadow: isSearchResult ? '0 0 20px rgba(59, 130, 246, 0.6)' : '0 0 8px rgba(59, 130, 246, 0.3)',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap' as const,
      overflow: 'hidden',
      textAlign: 'left' as const
    };

    switch (nodeType) {
      case 'page':
        return { 
          ...baseStyle, 
          backgroundColor: isSearchResult ? 'rgba(59, 130, 246, 0.9)' : 'rgba(59, 130, 246, 0.7)', 
          borderColor: '#60a5fa'
        };
      case 'concept':
        return { 
          ...baseStyle, 
          backgroundColor: isSearchResult ? 'rgba(52, 211, 153, 0.9)' : 'rgba(52, 211, 153, 0.7)', 
          borderColor: '#34d399'
        };
      case 'author':
        return { 
          ...baseStyle, 
          backgroundColor: isSearchResult ? 'rgba(251, 191, 36, 0.9)' : 'rgba(251, 191, 36, 0.7)', 
          borderColor: '#fbbf24'
        };
      case 'domain':
        return { 
          ...baseStyle, 
          backgroundColor: isSearchResult ? 'rgba(167, 139, 250, 0.9)' : 'rgba(167, 139, 250, 0.7)', 
          borderColor: '#a78bfa'
        };
      default:
        return { 
          ...baseStyle, 
          backgroundColor: isSearchResult ? 'rgba(156, 163, 175, 0.9)' : 'rgba(156, 163, 175, 0.7)', 
          borderColor: '#9ca3af'
        };
    }
  };

  const getEdgeStyle = (strength: number) => {
    return {
      strokeWidth: Math.max(0.5, strength * 1.5),
      stroke: `rgba(100, 116, 139, ${Math.max(0.2, strength * 0.6)})`,
      filter: 'drop-shadow(0 0 2px rgba(100, 116, 139, 0.3))'
    };
  };

  // Generate scattered positions around the search bar with overlap prevention
  const generateScatteredPosition = (index: number, total: number, existingPositions: Array<{x: number, y: number}> = []) => {
    const centerX = 640; // Center of viewport
    const centerY = 360;
    const searchBarRadius = 180; // Keep nodes away from search bar
    const maxRadius = 300;
    const minDistance = 30; // Minimum distance between nodes
    
    let position;
    let attempts = 0;
    const maxAttempts = 50;
    
    do {
      // Create concentric circles with some randomization
      const ring = Math.floor(index / Math.max(8, total / 5)) + 1;
      const angleStep = (2 * Math.PI) / Math.max(8, Math.ceil(total / ring));
      const angle = (index * angleStep) + (Math.random() - 0.5) * 0.5;
      const radius = searchBarRadius + (ring * (maxRadius - searchBarRadius) / 4) + (Math.random() - 0.5) * 40;
      
      position = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
      
      attempts++;
    } while (
      attempts < maxAttempts && 
      existingPositions.some(existing => 
        Math.sqrt(Math.pow(position.x - existing.x, 2) + Math.pow(position.y - existing.y, 2)) < minDistance
      )
    );
    
    return position;
  };

  // Arrange nodes in a grid pattern
  const arrangeNodesInGrid = () => {
    const cols = Math.ceil(Math.sqrt(allNodes.length));
    const rows = Math.ceil(allNodes.length / cols);
    const startX = 300;
    const startY = 200;
    const spacingX = 80;
    const spacingY = 80;
    
    const updatedNodes = allNodes.map((node, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      
      return {
        ...node,
        position: {
          x: startX + col * spacingX,
          y: startY + row * spacingY
        },
        style: getNodeStyle(node.type, false, allNodes.length, currentZoom),
        data: {
          ...node.data,
          label: truncateLabel(node.data.label, allNodes.length <= 50 ? 12 : 8),
          fullLabel: node.data.label // Store full label for tooltip
        },
        // Add tooltip with full text
        title: node.data.label || node.data.summary || 'Knowledge Node'
      };
    });
    
    setNodes(updatedNodes);
  };

  // Export functionality with PNG support
  const exportNodes = (format: 'json' | 'csv' | 'png') => {
    if (format === 'png') {
      setShowExportModal(true);
      return;
    }

    const dataToExport = allNodes.map(node => ({
      id: node.id,
      type: node.type,
      label: node.data.label,
      url: node.data.url || '',
      summary: node.data.summary || '',
      domain: node.data.domain || '',
      importance: node.data.importance,
      timestamp: node.data.timestamp
    }));

    let content, filename, mimeType;

    if (format === 'json') {
      content = JSON.stringify(dataToExport, null, 2);
      filename = 'knowledge-graph-nodes.json';
      mimeType = 'application/json';
    } else {
      const headers = ['ID', 'Type', 'Label', 'URL', 'Summary', 'Domain', 'Importance', 'Timestamp'];
      const csvContent = [
        headers.join(','),
        ...dataToExport.map(row => 
          headers.map(header => {
            const key = header.toLowerCase().replace(/\s+/g, '');
            const value = row[key as keyof typeof row] || '';
            return `"${String(value).replace(/"/g, '""')}"`;
          }).join(',')
        )
      ].join('\n');
      
      content = csvContent;
      filename = 'knowledge-graph-nodes.csv';
      mimeType = 'text/csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // PNG Export function
  const exportAsPNG = () => {
    if (!exportMainNodeText.trim()) {
      alert('Please enter the main node text before exporting');
      return;
    }

    // Create a canvas to draw the knowledge graph
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1920;
    canvas.height = 1080;

    // Fill background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Knowledge Graph: ${exportMainNodeText}`, canvas.width / 2, 50);

    // Draw nodes
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 200;

    allNodes.forEach((node, index) => {
      const angle = (index / allNodes.length) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      // Draw node circle
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, 2 * Math.PI);
      
      // Node color based on type
      switch (node.type) {
        case 'page':
          ctx.fillStyle = '#3b82f6';
          break;
        case 'concept':
          ctx.fillStyle = '#34d399';
          break;
        case 'author':
          ctx.fillStyle = '#fbbf24';
          break;
        case 'domain':
          ctx.fillStyle = '#a78bfa';
          break;
        default:
          ctx.fillStyle = '#9ca3af';
      }
      
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw node label
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(node.data.label.substring(0, 15), x, y + 35);
    });

    // Draw edges
    allEdges.forEach(edge => {
      const sourceNode = allNodes.find(n => n.id === edge.source);
      const targetNode = allNodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        const sourceIndex = allNodes.indexOf(sourceNode);
        const targetIndex = allNodes.indexOf(targetNode);
        
        const sourceAngle = (sourceIndex / allNodes.length) * 2 * Math.PI;
        const targetAngle = (targetIndex / allNodes.length) * 2 * Math.PI;
        
        const sourceX = centerX + radius * Math.cos(sourceAngle);
        const sourceY = centerY + radius * Math.sin(sourceAngle);
        const targetX = centerX + radius * Math.cos(targetAngle);
        const targetY = centerY + radius * Math.sin(targetAngle);

        ctx.beginPath();
        ctx.moveTo(sourceX, sourceY);
        ctx.lineTo(targetX, targetY);
        ctx.strokeStyle = `rgba(100, 116, 139, ${edge.data.strength * 0.8})`;
        ctx.lineWidth = edge.data.strength * 3;
        ctx.stroke();
      }
    });

    // Convert to blob and download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `knowledge-graph-${exportMainNodeText.replace(/\s+/g, '-').toLowerCase()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setShowExportModal(false);
        setExportMainNodeText('');
      }
    }, 'image/png');
  };

  // Widget helper functions
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  // Widget Components
  const ClockWidget = () => (
    <div className="fixed top-6 left-6 bg-black/20 backdrop-blur-xl rounded-2xl p-4 border border-white/10 min-w-[180px]">
      <div className="text-white/90 text-2xl font-light">{formatTime(currentTime)}</div>
      <div className="text-white/60 text-sm mt-1">{formatDate(currentTime)}</div>
    </div>
  );

  const FilterWidget = () => (
    <div className="fixed top-1/2 right-6 transform -translate-y-1/2">
      <div className="relative">
        {/* <button
          onClick={() => setShowFilters(!showFilters)}
          className="bg-black/20 backdrop-blur-xl rounded-full p-3 border border-white/20 text-white/80 hover:bg-black/30 transition-all mb-4"
          title="Filter Nodes"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
          </svg>
        </button> */}
        
        {showFilters && (
          <div className="absolute top-0 right-14 bg-black/30 backdrop-blur-xl rounded-2xl p-4 border border-white/20 min-w-[250px] z-50">
            <h3 className="text-white/90 text-sm font-medium mb-3">Filter Nodes</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-white/70 text-xs mb-2 block">Node Type</label>
                <select
                  value={filters.nodeType}
                  onChange={(e) => applyFilters({ ...filters, nodeType: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white/90 text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="page">Pages</option>
                  <option value="concept">Concepts</option>
                  <option value="author">Authors</option>
                  <option value="domain">Domains</option>
                </select>
              </div>
              
              <div>
                <label className="text-white/70 text-xs mb-2 block">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => applyFilters({ ...filters, dateRange: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white/90 text-sm"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
              
              <div>
                <label className="text-white/70 text-xs mb-2 block">Domain</label>
                <select
                  value={filters.domain}
                  onChange={(e) => applyFilters({ ...filters, domain: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white/90 text-sm"
                >
                  <option value="all">All Domains</option>
                  {Array.from(new Set(allNodes.map(node => node.data.domain).filter(Boolean))).map(domain => (
                    <option key={domain} value={domain}>{domain}</option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={() => applyFilters({ nodeType: 'all', dateRange: 'all', domain: 'all' })}
                className="w-full px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/30 rounded-lg text-white/90 text-sm transition-all"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const MenuWidget = () => (
    <div className="fixed top-6 right-6">
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="bg-black/20 backdrop-blur-xl rounded-full p-3 border border-white/20 text-white/80 hover:bg-black/30 transition-all"
          title="Menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
        
        {showMenu && (
          <div className="absolute top-12 right-0 bg-black/30 backdrop-blur-xl rounded-2xl p-4 border border-white/20 min-w-[200px] z-50">
            <div className="space-y-2">
              <button
                onClick={() => { exportNodes('json'); setShowMenu(false); }}
                className="w-full text-left px-3 py-2 text-white/80 hover:bg-white/10 rounded-lg transition-all text-sm"
              >
                Export as JSON
              </button>
              <button
                onClick={() => { exportNodes('csv'); setShowMenu(false); }}
                className="w-full text-left px-3 py-2 text-white/80 hover:bg-white/10 rounded-lg transition-all text-sm"
              >
                Export as CSV
              </button>
              <button
                onClick={() => { exportNodes('png'); setShowMenu(false); }}
                className="w-full text-left px-3 py-2 text-white/80 hover:bg-white/10 rounded-lg transition-all text-sm"
              >
                Export as PNG
              </button>
              <button
                onClick={() => { arrangeNodesInGrid(); setShowMenu(false); }}
                className="w-full text-left px-3 py-2 text-white/80 hover:bg-white/10 rounded-lg transition-all text-sm"
              >
                Arrange Nodes
              </button>
              <button
                onClick={() => { loadGraphData(); setShowMenu(false); }}
                className="w-full text-left px-3 py-2 text-white/80 hover:bg-white/10 rounded-lg transition-all text-sm"
              >
                Refresh Graph
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Popular Sites component for below search bar only
  const PopularSitesBelowSearch = () => (
    <div className="absolute top-full mt-6 left-1/2 transform -translate-x-1/2 z-10">
      <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
        <div className="flex items-center justify-center space-x-4">
          {popularSites.slice(0, 8).map((site, index) => (
            <button
              key={index}
              onClick={() => window.open(site.url, '_blank')}
              className="flex flex-col items-center space-y-2 p-3 rounded-xl bg-white/5 hover:bg-white/15 transition-all group"
              title={site.name}
            >
              <img 
                src={site.logo} 
                alt={`${site.name} logo`} 
                className="w-8 h-8 rounded-lg group-hover:scale-110 transition-transform"
                onError={(e) => {
                  // Fallback to colored circle if logo fails
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div 
                className={`w-8 h-8 rounded-lg bg-gradient-to-br ${site.color} hidden group-hover:scale-110 transition-transform`}
                style={{ display: 'none', alignItems: 'center', justifyContent: 'center' }}
              >
                <span className="text-white text-xs font-bold">{site.name.charAt(0)}</span>
              </div>
              <span className="text-white/70 text-xs group-hover:text-white/90 transition-colors">
                {site.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Traily Logo Component - using actual logo
  const TrailyLogo = () => (
    <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-20">
      <div className="flex items-center space-x-3 bg-black/20 backdrop-blur-xl rounded-2xl p-3 border border-white/10">
        <img 
          src="assets/traily-logo.png" 
          alt="Traily Logo" 
          className="w-8 h-8 rounded-lg"
          onError={(e) => {
            // Fallback to SVG icon if PNG fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) {
              fallback.style.display = 'flex';
            }
          }}
        />
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 items-center justify-center" style={{ display: 'none' }}>
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <span className="text-white/90 text-lg font-semibold">Traily</span>
      </div>
    </div>
  );

  const DeleteAllDataButton = () => {
    const handleDeleteAllData = () => {
      if (window.confirm('Are you sure you want to delete all knowledge graph data? This action cannot be undone.')) {
        // Clear all extension storage
        chrome.storage.local.clear(() => {
          console.log('All data cleared');
          // Reset the current state
          setNodes([]);
          setEdges([]);
          setAllNodes([]);
          setAllEdges([]);
          setSelectedNode(null);
          setSearchQuery('');
          setHasKnowledgeResults(false);
          // Show confirmation
          alert('All knowledge graph data has been deleted successfully.');
        });
      }
    };

    return (
      <div className="fixed bottom-6 right-6">
        <button
          onClick={handleDeleteAllData}
          className="bg-red-500/20 backdrop-blur-xl rounded-full p-3 border border-red-400/30 text-red-300 hover:bg-red-500/30 hover:text-red-200 transition-all"
          title="Delete All Data"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    );
  };

  const truncateLabel = (label: string, maxLength: number) => {
    return label.length > maxLength ? `${label.substring(0, maxLength)}...` : label;
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearching(!!query.trim());
    
    if (!query.trim()) {
      // Reset to show all nodes in scattered positions
      const positions: Array<{x: number, y: number}> = [];
      const flowNodes = allNodes.map((node: any, index: number) => {
        const position = generateScatteredPosition(index, allNodes.length, positions);
        positions.push(position);
        
        return {
          ...node,
          type: 'default',
          position,
          style: getNodeStyle(node.type, false, allNodes.length, currentZoom),
          data: {
            ...node.data,
            label: truncateLabel(node.data.label, allNodes.length <= 50 ? 12 : 8),
            fullLabel: node.data.label // Store full label for tooltip
          },
          // Add tooltip with full text
          title: node.data.label || node.data.summary || 'Knowledge Node'
        };
      });

      const flowEdges = allEdges.map((edge: any) => ({
        ...edge,
        type: 'default',
        style: getEdgeStyle(edge.data.strength),
        animated: false
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
      setHasKnowledgeResults(false);
      return;
    }

    // Filter nodes based on search query
    const filteredNodes = allNodes.filter((node: any) => 
      node.data.label.toLowerCase().includes(query.toLowerCase()) ||
      (node.data.summary && node.data.summary.toLowerCase().includes(query.toLowerCase())) ||
      (node.data.domain && node.data.domain.toLowerCase().includes(query.toLowerCase())) ||
      (node.data.url && node.data.url.toLowerCase().includes(query.toLowerCase()))
    );

    // Filter edges to only show those connecting filtered nodes
    const filteredNodeIds = new Set(filteredNodes.map((n: any) => n.id));
    const filteredEdges = allEdges.filter((edge: any) => 
      filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target)
    );

    // Transform for ReactFlow with enhanced styling for search results
    const flowNodes = filteredNodes.map((node: any, index: number) => ({
      ...node,
      type: 'default',
      position: {
        x: 500 + (index % 3) * 150,
        y: 250 + Math.floor(index / 3) * 120
      },
      style: getNodeStyle(node.type, true, filteredNodes.length, currentZoom),
      data: {
        ...node.data,
        label: truncateLabel(node.data.label, 15),
        fullLabel: node.data.label // Store full label for tooltip
      },
      // Add tooltip with full text
      title: node.data.label || node.data.summary || 'Knowledge Node'
    }));

    const flowEdges = filteredEdges.map((edge: any) => ({
      ...edge,
      type: 'default',
      style: getEdgeStyle(edge.data.strength),
      animated: true
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
    setHasKnowledgeResults(filteredNodes.length > 0);
  };

  // Handle web search
  const handleWebSearch = (query: string) => {
    if (!query.trim()) return;
    
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.update(tabs[0].id, { url: searchUrl });
      }
    });
  };

  // Handle direct URL navigation
  const handleDirectUrl = (url: string) => {
    if (!url.trim()) return;
    
    let finalUrl = url;
    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      finalUrl = `https://${url}`;
    }
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.update(tabs[0].id, { url: finalUrl });
      }
    });
  };

  const applyFilters = (newFilters: typeof filters) => {
    setFilters(newFilters);
    
    chrome.runtime.sendMessage({ type: 'GET_GRAPH_DATA' }, (response) => {
      if (response?.success) {
        let { nodes: graphNodes, edges: graphEdges } = response.data;

        // Apply filters
        if (newFilters.nodeType !== 'all') {
          graphNodes = graphNodes.filter((node: any) => node.type === newFilters.nodeType);
        }

        if (newFilters.dateRange !== 'all') {
          const now = Date.now();
          const filterTime = {
            'today': 24 * 60 * 60 * 1000,
            'week': 7 * 24 * 60 * 60 * 1000,
            'month': 30 * 24 * 60 * 60 * 1000
          }[newFilters.dateRange] || 0;

          graphNodes = graphNodes.filter((node: any) => 
            node.data.timestamp && (now - node.data.timestamp) <= filterTime
          );
        }

        if (newFilters.domain !== 'all') {
          graphNodes = graphNodes.filter((node: any) => 
            node.data.domain === newFilters.domain
          );
        }

        // Update nodes and edges
        const nodeIds = new Set(graphNodes.map((node: any) => node.id));
        const filteredEdges = graphEdges.filter((edge: any) => 
          nodeIds.has(edge.source) && nodeIds.has(edge.target)
        );

        const flowNodes = graphNodes.map((node: any) => ({
          ...node,
          type: 'default',
          style: getNodeStyle(node.type, false, 0, currentZoom),
          data: {
            ...node.data,
            label: truncateLabel(node.data.label, 30),
            fullLabel: node.data.label // Store full label for tooltip
          },
          // Add tooltip with full text
          title: node.data.label || node.data.summary || 'Knowledge Node'
        }));

        const flowEdges = filteredEdges.map((edge: any) => ({
          ...edge,
          type: 'default',
          style: getEdgeStyle(edge.data.strength),
          animated: edge.data.strength > 0.7
        }));

        setNodes(flowNodes);
        setEdges(flowEdges);
      }
    });
  };

  const closeNodeDetail = () => {
    setSelectedNode(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <svg className="animate-spin w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-white/70">Loading knowledge graph...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative overflow-hidden bg-black">
      {/* Aceternity UI Spotlight Background */}
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="white"
      />
      <Spotlight
        className="top-10 left-full transform -translate-x-1/2"
        fill="purple"
      />
      <Spotlight
        className="top-28 left-80 h-[80vh] w-[50vw]"
        fill="blue"
      />
      
      {/* Enhanced Blinking Stars Background */}
      <div className="absolute inset-0 bg-black">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/30 via-black to-gray-900/30"></div>
        {/* Multiple layers of blinking stars */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(1px 1px at 20px 30px, rgba(255,255,255,0.3), transparent),
            radial-gradient(1px 1px at 40px 70px, rgba(255,255,255,0.2), transparent),
            radial-gradient(2px 2px at 90px 40px, rgba(255,255,255,0.25), transparent),
            radial-gradient(1px 1px at 130px 80px, rgba(255,255,255,0.15), transparent),
            radial-gradient(2px 2px at 160px 30px, rgba(255,255,255,0.2), transparent),
            radial-gradient(1px 1px at 200px 60px, rgba(255,255,255,0.1), transparent),
            radial-gradient(1px 1px at 250px 90px, rgba(255,255,255,0.2), transparent),
            radial-gradient(2px 2px at 300px 20px, rgba(255,255,255,0.15), transparent)
          `,
          backgroundRepeat: 'repeat',
          backgroundSize: '350px 150px',
          animation: 'twinkle 4s ease-in-out infinite alternate'
        }}></div>
        {/* Secondary star layer */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(1px 1px at 100px 120px, rgba(59,130,246,0.3), transparent),
            radial-gradient(1px 1px at 180px 50px, rgba(167,139,250,0.2), transparent),
            radial-gradient(1px 1px at 280px 100px, rgba(52,211,153,0.2), transparent)
          `,
          backgroundRepeat: 'repeat',
          backgroundSize: '400px 200px',
          animation: 'twinkle 6s ease-in-out infinite alternate-reverse'
        }}></div>
      </div>

      {/* Main Content Area */}
      <div className="relative h-full">
        {/* Centered Search Bar - Clean Design */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="min-w-[500px] max-w-[600px]">
            <SearchInterface
              onSearch={handleSearch}
              onWebSearch={handleWebSearch}
              onDirectUrl={handleDirectUrl}
              placeholder="Ask anything or search..."
              value={searchQuery}
              hasKnowledgeResults={hasKnowledgeResults}
            />
            {/* Popular Sites below search bar - kept as requested */}
            <PopularSitesBelowSearch />
          </div>
        </div>

        {/* Knowledge Graph Visualization */}
        <div className="absolute inset-0">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onMove={(event, viewport) => onZoomChange(viewport.zoom)}
            fitView={false}
            attributionPosition="bottom-left"
            proOptions={{ hideAttribution: true }}
            className="space-graph"
          >
            <Background 
              color="rgba(100, 116, 139, 0.02)" 
              gap={80} 
              size={0.3}
              className="opacity-20"
            />
          </ReactFlow>
        </div>

        {/* Always show menu and filter */}
        <MenuWidget />
        <FilterWidget />

        {/* Widgets - Show by default */}
        <ClockWidget />
        <TrailyLogo />

        {/* Delete All Data Button */}
        <DeleteAllDataButton />

        {/* PNG Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-black/60 backdrop-blur-2xl rounded-2xl p-6 border border-white/20 max-w-md w-full mx-4">
              <h3 className="text-white/90 text-lg font-medium mb-4">Export as PNG</h3>
              <p className="text-white/70 text-sm mb-4">
                Please enter the main topic or theme for your knowledge graph:
              </p>
              <input
                type="text"
                value={exportMainNodeText}
                onChange={(e) => setExportMainNodeText(e.target.value)}
                placeholder="e.g., Machine Learning Research"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white/90 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 mb-4"
              />
              
              {/* Dynamic Suggestions */}
              <div className="mb-4">
                {allNodes.length > 0 && (
                  <>
                    <p className="text-white/60 text-xs mb-2">From your research:</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {/* Personalized suggestions from user's nodes */}
                      {allNodes
                        .filter(node => node.data.label && node.data.label.length > 3)
                        .slice(0, 6)
                        .map((node, index) => {
                          const title = node.data.label.length > 20 
                            ? node.data.label.substring(0, 20) + '...' 
                            : node.data.label;
                          return (
                            <button
                              key={`personal-${index}`}
                              onClick={() => setExportMainNodeText(node.data.label)}
                              className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-lg text-blue-200 text-xs transition-all hover:scale-105"
                              title={node.data.label}
                            >
                              {title}
                            </button>
                          );
                        })
                      }
                    </div>
                  </>
                )}
                
                {/* <p className="text-white/60 text-xs mb-2">💡 Popular topics:</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {[
                    'AI & Machine Learning', 'Web Development', 'Data Science', 'Software Engineering',
                    'Blockchain & Crypto', 'Cybersecurity', 'Cloud Computing', 'DevOps & Automation'
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setExportMainNodeText(suggestion)}
                      className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white/80 text-xs transition-all hover:scale-105"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div> */}
                
                {/* <p className="text-white/60 text-xs mb-2">🎯 Research formats:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Research Project', 'Learning Journey', 'Tech Stack Analysis', 'Market Research',
                    'Competitive Analysis', 'Literature Review', 'Study Notes'
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setExportMainNodeText(suggestion)}
                      className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 rounded-lg text-purple-200 text-xs transition-all hover:scale-105"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div> */}
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowExportModal(false);
                    setExportMainNodeText('');
                  }}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/30 rounded-xl text-white/80 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={exportAsPNG}
                  className="flex-1 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-xl text-white/90 transition-all"
                >
                  Export PNG
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Node Detail Panel */}
        {selectedNode && (
          <div className="fixed top-4 right-4 bg-black/40 backdrop-blur-2xl rounded-2xl p-6 border border-white/20 max-w-sm z-30 glass">
            <NodeDetailPanel 
              node={selectedNode} 
              onClose={closeNodeDetail}
            />
          </div>
        )}

        {/* Empty State */}
        {nodes.length === 0 && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            {/* <div className="text-center bg-black/40 backdrop-blur-2xl rounded-3xl p-8 border border-white/20 glass">
              <div className="mb-4 flex justify-center">
                <svg className="w-16 h-16 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white/80 mb-2">No Content Captured Yet</h3>
              <p className="text-white/50 mb-4 max-w-sm">
                Start browsing the web and Traily will automatically build your knowledge graph.
              </p>
              <button
                onClick={loadGraphData}
                className="bg-white/10 backdrop-blur-sm border border-white/30 text-white px-6 py-2 rounded-2xl font-medium hover:bg-white/20 transition-all"
              >
                Refresh
              </button>
            </div> */}
          </div>
        )}
      </div>
    </div>
  );
};

export default SidePanelApp;
