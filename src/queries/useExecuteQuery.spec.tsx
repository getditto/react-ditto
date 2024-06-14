import {
  Ditto,
  DittoError,
  IdentityOfflinePlayground,
  Logger,
} from '@dittolive/ditto'
import { renderHook, waitFor } from '@testing-library/react'
import { expect } from 'chai'
import React, { ReactNode, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { DittoLazyProvider } from '../DittoLazyProvider'
import { DittoProvider } from '../DittoProvider'
import { useMutations } from '../mutations'
import { waitForNextUpdate } from '../utils.spec'
import { useExecuteQuery } from './useExecuteQuery'

const testIdentity: () => {
  identity: IdentityOfflinePlayground
  persistenceDirectory: string
} = () => ({
  identity: {
    appID: 'useExecuteQuery',
    siteID: 100,
    type: 'offlinePlayground',
  },
  persistenceDirectory: uuidv4(),
})

type Data = {
  document: number
  category?: number
}

export const DocumentUpserter: React.FC<{ persistenceDirectory: string }> = ({
  persistenceDirectory,
}) => {
  const { ditto, upsert } = useMutations({
    path: persistenceDirectory,
    collection: 'foo',
  })

  useEffect(() => {
    if (ditto) {
      upsert({ value: { document: 1, category: 1 } })
      upsert({ value: { document: 2, category: 2 } })
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
  (
    identity: IdentityOfflinePlayground,
    persistenceDirectory: string,
    isLazy: boolean = false,
  ) =>
  // eslint-disable-next-line react/display-name
  ({ children }: { children: ReactNode }) => {
    const Provider = isLazy ? DittoLazyProvider : DittoProvider
    return (
      <Provider
        setup={async (lazyPersistenceDirectory?: string) => {
          Logger.minimumLogLevel = 'Warning'
          const ditto = new Ditto(
            identity,
            lazyPersistenceDirectory ?? persistenceDirectory,
          )
          await ditto.disableSyncWithV3()
          return ditto
        }}
        initOptions={initOptions}
      >
        {({ loading, error }) => {
          return (
            <>
              <DocumentUpserter persistenceDirectory={persistenceDirectory} />
              <div data-testid="loading">{`${loading}`}</div>
              <div data-testid="error">{error?.message}</div>
              {children}
            </>
          )
        }}
      </Provider>
    )
  }

describe.only('useExecuteQuery', function () {
  it('should only load items once the execution function is called', async () => {
    const testConfiguration = testIdentity()

    const { result } = renderHook(
      () =>
        useExecuteQuery<Data>('select * from foo', {
          persistenceDirectory: testConfiguration.persistenceDirectory,
        }),
      {
        wrapper: wrapper(
          testConfiguration.identity,
          testConfiguration.persistenceDirectory,
        ),
      },
    )

    // Wait for the Ditto instance to load
    await waitForNextUpdate(result)

    const [execute, { items, mutatedDocumentIDs, ditto, error, isLoading }] =
      result.current

    expect(items).to.be.undefined
    expect(mutatedDocumentIDs).to.be.undefined
    expect(ditto).to.be.undefined
    expect(error).to.be.null
    expect(isLoading).to.be.false

    await execute()
    await waitForNextUpdate(result)

    expect(result.current[1].items).to.have.length(5)
    expect(result.current[1].mutatedDocumentIDs).to.have.length(0)
    expect(result.current[1].error).to.be.null
    expect(result.current[1].isLoading).to.be.false
    expect(result.current[1].ditto).to.be.an.instanceOf(Ditto)
  })

  it('should load all documents correctly', async () => {
    const testConfiguration = testIdentity()

    const { result } = renderHook(
      () =>
        useExecuteQuery<Data>('select * from foo order by document asc', {
          persistenceDirectory: testConfiguration.persistenceDirectory,
        }),
      {
        wrapper: wrapper(
          testConfiguration.identity,
          testConfiguration.persistenceDirectory,
        ),
      },
    )

    await waitForNextUpdate(result)
    const [execute] = result.current
    await execute()
    await waitForNextUpdate(result)

    expect(result.current[1].items).to.have.length(5)

    for (let i = 1; i < 6; i++) {
      expect(result.current[1].items[i - 1].value.document).to.eq(i)
    }
  })

  it('should report errors correctly', async () => {
    const testConfiguration = testIdentity()

    const errorHandler = (error: Error) => {
      expect(error).to.be.an.instanceOf(DittoError)
    }

    const { result } = renderHook(
      () =>
        useExecuteQuery('not a query', {
          persistenceDirectory: testConfiguration.persistenceDirectory,
          onError: errorHandler,
        }),
      {
        wrapper: wrapper(
          testConfiguration.identity,
          testConfiguration.persistenceDirectory,
        ),
      },
    )

    const localErrorHandler = (error: Error) => {
      expect(error).to.be.an.instanceOf(DittoError)
    }

    await waitForNextUpdate(result)
    const [execute] = result.current
    await execute(undefined, localErrorHandler)
    await waitForNextUpdate(result)

    // items are null and not undefined because the query failed
    expect(result.current[1].items).to.be.null
    expect(result.current[1].error).to.be.an.instanceOf(DittoError)
    expect(result.current[1].isLoading).to.be.false
  })

  it('should use query arguments configured in the hook setup', async () => {
    const testConfiguration = testIdentity()

    const { result } = renderHook(
      () =>
        useExecuteQuery<Data>('select * from foo where document = :document', {
          persistenceDirectory: testConfiguration.persistenceDirectory,
          queryArguments: {
            document: 1,
          },
        }),
      {
        wrapper: wrapper(
          testConfiguration.identity,
          testConfiguration.persistenceDirectory,
        ),
      },
    )

    await waitForNextUpdate(result)
    const [execute] = result.current
    await execute()
    await waitForNextUpdate(result)

    expect(result.current[1].items).to.have.length(1)
    expect(result.current[1].items[0].value.document).to.eq(1)
  })

  it('should use query arguments configured in the execution function', async () => {
    const testConfiguration = testIdentity()

    const { result } = renderHook(
      () =>
        useExecuteQuery<Data>('select * from foo where document = :document', {
          persistenceDirectory: testConfiguration.persistenceDirectory,
        }),
      {
        wrapper: wrapper(
          testConfiguration.identity,
          testConfiguration.persistenceDirectory,
        ),
      },
    )

    await waitForNextUpdate(result)
    const [execute] = result.current
    await execute({ document: 2 })
    await waitForNextUpdate(result)

    expect(result.current[1].items).to.have.length(1)
    expect(result.current[1].items[0].value.document).to.eq(2)
  })

  it('should merge query arguments from the setup and the execution function', async () => {
    const testConfiguration = testIdentity()

    const { result } = renderHook(
      () =>
        useExecuteQuery<Data, Required<Data>>(
          'select * from foo where document = :document and category = :category',
          {
            persistenceDirectory: testConfiguration.persistenceDirectory,
            queryArguments: {
              document: 1,
              category: 2,
            },
          },
        ),
      {
        wrapper: wrapper(
          testConfiguration.identity,
          testConfiguration.persistenceDirectory,
        ),
      },
    )

    await waitForNextUpdate(result)
    const [selectByDocument] = result.current
    await selectByDocument({ document: 2 })
    await waitForNextUpdate(result)

    expect(result.current[1].items).to.have.length(1)
    expect(result.current[1].items[0].value.category).to.eq(2)
  })

  it('type generics should allow declaring the query arguments type while only providing query arguments to the execution function', async () => {
    const testConfiguration = testIdentity()

    const { result } = renderHook(
      () =>
        useExecuteQuery<Data, { document: number }>(
          'select * from foo where document = :document',
          {
            persistenceDirectory: testConfiguration.persistenceDirectory,
          },
        ),
      {
        wrapper: wrapper(
          testConfiguration.identity,
          testConfiguration.persistenceDirectory,
        ),
      },
    )

    await waitForNextUpdate(result)
    const [execute] = result.current
    await execute({ document: 1 })
  })

  it('should reject the execution function if an invalid Ditto instance is requested', async () => {
    const testConfiguration = testIdentity()

    const { result } = renderHook(
      () =>
        useExecuteQuery<Data>('select * from foo', {
          persistenceDirectory: 'non-existent',
        }),
      {
        wrapper: wrapper(
          testConfiguration.identity,
          testConfiguration.persistenceDirectory,
        ),
      },
    )

    await waitForNextUpdate(result)
    const [execute] = result.current
    try {
      await execute()
    } catch (e) {
      expect(e).to.be.an.instanceOf(Error)
      expect((e as Error).message).to.eq(
        'Provider does not have a loaded Ditto instance with persistence ' +
          'directory non-existent. Make sure your provider finished ' +
          'loading the instance before you call the execution function.',
      )
    }
  })

  it('should reject the execution function if the Ditto instance is not loaded yet', async () => {
    const testConfiguration = testIdentity()

    const { result } = renderHook(
      () =>
        useExecuteQuery<Data>('select * from foo', {
          persistenceDirectory: testConfiguration.persistenceDirectory,
        }),
      {
        wrapper: wrapper(
          testConfiguration.identity,
          testConfiguration.persistenceDirectory,
        ),
      },
    )
    // Here we don't wait for the Ditto instance to load.
    const [execute] = result.current
    try {
      await execute()
    } catch (e) {
      expect(e).to.be.an.instanceOf(Error)
      expect((e as Error).message).to.eq(
        'Provider does not have a loaded Ditto instance with persistence ' +
          'directory ' +
          testConfiguration.persistenceDirectory +
          '. Make sure your provider finished loading the instance before ' +
          'you call the execution function.',
      )
    }
  })

  describe.skip('using a lazy provider', function () {
    it('should load all documents correctly', async () => {
      const testConfiguration = testIdentity()

      const container = document.createElement('div')
      const { result } = renderHook(
        () =>
          useExecuteQuery<Data>('select * from foo', {
            persistenceDirectory: testConfiguration.persistenceDirectory,
          }),
        {
          wrapper: wrapper(
            testConfiguration.identity,
            testConfiguration.persistenceDirectory,
            true,
          ),
          baseElement: container,
        },
      )

      await waitFor(() =>
        expect(
          container.querySelector("div[data-testid='loading']").innerHTML,
        ).to.eq('false'),
      )

      console.log(`container: ${container.innerHTML}`)

      const [execute] = result.current
      await execute()
      await waitForNextUpdate(result)

      expect(result.current[1].items).to.have.length(5)
    })

    it('should reject the execution function if an invalid Ditto instance is requested', async () => {
      const testConfiguration = testIdentity()

      const { result } = renderHook(
        () =>
          useExecuteQuery<Data>('select * from foo', {
            persistenceDirectory: 'non-existent',
          }),
        {
          wrapper: wrapper(
            testConfiguration.identity,
            testConfiguration.persistenceDirectory,
            true,
          ),
        },
      )

      const [execute] = result.current
      try {
        await execute()
      } catch (e) {
        expect(e).to.be.an.instanceOf(Error)
        expect((e as Error).message).to.eq(
          'Provider does not have a loaded Ditto instance with persistence ' +
            'directory non-existent.',
        )
      }
    })
  })
})
