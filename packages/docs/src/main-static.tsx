import './styles/index.css'

import { StrictMode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import App from './App'

export function render(url: string) {
  const html = renderToStaticMarkup(
    <StrictMode>
      <App url={url} />
    </StrictMode>,
  )
  return { html }
}
