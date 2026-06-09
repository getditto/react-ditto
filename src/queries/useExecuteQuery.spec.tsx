import { Ditto, DittoError } from '@dittolive/ditto'
import { renderHook, waitFor } from '@testing-library/react'
import { AssertionError, expect } from 'chai'
import { ReactNode } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { DittoLazyProvider } from '../DittoLazyProvider'
import { DittoProvider } from '../DittoProvider'
import {
  openSeededDitto,
  waitForNextUpdate,
  wasmInitOptions,
} from '../utils.spec'
import { useExecuteQuery } from './useExecuteQuery'

const testConfig: () => {
  databaseID: string
  persistenceDirectory: string
} = () => ({
  databaseID: 'useExecuteQuery',
  persistenceDirectory: uuidv4(),
})

type Data = {
  document: number
  category?: number
}

// Creates a wrapper component for each test
const wrapper =
  (databaseID: string, persistenceDirectory: string, isLazy: boolean = false) =>
  // eslint-disable-next-line react/display-name
  ({ children }: { children: ReactNode }) => {
    const Provider = isLazy ? DittoLazyProvider : DittoProvider
    return (
      <Provider
        setup={(lazyPersistenceDirectory?: string) =>
          openSeededDitto(
            databaseID,
            lazyPersistenceDirectory ?? persistenceDirectory,
          )
        }
        initOptions={wasmInitOptions}
      >
        {({ loading, error }) => {
          return (
            <>
              <div data-testid="loading">{`${loading}`}</div>
              <div data-testid="error">{error?.message}</div>
              {children}
            </>
          )
        }}
      </Provider>
    )
  }

describe('useExecuteQuery', function () {
  it('should only load items once the execution function is called', async () => {
    const config = testConfig()

    const { result } = renderHook(
      () =>
        useExecuteQuery<Data>('select * from foo', {
          persistenceDirectory: config.persistenceDirectory,
        }),
      {
        wrapper: wrapper(config.databaseID, config.persistenceDirectory),
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
    const config = testConfig()

    const { result } = renderHook(
      () =>
        useExecuteQuery<Data>('select * from foo order by document asc', {
          persistenceDirectory: config.persistenceDirectory,
        }),
      {
        wrapper: wrapper(config.databaseID, config.persistenceDirectory),
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
    const config = testConfig()

    const errorHandler = (error: Error) => {
      expect(error).to.be.an.instanceOf(DittoError)
    }

    const { result } = renderHook(
      () =>
        useExecuteQuery('not a query', {
          persistenceDirectory: config.persistenceDirectory,
          onError: errorHandler,
        }),
      {
        wrapper: wrapper(config.databaseID, config.persistenceDirectory),
      },
    )

    const localErrorHandler = (error: Error) => {
      expect(error).to.be.an.instanceOf(DittoError)
    }

    await waitForNextUpdate(result)
    const [execute] = result.current
    await execute(undefined, localErrorHandler)
    await waitForNextUpdate(result)

    // items stay undefined because the query failed; the error is surfaced
    // through `error` instead.
    expect(result.current[1].items).to.be.undefined
    expect(result.current[1].error).to.be.an.instanceOf(DittoError)
    expect(result.current[1].isLoading).to.be.false
  })

  it('should use query arguments configured in the hook setup', async () => {
    const config = testConfig()

    const { result } = renderHook(
      () =>
        useExecuteQuery<Data>('select * from foo where document = :document', {
          persistenceDirectory: config.persistenceDirectory,
          queryArguments: {
            document: 1,
          },
        }),
      {
        wrapper: wrapper(config.databaseID, config.persistenceDirectory),
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
    const config = testConfig()

    const { result } = renderHook(
      () =>
        useExecuteQuery<Data>('select * from foo where document = :document', {
          persistenceDirectory: config.persistenceDirectory,
        }),
      {
        wrapper: wrapper(config.databaseID, config.persistenceDirectory),
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
    const config = testConfig()

    const { result } = renderHook(
      () =>
        useExecuteQuery<Data, Required<Data>>(
          'select * from foo where document = :document and category = :category',
          {
            persistenceDirectory: config.persistenceDirectory,
            queryArguments: {
              document: 1,
              category: 2,
            },
          },
        ),
      {
        wrapper: wrapper(config.databaseID, config.persistenceDirectory),
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
    const config = testConfig()

    const { result } = renderHook(
      () =>
        useExecuteQuery<Data, { document: number }>(
          'select * from foo where document = :document',
          {
            persistenceDirectory: config.persistenceDirectory,
          },
        ),
      {
        wrapper: wrapper(config.databaseID, config.persistenceDirectory),
      },
    )

    await waitForNextUpdate(result)
    const [execute] = result.current
    await execute({ document: 1 })
  })

  it('should reject the execution function if an invalid Ditto instance is requested', async () => {
    const config = testConfig()

    const { result } = renderHook(
      () =>
        useExecuteQuery<Data>('select * from foo', {
          persistenceDirectory: 'non-existent',
        }),
      {
        wrapper: wrapper(config.databaseID, config.persistenceDirectory),
      },
    )

    await waitForNextUpdate(result)
    const [execute] = result.current
    try {
      await execute()
      expect.fail('execute() should reject when the instance does not exist')
    } catch (e) {
      if (e instanceof AssertionError) throw e
      expect(e).to.be.an.instanceOf(Error)
      expect((e as Error).message).to.eq(
        'Provider does not have a loaded Ditto instance with persistence ' +
          'directory non-existent. Make sure your provider finished ' +
          'loading the instance before you call the execution function.',
      )
    }
  })

  it('should reject the execution function if the Ditto instance is not loaded yet', async () => {
    const config = testConfig()

    const { result } = renderHook(
      () =>
        useExecuteQuery<Data>('select * from foo', {
          persistenceDirectory: config.persistenceDirectory,
        }),
      {
        wrapper: wrapper(config.databaseID, config.persistenceDirectory),
      },
    )
    // Here we don't wait for the Ditto instance to load.
    const [execute] = result.current
    try {
      await execute()
      expect.fail('execute() should reject before the instance has loaded')
    } catch (e) {
      if (e instanceof AssertionError) throw e
      expect(e).to.be.an.instanceOf(Error)
      expect((e as Error).message).to.eq(
        'Provider does not have a loaded Ditto instance with persistence ' +
          'directory ' +
          config.persistenceDirectory +
          '. Make sure your provider finished loading the instance before ' +
          'you call the execution function.',
      )
    }
  })

  describe('using a lazy provider', function () {
    it('should load all documents correctly', async () => {
      const config = testConfig()

      const container = document.createElement('div')
      const { result } = renderHook(
        () =>
          useExecuteQuery<Data>('select * from foo', {
            persistenceDirectory: config.persistenceDirectory,
          }),
        {
          wrapper: wrapper(
            config.databaseID,
            config.persistenceDirectory,
            true, // isLazy
          ),
          baseElement: container,
        },
      )

      await waitFor(() =>
        expect(
          container.querySelector("div[data-testid='loading']").innerHTML,
        ).to.eq('false'),
      )

      const [execute] = result.current
      await execute()
      await waitForNextUpdate(result)

      expect(result.current[1].items).to.have.length(5)
    })

    it('should reject the execution function if an invalid Ditto instance is requested', async () => {
      // A lazy provider whose setup declines to create an instance for the
      // requested path (returns null), so the execution function rejects.
      const nullWrapper = ({ children }: { children: ReactNode }) => (
        <DittoLazyProvider
          setup={() => Promise.resolve(null)}
          initOptions={wasmInitOptions}
        >
          {() => <>{children}</>}
        </DittoLazyProvider>
      )

      const { result } = renderHook(
        () =>
          useExecuteQuery<Data>('select * from foo', {
            persistenceDirectory: 'non-existent',
          }),
        { wrapper: nullWrapper },
      )

      const [execute] = result.current
      try {
        await execute()
        expect.fail('execute() should reject when setup returns no instance')
      } catch (e) {
        if (e instanceof AssertionError) throw e
        expect(e).to.be.an.instanceOf(Error)
        expect((e as Error).message).to.eq(
          'Provider does not have a loaded Ditto instance with persistence ' +
            'directory non-existent.',
        )
      }
    })
  })
})
