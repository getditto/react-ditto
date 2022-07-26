import { Ditto, IdentityOfflinePlayground } from '@dittolive/ditto'
import { renderHook, waitFor } from '@testing-library/react'
import { expect } from 'chai'
import React, { ReactNode } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { DittoProvider } from '../DittoProvider'
import { waitForNextUpdate } from '../utils.spec'
import { useLazyPendingCursorOperation } from './useLazyPendingCursorOperation'
import { LiveQueryParams } from './usePendingCursorOperation'
import { DocumentUpserter } from './usePendingCursorOperation.spec'

const testIdentity: () => {
  identity: IdentityOfflinePlayground
  path: string
} = () => ({
  identity: {
    appID: 'useLazyPendingCursorOperationSpec',
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
              <DocumentUpserter path={path} />
              {children}
            </>
          )
        }}
      </DittoProvider>
    )

describe('useLazyPendingCursorOperation tests', function () {
  it('should not load any values until a query is executed with the exec function', async () => {
    const testConfiguration = testIdentity()

    const params: LiveQueryParams = {
      path: testConfiguration.path,
      collection: 'foo',
    }
    const { result } = renderHook(() => useLazyPendingCursorOperation(), {
      wrapper: wrapper(testConfiguration.identity, testConfiguration.path),
    })

    // we wait for the Ditto instance to load.
    await waitForNextUpdate(result)

    expect(result.current.documents).to.eql([])
    expect(result.current.liveQuery).to.eq(undefined)
    expect(result.current.liveQueryEvent).to.eq(undefined)
    expect(result.current.ditto).to.eq(undefined)

    await result.current.exec(params)

    await waitFor(() => expect(result.current.documents).not.to.be.empty, {
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
    const { result } = renderHook(() => useLazyPendingCursorOperation(), {
      wrapper: wrapper(testConfiguration.identity, testConfiguration.path),
    })

    // we wait for the Ditto instance to load.
    await waitForNextUpdate(result)
    await result.current.exec(params)

    await waitFor(() => expect(result.current.documents).not.to.be.empty, {
      timeout: 5000,
    })

    expect(result.current.documents.length).to.eq(5)

    for (let i = 1; i < 6; i++) {
      expect(
        !!result.current.documents.find((doc) => doc.value.document === i),
      ).to.eq(true)
    }
  })

  it('should load all documents correctly observing only for local data', async () => {
    const testConfiguration = testIdentity()

    const params: LiveQueryParams = {
      path: testConfiguration.path,
      collection: 'foo',
      localOnly: true,
    }
    const { result } = renderHook(() => useLazyPendingCursorOperation(), {
      wrapper: wrapper(testConfiguration.identity, testConfiguration.path),
    })

    // we wait for the Ditto instance to load.
    await waitForNextUpdate(result)
    await result.current.exec(params)

    await waitFor(() => expect(result.current.documents).not.to.be.empty, {
      timeout: 5000,
    })

    expect(result.current.documents.length).to.eq(5)

    for (let i = 1; i < 6; i++) {
      expect(
        !!result.current.documents.find((doc) => doc.value.document === i),
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

    const { result } = renderHook(() => useLazyPendingCursorOperation(), {
      wrapper: wrapper(testConfiguration.identity, testConfiguration.path),
    })

    // we wait for the Ditto instance to load.
    await waitForNextUpdate(result)
    await result.current.exec(params)

    await waitFor(() => expect(result.current.documents).not.to.be.empty, {
      timeout: 5000,
    })

    expect(result.current.documents.length).to.eq(2)

    for (let i = 4; i < 6; i++) {
      expect(
        !!result.current.documents.find((doc) => doc.value.document === i),
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

    const { result } = renderHook(() => useLazyPendingCursorOperation(), {
      wrapper: wrapper(testConfiguration.identity, testConfiguration.path),
    })

    // we wait for the Ditto instance to load.
    await waitForNextUpdate(result)
    await result.current.exec(params)

    await waitFor(() => expect(result.current.documents).not.to.be.empty, {
      timeout: 5000,
    })

    expect(result.current.documents.length).to.eq(2)
    const liveQuery = result.current.liveQuery

    await result.current.exec({
      path: testConfiguration.path,
      collection: 'foo',
    })

    await waitFor(() => expect(result.current.documents).to.have.lengthOf(5), {
      timeout: 5000,
    })

    expect(result.current.liveQuery).not.to.eq(liveQuery)
  })

  it('should return the Ditto collection as an alternative way for developers to query the collection', async () => {
    const testConfiguration = testIdentity()

    const params: LiveQueryParams = {
      path: testConfiguration.path,
      collection: 'foo',
    }
    const { result } = renderHook(() => useLazyPendingCursorOperation(), {
      wrapper: wrapper(testConfiguration.identity, testConfiguration.path),
    })

    // we wait for the Ditto instance to load.
    await waitForNextUpdate(result)
    await result.current.exec(params)

    await waitFor(() => expect(result.current.documents).not.to.be.empty, {
      timeout: 5000,
    })

    expect(result.current.documents.length).to.eq(5)

    const collectionDocuments = await result.current.collection.findAll().exec()
    expect(collectionDocuments.length).to.eq(5)
  })
})
