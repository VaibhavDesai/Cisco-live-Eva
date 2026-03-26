import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { RootErrorBoundary } from './RootErrorBoundary';

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Missing #root element — check index.html');
}

createRoot(rootEl).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);
