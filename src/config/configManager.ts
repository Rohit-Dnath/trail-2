// Configuration and API key management for Traily Chrome Extension
export class ConfigManager {
  private static readonly API_KEY_STORAGE_KEY = 'traily_gemini_api_key';
  private static readonly DEFAULT_API_KEY = 'AIzaSyBUKv9TXCEkttL3vxjguPlrd7YG-LYFXuU';

  /**
   * Get the Gemini API key from storage or use default
   */
  static async getGeminiApiKey(): Promise<string> {
    try {
      const result = await chrome.storage.sync.get([this.API_KEY_STORAGE_KEY]);
      return result[this.API_KEY_STORAGE_KEY] || this.DEFAULT_API_KEY;
    } catch (error) {
      console.warn('Failed to get API key from storage, using default:', error);
      return this.DEFAULT_API_KEY;
    }
  }

  /**
   * Set the Gemini API key in storage
   */
  static async setGeminiApiKey(apiKey: string): Promise<void> {
    try {
      await chrome.storage.sync.set({
        [this.API_KEY_STORAGE_KEY]: apiKey
      });
      console.log('API key saved successfully');
    } catch (error) {
      console.error('Failed to save API key:', error);
      throw error;
    }
  }

  /**
   * Clear the stored API key (revert to default)
   */
  static async clearGeminiApiKey(): Promise<void> {
    try {
      await chrome.storage.sync.remove([this.API_KEY_STORAGE_KEY]);
      console.log('API key cleared, reverting to default');
    } catch (error) {
      console.error('Failed to clear API key:', error);
      throw error;
    }
  }

  /**
   * Check if a custom API key is set (not using default)
   */
  static async hasCustomApiKey(): Promise<boolean> {
    try {
      const result = await chrome.storage.sync.get([this.API_KEY_STORAGE_KEY]);
      return !!result[this.API_KEY_STORAGE_KEY];
    } catch (error) {
      return false;
    }
  }

  /**
   * Initialize with default API key if none exists
   */
  static async initialize(): Promise<void> {
    try {
      const hasCustomKey = await this.hasCustomApiKey();
      if (!hasCustomKey) {
        console.log('Initializing with default API key');
        // We don't set the default key in storage, just use it when needed
      }
    } catch (error) {
      console.error('Failed to initialize config manager:', error);
    }
  }

  /**
   * Validate API key format
   */
  static validateApiKey(apiKey: string): boolean {
    // Basic validation for Google API key format
    return typeof apiKey === 'string' && 
           apiKey.length > 20 && 
           apiKey.startsWith('AIza');
  }

  /**
   * Get configuration for development/production
   */
  static getConfig() {
    return {
      isDevelopment: process.env.NODE_ENV === 'development',
      apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      rateLimitDelay: 1000, // 1 second between API calls
      maxRetries: 3,
      requestTimeout: 30000 // 30 seconds
    };
  }
}
