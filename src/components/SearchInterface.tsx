import React, { useState, useRef, useEffect } from 'react';

interface SearchInterfaceProps {
  onSearch: (query: string) => void;
  onWebSearch?: (query: string) => void;
  onDirectUrl?: (url: string) => void;
  placeholder?: string;
  value?: string;
  hasKnowledgeResults?: boolean;
}

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

  return (
    <div ref={dropdownRef} className="relative">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
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
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            placeholder={placeholder}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            style={{ minWidth: '300px' }}
          />
          {searchQuery && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  onSearch('');
                  setShowWebOptions(false);
                }}
                className="text-gray-400 hover:text-gray-500"
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
        <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {hasKnowledgeResults && (
            <div className="px-3 py-2 text-xs text-green-600 bg-green-50 border-b border-green-100 flex items-center space-x-2">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Found in your knowledge graph</span>
            </div>
          )}
          
          <div className="p-2">
            <div className="text-xs text-gray-500 mb-2 px-2">Web Search Options:</div>
            
            {onWebSearch && (
              <button
                onClick={handleWebSearch}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded flex items-center space-x-2 text-sm"
              >
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Search web for "{searchQuery}"</span>
              </button>
            )}
            
            {onDirectUrl && isUrl(searchQuery) && (
              <button
                onClick={handleDirectUrl}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded flex items-center space-x-2 text-sm"
              >
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0 9c-1.657 0-3-4.03-3-9s1.343-9 3-9m0 9c1.657 0 3 4.03 3 9s-1.343 9-3-9" />
                </svg>
                <span>Go to {searchQuery}</span>
              </button>
            )}
            
            {onWebSearch && (
              <button
                onClick={() => {
                  onWebSearch(`${searchQuery} site:wikipedia.org`);
                  setShowWebOptions(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded flex items-center space-x-2 text-sm"
              >
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>Search Wikipedia for "{searchQuery}"</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchInterface;
