import { Ditto } from '@dittolive/ditto'
import {
  DittoProvider,
  useOfflinePlaygroundIdentity,
  useOnlineIdentity,
} from '@dittolive/react-ditto'
import React, { useState } from 'react'
import { default as ReactSelect, SingleValue } from 'react-select'
import { v4 as uuidv4 } from 'uuid'

import App from './App'
import AuthenticationPanel from './AuthenticationPanel'

interface IdentityOption {
  name: string
  path: string
}

// If you're using the Ditto cloud these values can be found in the Ditto
// portal, on your app settings page.
const DITTO_APP_ID = uuidv4()
const DITTO_AUTH_URL = `https://${DITTO_APP_ID}.cloud.ditto.live`
const DITTO_WEBSOCKET_URL = `wss://${DITTO_APP_ID}.cloud.ditto.live`

const options: IdentityOption[] = [
  { path: '/path-development', name: 'Development' },
  { path: '/path-online', name: 'Online' },
]

/**
 * Container component that shows how to initialize the DittoProvider component.
 * */
const AppContainer: React.FC = () => {
  const { create: createDevelopment } = useOfflinePlaygroundIdentity()
  const { create: createOnline, getAuthenticationRequired } =
    useOnlineIdentity()
  const [currentPath, setCurrentPath] = useState('/path-development')

  const handleCreateDittoInstances = async () => {
    // Example of how to create a development instance
    const dittoDevelopment = new Ditto(
      createDevelopment({ appID: 'live.ditto.example', siteID: 1234 }),
      '/path-development',
    )
    await dittoDevelopment.disableSyncWithV3()
    dittoDevelopment.startSync()

    // Example of how to create an online instance with authentication enabled
    const dittoOnline = new Ditto(
      createOnline(
        {
          appID: DITTO_APP_ID,
          enableDittoCloudSync: false,
          customAuthURL: DITTO_AUTH_URL,
        },
        '/path-online',
      ),
      '/path-online',
    )
    dittoOnline.updateTransportConfig((config) => {
      config.connect.websocketURLs = [DITTO_WEBSOCKET_URL]
      return config
    })
    await dittoOnline.disableSyncWithV3()

    dittoOnline.startSync()

    return [dittoDevelopment, dittoOnline]
  }

  return (
    <>
      <div
        style={{
          maxWidth: '300px',
          margin: '16px auto',
          padding: '4px',
        }}
      >
        <label style={{ margin: '4px 0', display: 'block' }}>
          Identity type
        </label>
        <ReactSelect<IdentityOption>
          getOptionLabel={(animal: IdentityOption) => animal.name}
          getOptionValue={(animal: IdentityOption) => animal.path}
          options={options}
          value={options.find((opt) => opt.path === currentPath)}
          onChange={(nextOption: SingleValue<IdentityOption>) =>
            setCurrentPath(nextOption!.path)
          }
        />
      </div>
      <DittoProvider setup={handleCreateDittoInstances}>
        {({ loading, error }) => {
          if (loading) {
            return <h1>Loading</h1>
          }
          if (error) {
            if (error) console.error('Error creating Ditto instances:', error)
            return <h1>Error: {JSON.stringify(error)}</h1>
          }

          return (
            <>
              <App path={currentPath} />
              <AuthenticationPanel
                path={currentPath}
                isAuthRequired={getAuthenticationRequired(currentPath)}
              />
            </>
          )
        }}
      </DittoProvider>
    </>
  )
}

export default AppContainer
