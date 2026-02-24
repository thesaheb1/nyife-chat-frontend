import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'

import App from './app/App'
import ToastProvider from './app/providers/toast-provider.tsx'
import { ThemeProvider } from './components/theme-provider'
import { TooltipProvider } from './components/ui/tooltip.tsx'
import './index.css'
import { persistor, store } from './redux/store/store'

const bootstrapTheme = () => {
  const root = document.documentElement
  let mode: 'light' | 'dark' = window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'

  try {
    const persistedRoot = localStorage.getItem('persist:root')

    if (persistedRoot) {
      const parsedRoot = JSON.parse(persistedRoot) as { theme?: string }

      if (parsedRoot.theme) {
        const persistedTheme = JSON.parse(parsedRoot.theme) as { mode?: 'light' | 'dark' }
        if (persistedTheme.mode === 'light' || persistedTheme.mode === 'dark') {
          mode = persistedTheme.mode
        }
      }
    }
  } catch {
    mode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  const isDark = mode === 'dark'
  root.classList.toggle('dark', isDark)
  root.setAttribute('data-theme', mode)
  root.style.colorScheme = mode
}

bootstrapTheme()

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element with id "root" was not found.')
}

createRoot(rootElement).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider>
          <ToastProvider />
          <TooltipProvider>
            <App />
          </TooltipProvider>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  </StrictMode>,
)
