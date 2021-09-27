import { Ditto } from '@dittolive/ditto'
import { DittoProvider } from '@dittolive/react-ditto'
import React from 'react'

import App from './App'

/**
 * Container component that shows how to initialize the DittoProvider component.
 * */
const AppContainer: React.FC = () => {
  return (
    <DittoProvider
      setup={() => {
        const ditto = new Ditto(
          {
            appName: 'live.ditto.example',
            siteID: 1234,
            type: 'development',
          },
          '/foo',
        )
        return [ditto]
      }}
    >
      {({ loading, error }) => {
        if (loading) {
          return <h1>Loading</h1>
        }
        if (error) {
          return <h1>Error: {JSON.stringify(error)}</h1>
        }
        return <App />
      }}
    </DittoProvider>
  )
}

export default AppContainer
