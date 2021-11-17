import { Ditto, IdentityOfflinePlayground } from '@dittolive/ditto'
import { renderHook } from '@testing-library/react-hooks/dom'
import { expect } from 'chai'
import React, { ReactNode } from 'react'
import { unmountComponentAtNode } from 'react-dom'
import { v4 as uuidv4 } from 'uuid'

import { DittoProvider } from '../DittoProvider'
import { useLazyPendingCursorOperation } from './useLazyPendingCursorOperation'
import { LiveQueryParams } from './usePendingCursorOperation'
import { DocumentInserter } from './usePendingCursorOperation.spec'

const testIdentity: () => {
  identity: IdentityOfflinePlayground
  path: string
} = () => ({
  identity: {
    appName: 'useLazyPendingCursorOperationSpec',
    siteID: 100,
    type: 'offlinePlayground',
  },
  path: uuidv4(),
})

const initOptions = {
  webAssemblyModule: '/base/node_modules/@dittolive/ditto/web/ditto.wasm',
}

// Creates a wrapper component for each test
const wrapper =
  (identity: IdentityOfflinePlayground, path: string) =>
  // eslint-disable-next-line react/display-name
  ({ children }: { children: ReactNode }) =>
    (
      <DittoProvider
        setup={() => {
          const ditto = new Ditto(identity, path)
          return ditto
        }}
        initOptions={initOptions}
      >
        {() => {
          return (
            <>
              <DocumentInserter path={path} />
              {children}
            </>
          )
        }}
      </DittoProvider>
    )

describe('useLazyPendingCursorOperation tests', function () {
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

  it('should not load any values until a query is executed with the exec function', async () => {
    const testConfiguration = testIdentity()

    const params: LiveQueryParams = {
      path: testConfiguration.path,
      collection: 'foo',
    }
    const { result, waitFor, waitForNextUpdate } = renderHook(
      () => useLazyPendingCursorOperation(),
      {
        wrapper: wrapper(testConfiguration.identity, testConfiguration.path),
      },
    )

    // we wait for the Ditto instance to load.
    await waitForNextUpdate()

    expect(result.current.documents).to.eql([])
    expect(result.current.liveQuery).to.eq(undefined)
    expect(result.current.liveQueryEvent).to.eq(undefined)
    expect(result.current.ditto).to.eq(undefined)

    await result.current.exec(params)

    await waitFor(() => result.current.documents.length !== 0, {
      timeout: 5000,
    })

    expect(result.current.documents.length).to.eql(5)
    expect(result.current.liveQuery).not.to.eq(undefined)
    expect(result.current.liveQueryEvent).not.to.eq(undefined)
    expect(result.current.ditto).not.to.eq(undefined)
  })

  it('should load all documents correctly', async () => {
    const testConfiguration = testIdentity()

    const params: LiveQueryParams = {
      path: testConfiguration.path,
      collection: 'foo',
    }
    const { result, waitFor, waitForNextUpdate } = renderHook(
      () => useLazyPendingCursorOperation(),
      {
        wrapper: wrapper(testConfiguration.identity, testConfiguration.path),
      },
    )

    // we wait for the Ditto instance to load.
    await waitForNextUpdate()
    await result.current.exec(params)

    await waitFor(() => !!result.current.documents?.length, { timeout: 5000 })

    expect(result.current.documents.length).to.eq(5)

    for (let i = 1; i < 6; i++) {
      expect(
        !!result.current.documents.find((doc) => doc._value.document === i),
      ).to.eq(true)
    }
  })

  it('should load documents correctly using a query', async () => {
    const testConfiguration = testIdentity()

    const params: LiveQueryParams = {
      path: testConfiguration.path,
      collection: 'foo',
      query: 'document > 3',
    }

    const { result, waitFor, waitForNextUpdate } = renderHook(
      () => useLazyPendingCursorOperation(),
      {
        wrapper: wrapper(testConfiguration.identity, testConfiguration.path),
      },
    )

    // we wait for the Ditto instance to load.
    await waitForNextUpdate()
    await result.current.exec(params)

    await waitFor(() => !!result.current.documents?.length, { timeout: 5000 })

    expect(result.current.documents.length).to.eq(2)

    for (let i = 4; i < 6; i++) {
      expect(
        !!result.current.documents.find((doc) => doc._value.document === i),
      ).to.eq(true)
    }
  })

  it('should correctly reset the current live query and create a new one when the exec function is called a second time.', async () => {
    const testConfiguration = testIdentity()

    const params: LiveQueryParams = {
      path: testConfiguration.path,
      collection: 'foo',
      query: 'document > 3',
    }

    const { result, waitFor, waitForNextUpdate } = renderHook(
      () => useLazyPendingCursorOperation(),
      {
        wrapper: wrapper(testConfiguration.identity, testConfiguration.path),
      },
    )

    // we wait for the Ditto instance to load.
    await waitForNextUpdate()
    await result.current.exec(params)

    await waitFor(() => !!result.current.documents?.length, { timeout: 5000 })

    expect(result.current.documents.length).to.eq(2)
    const liveQuery = result.current.liveQuery

    await result.current.exec({
      path: testConfiguration.path,
      collection: 'foo',
    })

    expect(result.current.documents.length).to.eql(5)
    expect(result.current.liveQuery).not.to.eq(liveQuery)
  })
})
