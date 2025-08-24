import React, { useState, useRef, useEffect } from 'react';

interface SearchInterfaceProps {
  onSearch: (query: string) => void;
  onWebSearch?: (query: string) => void;
  onDirectUrl?: (url: string) => void;
  placeholder?: string;
  value?: string;
  hasKnowledgeResults?: boolean;
}

// Website logos mapping
const websiteLogos: { [key: string]: string } = {
  'youtube.com': 'https://www.youtube.com/favicon.ico',
  'youtube': 'https://www.youtube.com/favicon.ico',
  'yt': 'https://www.youtube.com/favicon.ico',
  'google.com': 'https://www.google.com/favicon.ico',
  'google': 'https://www.google.com/favicon.ico',
  'github.com': 'https://github.com/favicon.ico',
  'github': 'https://github.com/favicon.ico',
  'twitter.com': 'https://twitter.com/favicon.ico',
  'twitter': 'https://twitter.com/favicon.ico',
  'facebook.com': 'https://facebook.com/favicon.ico',
  'facebook': 'https://facebook.com/favicon.ico',
  'linkedin.com': 'https://linkedin.com/favicon.ico',
  'linkedin': 'https://linkedin.com/favicon.ico',
  'reddit.com': 'https://reddit.com/favicon.ico',
  'reddit': 'https://reddit.com/favicon.ico',
  'stackoverflow.com': 'https://stackoverflow.com/favicon.ico',
  'stackoverflow': 'https://stackoverflow.com/favicon.ico',
  'wikipedia.org': 'https://wikipedia.org/favicon.ico',
  'wikipedia': 'https://wikipedia.org/favicon.ico',
  'amazon.com': 'https://amazon.com/favicon.ico',
  'amazon': 'https://amazon.com/favicon.ico',
  'netflix.com': 'https://netflix.com/favicon.ico',
  'netflix': 'https://netflix.com/favicon.ico',
  'instagram.com': 'https://instagram.com/favicon.ico',
  'instagram': 'https://instagram.com/favicon.ico',
};

const SearchInterface: React.FC<SearchInterfaceProps> = ({
  onSearch,
  onWebSearch,
  onDirectUrl,
  placeholder = "Search...",
  value = "",
  hasKnowledgeResults = false
}) => {
  const [searchQuery, setSearchQuery] = useState(value);
  const [showWebOptions, setShowWebOptions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowWebOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
      setShowWebOptions(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Debounced search - could be enhanced with actual debouncing
    if (query.length > 2 || query.length === 0) {
      onSearch(query);
      setShowWebOptions(query.length > 2);
    } else {
      setShowWebOptions(false);
    }
  };

  const handleWebSearch = () => {
    if (onWebSearch && searchQuery.trim()) {
      onWebSearch(searchQuery);
      setShowWebOptions(false);
    }
  };

  const handleDirectUrl = () => {
    if (onDirectUrl && searchQuery.trim()) {
      onDirectUrl(searchQuery);
      setShowWebOptions(false);
    }
  };

  const isUrl = (text: string) => {
    return text.includes('.') && !text.includes(' ') && text.length > 3;
  };

  // Function to get website logo
  const getWebsiteLogo = (query: string): string | null => {
    const lowerQuery = query.toLowerCase().trim();
    
    // Check for exact matches in our logo mapping
    for (const [key, logo] of Object.entries(websiteLogos)) {
      if (lowerQuery.includes(key)) {
        return logo;
      }
    }
    
    // If it looks like a URL, try to get favicon
    if (isUrl(lowerQuery)) {
      try {
        const url = lowerQuery.startsWith('http') ? lowerQuery : `https://${lowerQuery}`;
        const domain = new URL(url).hostname;
        return `https://${domain}/favicon.ico`;
      } catch {
        return null;
      }
    }
    
    return null;
  };

  const currentLogo = getWebsiteLogo(searchQuery);

  return (
    <div ref={dropdownRef} className="relative">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {currentLogo ? (
              <div className="flex items-center space-x-2">
                <img 
                  src={currentLogo} 
                  alt="Website logo" 
                  className="h-5 w-5 rounded-sm"
                  onError={(e) => {
                    // Fallback to search icon if logo fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <svg
                  className="h-5 w-5 text-white/60 hidden"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            ) : (
              <svg
                className="h-5 w-5 text-white/60"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            )}
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            placeholder={placeholder}
            className="block w-full pl-12 pr-12 py-4 border border-white/30 rounded-2xl leading-5 bg-black/40 backdrop-blur-xl placeholder-white/50 focus:outline-none focus:placeholder-white/40 focus:ring-2 focus:ring-white/40 focus:border-white/50 sm:text-base text-white/90 transition-all shadow-2xl"
            style={{ minWidth: '500px' }}
          />
          {searchQuery && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  onSearch('');
                  setShowWebOptions(false);
                }}
                className="text-white/60 hover:text-white/80 transition-all p-1 rounded-full hover:bg-white/10"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </form>

      {/* Web Search Options Dropdown */}
      {showWebOptions && searchQuery.trim() && (onWebSearch || onDirectUrl) && (
        <div className="absolute top-full mt-2 w-full bg-black/50 backdrop-blur-2xl border border-white/30 rounded-2xl shadow-2xl z-50 glass">
          <div className="p-4">
            <div className="text-xs text-white/60 mb-3 px-3 py-2 font-medium bg-white/10 rounded-xl backdrop-blur-sm">Web Search Options:</div>
            
            {onWebSearch && (
              <button
                onClick={handleWebSearch}
                className="w-full text-left px-4 py-3 hover:bg-white/10 rounded-xl flex items-center space-x-3 text-sm text-white/80 hover:text-white/90 transition-all mb-2 group"
              >
                {currentLogo ? (
                  <img 
                    src={currentLogo} 
                    alt="Website logo" 
                    className="w-5 h-5 rounded-sm"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <svg className={`w-5 h-5 text-blue-400 ${currentLogo ? 'hidden' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="flex-1">Search web for "{searchQuery}"</span>
                <svg className="w-4 h-4 text-white/40 group-hover:text-white/60 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            )}
            
            {onDirectUrl && isUrl(searchQuery) && (
              <button
                onClick={handleDirectUrl}
                className="w-full text-left px-4 py-3 hover:bg-white/10 rounded-xl flex items-center space-x-3 text-sm text-white/80 hover:text-white/90 transition-all mb-2 group"
              >
                {currentLogo ? (
                  <img 
                    src={currentLogo} 
                    alt="Website logo" 
                    className="w-5 h-5 rounded-sm"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <svg className={`w-5 h-5 text-green-400 ${currentLogo ? 'hidden' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0 9c-1.657 0-3-4.03-3-9s1.343-9 3-9m0 9c1.657 0 3 4.03 3 9s-1.343-9-3-9" />
                </svg>
                <span className="flex-1">Go to {searchQuery}</span>
                <svg className="w-4 h-4 text-white/40 group-hover:text-white/60 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            )}
            
            {onWebSearch && (
              <button
                onClick={() => {
                  onWebSearch(`${searchQuery} site:wikipedia.org`);
                  setShowWebOptions(false);
                }}
                className="w-full text-left px-4 py-3 hover:bg-white/10 rounded-xl flex items-center space-x-3 text-sm text-white/80 hover:text-white/90 transition-all group"
              >
                <img 
                  src="https://wikipedia.org/favicon.ico" 
                  alt="Wikipedia logo" 
                  className="w-5 h-5 rounded-sm"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <svg className="w-5 h-5 text-purple-400 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="flex-1">Search Wikipedia for "{searchQuery}"</span>
                <svg className="w-4 h-4 text-white/40 group-hover:text-white/60 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchInterface;
