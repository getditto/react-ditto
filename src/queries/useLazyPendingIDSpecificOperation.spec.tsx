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

  it('should load a document by ID correctly', async () => {
    const testConfiguration = testIdentity()
    const initOptions = {
      webAssemblyModule: '/base/node_modules/@dittolive/ditto/web/ditto.wasm',
    }

    const TestComponent: React.FC = () => {
      const { ditto, insert } = useMutations<unknown>({
        path: testConfiguration.path,
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
      }, [ditto, insert])

      return <></>
    }

    const wrapper = ({ children }: { children: ReactNode }) => (
      <DittoProvider
        setup={() => {
          const ditto = new Ditto(
            testConfiguration.identity,
            testConfiguration.path,
          )
          return ditto
        }}
        initOptions={initOptions}
      >
        {() => {
          return (
            <>
              <TestComponent />
              {children}
            </>
          )
        }}
      </DittoProvider>
    )

    const params: UsePendingIDSpecificOperationParams = {
      path: testConfiguration.path,
      collection: 'foo',
      _id: new DocumentID('someId'),
    }
    const { result, waitFor, waitForNextUpdate } = renderHook(
      () => useLazyPendingIDSpecificOperation(),
      {
        wrapper,
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
})
