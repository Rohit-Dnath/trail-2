# Traily Extension - Troubleshooting Guide

## Issue: Graphs and Nodes Not Displaying

### What I Fixed:

1. **Missing Content Processing Handler**: The background script wasn't handling messages from the content script.
   - Added `PROCESS_CONTENT` message handler in background.ts
   - Content script now properly communicates with background service

2. **Enhanced Debugging**: Added console logging throughout the pipeline:
   - Content script logs when processing pages
   - Background script logs when receiving content
   - Side panel logs graph data loading

3. **Sample Data for Testing**: Added a "Load Sample Data" button to test the graph visualization without waiting for content capture.

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
