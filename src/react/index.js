import React from 'react';
import { createRoot } from 'react-dom/client';
import BlocklyDemo from './components/BlocklyDemo';

// Initialize React components when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Mount the new BlocklyDemo component
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const root = createRoot(rootElement);
    root.render(<BlocklyDemo />);
  } else {
    // Fallback: create a new root element
    const appRoot = document.createElement('div');
    appRoot.id = 'root';
    document.body.appendChild(appRoot);
    const root = createRoot(appRoot);
    root.render(<BlocklyDemo />);
  }
});

// Export components for direct use if needed
export { BlocklyDemo };