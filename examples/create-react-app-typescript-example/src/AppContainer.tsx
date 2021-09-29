import { Ditto } from '@dittolive/ditto'
import {
  DittoProvider,
  useDevelopmentIdentity,
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
  const { create: createDevelopment } = useDevelopmentIdentity()
  const {
    create: createOnline,
    isAuthenticationRequired,
    authenticate,
  } = useOnlineIdentity()
  const [currentPath, setCurrentPath] = useState('/path-development')

  const handleCreateDittoInstances = () => {
    // Example of how to create a development instance
    const dittoDevelopment = new Ditto(
      createDevelopment({ appName: 'live.ditto.example', siteID: 1234 }),
      '/path-development',
    )

    // Example of how to create an online instance with authentication enabled
    const dittoOnline = new Ditto(
      createOnline({
        // If you're using the Ditto cloud this ID should be the app ID shown on your app settings page, on the portal.
        appID: uuidv4(),
        // enableDittoCloudSync: true,
      }),
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
          return <App path={currentPath} />
        }}
      </DittoProvider>
      {isAuthenticationRequired && (
        <AuthenticationPanel
          onSubmit={(token, provider) => authenticate(token, provider)}
        />
      )}
    </>
  )
}

export default AppContainer
