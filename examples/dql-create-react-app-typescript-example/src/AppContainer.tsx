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
      createDevelopment({
        appID: '12e5e73c-68af-4af8-9322-5fd262ff5c7d',
        siteID: 1234,
      }),
      '/path-development',
    )
    await dittoDevelopment.disableSyncWithV3()

    // Example of how to create an online instance with authentication enabled
    const dittoOnline = new Ditto(
      createOnline(
        {
          // If you're using the Ditto cloud this ID should be the app ID shown on your app settings page, on the portal.
          appID: uuidv4(),
          // enableDittoCloudSync: true,
        },
        '/path-online',
      ),
      '/path-online',
    )
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
