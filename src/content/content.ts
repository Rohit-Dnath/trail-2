// Content Script for Traily Chrome Extension
// This script runs on every web page to extract content

interface ContentExtractionResult {
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

class ContentExtractor {
  private isProcessing = false;
  private lastExtractionTime = 0;
  private minExtractionInterval = 5000; // 5 seconds between extractions

  constructor() {
    this.init();
  }

  private init(): void {
    // Only process if enough time has passed
    if (Date.now() - this.lastExtractionTime < this.minExtractionInterval) {
      return;
    }

    // Wait for page to load completely
    if (document.readyState === 'complete') {
      this.processPage();
    } else {
      window.addEventListener('load', () => this.processPage());
    }
  }

  private async processPage(): Promise<void> {
    if (this.isProcessing || !this.shouldProcessPage()) {
      return;
    }

    this.isProcessing = true;
    this.lastExtractionTime = Date.now();

    try {
      console.log('Traily: Processing page:', window.location.href);
      const extractedContent = this.extractPageContent();
      
      if (extractedContent && this.isContentValid(extractedContent)) {
        console.log('Traily: Sending content to background script:', extractedContent);
        // Send to background script for processing
        chrome.runtime.sendMessage({
          type: 'PROCESS_CONTENT',
          data: extractedContent
        }, (response) => {
          if (response?.success) {
            console.log('Traily: Content processed successfully');
          } else {
            console.error('Traily: Failed to process content:', response);
          }
        });
      } else {
        console.log('Traily: Content not valid or sufficient for processing');
      }
    } catch (error) {
      console.error('Content extraction failed:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private shouldProcessPage(): boolean {
    const url = window.location.href;
    
    // Skip chrome internal pages
    if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
      return false;
    }

    // Skip common non-content pages
    const skipPatterns = [
      /facebook\.com/,
      /twitter\.com/,
      /instagram\.com/,
      /youtube\.com\/watch/, // Allow YouTube homepage but skip videos
      /\.pdf$/,
      /\.(jpg|jpeg|png|gif|svg)$/i
    ];

    if (skipPatterns.some(pattern => pattern.test(url))) {
      return false;
    }

    return true;
  }

  private extractPageContent(): ContentExtractionResult | null {
    try {
      const url = window.location.href;
      const title = this.extractTitle();
      const content = this.extractMainContent();
      
      if (!content || content.length < 100) {
        return null;
      }

      const wordCount = content.trim().split(/\s+/).length;
      const domain = new URL(url).hostname;
      const contentType = this.detectContentType(title, content, url);

      return {
        url,
        title,
        content: content.trim(),
        timestamp: Date.now(),
        metadata: {
          domain,
          contentType,
          wordCount
        }
      };
    } catch (error) {
      console.error('Content extraction error:', error);
      return null;
    }
  }

  private extractTitle(): string {
    // Try multiple strategies to get the best title
    let title = '';

    // 1. Try Open Graph title
    const ogTitle = document.querySelector('meta[property="og:title"]') as HTMLMetaElement;
    if (ogTitle?.content) {
      title = ogTitle.content;
    }

    // 2. Try Twitter title
    if (!title) {
      const twitterTitle = document.querySelector('meta[name="twitter:title"]') as HTMLMetaElement;
      if (twitterTitle?.content) {
        title = twitterTitle.content;
      }
    }

    // 3. Try h1 tags
    if (!title) {
      const h1 = document.querySelector('h1');
      if (h1?.textContent) {
        title = h1.textContent.trim();
      }
    }

    // 4. Fallback to document title
    if (!title) {
      title = document.title;
    }

    return title.trim();
  }

  private extractMainContent(): string {
    // Strategy 1: Look for common content containers
    const contentSelectors = [
      'article',
      '[role="main"]',
      'main',
      '.content',
      '.post-content',
      '.entry-content',
      '.article-body',
      '.story-body',
      '.post-body',
      '.content-body'
    ];

    for (const selector of contentSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        return this.cleanContent(element);
      }
    }

    // Strategy 2: Look for largest text block
    const textBlocks = this.findLargestTextBlocks();
    if (textBlocks.length > 0) {
      return textBlocks.map(block => this.cleanContent(block)).join('\n\n');
    }

    // Strategy 3: Fallback to body (with aggressive cleaning)
    return this.cleanContent(document.body, true);
  }

  private findLargestTextBlocks(): Element[] {
    const candidates: Array<{ element: Element; score: number }> = [];
    
    // Look for paragraphs with substantial text
    document.querySelectorAll('p, div').forEach(element => {
      const text = element.textContent || '';
      const wordCount = text.trim().split(/\s+/).length;
      
      if (wordCount > 20) {
        candidates.push({ element, score: wordCount });
      }
    });

    // Return top candidates
    return candidates
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(candidate => candidate.element);
  }

  private cleanContent(element: Element, aggressive = false): string {
    if (!element) return '';

    // Clone to avoid modifying the original
    const clone = element.cloneNode(true) as Element;

    // Remove unwanted elements
    const unwantedSelectors = [
      'script', 'style', 'noscript',
      '.ad', '.ads', '.advertisement', '.sponsor',
      '.social-share', '.share-buttons',
      '.comments', '.comment-form',
      'nav', 'header', 'footer',
      '.sidebar', '.widget',
      '.menu', '.navigation'
    ];

    if (aggressive) {
      unwantedSelectors.push(
        '.related-articles', '.recommended',
        '.newsletter', '.subscription',
        '.popup', '.modal',
        '.cookie-notice'
      );
    }

    unwantedSelectors.forEach(selector => {
      clone.querySelectorAll(selector).forEach(el => el.remove());
    });

    // Get text content
    let content = clone.textContent || '';

    // Clean up whitespace
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();

    return content;
  }

  private detectContentType(title: string, content: string, url: string): string {
    const titleLower = title.toLowerCase();
    const contentLower = content.toLowerCase();
    const domain = new URL(url).hostname;

    // Research papers
    if (titleLower.match(/\b(research|paper|study|analysis)\b/) ||
        contentLower.match(/\b(abstract|methodology|results|conclusion|literature review)\b/)) {
      return 'research';
    }

    // Documentation
    if (titleLower.match(/\b(documentation|docs|api|tutorial|guide)\b/) ||
        domain.includes('docs') ||
        contentLower.match(/\b(installation|configuration|usage|example)\b/)) {
      return 'documentation';
    }

    // News
    if (domain.includes('news') ||
        titleLower.match(/\b(breaking|reported|announced)\b/) ||
        contentLower.match(/\b(breaking news|reported|according to)\b/)) {
      return 'news';
    }

    // Blog posts
    if (titleLower.match(/\b(blog|post|opinion)\b/) ||
        contentLower.match(/\b(published by|written by|author)\b/) ||
        url.includes('/blog/')) {
      return 'blog';
    }

    // Technical content
    if (contentLower.match(/\b(function|class|method|algorithm|code|programming)\b/)) {
      return 'technical';
    }

    return 'article';
  }

  private isContentValid(content: ContentExtractionResult): boolean {
    // Minimum word count
    if (content.metadata.wordCount < 50) {
      return false;
    }

    // Check for meaningful content (not just navigation/UI text)
    const meaningfulPhrases = [
      /\b(the|this|that|what|how|why|when|where)\b/i,
      /\b(because|therefore|however|although|since)\b/i,
      /\.[A-Z]/,  // Sentence boundaries
      /\w+ing\b/, // Present participles
      /\w+ed\b/   // Past tense
    ];

    const hasmeaningfulContent = meaningfulPhrases.some(pattern => 
      pattern.test(content.content)
    );

    if (!hasmeaningfulContent) {
      return false;
    }

    // Avoid pages that are primarily navigation o