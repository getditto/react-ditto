import { Ditto, IdentityOfflinePlayground } from '@dittolive/ditto'
import { renderHook, waitFor } from '@testing-library/react'
import { expect } from 'chai'
import React, { ReactNode, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { DittoProvider } from '../DittoProvider'
import { useMutations } from '../mutations'
import {
  LiveQueryParams,
  usePendingCursorOperation,
} from './usePendingCursorOperation'

const testIdentity: () => {
  identity: IdentityOfflinePlayground
  path: string
} = () => ({
  identity: {
    appID: 'usePendingCursorOperationSpec',
    siteID: 100,
    type: 'offlinePlayground',
  },
  path: uuidv4(),
})

export const DocumentUpserter: React.FC<{ path: string }> = ({ path }) => {
  const { ditto, upsert } = useMutations<unknown>({
    path,
    collection: 'foo',
  })

  useEffect(() => {
    if (ditto) {
      upsert({ value: { document: 1 } })
      upsert({ value: { document: 2 } })
      upsert({ value: { document: 3 } })
      upsert({ value: { document: 4 } })
      upsert({ value: { document: 5 } })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ditto])

  return <></>
}

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

describe('usePendingCursorOperation tests', function () {
  it('should load all documents correctly', async () => {
    const testConfiguration = testIdentity()

    const params: LiveQueryParams = {
      path: testConfiguration.path,
      collection: 'foo',
    }
    const { result } = renderHook(() => usePendingCursorOperation(params), {
      wrapper: wrapper(testConfiguration.identity, testConfiguration.path),
    })
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
    const { result } = renderHook(() => usePendingCursorOperation(params), {
      wrapper: wrapper(testConfiguration.identity, testConfiguration.path),
    })
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
    const { result } = renderHook(() => usePendingCursorOperation(params), {
      wrapper: wrapper(testConfiguration.identity, testConfiguration.path),
    })
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

  it('should correctly reset the current live query and create a new one when the reset function is called.', async () => {
    const testConfiguration = testIdentity()

    const params: LiveQueryParams = {
      path: testConfiguration.path,
      collection: 'foo',
      query: 'document > 3',
    }
    const { result } = renderHook(() => usePendingCursorOperation(params), {
      wrapper: wrapper(testConfiguration.identity, testConfiguration.path),
    })
    await waitFor(() => expect(result.current.documents).not.to.be.empty, {
      timeout: 5000,
    })

    expect(result.current.documents.length).to.eq(2)

    const liveQueryBeforeReset = result.current.liveQuery

    result.current.reset()

    await waitFor(
      () => {
        expect(result.current.liveQuery).not.to.eq(liveQueryBeforeReset)
        expect(result.current.documents).to.have.lengthOf(2)
      },
      { timeout: 5000 },
    )
  })

  it('should return the Ditto collection as an alternative way for developers to query the collection', async () => {
    const testConfiguration = testIdentity()

    const params: LiveQueryParams = {
      path: testConfiguration.path,
      collection: 'foo',
    }
    const { result } = renderHook(() => usePendingCursorOperation(params), {
      wrapper: wrapper(testConfiguration.identity, testConfiguration.path),
    })
    await waitFor(() => expect(result.current.documents).not.to.be.empty, {
      timeout: 5000,
    })

    expect(result.current.documents.length).to.eq(5)

    const collectionDocuments = await result.current.collection.findAll().exec()
    expect(collectionDocuments.length).to.eq(5)
  })
})
