import dittoPackage, {
  Ditto,
  IdentityOfflinePlayground,
} from '@dittolive/ditto'
import { expect } from 'chai'
import React from 'react'
import { createRoot, Root } from 'react-dom/client'
import sinon from 'sinon'
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
    const config = testIdentity()

    root.render(
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
    const config = testIdentity()

    root.render(
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

    root.render(
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

    root.render(
      <DittoProvider
        setup={() => {
          return new Ditto(config.identity, config.path)
        }}
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
    const config = testIdentity()
    const renderFn = sinon.stub()
    renderFn.withArgs(sinon.match({ loading: false })).returns('loaded')

    root.render(
      <DittoProvider
        setup={() => new Ditto(config.identity, config.path)}
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
    const config = testIdentity()
    const config2 = testIdentity()
    const renderFn = sinon.stub()
    renderFn.withArgs(sinon.match({ loading: false })).returns('loaded')

    root.render(
      <DittoProvider
        setup={() => [
          new Ditto(config.identity, config.path),
          new Ditto(config2.identity, config2.path),
        ]}
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
})
