import './styles/index.css'

import { StrictMode } from 'react'
import { createRoot,hydrateRoot } from 'react-dom/client'

import App from './App.tsx'

const url_path = window.location.pathname

if (import.meta.env.DEV) {
  createRoot(document.querySelector('#root')!).render(
    <StrictMode>
      <App url={url_path} />
    </StrictMode>,
  )
} else {
  hydrateRoot(
    document.querySelector('#root')!,
    <StrictMode>
      <App url={url_path} />
    </StrictMode>,
  )
}
