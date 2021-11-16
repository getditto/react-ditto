import { Ditto, IdentityOfflinePlayground } from '@dittolive/ditto'
import { renderHook } from '@testing-library/react-hooks/dom'
import { expect } from 'chai'
import React, { ReactNode, useEffect } from 'react'
import { unmountComponentAtNode } from 'react-dom'
import { v4 as uuidv4 } from 'uuid'

import { DittoProvider } from '../DittoProvider'
import { useMutations } from '../mutations'
import { useCollections } from './useCollections'

const testIdentity: () => {
  identity: IdentityOfflinePlayground
  path: string
} = () => ({
  identity: {
    appName: 'useCollectionsSpec',
    siteID: 100,
    type: 'offlinePlayground',
  },
  path: uuidv4(),
})

describe('useCollections tests', function () {
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

  it('should load all collections correctly', async () => {
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
          insert({ value: { document: 1 } })
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

    const params = { path: testConfiguration.path }
    const { result, waitFor } = renderHook(() => useCollections(params), {
      wrapper,
    })
    await waitFor(() => !!result.current.documents?.length, { timeout: 5000 })

    expect(result.current.documents.length).to.eq(1)

    expect(
      result.current.documents.map((collection) => collection.name),
    ).to.eql(['foo'])

    expect(
      result.current.collectionsEvent.collections.map(
        (collection) => collection.name,
      ),
    ).to.eql(['foo'])
  })
})
