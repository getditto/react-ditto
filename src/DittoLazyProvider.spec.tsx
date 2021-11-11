import { Ditto, IdentityOfflinePlayground } from '@dittolive/ditto'
import { expect } from 'chai'
import React, { useContext } from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import { act } from 'react-dom/test-utils'

import { DittoContext } from './DittoContext'
import { DittoLazyProvider } from './DittoLazyProvider'

describe('Ditto Lazy Provider Tests', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    unmountComponentAtNode(container)
    container.remove()
    container = null
  })

  it('should load ditto wasm from the CDN', function () {
    const identity: IdentityOfflinePlayground = {
      appName: 'live.ditto.test',
      siteID: 234,
      type: 'offlinePlayground',
    }
    act(() => {
      render(
        <DittoLazyProvider
          setup={() => {
            return Promise.resolve(new Ditto(identity, '/test'))
          }}
        >
          {({ loading, error }) => {
            if (loading) {
              expect(error).to.be.undefined
            }
            if (error) {
              expect(loading).to.be.false
            }
            return <></>
          }}
        </DittoLazyProvider>,
        container,
      )
    })
  })

  it('should load ditto wasm from a locally served ditto.wasm file', function () {
    const identity: IdentityOfflinePlayground = {
      appName: 'live.ditto.test',
      siteID: 234,
      type: 'offlinePlayground',
    }
    const initOptions = {
      webAssemblyModule: '/base/node_modules/@dittolive/ditto/web/ditto.wasm',
    }

    act(() => {
      render(
        <DittoLazyProvider
          initOptions={initOptions}
          setup={() => {
            return Promise.resolve(new Ditto(identity, '/test'))
          }}
        >
          {({ loading, error }) => {
            if (loading) {
              expect(error).to.be.undefined
            }
            if (error) {
              expect(loading).to.be.false
            }
            return <></>
          }}
        </DittoLazyProvider>,
        container,
      )
    })
  })

  it('should fail to load ditto from web assembly file that does not exist', function () {
    const identity: IdentityOfflinePlayground = {
      appName: 'live.ditto.test',
      siteID: 234,
      type: 'offlinePlayground',
    }
    const initOptions = {
      webAssemblyModule:
        '/base/node_modules/@dittolive/ditto/web/ditto-that-does-not-exist.wasm',
    }

    act(() => {
      render(
        <DittoLazyProvider
          initOptions={initOptions}
          setup={() => {
            return Promise.resolve(new Ditto(identity, '/test'))
          }}
        >
          {({ loading, error }) => {
            if (loading == false) {
              expect(error).to.not.be.undefined
            }
            return <></>
          }}
        </DittoLazyProvider>,
        container,
      )
    })
  })

  it('should mount the provider with an empty set of Ditto instances.', () => {
    const identity: IdentityOfflinePlayground = {
      appName: 'live.ditto.test',
      siteID: 234,
      type: 'offlinePlayground',
    }

    const TesterChildComponent = () => {
      const { dittoHash } = useContext(DittoContext)

      expect(dittoHash).to.eqls({})

      return <></>
    }
    act(() => {
      render(
        <DittoLazyProvider
          setup={() => {
            return Promise.resolve(new Ditto(identity, '/test'))
          }}
        >
          {() => <TesterChildComponent />}
        </DittoLazyProvider>,
        container,
      )
    })
  })
})
