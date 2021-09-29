import { Ditto, IdentityDevelopment } from '@dittolive/ditto'
import { expect } from 'chai'
import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import { act } from 'react-dom/test-utils'

import { DittoProvider } from './DittoProvider'

describe('Ditto Provider Tests', () => {
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
    const identity: IdentityDevelopment = {
      appName: 'live.ditto.test',
      siteID: 234,
      type: 'development',
    }
    act(() => {
      render(
        <DittoProvider
          setup={() => {
            const ditto = new Ditto(identity, '/test')
            return ditto
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
        </DittoProvider>,
        container,
      )
    })
  })

  it('should load ditto wasm from a locally served ditto.wasm file', function () {
    const identity: IdentityDevelopment = {
      appName: 'live.ditto.test',
      siteID: 234,
      type: 'development',
    }
    const initOptions = {
      webAssemblyModule: '/base/node_modules/@dittolive/ditto/web/ditto.wasm',
    }

    act(() => {
      render(
        <DittoProvider
          initOptions={initOptions}
          setup={() => {
            const ditto = new Ditto(identity, '/test')
            return ditto
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
        </DittoProvider>,
        container,
      )
    })
  })

  it('should fail to load ditto from web assembly file that does not exist', function () {
    const identity: IdentityDevelopment = {
      appName: 'live.ditto.test',
      siteID: 234,
      type: 'development',
    }
    const initOptions = {
      webAssemblyModule:
        '/base/node_modules/@dittolive/ditto/web/ditto-that-does-not-exist.wasm',
    }

    act(() => {
      render(
        <DittoProvider
          initOptions={initOptions}
          setup={() => {
            const ditto = new Ditto(identity, '/test')
            return ditto
          }}
        >
          {({ loading, error }) => {
            if (loading == false) {
              expect(error).to.not.be.undefined
            }
            return <></>
          }}
        </DittoProvider>,
        container,
      )
    })
  })
})
