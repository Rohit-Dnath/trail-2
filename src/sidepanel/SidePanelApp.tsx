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
  const [filters, setFilters] = useState({
    nodeType: 'all',
    dateRange: 'all',
    domain: 'all'
  });
  const [isLoading, setIsLoading] = useState(true);

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
      style: getNodeStyle(node.type),
      data: {
        ...node.data,
        label: truncateLabel(node.data.label, 30)
      }
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
          
          // Transform nodes for ReactFlow
          const flowNodes = graphNodes.map((node: any) => ({
            ...node,
            type: 'default',
            style: getNodeStyle(node.type),
            data: {
              ...node.data,
              label: truncateLabel(node.data.label, 30)
            }
          }));

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

  const getNodeStyle = (nodeType: string) => {
    const baseStyle = {
      padding: '10px',
      borderRadius: '8px',
      fontSize: '12px',
      fontWeight: '500',
      border: '2px solid',
      minWidth: '120px',
      textAlign: 'center' as const
    };

    switch (nodeType) {
      case 'page':
        return { ...baseStyle, backgroundColor: '#dbeafe', borderColor: '#60a5fa', color: '#1e40af' };
      case 'concept':
        return { ...baseStyle, backgroundColor: '#d1fae5', borderColor: '#34d399', color: '#065f46' };
      case 'author':
        return { ...baseStyle, backgroundColor: '#fef3c7', borderColor: '#fbbf24', color: '#92400e' };
      case 'domain':
        return { ...baseStyle, backgroundColor: '#e0e7ff', borderColor: '#a78bfa', color: '#5b21b6' };
      default:
        return { ...baseStyle, backgroundColor: '#f3f4f6', borderColor: '#9ca3af', color: '#374151' };
    }
  };

  const getEdgeStyle = (strength: number) => {
    return {
      strokeWidth: Math.max(1, strength * 3),
      stroke: `rgba(59, 130, 246, ${Math.max(0.3, strength)})`,
    };
  };

  const truncateLabel = (label: string, maxLength: number) => {
    return label.length > maxLength ? `${label.substring(0, maxLength)}...` : label;
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      // Reset to show all nodes
      loadGraphData();
      return;
    }

    // Filter nodes based on search query
    const filteredNodes = nodes.filter(node => 
      node.data.label.toLowerCase().includes(query.toLowerCase()) ||
      (node.data.summary && node.data.summary.toLowerCase().includes(query.toLowerCase())) ||
      (node.data.domain && node.data.domain.toLowerCase().includes(query.toLowerCase()))
    );

    // Filter edges to only show those connecting filtered nodes
    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = edges.filter(edge => 
      filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target)
    );

    setNodes(filteredNodes);
    setEdges(filteredEdges);
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
          style: getNodeStyle(node.type),
          data: {
            ...node.data,
            label: truncateLabel(node.data.label, 30)
          }
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
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-gray-600">Loading knowledge graph...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-50">
      {/* Sidebar */}
      <KnowledgeGraphSidebar
        onSearch={handleSearch}
        onFilterChange={applyFilters}
        filters={filters}
        nodeCount={nodes.length}
        edgeCount={edges.length}
      />

      {/* Main Graph Area */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          fitView
          attributionPosition="bottom-left"
        >
          <Controls />
          <Background color="#f1f5f9" gap={20} />
          <MiniMap
            nodeStrokeColor={(n) => {
              if (n.type === 'page') return '#60a5fa';
              if (n.type === 'concept') return '#34d399';
              if (n.type === 'author') return '#fbbf24';
              if (n.type === 'domain') return '#a78bfa';
              return '#9ca3af';
            }}
            nodeColor={(n) => {
              if (n.type === 'page') return '#dbeafe';
              if (n.type === 'concept') return '#d1fae5';
              if (n.type === 'author') return '#fef3c7';
              if (n.type === 'domain') return '#e0e7ff';
              return '#f3f4f6';
            }}
            nodeBorderRadius={8}
            position="bottom-right"
          />
        </ReactFlow>

        {/* Node Detail Panel */}
        {selectedNode && (
          <NodeDetailPanel
            node={selectedNode}
            onClose={closeNodeDetail}
          />
        )}

        {/* Search Interface Overlay */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
          <SearchInterface
            onSearch={handleSearch}
            placeholder="Search pages, concepts, or content..."
            value={searchQuery}
          />
        </div>

        {/* Empty State */}
        {nodes.length === 0 && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl text-gray-300 mb-4">🕸️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Content Captured Yet</h3>
              <p className="text-gray-600 mb-4">
                Start browsing the web and Traily will automatically build your knowledge graph.
              </p>
              <button
                onClick={loadGraphData}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700"
              >
                Refresh
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SidePanelApp;
