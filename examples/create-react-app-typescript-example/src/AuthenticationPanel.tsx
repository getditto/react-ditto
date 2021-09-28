import React, { useState } from 'react'

type Props = {
  /** Callback used to submit the current token and the name of the provider to
   * authenticate agains.
   * @param token
   * @param provider
   */
  onSubmit: (token: string, provider: string) => Promise<void>
}

/** Simple authenticate panel for the user to input a token and a token provider.
 */
const AuthenticationPanel: React.FC<Props> = ({ onSubmit }) => {
  const [token, setToken] = useState('')
  const [provider, setProvider] = useState('')
  const [authError, setAuthError] = useState<Error>()

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
          onSubmit(token, provider).catch((err) => {
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
