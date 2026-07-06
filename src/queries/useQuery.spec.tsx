import { DittoError } from '@dittolive/ditto'
import { renderHook, waitFor } from '@testing-library/react'
import { expect } from 'chai'
import { ReactNode } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { DittoProvider } from '../DittoProvider'
import { openSeededDitto, wasmInitOptions } from '../utils.spec'
import { useQuery, UseQueryParams } from './useQuery'

const testConfig: () => {
  databaseID: string
  persistenceDirectory: string
} = () => ({
  databaseID: 'useQuerySpec',
  persistenceDirectory: uuidv4(),
})

// Creates a wrapper component for each test
const wrapper =
  (databaseID: string, persistenceDirectory: string) =>
  // eslint-disable-next-line react/display-name
  ({ children }: { children: ReactNode }) => (
    <DittoProvider
      setup={() => openSeededDitto(databaseID, persistenceDirectory)}
      initOptions={wasmInitOptions}
    >
      {() => {
        return <>{children}</>
      }}
    </DittoProvider>
  )

describe('useQuery', function () {
  it('should load all documents correctly', async () => {
    const config = testConfig()

    const { result } = renderHook(
      () =>
        useQuery('select * from foo', {
          persistenceDirectory: config.persistenceDirectory,
        }),
      {
        wrapper: wrapper(config.databaseID, config.persistenceDirectory),
      },
    )
    await waitFor(() => expect(result.current.items).not.to.be.empty, {
      timeout: 5000,
    })

    expect(result.current.syncSubscription).to.exist
    expect(result.current.items.length).to.eq(5)

    for (let i = 1; i < 6; i++) {
      expect(
        !!result.current.items.find((item) => item.value.document === i),
      ).to.eq(true)
    }
  })

  it('should load all documents correctly observing only for local data', async () => {
    const config = testConfig()

    const params: UseQueryParams = {
      persistenceDirectory: config.persistenceDirectory,
      localOnly: true,
    }
    const { result } = renderHook(() => useQuery('select * from foo', params), {
      wrapper: wrapper(config.databaseID, config.persistenceDirectory),
    })
    await waitFor(() => expect(result.current.items).not.to.be.empty, {
      timeout: 5000,
    })

    expect(result.current.syncSubscription).to.be.undefined
    expect(result.current.items.length).to.eq(5)

    for (let i = 1; i < 6; i++) {
      expect(
        !!result.current.items.find((doc) => doc.value.document === i),
      ).to.eq(true)
    }
  })

  it('should load documents correctly using a query', async () => {
    const config = testConfig()

    const params: UseQueryParams = {
      persistenceDirectory: config.persistenceDirectory,
    }
    const { result } = renderHook(
      () => useQuery('select * from foo where document > 3', params),
      {
        wrapper: wrapper(config.databaseID, config.persistenceDirectory),
      },
    )
    await waitFor(() => expect(result.current.items).not.to.be.empty, {
      timeout: 5000,
    })

    expect(result.current.items.length).to.eq(2)

    for (let i = 4; i < 6; i++) {
      expect(
        !!result.current.items.find((doc) => doc.value.document === i),
      ).to.eq(true)
    }
  })

  it('should correctly reset the current store observer and create a new one when the reset function is called.', async () => {
    const config = testConfig()

    const { result } = renderHook(
      () =>
        useQuery('select * from foo where document > 3', {
          persistenceDirectory: config.persistenceDirectory,
        }),
      {
        wrapper: wrapper(config.databaseID, config.persistenceDirectory),
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

    await waitFor(
      () =>
        expect(result.current.storeObserver).not.to.eq(
          storeObserverBeforeReset,
        ),
      { timeout: 5000 },
    )
    expect(storeObserverBeforeReset.isCancelled).to.be.true
    await waitFor(
      () => {
        expect(result.current.items).to.have.lengthOf(2)
      },
      { timeout: 5000 },
    )
  })

  it('should cancel the current sync subscription when the reset function is called.', async () => {
    const config = testConfig()

    const { result } = renderHook(
      () =>
        useQuery('select * from foo where document > 3', {
          persistenceDirectory: config.persistenceDirectory,
        }),
      {
        wrapper: wrapper(config.databaseID, config.persistenceDirectory),
      },
    )
    await waitFor(() => expect(result.current.items).to.have.lengthOf(2))
    const subscriptionBeforeReset = result.current.syncSubscription

    await result.current.reset()

    expect(subscriptionBeforeReset.isCancelled).to.be.true
  })

  it('should provide errors from invalid queries on the return value and via the error callback', async () => {
    const config = testConfig()

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
        wrapper: wrapper(config.databaseID, config.persistenceDirectory),
      },
    )

    await waitFor(() => expect(result.current.error).to.exist)
  })

  it('keeps a working observer when the subscription query is rejected under v5', async () => {
    const config = testConfig()

    const { result } = renderHook(
      () =>
        // `ORDER BY`/`LIMIT` are valid to observe but rejected by
        // `registerSubscription` under v5's `DQL_RESTRICT_SUBSCRIPTION`.
        useQuery('select * from foo order by document limit 3', {
          persistenceDirectory: config.persistenceDirectory,
          // Swallow the expected subscription failure so it is not logged.
          onError: () => {},
        }),
      {
        wrapper: wrapper(config.databaseID, config.persistenceDirectory),
      },
    )

    await waitFor(() => expect(result.current.items).not.to.be.empty, {
      timeout: 5000,
    })

    // The observer succeeded and is serving data...
    expect(result.current.items).to.have.lengthOf(3)
    // ...so the rejected subscription must not have set the error state.
    expect(result.current.error).to.be.null
    // The subscription itself failed to register.
    expect(result.current.syncSubscription).to.be.undefined
  })

  it('registers the subscription with subscriptionQuery when provided', async () => {
    const config = testConfig()

    const { result } = renderHook(
      () =>
        useQuery('select * from foo order by document limit 3', {
          persistenceDirectory: config.persistenceDirectory,
          subscriptionQuery: 'select * from foo',
        }),
      {
        wrapper: wrapper(config.databaseID, config.persistenceDirectory),
      },
    )

    await waitFor(() => expect(result.current.items).not.to.be.empty, {
      timeout: 5000,
    })

    expect(result.current.items).to.have.lengthOf(3)
    // The unrestricted subscriptionQuery registers cleanly, no error.
    expect(result.current.error).to.be.null
    expect(result.current.syncSubscription).to.exist
  })

  it('has the expected failure mode when used with a mutating query', async () => {
    const config = testConfig()

    const { result } = renderHook(
      () =>
        useQuery('insert into foo documents (:value)', {
          persistenceDirectory: config.persistenceDirectory,
          queryArguments: { value: { document: 10 } },
          // The mutating query is expected to fail; handle the error so the
          // hook does not log it to the console during the test run.
          onError: () => {},
        }),
      {
        wrapper: wrapper(config.databaseID, config.persistenceDirectory),
      },
    )

    await waitFor(() =>
      expect((result.current.error as DittoError).code).to.equal(
        'query/unsupported',
      ),
    )
  })
})
