import React from 'react';
import SearchInterface from './SearchInterface';

interface KnowledgeGraphSidebarProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: {
    nodeType: string;
    dateRange: string;
    domain: string;
  }) => void;
  filters: {
    nodeType: string;
    dateRange: string;
    domain: string;
  };
  nodeCount: number;
  edgeCount: number;
}

const KnowledgeGraphSidebar: React.FC<KnowledgeGraphSidebarProps> = ({
  onSearch,
  onFilterChange,
  filters,
  nodeCount,
  edgeCount
}) => {
  const handleFilterChange = (filterType: string, value: string) => {
    onFilterChange({
      ...filters,
      [filterType]: value
    });
  };

  return (
    <div className="sidebar bg-white border-r border-gray-200 overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="sidebar-section">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Knowledge Graph</h2>
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-lg font-bold text-blue-600">{nodeCount}</div>
            <div className="text-xs text-blue-600">Nodes</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-lg font-bold text-green-600">{edgeCount}</div>
            <div className="text-xs text-green-600">Connections</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="sidebar-section">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Search</h3>
        <SearchInterface 
          onSearch={onSearch}
          placeholder="Search nodes..."
        />
      </div>

      {/* Filters */}
      <div className="sidebar-section">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Filters</h3>
        
        {/* Node Type Filter */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Node Type
          </label>
          <select
            value={filters.nodeType}
            onChange={(e) => handleFilterChange('nodeType', e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="page">📄 Pages</option>
            <option value="concept">💡 Concepts</option>
            <option value="author">👤 Authors</option>
            <option value="domain">🌐 Domains</option>
          </select>
        </div>

        {/* Date Range Filter */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Date Range
          </label>
          <select
            value={filters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>

        {/* Domain Filter */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Domain
          </label>
          <select
            value={filters.domain}
            onChange={(e) => handleFilterChange('domain', e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Domains</option>
            {/* Dynamic domain options would be populated here */}
          </select>
        </div>

        {/* Clear Filters */}
        <button
          onClick={() => onFilterChange({
            nodeType: 'all',
            dateRange: 'all',
            domain: 'all'
          })}
          className="w-full text-sm text-gray-600 hover:text-gray-800 py-2 px-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Clear Filters
        </button>
      </div>

      {/* Legend */}
      <div className="sidebar-section">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Legend</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-blue-200 border-2 border-blue-400"></div>
            <span className="text-xs text-gray-600">Pages</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-green-200 border-2 border-green-400"></div>
            <span className="text-xs text-gray-600">Concepts</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-yellow-200 border-2 border-yellow-400"></div>
            <span className="text-xs text-gray-600">Authors</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-purple-200 border-2 border-purple-400"></div>
            <span className="text-xs text-gray-600">Domains</span>
          </div>
        </div>
      </div>

      {/* Graph Controls */}
      <div className="sidebar-section">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Graph Controls</h3>
        <div className="space-y-2">
          <button
            onClick={() => {
              // TODO: Implement layout algorithm
              console.log('Reorganize layout');
            }}
            className="w-full text-sm bg-gray-100 text-gray-700 py-2 px-3 rounded-md hover:bg-gray-200 transition-colors"
          >
            Reorganize Layout
          </button>
          <button
            onClick={() => {
              // TODO: Implement export functionality
              console.log('Export graph');
            }}
            className="w-full text-sm bg-gray-100 text-gray-700 py-2 px-3 rounded-md hover:bg-gray-200 transition-colors"
          >
            Export Graph
          </button>
          <button
            onClick={() => {
              // TODO: Implement settings
              console.log('Open settings');
            }}
            className="w-full text-sm bg-gray-100 text-gray-700 py-2 px-3 rounded-md hover:bg-gray-200 transition-colors"
          >
            Settings
          </button>
        </div>
      </div>

      {/* Help */}
      <div className="sidebar-section border-b-0">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Help</h3>
        <div className="text-xs text-gray-600 space-y-2">
          <p>• Click nodes to see details</p>
          <p>• Drag to move nodes around</p>
          <p>• Use scroll wheel to zoom</p>
          <p>• Search to find specific content</p>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeGraphSidebar;
