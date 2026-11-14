import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Offline-first: the service worker caches the app shell so it keeps working without a link to Earth.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then(() => navigator.serviceWorker.ready)
      .then((reg) => {
        // Cache what this first visit already downloaded, so the app also opens offline next time.
        const urls = performance.getEntriesByType('resource').map((e) => e.name)
        reg.active?.postMessage({ type: 'CACHE_URLS', urls })
      })
      .catch(() => {
        /* offline support is a progressive enhancement */
      })
  })
}
