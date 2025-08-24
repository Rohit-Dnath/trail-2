// Content Processing utilities
import { ProcessedContent } from './storageManager';

export interface SearchResult {
  content: ProcessedContent;
  relevanceScore: number;
  matchType: 'title' | 'content' | 'concept' | 'semantic';
  snippet: string;
}

export class ContentProcessor {
  
  /**
   * Combines semantic search results from Gemini with stored content search results
   */
  combineSearchResults(
    semanticResults: Array<{ relevanceScore: number; matchedConcepts: string[]; contentSnippet: string }>,
    storedContent: ProcessedContent[]
  ): SearchResult[] {
    const results: SearchResult[] = [];
    
    // Convert stored content to search results
    storedContent.forEach(content => {
      const result: SearchResult = {
        content,
        relevanceScore: this.calculateRelevanceScore(content),
        matchType: 'content',
        snippet: this.generateSnippet(content.content)
      };
      results.push(result);
    });
    
    // Boost scores based on semantic matches
    semanticResults.forEach(semantic => {
      results.forEach(result => {
        if (this.hasSemanticMatch(result.content, semantic.matchedConcepts)) {
          result.relevanceScore += semantic.relevanceScore * 0.5;
          result.matchType = 'semantic';
        }
      });
    });
    
    // Sort by relevance and return top results
    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 20);
  }
  
  /**
   * Calculate relevance score for content
   */
  private calculateRelevanceScore(content: ProcessedContent): number {
    let score = 0;
    
    // Base score from content type
    switch (content.metadata.contentType) {
      case 'research':
        score += 3;
        break;
      case 'documentation':
        score += 2.5;
        break;
      case 'article':
        score += 2;
        break;
      case 'blog':
        score += 1.5;
        break;
      default:
        score += 1;
    }
    
    // Boost recent content
    const ageInDays = (Date.now() - content.timestamp) / (1000 * 60 * 60 * 24);
    if (ageInDays < 7) score += 1;
    else if (ageInDays < 30) score += 0.5;
    
    // Boost based on content length (longer content might be more comprehensive)
    if (content.metadata.wordCount > 2000) score += 1;
    else if (content.metadata.wordCount > 1000) score += 0.5;
    
    // Boost based on analysis confidence
    if (content.analysis?.confidence) {
      score += content.analysis.confidence;
    }
    
    return score;
  }
  
  /**
   * Check if content has semantic matches with concepts
   */
  private hasSemanticMatch(content: ProcessedContent, concepts: string[]): boolean {
    if (!content.analysis?.concepts) return false;
    
    const contentConcepts = content.analysis.concepts.map((c: string) => c.toLowerCase());
    return concepts.some(concept => 
      contentConcepts.some((cc: string) => 
        cc.includes(concept.toLowerCase()) || concept.toLowerCase().includes(cc)
      )
    );
  }
  
  /**
   * Generate content snippet for search results
   */
  private generateSnippet(content: string, maxLength: number = 200): string {
    if (content.length <= maxLength) return content;
    
    // Try to find a good sentence boundary
    const truncated = content.substring(0, maxLength);
    const lastSentence = truncated.lastIndexOf('. ');
    
    if (lastSentence > maxLength * 0.7) {
      return truncated.substring(0, lastSentence + 1);
    }
    
    const lastSpace = truncated.lastIndexOf(' ');
    return truncated.substring(0, lastSpace) + '...';
  }
  
  /**
   * Extract keywords from content for search optimization
   */
  extractKeywords(content: string): string[] {
    // Simple keyword extraction - could be enhanced with NLP
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);
      
    // Count word frequency
    const wordCount: { [key: string]: number } = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    // Return top keywords
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }
  
  /**
   * Categorize content based on patterns
   */
  categorizeContent(title: string, content: string, url: string): {
    category: string;
    confidence: number;
    indicators: string[];
  } {
    const indicators: string[] = [];
    let category = 'general';
    let confidence = 0.5;
    
    const titleLower = title.toLowerCase();
    const contentLower = content.toLowerCase();
    const domain = new URL(url).hostname;
    
    // Research indicators
    const researchIndicators = [
      'abstract', 'methodology', 'results', 'conclusion',
      'literature review', 'hypothesis', 'experiment'
    ];
    
    if (researchIndicators.some(indicator => 
      titleLower.includes(indicator) || contentLower.includes(indicator)
    )) {
      category = 'research';
      confidence += 0.3;
      indicators.push('research patterns detected');
    }
    
    // Documentation indicators
    const docIndicators = [
      'documentation', 'api', 'tutorial', 'guide',
      'installation', 'configuration', 'usage'
    ];
    
    if (docIndicators.some(indicator => 
      titleLower.includes(indicator) || contentLower.includes(indicator)
    )) {
      category = 'documentation';
      confidence += 0.25;
      indicators.push('documentation patterns detected');
    }
    
    // News indicators
    if (domain.includes('news') || 
        contentLower.includes('breaking') ||
        contentLower.includes('reported') ||
        /\b(today|yesterday|this morning)\b/.test(contentLower)) {
      category = 'news';
      confidence += 0.2;
      indicators.push('news patterns detected');
    }
    
    // Technical content
    const techIndicators = [
      'function', 'class', 'method', 'algorithm',
      'implementation', 'code', 'programming'
    ];
    
    if (techIndicators.some(indicator => contentLower.includes(indicator))) {
      if (category === 'general') category = 'technical';
      confidence += 0.15;
      indicators.push('technical content detected');
    }
    
    return {
      category,
      confidence: Math.min(confidence, 1.0),
      indicators
    };
  }
  
  /**
   * Filter content based on quality metrics
   */
  filterContentByQuality(content: string, minQualityScore: number = 0.5): boolean {
    const qualityMetrics = this.calculateQualityScore(content);
    return qualityMetrics.overall >= minQualityScore;
  }
  
  /**
   * Calculate content quality score
   */
  private calculateQualityScore(content: string): {
    overall: number;
    length: number;
    structure: number;
    readability: number;
  } {
    // Length score (optimal range: 500-5000 words)
    const wordCount = content.split(/\s+/).length;
    let lengthScore = 0;
    if (wordCount >= 500 && wordCount <= 5000) {
      lengthScore = 1;
    } else if (wordCount >= 200 && wordCount < 500) {
      lengthScore = 0.7;
    } else if (wordCount > 5000 && wordCount <= 10000) {
      lengthScore = 0.8;
    } else if (wordCount >= 100) {
      lengthScore = 0.4;
    }
    
    // Structure score (paragraphs, sentences)
    const paragraphs = content.split(/\n\s*\n/).length;
    const sentences = content.split(/[.!?]+/).length;
    const avgSentenceLength = wordCount / sentences;
    
    let structureScore = 0;
    if (paragraphs > 1) structureScore += 0.3;
    if (sentences > 5) structureScore += 0.3;
    if (avgSentenceLength >= 10 && avgSentenceLength <= 25) structureScore += 0.4;
    
    // Readability score (simple metrics)
    const avgWordLength = content.replace(/\s+/g, '').length / wordCount;
    let readabilityScore = 0;
    if (avgWordLength >= 4 && avgWordLength <= 6) readabilityScore += 0.5;
    if (content.includes(',') || content.includes(';')) readabilityScore += 0.3;
    if (/[A-Z]/.test(content)) readabilityScore += 0.2;
    
    const overall = (lengthScore + structureScore + readabilityScore) / 3;
    
    return {
      overall,
      length: lengthScore,
      structure: structureScore,
      readability: readabilityScore
    };
  }
}
