import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';
import { setupApiFallbackInterceptor } from './services/setupApiFallback';

// Initialize resilient API fallback interceptor for static GitHub Pages or serverless hosting
try {
  setupApiFallbackInterceptor();
} catch (e) {
  console.warn('API fallback interceptor initialization skipped:', e);
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
