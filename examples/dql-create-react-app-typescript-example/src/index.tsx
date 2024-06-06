import './index.css'

import React from 'react'
import ReactDOMClient from 'react-dom/client'

import AppContainer from './AppContainer'
import reportWebVitals from './reportWebVitals'

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

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
