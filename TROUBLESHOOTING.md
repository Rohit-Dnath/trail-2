# Traily Extension - En- **Web Options**: Dropdown appears with options to search Google or go to Wikipedia
- **Smart Detection**: If you type "wikipedia.org", it offers direct navigation

## Testing the New Functionality:ed Search Functionality

## New Features Added:

### **Smart Search Interface**
- **Dual Search**: Search both your knowledge graph AND the web from the same search box
- **Smart Suggestions**: Shows whether your search query exists in your captured content
- **Web Search Options**: Direct links to Google search, Wikipedia, or direct URL navigation
- **Knowledge Graph Integration**: See existing results while offering web search options

### **How It Works:**

1. **Search in Knowledge Graph**: Type in the search box to filter your captured content
2. **Web Search Options**: If you have results, you'll see a green indicator "Found in your knowledge graph"
3. **Search Options Dropdown**: Click or continue typing to see web search options:
   - Search icon: Search web for "your query"
   - Globe icon: Go to URL (if your input looks like a URL)
   - Book icon: Search Wikipedia for "your query"

### **Example Usage:**

**Scenario**: You search for "wiki"
- ✅ **Knowledge Graph**: Shows any captured Wikipedia pages in the background
- ✅ **Web Options**: Dropdown appears with options to search Google or go to Wikipedia
- ✅ **Smart Detection**: If you type "wikipedia.org", it offers direct navigation

## Testing the New Functionality:

1. **Open Side Panel**: Click extension icon → "View Knowledge Graph"
2. **Search Test**: Type "wiki" or any term in the search box
3. **Check Results**: 
   - See filtered nodes in the graph background
   - Notice the dropdown with web search options
   - Green checkmark indicator if results found in knowledge graph
4. **Try Web Search**: Click "Search web" to open Google in current tab
5. **Try Direct URL**: Type "github.com" and select "Go to URL"

### How to Test:

1. **Load the Extension**:
   ```bash
   # Make sure it's built
   npm run build
   
   # Load dist/ folder in Chrome extensions
   ```

2. **Open Developer Tools**:
   - Open Chrome DevTools (F12)
   - Check Console tab for "Traily:" messages
   - Look for content processing logs

3. **Test Content Capture**:
   - Visit any website (e.g., news articles, blogs)
   - Check console for "Traily: Processing page" messages
   - Wait a few seconds for AI processing

4. **Open Side Panel**:
   - Click extension icon → "View Knowledge Graph"
   - Or use the "Load Sample Data" button to test visualization

5. **Check Storage**:
   ```javascript
   // In Chrome DevTools console:
   chrome.storage.local.get(['graph_nodes', 'graph_edges'], console.log)
   ```

### Expected Behavior:

- Content script should log when processing pages
- Background should log when receiving content
- After visiting 2-3 pages, nodes should appear in the graph
- Sample data button should immediately show test nodes

### Common Issues:

1. **No Console Logs**: Extension might not be loaded properly
2. **Content Script Errors**: Check if pages are being blocked by CSP
3. **API Key Issues**: Check popup for connection status
4. **Storage Problems**: Clear extension data in Chrome settings

### Debug Commands:

```javascript
// Check if extension is running
chrome.runtime.sendMessage({type: 'GET_GRAPH_DATA'}, console.log)

// Clear all data
chrome.storage.local.clear()

// Check content script injection
console.log('Content script loaded:', !!window.ContentExtractor)
```
