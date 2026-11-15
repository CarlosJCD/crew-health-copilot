import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Fonts are bundled (not loaded from a CDN) so the app looks the same offline. Latin subset only.
import '@fontsource/inter/latin-300.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import '@fontsource/public-sans/latin-400.css'
import '@fontsource/public-sans/latin-600.css'
import '@fontsource/dm-mono/latin-400.css'
import '@fontsource/dm-mono/latin-500.css'
import './index.css'
import App from './App.tsx'
import { I18nProvider } from './i18n/I18nProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
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
