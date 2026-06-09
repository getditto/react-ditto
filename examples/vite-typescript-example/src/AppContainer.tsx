import { Authenticator, Ditto, DittoConfig } from '@dittolive/ditto'
import { DittoProvider } from '@dittolive/react-ditto'
import React, { useState } from 'react'
import { default as ReactSelect, SingleValue } from 'react-select'

import App from './App'

interface InstanceOption {
  name: string
  path: string
}

// Online (server) connection details. Copy these from your database's settings
// page in the Ditto portal. Copy the whole connection URL verbatim from
// "Connect via SDK → URL"; do not build it from the database ID.
const DITTO_DATABASE_ID = 'REPLACE_ME_WITH_YOUR_DATABASE_ID'
const DITTO_SERVER_URL = 'REPLACE_ME_WITH_YOUR_URL'
const DITTO_PLAYGROUND_TOKEN = 'REPLACE_ME_WITH_YOUR_PLAYGROUND_TOKEN'

const DEVELOPMENT_PATH = '/path-development'
const ONLINE_PATH = '/path-online'

// The online (server) instance is only opened once the credentials above are
// filled in. Until then the example runs fully offline and out of the box.
const isOnlineConfigured =
  DITTO_DATABASE_ID !== 'REPLACE_ME_WITH_YOUR_DATABASE_ID' &&
  DITTO_SERVER_URL !== 'REPLACE_ME_WITH_YOUR_URL'

const options: InstanceOption[] = [
  { path: DEVELOPMENT_PATH, name: 'Development (offline)' },
  ...(isOnlineConfigured
    ? [{ path: ONLINE_PATH, name: 'Online (server)' }]
    : []),
]

/**
 * Container component that shows how to initialize the DittoProvider with the
 * Ditto v5 API (`Ditto.open` + `DittoConfig`).
 * */
const AppContainer: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(DEVELOPMENT_PATH)

  const handleCreateDittoInstances = async (): Promise<Ditto[]> => {
    // An offline, peer-to-peer ("small peers only") instance. No authentication
    // is required, so sync can be started right away.
    const dittoDevelopment = await Ditto.open(
      new DittoConfig(
        'live.ditto.example',
        { mode: 'smallPeersOnly' },
        DEVELOPMENT_PATH,
      ),
    )
    dittoDevelopment.sync.start()

    if (!isOnlineConfigured) {
      return [dittoDevelopment]
    }

    // An instance connected to a Ditto server (Big Peer). Server connections
    // require an authentication expiration handler to be set before starting
    // sync — `sync.start()` throws otherwise.
    const dittoOnline = await Ditto.open(
      new DittoConfig(
        DITTO_DATABASE_ID,
        { mode: 'server', url: DITTO_SERVER_URL },
        ONLINE_PATH,
      ),
    )
    await dittoOnline.auth.setExpirationHandler(async (ditto) => {
      try {
        await ditto.auth.login(
          DITTO_PLAYGROUND_TOKEN,
          Authenticator.DEVELOPMENT_PROVIDER,
        )
      } catch (error) {
        console.error('Ditto authentication failed:', error)
      }
    })
    dittoOnline.sync.start()

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
        <label style={{ margin: '4px 0', display: 'block' }}>Instance</label>
        <ReactSelect<InstanceOption>
          getOptionLabel={(option: InstanceOption) => option.name}
          getOptionValue={(option: InstanceOption) => option.path}
          options={options}
          value={options.find((opt) => opt.path === currentPath)}
          onChange={(nextOption: SingleValue<InstanceOption>) =>
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
            console.error('Error creating Ditto instances:', error)
            return <h1>Error: {JSON.stringify(error)}</h1>
          }

          return <App path={currentPath} />
        }}
      </DittoProvider>
    </>
  )
}

export default AppContainer
