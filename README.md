# Traily - Research Knowledge Graph Chrome Extension

Traily is a powerful Chrome extension that automatically captures, processes, and visualizes your browsing data as an interactive knowledge graph using Google Gemini 2.5 Flash API.

## Features

- **Automatic Content Capture**: Intelligently captures relevant web content as you browse
- **AI-Powered Analysis**: Uses Google Gemini 2.5 Flash API to extract key concepts and relationships
- **Interactive Knowledge Graph**: Visualize your research as an interconnected graph using ReactFlow
- **Smart Filtering**: Advanced filtering by content type, date, domain, and more
- **Semantic Search**: Find content using natural language queries
- **Pre-configured Setup**: Ready to use with default API key - no setup required
- **Flexible API Management**: Optionally use your own Gemini API key for increased usage limits
- **Local-First Storage**: All data stored locally in Chrome extension storage
- **Privacy-Focused**: Only processes content you explicitly visit

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Graph Visualization**: ReactFlow
- **AI Processing**: Google Gemini 2.5 Flash API
- **Storage**: Chrome Extension Storage API
- **Styling**: Tailwind CSS
- **Build Tool**: Webpack 5
- **Manifest**: Chrome Extension Manifest V3

## Installation

### Development Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd traily-chrome-extension
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the extension**:
   ```bash
   npm run build
   ```

4. **Load in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the `dist` folder

5. **API Configuration**:
   - The extension comes with a default Gemini API key pre-configured
   - You can optionally add your own API key in the extension settings
   - Get a free API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Production Build

```bash
npm run build
```

## Configuration

### Google Gemini API Key

1. Get a free API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click the Traily extension icon in Chrome
3. Go to Settings tab
4. Enter your API key and save

### Settings

- **Auto-capture**: Toggle automatic page analysis
- **Minimum content length**: Set threshold for content capture
- **Skip domains**: Configure domains to ignore
- **Capture frequency**: Adjust processing intervals

## Usage

### Basic Usage

1. **Install and configure** the extension with your Gemini API key
2. **Browse the web** - Traily automatically captures relevant content
3. **Open the knowledge graph** by clicking the extension icon and selecting "Open Knowledge Graph"
4. **Explore connections** by clicking on nodes to see details and relationships

### Advanced Features

- **Search**: Use the search bar to find specific content or concepts
- **Filter**: Apply filters by node type, date range, or domain
- **Node Details**: Click any node to see detailed information and connected content
- **Export**: Export your knowledge graph data (feature in development)

## Project Structure

```
src/
├── background/          # Background service worker
│   └── background.ts    # Main background script
├── content/             # Content scripts
│   └── content.ts       # Page content extraction
├── popup/               # Extension popup
│   ├── popup.html       # Popup HTML
│   ├── popup.tsx        # Popup entry point
│   └── PopupApp.tsx     # Main popup component
├── sidepanel/           # Side panel interface
│   ├── sidepanel.html   # Side panel HTML
│   ├── sidepanel.tsx    # Side panel entry point
│   └── SidePanelApp.tsx # Main side panel component
├── components/          # Shared React components
│   ├── SearchInterface.tsx
│   ├── NodeDetailPanel.tsx
│   └── KnowledgeGraphSidebar.tsx
├── services/            # Core services
│   ├── geminiProcessor.ts    # Gemini API integration
│   ├── storageManager.ts     # Chrome storage management
│   └── contentProcessor.ts   # Content processing utilities
├── styles/              # CSS styles
│   └── globals.css      # Global styles with Tailwind
├── types/               # TypeScript type definitions
│   └── index.ts         # Common interfaces
└── manifest.json        # Chrome extension manifest
```

## Development

### Available Scripts

- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run watch` - Watch mode for development
- `npm run clean` - Clean build directory
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Development Workflow

1. **Make changes** to the source code
2. **Run build** with `npm run build:dev` or `npm run watch`
3. **Reload extension** in Chrome extensions page
4. **Test changes** in browser

### Adding New Features

1. **Content Processing**: Modify `src/services/geminiProcessor.ts` for AI features
2. **Graph Visualization**: Update components in `src/components/`
3. **Storage**: Extend `src/services/storageManager.ts` for data management
4. **UI**: Add new React components and update existing ones

## API Integration

### Gemini 2.5 Flash API

The extension uses Google's Gemini 2.5 Flash API for:

- **Content Analysis**: Extracting key concepts and topics
- **Relationship Detection**: Finding connections between content
- **Semantic Search**: Understanding user search intent
- **Content Categorization**: Automatically tagging content types

### Rate Limiting

- API calls are rate-limited to avoid quota exhaustion
- Requests are queued and processed sequentially
- Failed requests are logged but don't interrupt normal operation

## Privacy & Security

- **Local Storage**: All data stored locally in Chrome extension storage
- **API Key Security**: Gemini API key stored securely in Chrome sync storage
- **No Data Collection**: Extension doesn't collect or transmit personal data
- **Permission Minimal**: Only requests necessary Chrome permissions

## Performance

- **Lazy Loading**: Graph nodes loaded on demand
- **Memory Management**: Automatic cleanup of old data
- **Storage Limits**: Configurable storage size limits
- **Background Processing**: Non-blocking content analysis

## Troubleshooting

### Common Issues

1. **Extension not loading**:
   - Check Chrome Developer mode is enabled
   - Verify manifest.json is valid
   - Check console for errors

2. **API not working**:
   - Verify Gemini API key is correct
   - Check internet connection
   - Monitor browser console for API errors

3. **Graph not showing**:
   - Ensure content has been captured
   - Check if filters are too restrictive
   - Verify ReactFlow dependencies are loaded

### Debug Mode

Enable debug logging by setting `console.log` statements in the background script. Logs can be viewed in Chrome extension inspector.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

[Specify license here]

## Roadmap

- [ ] Enhanced AI analysis with multiple models
- [ ] Export to common formats (JSON, CSV, GraphML)
- [ ] Collaborative knowledge graphs
- [ ] Mobile companion app
- [ ] Integration with research tools
- [ ] Advanced visualization layouts
- [ ] Machine learning for content relevance

## Support

For support, please:
1. Check the troubleshooting section
2. Search existing issues
3. Create a new issue with detailed description

---

**Note**: This extension requires a Google Gemini API key for full functionality. The free tier provides generous limits for personal research use.
