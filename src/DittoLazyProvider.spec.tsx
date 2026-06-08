import dittoPackage from '@dittolive/ditto'
import { expect } from 'chai'
import React from 'react'
import { createRoot, Root } from 'react-dom/client'
import sinon from 'sinon'
import { v4 as uuidv4 } from 'uuid'

import { useDittoContext } from './DittoContext'
import { DittoLazyProvider } from './DittoLazyProvider'
import { openOfflineDitto, waitFor } from './utils.spec'

const testConfig: () => {
  databaseID: string
  path: string
} = () => ({
  databaseID: 'dittoLazyProviderSpec',
  path: uuidv4(),
})

describe('Ditto Lazy Provider Tests', () => {
  let root: Root
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    root.unmount()
    container.remove()
    sinon.restore()
  })

  const initOptions = {
    webAssemblyModule: '/base/node_modules/@dittolive/ditto/web/ditto.wasm',
  }

  it('should load ditto wasm from the CDN', async function () {
    this.timeout(10_000)
    const config = testConfig()

    root.render(
      <DittoLazyProvider
        setup={() => openOfflineDitto(config.databaseID, config.path)}
      >
        {({ loading, error }) => {
          return (
            <>
              <div data-testid="loading">{`${loading}`}</div>
              <div data-testid="error">{error?.message}</div>
            </>
          )
        }}
      </DittoLazyProvider>,
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
    const config = testConfig()

    root.render(
      <DittoLazyProvider
        initOptions={initOptions}
        setup={() => openOfflineDitto(config.databaseID, config.path)}
      >
        {({ loading, error }) => {
          return (
            <>
              <div data-testid="loading">{`${loading}`}</div>
              <div data-testid="error">{error?.message}</div>
            </>
          )
        }}
      </DittoLazyProvider>,
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
    const config = testConfig()
    const initOptions = {
      webAssemblyModule:
        '/base/node_modules/@dittolive/ditto/web/ditto-that-does-not-exist.wasm',
    }

    root.render(
      <DittoLazyProvider
        initOptions={initOptions}
        setup={() => openOfflineDitto(config.databaseID, config.path)}
      >
        {({ loading, error }) => {
          return (
            <>
              <div data-testid="loading">{`${loading}`}</div>
              <div data-testid="error">{error?.message}</div>
            </>
          )
        }}
      </DittoLazyProvider>,
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
    const config = testConfig()

    const TesterChildComponent = () => {
      const { dittoHash } = useDittoContext()

      return (
        <div data-testid="dittoHash">
          {JSON.stringify(Object.keys(dittoHash))}
        </div>
      )
    }

    root.render(
      <DittoLazyProvider
        setup={() => openOfflineDitto(config.databaseID, config.path)}
      >
        {() => <TesterChildComponent />}
      </DittoLazyProvider>,
    )

    await waitFor(() => {
      return (
        container.querySelector("div[data-testid='dittoHash']").innerHTML ===
        `[]`
      )
    })
  })

  it("should call Ditto's init only once in strict mode", async () => {
    const init = sinon.fake()
    sinon.replace(dittoPackage, 'init', init)

    root.render(
      <React.StrictMode>
        <DittoLazyProvider setup={sinon.fake()} initOptions={initOptions}>
          {({ loading }) => !loading && 'loaded'}
        </DittoLazyProvider>
      </React.StrictMode>,
    )

    await waitFor(() => container.textContent === 'loaded', 600)
    expect(init).to.have.been.calledOnce
  })
})
