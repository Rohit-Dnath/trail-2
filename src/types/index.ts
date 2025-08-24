// Type definitions for the Chrome Extension
/// <reference types="chrome" />

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

export interface GeminiAnalysis {
  concepts: string[];
  summary: string;
  contentType: string;
  author?: string;
  mainTopic: string;
  relatedTopics: string[];
  confidence: number;
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
  analysis: GeminiAnalysis;
}

export interface ExtensionSettings {
  geminiApiKey: string;
  autoCapture: boolean;
  minContentLength: number;
  skipDomains: string[];
  captureFrequency: number;
  maxStorageSize: number;
}

export interface CapturedContent {
  url: string;
  title: string;
  content: string;
  timestamp: number;
  metadata: {
    domain: string;
    contentType: string;
    wordCount: number;
  };
}

// Message types for communication between components
export interface MessageRequest {
  type: 'GET_GRAPH_DATA' | 'SEARCH_CONTENT' | 'UPDATE_SETTINGS' | 'PROCESS_CONTENT';
  data?: any;
  query?: string;
  settings?: Partial<ExtensionSettings>;
}

export interface MessageResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// React Flow types
export interface ReactFlowNode extends GraphNode {
  dragging?: boolean;
  selected?: boolean;
}

export interface ReactFlowEdge extends GraphEdge {
  selected?: boolean;
  animated?: boolean;
}
