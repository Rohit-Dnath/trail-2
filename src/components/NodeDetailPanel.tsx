import React from 'react';

interface GraphNode {
  id: string;
  type: 'page' | 'concept' | 'author' | 'domain';
  data: {
    label: string;
    url?: string;
    summary?: string;
    timestamp?: number;
    importance: number;
    domain?: string;
    contentType?: string;
    connectedPages?: string[];
  };
  position: { x: number; y: number };
}

interface NodeDetailPanelProps {
  node: GraphNode;
  onClose: () => void;
}

const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({ node, onClose }) => {
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNodeTypeIcon = (type: string) => {
    switch (type) {
      case 'page':
        return '📄';
      case 'concept':
        return '💡';
      case 'author':
        return '👤';
      case 'domain':
        return '🌐';
      default:
        return '📄';
    }
  };

  const getNodeTypeColor = (type: string) => {
    switch (type) {
      case 'page':
        return 'bg-blue-100 text-blue-800';
      case 'concept':
        return 'bg-green-100 text-green-800';
      case 'author':
        return 'bg-yellow-100 text-yellow-800';
      case 'domain':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const openUrl = () => {
    if (node.data.url) {
      window.open(node.data.url, '_blank');
    }
  };

  return (
    <div className="node-detail bg-white border border-gray-200 rounded-lg shadow-lg max-w-sm">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-gray-200">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">{getNodeTypeIcon(node.type)}</span>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 leading-tight">
              {node.data.label}
            </h3>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${getNodeTypeColor(node.type)}`}>
              {node.type.charAt(0).toUpperCase() + node.type.slice(1)}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500 p-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Summary */}
        {node.data.summary && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Summary</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              {node.data.summary}
            </p>
          </div>
        )}

        {/* URL */}
        {node.data.url && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">URL</h4>
            <button
              onClick={openUrl}
              className="text-sm text-blue-600 hover:text-blue-800 underline break-all"
            >
              {node.data.url}
            </button>
          </div>
        )}

        {/* Domain */}
        {node.data.domain && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Domain</h4>
            <span className="text-sm text-gray-600">{node.data.domain}</span>
          </div>
        )}

        {/* Content Type */}
        {node.data.contentType && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Content Type</h4>
            <span className="text-sm text-gray-600 capitalize">{node.data.contentType}</span>
          </div>
        )}

        {/* Timestamp */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Added</h4>
          <span className="text-sm text-gray-600">{formatDate(node.data.timestamp)}</span>
        </div>

        {/* Importance Score */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Importance</h4>
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (node.data.importance / 10) * 100)}%` }}
              />
            </div>
            <span className="text-sm text-gray-600 min-w-0">
              {node.data.importance.toFixed(1)}/10
            </span>
          </div>
        </div>

        {/* Connected Pages */}
        {node.data.connectedPages && node.data.connectedPages.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Connected Pages ({node.data.connectedPages.length})
            </h4>
            <div className="max-h-24 overflow-y-auto">
              {node.data.connectedPages.slice(0, 5).map((pageId, index) => (
                <div key={index} className="text-xs text-gray-500 py-1">
                  {pageId}
                </div>
              ))}
              {node.data.connectedPages.length > 5 && (
                <div className="text-xs text-gray-400 py-1">
                  +{node.data.connectedPages.length - 5} more
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <div className="flex space-x-2">
          {node.data.url && (
            <button
              onClick={openUrl}
              className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 px-3 rounded hover:bg-blue-700 transition-colors"
            >
              Visit Page
            </button>
          )}
          <button
            onClick={() => {
              // TODO: Implement focus on node in graph
              console.log('Focus on node:', node.id);
            }}
            className="flex-1 bg-gray-200 text-gray-700 text-sm font-medium py-2 px-3 rounded hover:bg-gray-300 transition-colors"
          >
            Focus
          </button>
        </div>
      </div>
    </div>
  );
};

export default NodeDetailPanel;
