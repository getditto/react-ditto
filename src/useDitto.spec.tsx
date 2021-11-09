import { Ditto, IdentityOfflinePlayground } from '@dittolive/ditto'
import { renderHook } from '@testing-library/react-hooks/dom'
import { expect } from 'chai'
import React, { ReactNode } from 'react'

import { DittoLazyProvider, DittoProvider, useDitto } from './'

const identity: IdentityOfflinePlayground = {
  appName: 'useDittoSpec',
  siteID: 100,
  type: 'offlinePlayground',
}

const path = 'useDittoSpec'

describe('useDittoSpec tests', function () {
  it('should return a ditto instance with a matching path variable when a non-lazy provider is used.', async function () {
    const setup = (): Ditto => {
      const ditto = new Ditto(identity, path)
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
    const { result, waitFor } = renderHook(() => useDitto(path), {
      wrapper,
    })

    await waitFor(() => !!result.current.ditto, { timeout: 5000 })
    expect(result.current?.ditto.path).to.eq(path)
  })

  it('should return a ditto instance with a matching path variable, and a loading state, when a lazy provider is used.', async function () {
    const setup = (): Promise<Ditto> => {
      return Promise.resolve(new Ditto(identity, path))
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
    const { result, waitFor } = renderHook(() => useDitto(path), {
      wrapper,
    })

    await waitFor(() => !result.current.loading && !!result.current?.ditto, {
      timeout: 5000,
    })

    expect(result.current?.ditto.path).to.eq(path)
    expect(result.current?.loading).to.eq(false)
    expect(result.current?.error).to.eq(undefined)
  })
})
