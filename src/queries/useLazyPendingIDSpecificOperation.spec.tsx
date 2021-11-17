import { Ditto, DocumentID, IdentityOfflinePlayground } from '@dittolive/ditto'
import { renderHook } from '@testing-library/react-hooks/dom'
import { expect } from 'chai'
import React, { ReactNode, useEffect } from 'react'
import { unmountComponentAtNode } from 'react-dom'
import { v4 as uuidv4 } from 'uuid'

import { DittoProvider } from '../DittoProvider'
import { useMutations } from '../mutations'
import { useLazyPendingIDSpecificOperation } from './useLazyPendingIDSpecificOperation'
import { UsePendingIDSpecificOperationParams } from './usePendingIDSpecificOperation'

const testIdentity: () => {
  identity: IdentityOfflinePlayground
  path: string
} = () => ({
  identity: {
    appName: 'usePendingIDSpecificOperationSpec',
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

describe('useLazyPendingIDSpecificOperation tests', function () {
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

  it('should load a document by ID correctly when the exec function is called', async () => {
    const testConfiguration = testIdentity()

    const params: UsePendingIDSpecificOperationParams = {
      path: testConfiguration.path,
      collection: 'foo',
      _id: new DocumentID('someId'),
    }
    const { result, waitFor, waitForNextUpdate } = renderHook(
      () => useLazyPendingIDSpecificOperation(),
      {
        wrapper: wrapper(testConfiguration.identity, testConfiguration.path),
      },
    )

    // we wait for the Ditto instance to load.
    await waitForNextUpdate()

    expect(result.current.document).to.eq(undefined)
    expect(result.current.ditto).to.eq(undefined)
    expect(result.current.liveQuery).to.eq(undefined)
    expect(result.current.event).to.eq(undefined)

    await result.current.exec(params)
    await waitFor(() => !!result.current.document, { timeout: 5000 })

    expect(result.current.document._id.toString()).to.eq('"someId"')
    expect(result.current.document._value.document).to.eq(1)

    expect(result.current.ditto).not.to.eq(undefined)
    expect(result.current.liveQuery).not.to.eq(undefined)
    expect(result.current.event).not.to.eq(undefined)
  })

  it('should return the loaded Ditto collection so developers can launch queries on the store with it, once the exec function is called', async function () {
    const testConfiguration = testIdentity()

    const params: UsePendingIDSpecificOperationParams = {
      path: testConfiguration.path,
      collection: 'foo',
      _id: new DocumentID('someId'),
    }
    const { result, waitFor, waitForNextUpdate } = renderHook(
      () => useLazyPendingIDSpecificOperation(),
      {
        wrapper: wrapper(testConfiguration.identity, testConfiguration.path),
      },
    )

    // we wait for the Ditto instance to load.
    await waitForNextUpdate()

    await result.current.exec(params)
    await waitFor(() => !!result.current.document, { timeout: 5000 })

    const allDocs = await result.current.collection.findAll().exec()

    expect(allDocs.length).to.eq(5)
  })
})
