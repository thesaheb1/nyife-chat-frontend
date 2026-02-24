import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { persistor, store } from './redux/store/store'
import ToastProvider from './app/providers/toast-provider.tsx'
import { TooltipProvider } from './components/ui/tooltip.tsx'
import './index.css'
import App from './app/App'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element with id "root" was not found.')
}

createRoot(rootElement).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ToastProvider />
        <TooltipProvider>
          <App />
        </TooltipProvider>
      </PersistGate>
    </Provider>
  </StrictMode>,
)
