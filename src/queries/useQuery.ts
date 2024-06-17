import {
  Ditto,
  DQLQueryArguments,
  QueryResult,
  QueryResultItem,
  StoreObserver,
  SyncSubscription,
} from '@dittolive/ditto'
import { useCallback, useEffect, useRef, useState } from 'react'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { type DittoProvider } from '../DittoProvider.js'
import { useDitto } from '../useDitto.js'
import { useVersion } from './useVersion.js'

/**
 * Parameters for {@link useQuery}.
 *
 * @template T - The type of query arguments.
 */
export interface UseQueryParams<
  T extends DQLQueryArguments = DQLQueryArguments,
> {
  /**
   * The arguments to pass to the query.
   */
  queryArguments?: T
  /**
   * Whether to run the query locally only.
   *
   * Setting this to `true` will skip setting up a {@link SyncSubscription} that
   * syncs documents with remote peers. Consequently, the `syncSubscription`
   * property of the return value will be `undefined`.
   */
  localOnly?: boolean
  /**
   * A callback to run when an error occurs.
   *
   * @param error
   * @returns
   */
  onError?: (error: unknown) => void
  /**
   * Identifies the Ditto instance to use when multiple instances are registered
   * in the {@link DittoProvider}. Defaults to the first registered instance.
   *
   * See {@link Ditto.persistenceDirectory}.
   */
  persistenceDirectory?: string
}

/**
 * The return value of {@link useQuery}.
 *
 * @template T - The type of query result items.
 * @template U - The type of query arguments.
 */
export interface UseQueryReturn<T, U extends DQLQueryArguments> {
  /**
   * The Ditto instance used by this hook.
   */
  ditto: Ditto
  /**
   * The most recent error that occurred while setting up the query.
   *
   * Use the {@link UseQueryParams.onError | `onError`} callback parameter
   * to handle errors as they occur.
   */
  error: unknown
  /**
   * The items returned by the query.
   *
   * An empty array while `isLoading` is `true`.
   */
  items: QueryResultItem<T>[]
  /**
   * `true` during the initial setup of the query. Resetting the query with
   * {@link UseQueryReturn.reset | `reset`} will not set this back to `true` to
   * avoid flickering when used in UIs.
   */
  isLoading: boolean
  /**
   * Reset the state of this hook.
   *
   * This will cancel and reconfigure the {@link StoreObserver} and
   * {@link SyncSubscription}, and return `error` and `items` to their initial
   * `null` state.
   *
   * This does not set {@link UseQueryReturn.isLoading | `isLoading`} to `true`
   * during the reset process. However, the promise returned by this function
   * will resolve once the reset is complete.
   */
  reset: () => Promise<void>
  /**
   * The underlying Ditto {@link StoreObserver}.
   */
  storeObserver: StoreObserver<T, U>
  /**
   * The underlying Ditto {@link SyncSubscription}. This is `undefined` when the
   * {@link UseQueryParams.localOnly | `localOnly`} parameter is set to `true`.
   */
  syncSubscription?: SyncSubscription
}

/**
 * Continuously fetch results for the provided query.
 *
 * Configures both a {@link StoreObserver} and a {@link SyncSubscription} to
 * keep results up-to-date with local and remote changes.
 *
 *
 * @example
 * ```tsx
 * const { items } = useStoreObserver(
 *   'select * from tasks where _id = :id limit 10', {
 *     queryArguments: { id: '123' },
 *   }
 * )
 * ```
 *
 * @param query - The query to run. Must be a non-mutating query.
 * @param params - Additional parameters to configure how the query is run.
 * @template T - The type of query result items. Be aware that this is a
 * convenience type that is not checked against the query being run.
 * @template U - The type of query arguments.
 */
export function useQuery<
  // We default to any here and let the user specify the type if they want.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T = any,
  U extends DQLQueryArguments = DQLQueryArguments,
>(query: string, params?: UseQueryParams<U>): UseQueryReturn<T, U> {
  const { ditto } = useDitto(params?.persistenceDirectory)
  const [queryResult, setQueryResult] = useState<QueryResult<T>>()
  const [error, setError] = useState<unknown>(null)
  const [isLoading, setIsLoading] = useState(true)
  const storeObserverRef = useRef<StoreObserver<T, U>>()
  const syncSubscriptionRef = useRef<SyncSubscription>()
  const paramsVersion = useVersion(params)

  const reset = useCallback(async () => {
    const configureQuery = (onCompletion: () => void) => {
      if (!ditto) {
        return
      }

      storeObserverRef.current?.cancel()
      syncSubscriptionRef.current?.cancel()

      try {
        storeObserverRef.current = ditto.store.registerObserver<T, U>(
          query,
          (result) => {
            setQueryResult(result)
            onCompletion()
          },
          params?.queryArguments,
        )
      } catch (e: unknown) {
        setError(e)
        params?.onError?.(e)
      }

      if (!params?.localOnly) {
        try {
          syncSubscriptionRef.current = ditto.sync.registerSubscription(
            query,
            params?.queryArguments,
          )
        } catch (e: unknown) {
          setError(e)
          params?.onError?.(e)
        }
      }
    }

    setQueryResult(null)
    setError(null)
    return new Promise<void>((resolve) => {
      configureQuery(resolve)
    })

    // `paramsVersion` is not recognized by eslint as a required dependency but
    // ensures that the hook is reset when deep changes occur in `params`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ditto, paramsVersion, query])

  useEffect(() => {
    reset().then(() => setIsLoading(false))
    return () => {
      storeObserverRef.current?.cancel()
      syncSubscriptionRef.current?.cancel()
    }
  }, [ditto, paramsVersion, reset])

  return {
    ditto,
    error,
    items: queryResult?.items || [],
    isLoading,
    reset,
    storeObserver: storeObserverRef.current,
    syncSubscription: syncSubscriptionRef.current,
  }
}
