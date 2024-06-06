import { useDitto } from '@dittolive/react-ditto'
import React, { useState } from 'react'

type Props = {
  /** True if authentication is required */
  isAuthRequired: boolean
  /** Current active path */
  path: string
}

/** Simple authenticate panel for the user to input a token and a token provider.
 */
const AuthenticationPanel: React.FC<Props> = ({ path, isAuthRequired }) => {
  const [token, setToken] = useState('')
  const [provider, setProvider] = useState('')
  const [authError, setAuthError] = useState<Error>()
  const { ditto } = useDitto(path)
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!ditto?.auth.status.isAuthenticated,
  )

  if (!ditto || !isAuthRequired || isAuthenticated) {
    return null
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '0',
        width: '100%',
        height: '300px',
        padding: '16px',
        backgroundColor: '#FEE2E2',
        boxSizing: 'border-box',
      }}
    >
      <form
        onSubmit={(evt) => {
          evt.preventDefault()
          ditto.auth
            .loginWithToken(token, provider)
            .then(() => setIsAuthenticated(ditto.auth.status.isAuthenticated))
            .catch((err) => {
              setAuthError(err)
            })
        }}
      >
        <h3>Authentication required</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '200px 1fr',
            gridColumnGap: '8px',
            marginBottom: '16px',
          }}
        >
          <div>
            <label htmlFor="provider" style={{ display: 'block' }}>
              Provider
            </label>
            <input
              type="text"
              id="provider"
              value={provider}
              onChange={(evt) => setProvider(evt.target.value)}
            />
          </div>
          <div>
            <label htmlFor="token" style={{ display: 'block' }}>
              Token
            </label>
            <textarea
              id="token"
              value={token}
              onChange={(evt) => setToken(evt.target.value)}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        </div>
        <button type="submit">Authenticate</button>
      </form>

      <div style={{ color: '#B91C1C', marginTop: '16px' }}>
        {authError?.message}
      </div>
    </div>
  )
}

export default AuthenticationPanel
