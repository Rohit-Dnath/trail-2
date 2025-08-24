// Background Service Worker for Traily Chrome Extension
import { GeminiProcessor } from '../services/geminiProcessor';
import { StorageManager } from '../services/storageManager';
import { ContentProcessor } from '../services/contentProcessor';
import { ConfigManager } from '../config/configManager';

interface CapturedContent {
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

class BackgroundService {
  private geminiProcessor: GeminiProcessor;
  private storageManager: StorageManager;
  private contentProcessor: ContentProcessor;
  private isProcessing = new Set<string>();

  constructor() {
    this.geminiProcessor = new GeminiProcessor();
    this.storageManager = new StorageManager();
    this.contentProcessor = new ContentProcessor();
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Listen for tab updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url && this.shouldProcessUrl(tab.url)) {
        this.processTab(tab);
      }
    });

    // Listen for messages from content scripts
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async response
    });

    // Handle extension installation
    chrome.runtime.onInstalled.addListener(() => {
      this.initializeExtension();
    });
  }

  private shouldProcessUrl(url: string): boolean {
    const skipDomains = ['facebook.com', 'twitter.com', 'instagram.com', 'youtube.com'];
    const skipProtocols = ['chrome:', 'chrome-extension:', 'moz-extension:'];
    
    try {
      const urlObj = new URL(url);
      
      // Skip chrome internal pages and extensions
      if (skipProtocols.some(protocol => url.startsWith(protocol))) {
        return false;
      }
      
      // Skip social media and other irrelevant domains
      if (skipDomains.some(domain => urlObj.hostname.includes(domain))) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }

  private async processTab(tab: chrome.tabs.Tab) {
    if (!tab.id || !tab.url || this.isProcessing.has(tab.url)) {
      return;
    }

    this.isProcessing.add(tab.url);

    try {
      // Inject content script to extract page content
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: this.extractPageContent
      });

      if (results && results[0]?.result) {
        const content: CapturedContent = results[0].result;
        await this.processContent(content);
      }
    } catch (error) {
      console.error('Error processing tab:', error);
    } finally {
      this.isProcessing.delete(tab.url);
    }
  }

  private extractPageContent(): CapturedContent | null {
    try {
      // Extract main content, avoiding navigation, ads, etc.
      const title = document.title;
      const url = window.location.href;
      
      // Try to find main content area
      const contentSelectors = [
        'article',
        '[role="main"]',
        'main',
        '.content',
        '.post-content',
        '.entry-content',
        '.article-body'
      ];
      
      let contentElement: Element | null = null;
      for (const selector of contentSelectors) {
        contentElement = document.querySelector(selector);
        if (contentElement) break;
      }
      
      // Fallback to body if no main content found
      if (!contentElement) {
        contentElement = document.body;
      }
      
      // Clean up content
      const clonedElement = contentElement.cloneNode(true) as Element;
      
      // Remove unwanted elements
      const unwantedSelectors = [
        'script', 'style', 'nav', 'header', 'footer',
        '.ads', '.advertisement', '.social-share',
        '.comments', '.sidebar', '.menu'
      ];
      
      unwantedSelectors.forEach(selector => {
        clonedElement.querySelectorAll(selector).forEach(el => el.remove());
      });
      
      const content = clonedElement.textContent || '';
      const wordCount = content.trim().split(/\s+/).length;
      
      // Skip if content is too short
      if (wordCount < 100) {
        return null;
      }
      
      const domain = new URL(url).hostname;
      
      return {
        url,
        title,
        content: content.trim(),
        timestamp: Date.now(),
        metadata: {
          domain,
          contentType: this.detectContentType(title, content),
          wordCount
        }
      };
    } catch (error) {
      console.error('Content extraction error:', error);
      return null;
    }
  }

  private detectContentType(title: string, content: string): string {
    const titleLower = title.toLowerCase();
    const contentLower = content.toLowerCase();
    
    if (titleLower.includes('research') || titleLower.includes('paper') || 
        contentLower.includes('abstract') || contentLower.includes('methodology')) {
      return 'research';
    }
    
    if (titleLower.includes('documentation') || titleLower.includes('docs') ||
        contentLower.includes('api') || contentLower.includes('tutorial')) {
      return 'documentation';
    }
    
    if (titleLower.includes('news') || contentLower.includes('breaking') ||
        contentLower.includes('reported')) {
      return 'news';
    }
    
    if (titleLower.includes('blog') || contentLower.includes('published by') ||
        contentLower.includes('opinion')) {
      return 'blog';
    }
    
    return 'article';
  }

  private async processContent(content: CapturedContent) {
    try {
      // Check if similar content already exists
      const existingContent = await this.storageManager.findSimilarContent(content.url);
      if (existingContent) {
        console.log('Similar content already exists, skipping');
        return;
      }

      // Process with Gemini API
      const analysis = await this.geminiProcessor.analyzeContent(content.content, content.url);
      
      if (analysis) {
        // Store processed content and analysis
        await this.storageManager.storeProcessedContent({
          ...content,
          analysis,
          nodeId: this.generateNodeId(content.url)
        });

        // Update knowledge graph
        await this.updateKnowledgeGraph(content, analysis);
        
        console.log('Content processed and stored:', content.title);
      }
    } catch (error) {
      console.error('Error processing content:', error);
    }
  }

  private generateNodeId(url: string): string {
    return btoa(url).replace(/[+/=]/g, '').substring(0, 16);
  }

  private async updateKnowledgeGraph(content: CapturedContent, analysis: any) {
    // Create nodes and edges for the knowledge graph
    const pageNode = {
      id: this.generateNodeId(content.url),
      type: 'page' as const,
      data: {
        label: content.title,
        url: content.url,
        summary: analysis.summary,
        timestamp: content.timestamp,
        importance: this.calculateImportance(content, analysis),
        domain: content.metadata.domain,
        contentType: content.metadata.contentType
      },
      position: { x: Math.random() * 400, y: Math.random() * 400 }
    };

    await this.storageManager.addGraphNode(pageNode);

    // Create concept nodes and relationships
    if (analysis.concepts && Array.isArray(analysis.concepts)) {
      for (const concept of analysis.concepts) {
        await this.processConceptNode(concept, pageNode.id);
      }
    }
  }

  private calculateImportance(content: CapturedContent, analysis: any): number {
    let score = 0;
    
    // Base score from content length
    score += Math.min(content.metadata.wordCount / 1000, 5);
    
    // Boost for certain content types
    if (content.metadata.contentType === 'research') score += 3;
    if (content.metadata.contentType === 'documentation') score += 2;
    
    // Boost for concept richness
    if (analysis.concepts) {
      score += Math.min(analysis.concepts.length * 0.5, 3);
    }
    
    return Math.min(score, 10);
  }

  private async processConceptNode(concept: string, pageNodeId: string) {
    const conceptId = this.generateNodeId(`concept:${concept}`);
    
    // Check if concept node already exists
    const existingNode = await this.storageManager.getGraphNode(conceptId);
    
    if (!existingNode) {
      // Create new concept node
      const conceptNode = {
        id: conceptId,
        type: 'concept' as const,
        data: {
          label: concept,
          importance: 1,
          connectedPages: [pageNodeId]
        },
        position: { x: Math.random() * 400, y: Math.random() * 400 }
      };
      
      await this.storageManager.addGraphNode(conceptNode);
    } else {
      // Update existing concept node
      const updatedNode = {
        ...existingNode,
        data: {
          ...existingNode.data,
          importance: existingNode.data.importance + 0.5,
          connectedPages: [...(existingNode.data.connectedPages || []), pageNodeId]
        }
      };
      
      await this.storageManager.updateGraphNode(updatedNode);
    }

    // Create edge between page and concept
    const edge = {
      id: `${pageNodeId}-${conceptId}`,
      source: pageNodeId,
      target: conceptId,
      type: 'relates_to' as const,
      data: {
        strength: 1,
        relationship: 'contains_concept'
      }
    };

    await this.storageManager.addGraphEdge(edge);
  }

  private async handleMessage(message: any, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) {
    try {
      switch (message.type) {
        case 'PROCESS_CONTENT':
          console.log('Processing content from content script:', message.data);
          await this.processContent(message.data);
          sendResponse({ success: true });
          break;
          
        case 'GET_GRAPH_DATA':
          const graphData = await this.storageManager.getGraphData();
          sendResponse({ success: true, data: graphData });
          break;
          
        case 'SEARCH_CONTENT':
          const searchResults = await this.performSearch(message.query);
          sendResponse({ success: true, data: searchResults });
          break;
          
        case 'UPDATE_SETTINGS':
          await this.storageManager.updateSettings(message.settings);
          sendResponse({ success: true });
          break;
          
        case 'CLEAR_ALL_DATA':
          await this.storageManager.clearAllData();
          sendResponse({ success: true });
          break;
          
        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Message handling error:', error);
      sendResponse({ success: false, error: (error as Error).message });
    }
  }

  private async performSearch(query: string) {
    // Use Gemini for semantic search
    const semanticResults = await this.geminiProcessor.semanticSearch(query);
    const storedContent = await this.storageManager.searchContent(query);
    
    // Combine and rank results
    return this.contentProcessor.combineSearchResults(semanticResults, storedContent);
  }

  private async initializeExtension() {
    console.log('Traily extension initialized');
    
    // Initialize configuration with API key
    await ConfigManager.initialize();
    
    // Set default settings
    await this.storageManager.initializeSettings();
    
    // Set up side panel
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }
}

// Initialize the background service
new BackgroundService();
