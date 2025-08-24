import React, { useState, useEffect } from 'react';
import { ConfigManager } from '../config/configManager';

interface ExtensionSettings {
  geminiApiKey: string;
  autoCapture: boolean;
  enableNotifications: boolean;
  captureFrequency: number;
  minContentLength: number;
  skipDomains: string[];
}

interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  recentlyAdded: number;
  storageUsed: number;
}

const PopupApp: React.FC = () => {
  const [settings, setSettings] = useState<ExtensionSettings>({
    geminiApiKey: '',
    autoCapture: true,
    enableNotifications: true,
    captureFrequency: 5,
    minContentLength: 500,
    skipDomains: []
  });
  
  const [stats, setStats] = useState<GraphStats>({
    totalNodes: 0,
    totalEdges: 0,
    recentlyAdded: 0,
    storageUsed: 0
  });
  
  const [isConnected, setIsConnected] = useState(false);
  const [hasCustomApiKey, setHasCustomApiKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'settings'>('overview');

  useEffect(() => {
    loadSettings();
    loadStats();
    checkApiKeyStatus();
  }, []);

  const checkApiKeyStatus = async () => {
    try {
      const apiKey = await ConfigManager.getGeminiApiKey();
      const hasCustom = await ConfigManager.hasCustomApiKey();
      setIsConnected(!!apiKey);
      setHasCustomApiKey(hasCustom);
      setSettings(prev => ({ ...prev, geminiApiKey: hasCustom ? apiKey : '' }));
    } catch (error) {
      console.error('Failed to check API key status:', error);
    }
  };

  const loadSettings = async () => {
    try {
      chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
        if (response?.success) {
          setSettings(response.data);
          setIsConnected(!!response.data.geminiApiKey);
        }
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const loadStats = async () => {
    try {
      chrome.runtime.sendMessage({ type: 'GET_GRAPH_DATA' }, (response) => {
        if (response?.success) {
          const { nodes, edges } = response.data;
          const recentNodes = nodes.filter((node: any) => 
            node.data.timestamp && Date.now() - node.data.timestamp < 24 * 60 * 60 * 1000
          );
          
          setStats({
            totalNodes: nodes.length,
            totalEdges: edges.length,
            recentlyAdded: recentNodes.length,
            storageUsed: 0 // Would need separate call to get storage usage
          });
        }
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const saveSettings = async () => {
    try {
      // Only save API key if user entered a custom one
      if (settings.geminiApiKey && settings.geminiApiKey.trim()) {
        await ConfigManager.setGeminiApiKey(settings.geminiApiKey.trim());
        setHasCustomApiKey(true);
      }
      
      // Save other settings to Chrome storage
      await chrome.storage.sync.set({
        autoCapture: settings.autoCapture,
        enableNotifications: settings.enableNotifications,
        captureFrequency: settings.captureFrequency
      });
      
      await checkApiKeyStatus();
      
      // Show success message
      setSaveStatus('Settings saved successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
      
      setIsConnected(hasCustomApiKey || !!(await ConfigManager.getGeminiApiKey()));
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus('Failed to save settings. Please try again.');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const openSidePanel = () => {
    // For Chrome extensions, we'll open the side panel via tab creation for now
    chrome.tabs.create({ url: chrome.runtime.getURL('sidepanel.html') });
  };

  return (
    <div className="w-full h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-primary-600 text-white p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Traily</h1>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
        </div>
        <p className="text-primary-100 text-sm mt-1">Knowledge Graph</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-3 px-4 text-sm font-medium ${
            activeTab === 'overview'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-3 px-4 text-sm font-medium ${
            activeTab === 'settings'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Settings
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'overview' && (
          <div className="p-4 space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-lg border">
                <div className="text-2xl font-bold text-primary-600">{stats.totalNodes}</div>
                <div className="text-xs text-gray-600">Pages Captured</div>
              </div>
              <div className="bg-white p-3 rounded-lg border">
                <div className="text-2xl font-bold text-green-600">{stats.totalEdges}</div>
                <div className="text-xs text-gray-600">Connections</div>
              </div>
              <div className="bg-white p-3 rounded-lg border">
                <div className="text-2xl font-bold text-orange-600">{stats.recentlyAdded}</div>
                <div className="text-xs text-gray-600">Today</div>
              </div>
              <div className="bg-white p-3 rounded-lg border">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(stats.storageUsed / 1024)}KB
                </div>
                <div className="text-xs text-gray-600">Storage Used</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={openSidePanel}
                className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                Open Knowledge Graph
              </button>
              
              <button
                onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('sidepanel.html') })}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Open in New Tab
              </button>
            </div>

            {/* Connection Status */}
            <div className="bg-white p-3 rounded-lg border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Gemini AI</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {isConnected ? 'Connected' : 'Not Connected'}
                </span>
              </div>
              {!hasCustomApiKey && isConnected && (
                <p className="text-xs text-blue-600 mt-1">
                  Using default API key. You can add your own in settings.
                </p>
              )}
              {!isConnected && (
                <p className="text-xs text-gray-600 mt-1">
                  Configure your API key in settings to enable AI features.
                </p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-3 rounded-lg border">
              <h3 className="text-sm font-medium mb-2">Auto-Capture</h3>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">
                  {settings.autoCapture ? 'Active' : 'Paused'}
                </span>
                <button
                  onClick={() => {
                    const newSettings = { ...settings, autoCapture: !settings.autoCapture };
                    setSettings(newSettings);
                    chrome.runtime.sendMessage({ type: 'UPDATE_SETTINGS', settings: newSettings });
                  }}
                  className={`px-3 py-1 text-xs rounded ${
                    settings.autoCapture
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  } transition-colors`}
                >
                  {settings.autoCapture ? 'Pause' : 'Resume'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-4 space-y-4">
            {/* API Key */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Gemini API Key
              </label>
              <input
                type="password"
                value={settings.geminiApiKey}
                onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                placeholder={hasCustomApiKey ? "Custom API key configured" : "Using default API key - enter your own (optional)"}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">
                  {hasCustomApiKey ? 'Custom key active' : 'Default key active'}
                </span>
                {hasCustomApiKey && (
                  <button
                    onClick={async () => {
                      try {
                        await ConfigManager.clearGeminiApiKey();
                        setSettings({ ...settings, geminiApiKey: '' });
                        setHasCustomApiKey(false);
                        await checkApiKeyStatus();
                      } catch (error) {
                        console.error('Failed to clear API key:', error);
                      }
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    Use Default
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-600">
                Get your free API key from Google AI Studio
              </p>
            </div>

            {/* Auto Capture */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Auto-capture pages
                </label>
                <p className="text-xs text-gray-600">
                  Automatically analyze pages as you browse
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoCapture}
                onChange={(e) => setSettings({ ...settings, autoCapture: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
            </div>

            {/* Content Length */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Minimum content length
              </label>
              <input
                type="number"
                value={settings.minContentLength}
                onChange={(e) => setSettings({ ...settings, minContentLength: parseInt(e.target.value) })}
                min="100"
                max="5000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-600">
                Pages shorter than this will be ignored
              </p>
            </div>

            {/* Save Button */}
            <button
              onClick={saveSettings}
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              Save Settings
            </button>

            {/* Save Status */}
            {saveStatus && (
              <div className={`text-sm p-2 rounded ${
                saveStatus.includes('successfully') 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {saveStatus}
              </div>
            )}

            {/* Danger Zone */}
            <div className="border-t pt-4 mt-6">
              <h3 className="text-sm font-medium text-red-600 mb-2">Danger Zone</h3>
              <button
                onClick={() => {
                  if (confirm('This will delete all your captured data. Are you sure?')) {
                    chrome.runtime.sendMessage({ type: 'CLEAR_ALL_DATA' });
                  }
                }}
                className="w-full bg-red-50 text-red-600 py-2 px-4 rounded-lg font-medium hover:bg-red-100 transition-colors border border-red-200"
              >
                Clear All Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PopupApp;
