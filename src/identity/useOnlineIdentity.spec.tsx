import { Ditto } from '@dittolive/ditto'
import { render, screen, waitFor } from '@testing-library/react'
import { renderHook } from '@testing-library/react-hooks/dom'
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

    const identity = result.current.create({ appID })

    expect(identity.type).to.eql('online')
    expect(identity.appID).to.eql(appID)
    expect(identity.authHandler).to.exist
    expect(identity.authHandler.authenticationRequired).to.exist
    expect(identity.authHandler.authenticationExpiringSoon).to.exist
  })

  it('should set isAuthenticationRequired to true when an online identity is used to connect to an app', async () => {
    const appID = uuidv4()
    const { result } = renderHook(() => useOnlineIdentity())

    expect(result.current.create).to.exist
    expect(result.current.isAuthenticationRequired).false
    const identity = result.current.create({ appID })

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

    await waitFor(() => !!screen.queryAllByTestId('loaded').length)
    await waitFor(() => !!result.current.isAuthenticationRequired)
    await waitFor(unmount)
  })
})
