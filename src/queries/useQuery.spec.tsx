import { Ditto, IdentityOfflinePlayground } from '@dittolive/ditto'
import { renderHook, waitFor } from '@testing-library/react'
import { expect } from 'chai'
import React, { ReactNode, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { DittoProvider } from '../DittoProvider'
import { useMutations } from '../mutations'
import { useQuery, UseQueryParams } from './useQuery'

const testIdentity: () => {
  identity: IdentityOfflinePlayground
  persistenceDirectory: string
} = () => ({
  identity: {
    appID: 'usePendingCursorOperationSpec',
    siteID: 100,
    type: 'offlinePlayground',
  },
  persistenceDirectory: uuidv4(),
})

export const DocumentUpserter: React.FC<{ persistenceDirectory: string }> = ({
  persistenceDirectory,
}) => {
  const { ditto, upsert } = useMutations({
    path: persistenceDirectory,
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
  (identity: IdentityOfflinePlayground, persistenceDirectory: string) =>
  // eslint-disable-next-line react/display-name
  ({ children }: { children: ReactNode }) => (
    <DittoProvider
      setup={() => {
        const ditto = new Ditto(identity, persistenceDirectory)
        return ditto
      }}
      initOptions={initOptions}
    >
      {() => {
        return (
          <>
            <DocumentUpserter persistenceDirectory={persistenceDirectory} />
            {children}
          </>
        )
      }}
    </DittoProvider>
  )

describe('useQuery', function () {
  it('should load all documents correctly', async () => {
    const testConfiguration = testIdentity()

    const { result } = renderHook(
      () =>
        useQuery('select * from foo', {
          persistenceDirectory: testConfiguration.persistenceDirectory,
        }),
      {
        wrapper: wrapper(
          testConfiguration.identity,
          testConfiguration.persistenceDirectory,
        ),
      },
    )
    await waitFor(() => expect(result.current.items).not.to.be.empty, {
      timeout: 5000,
    })

    expect(result.current.syncSubscription).to.exist
    expect(result.current.items.length).to.eq(5)

    for (let i = 1; i < 6; i++) {
      expect(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        !!result.current.items.find((item) => item.value.document === i),
      ).to.eq(true)
    }
  })

  it('should load all documents correctly observing only for local data', async () => {
    const testConfiguration = testIdentity()

    const params: UseQueryParams = {
      persistenceDirectory: testConfiguration.persistenceDirectory,
      localOnly: true,
    }
    const { result } = renderHook(() => useQuery('select * from foo', params), {
      wrapper: wrapper(
        testConfiguration.identity,
        testConfiguration.persistenceDirectory,
      ),
    })
    await waitFor(() => expect(result.current.items).not.to.be.empty, {
      timeout: 5000,
    })

    expect(result.current.syncSubscription).to.be.undefined
    expect(result.current.items.length).to.eq(5)

    for (let i = 1; i < 6; i++) {
      expect(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        !!result.current.items.find((doc) => doc.value.document === i),
      ).to.eq(true)
    }
  })

  it('should load documents correctly using a query', async () => {
    const testConfiguration = testIdentity()

    const params: UseQueryParams = {
      persistenceDirectory: testConfiguration.persistenceDirectory,
    }
    const { result } = renderHook(
      () => useQuery('select * from foo where document > 3', params),
      {
        wrapper: wrapper(
          testConfiguration.identity,
          testConfiguration.persistenceDirectory,
        ),
      },
    )
    await waitFor(() => expect(result.current.items).not.to.be.empty, {
      timeout: 5000,
    })

    expect(result.current.items.length).to.eq(2)

    for (let i = 4; i < 6; i++) {
      expect(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        !!result.current.items.find((doc) => doc.value.document === i),
      ).to.eq(true)
    }
  })

  it('should correctly reset the current store observer and create a new one when the reset function is called.', async () => {
    const config = testIdentity()

    const { result } = renderHook(
      () =>
        useQuery('select * from foo where document > 3', {
          persistenceDirectory: config.persistenceDirectory,
        }),
      {
        wrapper: wrapper(config.identity, config.persistenceDirectory),
      },
    )
    await waitFor(() => expect(result.current.items).not.to.be.empty, {
      timeout: 5000,
    })

    expect(result.current.items.length).to.eq(2)

    const storeObserverBeforeReset = result.current.storeObserver

    const promisedReset = result.current.reset()

    expect(result.current.isLoading).to.be.false
    await promisedReset

    expect(result.current.storeObserver).not.to.eq(storeObserverBeforeReset)
    expect(storeObserverBeforeReset.isCancelled).to.be.true
    await waitFor(
      () => {
        expect(result.current.items).to.have.lengthOf(2)
      },
      { timeout: 5000 },
    )
  })

  it('should cancel the current sync subscription when the reset function is called.', async () => {
    const config = testIdentity()

    const { result } = renderHook(
      () =>
        useQuery('select * from foo where document > 3', {
          persistenceDirectory: config.persistenceDirectory,
        }),
      {
        wrapper: wrapper(config.identity, config.persistenceDirectory),
      },
    )
    await waitFor(() => expect(result.current.items).to.have.lengthOf(2))
    const subscriptionBeforeReset = result.current.syncSubscription

    await result.current.reset()

    expect(subscriptionBeforeReset.isCancelled).to.be.true
  })

  it('should provide errors from invalid queries on the return value and via the error callback', async () => {
    const config = testIdentity()

    const handleErrors = (error: Error) => {
      expect(error).to.exist
    }

    const { result } = renderHook(
      () =>
        useQuery('not a query', {
          persistenceDirectory: config.persistenceDirectory,
          onError: handleErrors,
        }),
      {
        wrapper: wrapper(config.identity, config.persistenceDirectory),
      },
    )

    await waitFor(() => expect(result.current.error).to.exist)
  })
})
