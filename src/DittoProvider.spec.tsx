import { Ditto, IdentityOfflinePlayground } from '@dittolive/ditto'
// import { waitFor } from '@testing-library/react'
import { expect } from 'chai'
import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import { v4 as uuidv4 } from 'uuid'

import { useDittoContext } from './DittoContext'
import { DittoProvider } from './DittoProvider'
import { waitFor } from './utils.spec'

const testIdentity: () => {
  identity: IdentityOfflinePlayground
  path: string
} = () => ({
  identity: {
    appName: 'dittoProviderSpec',
    siteID: 100,
    type: 'offlinePlayground',
  },
  path: uuidv4(),
})

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

  const initOptions = {
    webAssemblyModule: '/base/node_modules/@dittolive/ditto/web/ditto.wasm',
  }

  it('should load ditto wasm from the CDN', async function () {
    const config = testIdentity()

    render(
      <DittoProvider
        setup={() => {
          const ditto = new Ditto(config.identity, config.path)
          return ditto
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
      </DittoProvider>,
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

    render(
      <DittoProvider
        initOptions={initOptions}
        setup={() => {
          const ditto = new Ditto(config.identity, config.path)
          return ditto
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
      </DittoProvider>,
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
      <DittoProvider
        initOptions={initOptions}
        setup={() => {
          const ditto = new Ditto(config.identity, config.path)
          return ditto
        }}
      >
        {({ loading, error }) => {
          return (
            <>
              <div data-testid="loading">{`${loading}`}</div>
              <div data-testid="error">{error?.message}</div>
            </>
          )
        }}
      </DittoProvider>,
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

  it('should mount the provider with the initialized Ditto instance.', async () => {
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
      <DittoProvider
        setup={() => {
          return new Ditto(config.identity, config.path)
        }}
        initOptions={initOptions}
      >
        {() => <TesterChildComponent />}
      </DittoProvider>,
      container,
    )

    await waitFor(() => {
      return (
        container.querySelector("div[data-testid='dittoHash']").innerHTML ===
        `["${config.path}"]`
      )
    })
  })

  it('should pass the loading state to the child component when the provider is initialized as a single instance', async () => {
    const config = testIdentity()

    render(
      <DittoProvider
        setup={() => {
          return new Ditto(config.identity, config.path)
        }}
        initOptions={initOptions}
      >
        {({ loading }) => <div data-testid="loading">{`${loading}`}</div>}
      </DittoProvider>,
      container,
    )

    expect(
      container.querySelector("div[data-testid='loading']").innerHTML,
    ).to.eq('true')

    await waitFor(
      () =>
        container.querySelector("div[data-testid='loading']").innerHTML ===
        'false',
    )
  })

  it('should pass the loading state to the child component when the provider is initialized as an array of instances', async () => {
    const config = testIdentity()
    const config2 = testIdentity()

    render(
      <DittoProvider
        setup={() => {
          return [
            new Ditto(config.identity, config.path),
            new Ditto(config2.identity, config2.path),
          ]
        }}
        initOptions={initOptions}
      >
        {({ loading }) => <div data-testid="loading">{`${loading}`}</div>}
      </DittoProvider>,
      container,
    )

    expect(
      container.querySelector("div[data-testid='loading']").innerHTML,
    ).to.eq('true')

    await waitFor(
      () =>
        container.querySelector("div[data-testid='loading']").innerHTML ===
        'false',
    )
  })
})
