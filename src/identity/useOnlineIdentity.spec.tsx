import { Ditto } from '@dittolive/ditto'
import { render, renderHook, screen, waitFor } from '@testing-library/react'
import { expect } from 'chai'
import React from 'react'
import { v4 as uuidv4 } from 'uuid'

import { DittoProvider } from '../DittoProvider'
import { useOnlineIdentity } from './useOnlineIdentity'

describe('Ditto useOnlineIdentity hook tests', () => {
  it('should correctly create an online identity', () => {
    const appID = uuidv4()
    const { result } = renderHook(() => useOnlineIdentity())

    expect(result.current.create).to.exist
    expect(result.current.getAuthenticationRequired).to.exist
    expect(result.current.getTokenExpiresInSeconds).to.exist
    expect(result.current.authenticate).to.exist

    const identity = result.current.create({ appID }, 'app')

    expect(identity.type).to.eql('onlineWithAuthentication')
    expect(identity.appID).to.eql(appID)
    expect(identity.authHandler).to.exist
    expect(identity.authHandler.authenticationRequired).to.exist
    expect(identity.authHandler.authenticationExpiringSoon).to.exist
  })

  it('should return true when the getAuthenticationRequired function is called and authentication is required to connect to an app', async () => {
    const appID = uuidv4()
    const { result } = renderHook(() => useOnlineIdentity())

    expect(result.current.create).to.exist
    const identity = result.current.create({ appID }, 'app')

    const { unmount } = render(
      <DittoProvider
        setup={() => {
          const ditto = new Ditto(identity, '/path')
          return ditto
        }}
      >
        {({ loading, error }) => {
          if (loading || error) {
            return null
          }
          return <div data-testid="loaded"></div>
        }}
      </DittoProvider>,
    )

    await waitFor(
      () => expect(screen.queryAllByTestId('loaded')).not.to.be.empty,
    )
    await waitFor(
      () => expect(result.current.getAuthenticationRequired('app')).to.be.true,
    )
    await waitFor(unmount)
  })
})
