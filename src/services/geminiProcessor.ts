// Gemini API Service for processing content with Google's Gemini 2.5 Flash
import { ConfigManager } from '../config/configManager';

export interface GeminiAnalysis {
  concepts: string[];
  summary: string;
  contentType: string;
  author?: string;
  mainTopic: string;
  relatedTopics: string[];
  confidence: number;
}

export interface SearchResult {
  relevanceScore: number;
  matchedConcepts: string[];
  contentSnippet: string;
}

export class GeminiProcessor {
  private apiKey: string = '';
  private config = ConfigManager.getConfig();
  private rateLimitQueue: Array<() => Promise<any>> = [];
  private isProcessing = false;
  private lastApiCall = 0;

  constructor() {
    this.initializeApiKey();
  }

  private async initializeApiKey(): Promise<void> {
    try {
      this.apiKey = await ConfigManager.getGeminiApiKey();
      console.log('Gemini API key initialized');
    } catch (error) {
      console.error('Failed to initialize Gemini API key:', error);
    }
  }

  public async setApiKey(apiKey: string): Promise<void> {
    if (!ConfigManager.validateApiKey(apiKey)) {
      throw new Error('Invalid API key format');
    }
    
    this.apiKey = apiKey;
    await ConfigManager.setGeminiApiKey(apiKey);
    console.log('Gemini API key updated');
  }

  public async analyzeContent(content: string, url: string): Promise<GeminiAnalysis | null> {
    if (!this.apiKey) {
      console.warn('Gemini API key not configured');
      return null;
    }

    const prompt = `Analyze this web content and extract information in JSON format:

Content URL: ${url}
Content: ${content.substring(0, 4000)} ${content.length > 4000 ? '...[truncated]' : ''}

Please provide a JSON response with the following structure:
{
  "concepts": ["concept1", "concept2", ...] (max 10 key concepts/topics),
  "summary": "2-3 sentence summary",
  "contentType": "research|documentation|news|blog|article|tutorial",
  "author": "author name if mentioned, null otherwise",
  "mainTopic": "primary topic/theme",
  "relatedTopics": ["topic1", "topic2", ...] (max 5 related topics),
  "confidence": 0.8 (confidence score 0-1)
}

Focus on extracting meaningful concepts that could be useful for building knowledge connections.`;

    try {
      const response = await this.callGeminiAPI(prompt);
      return this.parseGeminiResponse(response);
    } catch (error) {
      console.error('Gemini analysis failed:', error);
      return null;
    }
  }

  public async findRelationships(newContent: string, existingConcepts: string[]): Promise<Array<{concept: string, similarity: number}>> {
    if (!this.apiKey || existingConcepts.length === 0) {
      return [];
    }

    const prompt = `Given this new content and existing concepts, identify relationships:

New Content: ${newContent.substring(0, 2000)}
Existing Concepts: ${existingConcepts.join(', ')}

Return a JSON array of relationships:
[
  {"concept": "existing_concept", "similarity": 0.8, "relationship": "strongly_related"},
  ...
]

Only include relationships with similarity > 0.3. Max 10 relationships.`;

    try {
      const response = await this.callGeminiAPI(prompt);
      return this.parseRelationshipsResponse(response);
    } catch (error) {
      console.error('Relationship analysis failed:', error);
      return [];
    }
  }

  public async semanticSearch(query: string): Promise<SearchResult[]> {
    if (!this.apiKey) {
      return [];
    }

    const prompt = `Analyze this search query and generate semantic variations:

Query: ${query}

Provide JSON response:
{
  "semanticVariations": ["variation1", "variation2", ...],
  "relatedConcepts": ["concept1", "concept2", ...],
  "searchIntent": "research|general|specific_topic|comparison",
  "keyTerms": ["term1", "term2", ...]
}`;

    try {
      const response = await this.callGeminiAPI(prompt);
      const analysis = this.parseSearchResponse(response);
      
      // This would be combined with actual content search in the calling function
      return [{
        relevanceScore: 1.0,
        matchedConcepts: analysis.relatedConcepts || [],
        contentSnippet: `Search analysis: ${analysis.searchIntent}`
      }];
    } catch (error) {
      console.error('Semantic search failed:', error);
      return [];
    }
  }

  private async callGeminiAPI(prompt: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.rateLimitQueue.push(async () => {
        try {
          // Ensure minimum interval between API calls
          const now = Date.now();
          const timeSinceLastCall = now - this.lastApiCall;
          if (timeSinceLastCall < this.config.rateLimitDelay) {
            await new Promise(resolve => setTimeout(resolve, this.config.rateLimitDelay - timeSinceLastCall));
          }

          const response = await fetch(`${this.config.apiEndpoint}?key=${this.apiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: prompt
                }]
              }],
              generationConfig: {
                temperature: 0.3,
                topK: 20,
                topP: 0.8,
                maxOutputTokens: 2048,
              }
            })
          });

          this.lastApiCall = Date.now();

          if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
          }

          const data = await response.json();
          
          if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
            resolve(data.candidates[0].content.parts[0].text);
          } else {
            throw new Error('Invalid response format from Gemini API');
          }
        } catch (error) {
          reject(error);
        }
      });

      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  private async processQueue(): Promise<void> {
    this.isProcessing = true;
    
    while (this.rateLimitQueue.length > 0) {
      const task = this.rateLimitQueue.shift();
      if (task) {
        try {
          await task();
        } catch (error) {
          console.error('Queue task failed:', error);
        }
      }
    }
    
    this.isProcessing = false;
  }

  private parseGeminiResponse(response: string): GeminiAnalysis | null {
    try {
      // Clean up response - remove markdown code blocks if present
      const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanResponse);
      
      return {
        concepts: Array.isArray(parsed.concepts) ? parsed.concepts.slice(0, 10) : [],
        summary: parsed.summary || '',
        contentType: parsed.contentType || 'article',
        author: parsed.author || undefined,
        mainTopic: parsed.mainTopic || '',
        relatedTopics: Array.isArray(parsed.relatedTopics) ? parsed.relatedTopics.slice(0, 5) : [],
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5
      };
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      return null;
    }
  }

  private parseRelationshipsResponse(response: string): Array<{concept: string, similarity: number}> {
    try {
      const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanResponse);
      
      if (Array.isArray(parsed)) {
        return parsed
          .filter(item => item.concept && typeof item.similarity === 'number')
          .slice(0, 10);
      }
      
      return [];
    } catch (error) {
      console.error('Failed to parse relationships response:', error);
      return [];
    }
  }

  private parseSearchResponse(response: string): any {
    try {
      const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanResponse);
    } catch (error) {
      console.error('Failed to parse search response:', error);
      return {
        semanticVariations: [],
        relatedConcepts: [],
        searchIntent: 'general',
        keyTerms: []
      };
    }
  }

  public async testConnection(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      const response = await this.callGeminiAPI('Test connection. Respond with: {"status": "connected"}');
      const parsed = JSON.parse(response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
      return parsed.status === 'connected';
    } catch (error) {
      console.error('Gemini connection test failed:', error);
      return false;
    }
  }
}
