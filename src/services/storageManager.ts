// Storage Manager for Chrome Extension Local Storage
export interface GraphNode {
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

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'relates_to' | 'authored_by' | 'part_of' | 'similar_to';
  data: {
    strength: number;
    relationship: string;
  };
}

export interface ProcessedContent {
  nodeId: string;
  url: string;
  title: string;
  content: string;
  timestamp: number;
  metadata: {
    domain: string;
    contentType: string;
    wordCount: number;
  };
  analysis: any;
}

export interface ExtensionSettings {
  geminiApiKey: string;
  autoCapture: boolean;
  minContentLength: number;
  skipDomains: string[];
  captureFrequency: number;
  maxStorageSize: number;
}

export class StorageManager {
  private readonly STORAGE_KEYS = {
    NODES: 'traily_graph_nodes',
    EDGES: 'traily_graph_edges',
    CONTENT: 'traily_content',
    SETTINGS: 'traily_settings',
    LAST_CLEANUP: 'traily_last_cleanup'
  };

  private readonly DEFAULT_SETTINGS: ExtensionSettings = {
    geminiApiKey: '',
    autoCapture: true,
    minContentLength: 500,
    skipDomains: ['facebook.com', 'twitter.com', 'instagram.com', 'youtube.com'],
    captureFrequency: 2000, // milliseconds
    maxStorageSize: 100 * 1024 * 1024 // 100MB
  };

  constructor() {
    this.scheduleCleanup();
  }

  // Settings Management
  async initializeSettings(): Promise<void> {
    try {
      const result = await chrome.storage.sync.get(this.STORAGE_KEYS.SETTINGS);
      if (!result[this.STORAGE_KEYS.SETTINGS]) {
        await chrome.storage.sync.set({
          [this.STORAGE_KEYS.SETTINGS]: this.DEFAULT_SETTINGS
        });
      }
    } catch (error) {
      console.error('Failed to initialize settings:', error);
    }
  }

  async getSettings(): Promise<ExtensionSettings> {
    try {
      const result = await chrome.storage.sync.get(this.STORAGE_KEYS.SETTINGS);
      return { ...this.DEFAULT_SETTINGS, ...result[this.STORAGE_KEYS.SETTINGS] };
    } catch (error) {
      console.error('Failed to get settings:', error);
      return this.DEFAULT_SETTINGS;
    }
  }

  async updateSettings(settings: Partial<ExtensionSettings>): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      const updatedSettings = { ...currentSettings, ...settings };
      await chrome.storage.sync.set({
        [this.STORAGE_KEYS.SETTINGS]: updatedSettings
      });
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  }

  // Content Storage
  async storeProcessedContent(content: ProcessedContent): Promise<void> {
    try {
      const result = await chrome.storage.local.get(this.STORAGE_KEYS.CONTENT);
      const existingContent: ProcessedContent[] = result[this.STORAGE_KEYS.CONTENT] || [];
      
      // Remove any existing content with the same URL
      const filteredContent = existingContent.filter(item => item.url !== content.url);
      
      // Add new content
      filteredContent.push(content);
      
      // Keep only the most recent 1000 items to manage storage
      const sortedContent = filteredContent
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 1000);

      await chrome.storage.local.set({
        [this.STORAGE_KEYS.CONTENT]: sortedContent
      });
    } catch (error) {
      console.error('Failed to store content:', error);
    }
  }

  async findSimilarContent(url: string): Promise<ProcessedContent | null> {
    try {
      const result = await chrome.storage.local.get(this.STORAGE_KEYS.CONTENT);
      const content: ProcessedContent[] = result[this.STORAGE_KEYS.CONTENT] || [];
      
      return content.find(item => item.url === url) || null;
    } catch (error) {
      console.error('Failed to find similar content:', error);
      return null;
    }
  }

  async searchContent(query: string): Promise<ProcessedContent[]> {
    try {
      const result = await chrome.storage.local.get(this.STORAGE_KEYS.CONTENT);
      const content: ProcessedContent[] = result[this.STORAGE_KEYS.CONTENT] || [];
      
      const queryLower = query.toLowerCase();
      
      return content.filter(item => 
        item.title.toLowerCase().includes(queryLower) ||
        item.content.toLowerCase().includes(queryLower) ||
        (item.analysis?.concepts && item.analysis.concepts.some((concept: string) => 
          concept.toLowerCase().includes(queryLower)
        ))
      ).slice(0, 50); // Limit results
    } catch (error) {
      console.error('Failed to search content:', error);
      return [];
    }
  }

  // Graph Node Management
  async addGraphNode(node: GraphNode): Promise<void> {
    try {
      const result = await chrome.storage.local.get(this.STORAGE_KEYS.NODES);
      const nodes: GraphNode[] = result[this.STORAGE_KEYS.NODES] || [];
      
      // Remove existing node with same ID
      const filteredNodes = nodes.filter(n => n.id !== node.id);
      filteredNodes.push(node);
      
      await chrome.storage.local.set({
        [this.STORAGE_KEYS.NODES]: filteredNodes
      });
    } catch (error) {
      console.error('Failed to add graph node:', error);
    }
  }

  async getGraphNode(nodeId: string): Promise<GraphNode | null> {
    try {
      const result = await chrome.storage.local.get(this.STORAGE_KEYS.NODES);
      const nodes: GraphNode[] = result[this.STORAGE_KEYS.NODES] || [];
      
      return nodes.find(node => node.id === nodeId) || null;
    } catch (error) {
      console.error('Failed to get graph node:', error);
      return null;
    }
  }

  async updateGraphNode(node: GraphNode): Promise<void> {
    try {
      const result = await chrome.storage.local.get(this.STORAGE_KEYS.NODES);
      const nodes: GraphNode[] = result[this.STORAGE_KEYS.NODES] || [];
      
      const nodeIndex = nodes.findIndex(n => n.id === node.id);
      if (nodeIndex !== -1) {
        nodes[nodeIndex] = node;
        await chrome.storage.local.set({
          [this.STORAGE_KEYS.NODES]: nodes
        });
      }
    } catch (error) {
      console.error('Failed to update graph node:', error);
    }
  }

  // Graph Edge Management
  async addGraphEdge(edge: GraphEdge): Promise<void> {
    try {
      const result = await chrome.storage.local.get(this.STORAGE_KEYS.EDGES);
      const edges: GraphEdge[] = result[this.STORAGE_KEYS.EDGES] || [];
      
      // Check if edge already exists
      const existingEdge = edges.find(e => e.id === edge.id);
      if (!existingEdge) {
        edges.push(edge);
        await chrome.storage.local.set({
          [this.STORAGE_KEYS.EDGES]: edges
        });
      }
    } catch (error) {
      console.error('Failed to add graph edge:', error);
    }
  }

  // Complete Graph Data
  async getGraphData(): Promise<{ nodes: GraphNode[], edges: GraphEdge[] }> {
    try {
      const [nodesResult, edgesResult] = await Promise.all([
        chrome.storage.local.get(this.STORAGE_KEYS.NODES),
        chrome.storage.local.get(this.STORAGE_KEYS.EDGES)
      ]);

      return {
        nodes: nodesResult[this.STORAGE_KEYS.NODES] || [],
        edges: edgesResult[this.STORAGE_KEYS.EDGES] || []
      };
    } catch (error) {
      console.error('Failed to get graph data:', error);
      return { nodes: [], edges: [] };
    }
  }

  // Storage Management
  async getStorageUsage(): Promise<{ bytesInUse: number, maxBytes: number }> {
    try {
      const bytesInUse = await chrome.storage.local.getBytesInUse();
      const maxBytes = chrome.storage.local.QUOTA_BYTES || 10485760; // 10MB default
      
      return { bytesInUse, maxBytes };
    } catch (error) {
      console.error('Failed to get storage usage:', error);
      return { bytesInUse: 0, maxBytes: 10485760 };
    }
  }

  async clearOldData(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const cutoffTime = Date.now() - maxAge;
      
      // Clean old content
      const contentResult = await chrome.storage.local.get(this.STORAGE_KEYS.CONTENT);
      const content: ProcessedContent[] = contentResult[this.STORAGE_KEYS.CONTENT] || [];
      const recentContent = content.filter(item => item.timestamp > cutoffTime);
      
      // Clean old nodes
      const nodesResult = await chrome.storage.local.get(this.STORAGE_KEYS.NODES);
      const nodes: GraphNode[] = nodesResult[this.STORAGE_KEYS.NODES] || [];
      const recentNodes = nodes.filter(node => 
        !node.data.timestamp || node.data.timestamp > cutoffTime
      );
      
      // Update storage
      await chrome.storage.local.set({
        [this.STORAGE_KEYS.CONTENT]: recentContent,
        [this.STORAGE_KEYS.NODES]: recentNodes,
        [this.STORAGE_KEYS.LAST_CLEANUP]: Date.now()
      });
      
      console.log(`Cleaned up old data. Kept ${recentContent.length} content items and ${recentNodes.length} nodes.`);
    } catch (error) {
      console.error('Failed to clean old data:', error);
    }
  }

  private async scheduleCleanup(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(this.STORAGE_KEYS.LAST_CLEANUP);
      const lastCleanup = result[this.STORAGE_KEYS.LAST_CLEANUP] || 0;
      const daysSinceCleanup = (Date.now() - lastCleanup) / (24 * 60 * 60 * 1000);
      
      if (daysSinceCleanup > 1) {
        await this.clearOldData();
      }
    } catch (error) {
      console.error('Failed to schedule cleanup:', error);
    }
  }

  async exportData(): Promise<{ content: ProcessedContent[], graphData: { nodes: GraphNode[], edges: GraphEdge[] } }> {
    try {
      const [contentResult, graphData] = await Promise.all([
        chrome.storage.local.get(this.STORAGE_KEYS.CONTENT),
        this.getGraphData()
      ]);

      return {
        content: contentResult[this.STORAGE_KEYS.CONTENT] || [],
        graphData
      };
    } catch (error) {
      console.error('Failed to export data:', error);
      return { content: [], graphData: { nodes: [], edges: [] } };
    }
  }

  async clearAllData(): Promise<void> {
    try {
      await chrome.storage.local.clear();
      await this.initializeSettings();
      console.log('All data cleared successfully');
    } catch (error) {
      console.error('Failed to clear all data:', error);
    }
  }
}
