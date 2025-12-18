import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@/index.css'
import { App } from '@/App'

async function prepareApp(): Promise<void> {
  if (import.meta.env.DEV) {
    const { worker } = await import('@/mocks/browser')
    await worker.start({
      onUnhandledRequest: 'bypass',
    })
  }
}

void prepareApp().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  )
})
