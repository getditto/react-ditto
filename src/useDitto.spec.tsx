import { Ditto, IdentityOfflinePlayground } from '@dittolive/ditto'
import { renderHook, waitFor } from '@testing-library/react'
import { expect } from 'chai'
import React, { ReactNode } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { DittoLazyProvider, DittoProvider, useDitto } from './'

const testIdentity: () => {
  identity: IdentityOfflinePlayground
  persistenceDirectory: string
} = () => ({
  identity: {
    appID: 'useDittoSpec',
    siteID: 100,
    type: 'offlinePlayground',
  },
  persistenceDirectory: uuidv4(),
})

describe('useDittoSpec tests', function () {
  it('should return a ditto instance with a matching persistence directory when a non-lazy provider is used.', async function () {
    const testConfiguration = testIdentity()
    const setup = (): Ditto => {
      const ditto = new Ditto(
        testConfiguration.identity,
        testConfiguration.persistenceDirectory,
      )
      return ditto
    }

    const initOptions = {
      webAssemblyModule: '/base/node_modules/@dittolive/ditto/web/ditto.wasm',
    }

    const wrapper = ({ children }: { children: ReactNode }) => (
      <DittoProvider setup={setup} initOptions={initOptions}>
        {() => {
          return children
        }}
      </DittoProvider>
    )
    const { result } = renderHook(
      () => useDitto(testConfiguration.persistenceDirectory),
      {
        wrapper,
      },
    )

    await waitFor(() => expect(result.current.ditto).to.exist, {
      timeout: 5000,
    })
    expect(result.current.ditto.persistenceDirectory).to.eq(
      testConfiguration.persistenceDirectory,
    )
  })

  it('should return a ditto instance with a matching persistenceDirectory, and a loading state, when a lazy provider is used.', async function () {
    const testConfiguration = testIdentity()
    const setup = (): Promise<Ditto> => {
      return Promise.resolve(
        new Ditto(
          testConfiguration.identity,
          testConfiguration.persistenceDirectory,
        ),
      )
    }

    const initOptions = {
      webAssemblyModule: '/base/node_modules/@dittolive/ditto/web/ditto.wasm',
    }

    const wrapper = ({ children }: { children: ReactNode }) => (
      <DittoLazyProvider setup={setup} initOptions={initOptions}>
        {({ loading }) => {
          if (loading) {
            return null
          }
          return children
        }}
      </DittoLazyProvider>
    )
    const { result, rerender } = renderHook(
      () => useDitto(testConfiguration.persistenceDirectory),
      {
        wrapper,
      },
    )

    await waitFor(
      () => {
        rerender()
        expect(result.current.loading).to.be.false
        expect(result.current.ditto).to.exist
      },
      { timeout: 5000 },
    )

    expect(result.current?.ditto.persistenceDirectory).to.eq(
      testConfiguration.persistenceDirectory,
    )
    expect(result.current?.loading).to.eq(false)
    expect(result.current?.error).to.eq(undefined)
  })
})
