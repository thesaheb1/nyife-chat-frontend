import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/App'
import { TooltipProvider } from './components/ui/tooltip.tsx'
import ToastProvider from './app/providers/toast-provider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider />
    <TooltipProvider><App /></TooltipProvider>
  </StrictMode>
)
