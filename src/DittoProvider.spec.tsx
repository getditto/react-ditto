import dittoPackage from '@dittolive/ditto'
import { expect } from 'chai'
import React from 'react'
import { createRoot, Root } from 'react-dom/client'
import sinon from 'sinon'
import { v4 as uuidv4 } from 'uuid'

import { useDittoContext } from './DittoContext'
import { DittoProvider } from './DittoProvider'
import { openOfflineDitto, waitFor } from './utils.spec'

const testConfig: () => {
  databaseID: string
  path: string
} = () => ({
  databaseID: 'dittoProviderSpec',
  path: uuidv4(),
})

describe('Ditto Provider Tests', () => {
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
      <DittoProvider
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
      </DittoProvider>,
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
      <DittoProvider
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
      </DittoProvider>,
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

  it('should mount the provider with the initialized Ditto instance.', async () => {
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
      <DittoProvider
        setup={() => openOfflineDitto(config.databaseID, config.path)}
        initOptions={initOptions}
      >
        {() => <TesterChildComponent />}
      </DittoProvider>,
    )

    await waitFor(() => {
      return (
        container.querySelector("div[data-testid='dittoHash']").innerHTML ===
        `["${config.path}"]`
      )
    })
  })

  it('should pass the loading state to the child component when the provider is initialized as a single instance', async () => {
    const config = testConfig()
    const renderFn = sinon.stub()
    renderFn.withArgs(sinon.match({ loading: false })).returns('loaded')

    root.render(
      <DittoProvider
        setup={() => openOfflineDitto(config.databaseID, config.path)}
        initOptions={initOptions}
      >
        {renderFn}
      </DittoProvider>,
    )

    await waitFor(() => container.textContent === 'loaded')
    expect(renderFn).to.have.been.calledTwice
    expect(renderFn.getCall(0)).to.have.been.calledWithMatch({ loading: true })
    expect(renderFn.getCall(1)).to.have.been.calledWithMatch({ loading: false })
  })

  it('should pass the loading state to the child component when the provider is initialized as an array of instances', async () => {
    const config = testConfig()
    const config2 = testConfig()
    const renderFn = sinon.stub()
    renderFn.withArgs(sinon.match({ loading: false })).returns('loaded')

    root.render(
      <DittoProvider
        setup={() =>
          Promise.all([
            openOfflineDitto(config.databaseID, config.path),
            openOfflineDitto(config2.databaseID, config2.path),
          ])
        }
        initOptions={initOptions}
      >
        {renderFn}
      </DittoProvider>,
    )

    await waitFor(() => container.textContent === 'loaded')
    expect(renderFn).to.have.been.calledTwice
    expect(renderFn.getCall(0)).to.have.been.calledWithMatch({ loading: true })
    expect(renderFn.getCall(1)).to.have.been.calledWithMatch({ loading: false })
  })

  it("should call setup and Ditto's init only once in strict mode", async () => {
    const setup = sinon.fake()
    const init = sinon.fake()
    sinon.replace(dittoPackage, 'init', init)

    root.render(
      <React.StrictMode>
        <DittoProvider setup={setup} initOptions={initOptions}>
          {({ loading }) => !loading && 'loaded'}
        </DittoProvider>
      </React.StrictMode>,
    )

    await waitFor(() => container.textContent === 'loaded', 600)
    expect(setup).to.have.been.calledOnce
    expect(init).to.have.been.calledOnce
  })

  it('should work with an async setup function', async () => {
    const config = testConfig()
    const renderFn = sinon.stub()
    renderFn.withArgs(sinon.match({ loading: false })).returns('loaded')

    root.render(
      <DittoProvider
        setup={async () => {
          const ditto = await openOfflineDitto(config.databaseID, config.path)
          await new Promise((resolve) => setTimeout(resolve, 10))
          return ditto
        }}
      >
        {renderFn}
      </DittoProvider>,
    )

    await waitFor(() => container.textContent === 'loaded')
    expect(renderFn).to.have.been.calledTwice
  })

  it(`should provide an error when the setup function doesn't return a ditto instance`, async () => {
    const setup = sinon.stub().returns(null)

    root.render(
      <DittoProvider setup={setup}>
        {({ loading, error }) => !loading && error?.message}
      </DittoProvider>,
    )

    await waitFor(
      () =>
        container.textContent ===
        'expected a Ditto instance to be returned by the setup function, but got null',
    )
  })

  it('should provide an error when the setup function doesn’t return an array of ditto instances', async () => {
    const setup = sinon.stub().returns([null])
    root.render(
      <DittoProvider setup={setup}>
        {({ loading, error }) => !loading && error?.message}
      </DittoProvider>,
    )

    await waitFor(
      () =>
        container.textContent ===
        'expected an array of Ditto instances to be returned by the setup function, but at least one element is not a Ditto instance (got null)',
    )
  })
})
