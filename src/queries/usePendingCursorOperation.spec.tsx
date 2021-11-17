import { Ditto, IdentityOfflinePlayground } from '@dittolive/ditto'
import { renderHook } from '@testing-library/react-hooks/dom'
import { expect } from 'chai'
import React, { ReactNode, useEffect } from 'react'
import { unmountComponentAtNode } from 'react-dom'
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
    appName: 'usePendingCursorOperationSpec',
    siteID: 100,
    type: 'offlinePlayground',
  },
  path: uuidv4(),
})

export const DocumentInserter: React.FC<{ path: string }> = ({ path }) => {
  const { ditto, insert } = useMutations<unknown>({
    path,
    collection: 'foo',
  })

  useEffect(() => {
    if (ditto) {
      insert({ value: { document: 1 } })
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

describe('usePendingCursorOperation tests', function () {
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

  it('should load all documents correctly', async () => {
    const testConfiguration = testIdentity()

    const params: LiveQueryParams = {
      path: testConfiguration.path,
      collection: 'foo',
    }
    const { result, waitFor } = renderHook(
      () => usePendingCursorOperation(params),
      {
        wrapper: wrapper(testConfiguration.identity, testConfiguration.path),
      },
    )
    await waitFor(() => !!result.current.documents?.length, { timeout: 5000 })

    expect(result.current.documents.length).to.eq(5)

    for (let i = 1; i < 6; i++) {
      expect(
        !!result.current.documents.find((doc) => doc._value.document === i),
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
    const { result, waitFor } = renderHook(
      () => usePendingCursorOperation(params),
      {
        wrapper: wrapper(testConfiguration.identity, testConfiguration.path),
      },
    )
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
    const { result, waitFor } = renderHook(
      () => usePendingCursorOperation(params),
      {
        wrapper: wrapper(testConfiguration.identity, testConfiguration.path),
      },
    )
    await waitFor(() => !!result.current.documents?.length, { timeout: 5000 })

    expect(result.current.documents.length).to.eq(2)

    for (let i = 4; i < 6; i++) {
      expect(
        !!result.current.documents.find((doc) => doc._value.document === i),
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
    const { result, waitFor } = renderHook(
      () => usePendingCursorOperation(params),
      {
        wrapper: wrapper(testConfiguration.identity, testConfiguration.path),
      },
    )
    await waitFor(() => !!result.current.documents?.length, { timeout: 5000 })

    expect(result.current.documents.length).to.eq(2)

    const liveQueryBeforeReset = result.current.liveQuery

    result.current.reset()

    await waitFor(() => result.current.liveQuery !== liveQueryBeforeReset, {
      timeout: 5000,
    })

    expect(result.current.documents.length).to.eq(2)
  })

  it('should return the Ditto collection as an alternative way for developers to query the collection', async () => {
    const testConfiguration = testIdentity()

    const params: LiveQueryParams = {
      path: testConfiguration.path,
      collection: 'foo',
    }
    const { result, waitFor } = renderHook(
      () => usePendingCursorOperation(params),
      {
        wrapper: wrapper(testConfiguration.identity, testConfiguration.path),
      },
    )
    await waitFor(() => !!result.current.documents?.length, { timeout: 5000 })

    expect(result.current.documents.length).to.eq(5)

    const collectionDocuments = await result.current.collection.findAll().exec()
    expect(collectionDocuments.length).to.eq(5)
  })
})
