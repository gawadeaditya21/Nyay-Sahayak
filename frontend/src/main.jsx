import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
        <App />
      </Suspense>
    </LanguageProvider>
  </StrictMode>,
)
