import { Ditto, IdentityOfflinePlayground } from '@dittolive/ditto'
import { renderHook, waitFor } from '@testing-library/react'
import { expect } from 'chai'
import React, { ReactNode, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { DittoProvider } from '../DittoProvider'
import { useMutations } from '../mutations'
import { useCollections } from './useCollections'

const initOptions = {
  webAssemblyModule: '/base/node_modules/@dittolive/ditto/web/ditto.wasm',
}

const testIdentity: () => {
  identity: IdentityOfflinePlayground
  path: string
} = () => ({
  identity: {
    appID: 'useCollectionsSpec',
    siteID: 100,
    type: 'offlinePlayground',
  },
  path: uuidv4(),
})

const TestComponent = ({ path }: { path: string }) => {
  const { ditto, upsert } = useMutations({ path: path, collection: 'foo' })

  useEffect(() => {
    if (ditto) {
      upsert({ value: { document: 1 } })
    }
  }, [ditto, upsert])

  return <></>
}

const wrapper =
  (identity: IdentityOfflinePlayground, path: string) =>
  // eslint-disable-next-line react/display-name
  ({ children }: { children: ReactNode }) => (
    <DittoProvider
      setup={() => new Ditto(identity, path)}
      initOptions={initOptions}
    >
      {() => {
        return (
          <>
            <TestComponent path={path} />
            {children}
          </>
        )
      }}
    </DittoProvider>
  )

describe('useCollections tests', function () {
  it('should load all collections correctly', async () => {
    const testConfiguration = testIdentity()
    const params = { path: testConfiguration.path }
    const { result } = renderHook(() => useCollections(params), {
      wrapper: wrapper(testConfiguration.identity, testConfiguration.path),
    })
    await waitFor(() => expect(result.current.documents).not.to.be.empty, {
      timeout: 5000,
    })

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

  it('should cancel the subscription on unmount', async () => {
    const testConfiguration = testIdentity()
    const params = { path: testConfiguration.path }
    const { result, unmount } = renderHook(() => useCollections(params), {
      wrapper: wrapper(testConfiguration.identity, testConfiguration.path),
    })
    await waitFor(() => expect(result.current.documents).not.to.be.empty)

    unmount()

    await waitFor(
      () => expect(result.current.subscription.isCancelled).to.be.true,
    )
  })
})
