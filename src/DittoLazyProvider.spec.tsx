import { Ditto, IdentityOfflinePlayground } from '@dittolive/ditto'
import { expect } from 'chai'
import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import { v4 as uuidv4 } from 'uuid'

import { useDittoContext } from './DittoContext'
import { DittoLazyProvider } from './DittoLazyProvider'
import { waitFor } from './utils.spec'

const testIdentity: () => {
  identity: IdentityOfflinePlayground
  path: string
} = () => ({
  identity: {
    appName: 'dittoLazyProviderSpec',
    siteID: 100,
    type: 'offlinePlayground',
  },
  path: uuidv4(),
})

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

  it('should load ditto wasm from the CDN', async function () {
    const config = testIdentity()

    render(
      <DittoLazyProvider
        setup={() => {
          return Promise.resolve(new Ditto(config.identity, config.path))
        }}
      >
        {({ loading, error }) => {
          return (
            <>
              <div data-testid="loading">{`${loading}`}</div>
              <div data-testid="error">{error}</div>
            </>
          )
        }}
      </DittoLazyProvider>,
      container,
    )

    await waitFor(
      () =>
        container.querySelector("div[data-testid='loading']").innerHTML ===
        'false',
    )

    expect(container.querySelector("div[data-testid='error']").innerHTML).to.eq(
      '',
    )
  })

  it('should load ditto wasm from a locally served ditto.wasm file', async function () {
    const config = testIdentity()
    const initOptions = {
      webAssemblyModule: '/base/node_modules/@dittolive/ditto/web/ditto.wasm',
    }

    render(
      <DittoLazyProvider
        initOptions={initOptions}
        setup={() => {
          return Promise.resolve(new Ditto(config.identity, config.path))
        }}
      >
        {({ loading, error }) => {
          return (
            <>
              <div data-testid="loading">{`${loading}`}</div>
              <div data-testid="error">{error}</div>
            </>
          )
        }}
      </DittoLazyProvider>,
      container,
    )
    await waitFor(
      () =>
        container.querySelector("div[data-testid='loading']").innerHTML ===
        'false',
    )

    expect(container.querySelector("div[data-testid='error']").innerHTML).to.eq(
      '',
    )
  })

  it('should fail to load ditto from web assembly file that does not exist', async function () {
    const config = testIdentity()
    const initOptions = {
      webAssemblyModule:
        '/base/node_modules/@dittolive/ditto/web/ditto-that-does-not-exist.wasm',
    }

    render(
      <DittoLazyProvider
        initOptions={initOptions}
        setup={() => {
          return Promise.resolve(new Ditto(config.identity, config.path))
        }}
      >
        {({ loading, error }) => {
          return (
            <>
              <div data-testid="loading">{`${loading}`}</div>
              <div data-testid="error">{error}</div>
            </>
          )
        }}
      </DittoLazyProvider>,
      container,
    )

    await waitFor(
      () =>
        container.querySelector("div[data-testid='loading']").innerHTML ===
        'false',
    )
    await waitFor(
      () =>
        container.querySelector("div[data-testid='error']").innerHTML === '',
    )
  })

  it('should mount the provider with an empty set of Ditto instances.', async () => {
    const config = testIdentity()

    const TesterChildComponent = () => {
      const { dittoHash } = useDittoContext()

      return (
        <div data-testid="dittoHash">
          {JSON.stringify(Object.keys(dittoHash))}
        </div>
      )
    }

    render(
      <DittoLazyProvider
        setup={() => {
          return Promise.resolve(new Ditto(config.identity, config.path))
        }}
      >
        {() => <TesterChildComponent />}
      </DittoLazyProvider>,
      container,
    )

    await waitFor(() => {
      return (
        container.querySelector("div[data-testid='dittoHash']").innerHTML ===
        `[]`
      )
    })
  })
})
