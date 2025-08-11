import './index.css'

import React from 'react'
import ReactDOMClient from 'react-dom/client'

import AppContainer from './AppContainer'

const container = document.getElementById('root')
if (!container) {
  throw new Error('root element not found')
}

const root = ReactDOMClient.createRoot(container)
root.render(
  <React.StrictMode>
    <AppContainer />
  </React.StrictMode>,
)
