import React from 'react';
import { createRoot } from 'react-dom/client';
import SidePanelApp from './SidePanelApp';
import '../styles/globals.css';

const container = document.getElementById('sidepanel-root');
if (container) {
  const root = createRoot(container);
  root.render(<SidePanelApp />);
}
