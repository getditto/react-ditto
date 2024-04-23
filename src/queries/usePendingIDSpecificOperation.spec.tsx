import { Ditto, IdentityOfflinePlayground } from '@dittolive/ditto'
import { renderHook, waitFor } from '@testing-library/react'
import { expect } from 'chai'
import React, { ReactNode, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { DittoProvider } from '../DittoProvider'
import { useMutations } from '../mutations'
import {
  usePendingIDSpecificOperation,
  UsePendingIDSpecificOperationParams,
} from './usePendingIDSpecificOperation'

const testIdentity: () => {
  identity: IdentityOfflinePlayground
  path: string
} = () => ({
  identity: {
    appID: 'usePendingIDSpecificOperationSpec',
    siteID: 100,
    type: 'offlinePlayground',
  },
  path: uuidv4(),
})

const DocumentUpserter: React.FC<{ path: string }> = ({ path }) => {
  const { ditto, upsert } = useMutations({
    path,
    collection: 'foo',
  })

  useEffect(() => {
    if (ditto) {
      upsert({ value: { _id: 'someId', document: 1 } })
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

const wrapper =
  (identity: IdentityOfflinePlayground, path: string) =>
  // eslint-disable-next-line react/display-name
  ({ children }: { children: ReactNode }) => (
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

describe('usePendingIDSpecificOperation tests', function () {
  it('should load a document by ID correctly', async () => {
    const testConfiguration = testIdentity()

    const params: UsePendingIDSpecificOperationParams = {
      path: testConfiguration.path,
      collection: 'foo',
      _id: 'someId',
    }
    const { result } = renderHook(() => usePendingIDSpecificOperation(params), {
      wrapper: wrapper(testConfiguration.identity, testConfiguration.path),
    })
    await waitFor(() => expect(result.current.document).to.exist, {
      timeout: 5000,
    })

    expect(result.current.subscription).to.exist
    expect(result.current.document.id.value).to.eq('someId')
    expect(result.current.document.value.document).to.eq(1)
  })

  it('should load a document by ID correctly observing only the local store', async () => {
    const testConfiguration = testIdentity()

    const params: UsePendingIDSpecificOperationParams = {
      path: testConfiguration.path,
      collection: 'foo',
      _id: 'someId',
      localOnly: true,
    }
    const { result } = renderHook(() => usePendingIDSpecificOperation(params), {
      wrapper: wrapper(testConfiguration.identity, testConfiguration.path),
    })
    await waitFor(() => expect(result.current.document).to.exist, {
      timeout: 5000,
    })

    expect(result.current.subscription).to.be.undefined
    expect(result.current.document.id.value).to.eq('someId')
    expect(result.current.document.value.document).to.eq(1)
  })

  it('should return the loaded Ditto collection so developers can launch queries on the store with it', async function () {
    const testConfiguration = testIdentity()

    const params: UsePendingIDSpecificOperationParams = {
      path: testConfiguration.path,
      collection: 'foo',
      _id: 'someId',
    }
    const { result } = renderHook(() => usePendingIDSpecificOperation(params), {
      wrapper: wrapper(testConfiguration.identity, testConfiguration.path),
    })
    await waitFor(() => expect(result.current.document).to.exist, {
      timeout: 5000,
    })

    expect(result.current.collection).not.to.eq(undefined)

    const allDocs = await result.current.collection.findAll().exec()

    expect(allDocs.length).to.eq(5)
  })

  it('should cancel the subscription on unmount', async () => {
    const testConfiguration = testIdentity()
    const params: UsePendingIDSpecificOperationParams = {
      path: testConfiguration.path,
      collection: 'foo',
      _id: 'someId',
    }
    const { result, unmount } = renderHook(
      () => usePendingIDSpecificOperation(params),
      {
        wrapper: wrapper(testConfiguration.identity, testConfiguration.path),
      },
    )
    await waitFor(() => expect(result.current.document).to.exist)

    unmount()

    await waitFor(
      () => expect(result.current.subscription.isCancelled).to.be.true,
    )
  })
})
