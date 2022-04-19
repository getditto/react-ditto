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

const DocumentInserter: React.FC<{ path: string }> = ({ path }) => {
  const { ditto, insert } = useMutations<unknown>({
    path,
    collection: 'foo',
  })

  useEffect(() => {
    if (ditto) {
      insert({
        value: { document: 1 },
        insertOptions: {
          id: 'someId',
        },
      })
      insert({ value: { document: 2 } })
      insert({ value: { document: 3 } })
      insert({ value: { document: 4 } })
      insert({ value: { document: 5 } })
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

    expect(result.current.document._id).to.eq('someId')
    expect(result.current.document._value.document).to.eq(1)
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

    expect(result.current.document._id).to.eq('someId')
    expect(result.current.document._value.document).to.eq(1)
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
})
