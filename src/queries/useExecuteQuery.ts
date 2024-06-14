import {
  Ditto,
  DocumentID,
  QueryArguments as DittoQueryArguments,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type QueryResult,
  QueryResultItem,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type SyncSubscription,
} from '@dittolive/ditto'
import { useCallback, useState } from 'react'

import { useDittoContext } from '../DittoContext.js'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { DittoProvider } from '../DittoProvider.js'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { useQuery } from './useQuery.js'
import { useVersion } from './useVersion.js'

/**
 * Parameters for {@link useExecuteQuery}.
 *
 * @template T - The type of query arguments.
 */
export interface UseExecuteQueryParams<
  T extends DittoQueryArguments = DittoQueryArguments,
> {
  /**
   * The arguments to pass to the query.
   */
  queryArguments?: T
  /**
   * A callback to run when an error occurs.
   *
   * @param error The error that occurred during query execution.
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
 * Execute the query with the given arguments.
 *
 * This function is returned by {@link useExecuteQuery}. Optionally takes an
 * `onError` callback to handle errors specifically for this query execution.
 *
 * To avoid overly complex types, query arguments are allowed to be partial.
 * However, if you pass partial query arguments when setting up the hook, you
 * must pass complete query arguments when calling the execution function.
 *
 * @param queryArguments Any arguments to pass to the query. Will be merged with
 * parameters set up when the hook was created. See
 * {@link UseExecuteQueryParams.queryArguments}.
 * @param onError A callback to run when an error occurs.
 * @template T - The type of query arguments.
 * @returns A promise that resolves when the query has been executed. The
 * results of the query can be accessed through the hook's return value.
 */
export type ExecutionFunction<T> = (
  queryArguments?: Partial<T>,
  onError?: (error: unknown) => void,
) => Promise<void>

/**
 * Return value of {@link useExecuteQuery}.
 *
 * @template T - The type of the items returned by the query. Be aware that this
 * is a convenience type that is not checked against the query being run.
 * @template U - The type of query arguments.
 */
export type UseExecuteQueryReturn<
  T,
  U extends DittoQueryArguments = DittoQueryArguments,
> = [
  ExecutionFunction<U>,
  {
    /**
     * The Ditto instance used by this hook.
     */
    ditto: Ditto
    /**
     * The most recent error that resulted from query execution
     *
     * Use the {@link UseExecuteQueryParams.onError | `onError`} callback
     * parameter when setting up the hook or the `onError` parameter of
     * {@link UseExecuteQueryReturn.0 | the execution function} to handle errors
     * as they occur.
     */
    error: unknown
    /**
     * The items returned by the query.
     *
     * `undefined` when the query has not been executed yet, the hook has been
     * reset, or an error occurred.
     */
    items?: QueryResultItem<T>[]

    /**
     * `true` while a call to the execution function is pending. Resetting the
     * query with {@link reset} will not set this back to `true` to avoid
     * flickering when used in UIs.
     */
    isLoading: boolean
    /**
     * Reset the state of this hook.
     *
     * This will return `error`, `items`, and `mutatedDocumentIDs` to their
     * initial `null` state.
     *
     * This does not set `isLoading` to `true` during the reset process.
     */
    reset: () => void
    /**
     * IDs of documents that were mutated _locally_ by the execution function.
     * Empty array if no documents have been mutated.
     *
     * See {@link QueryResult.mutatedDocumentIDs}.
     */
    mutatedDocumentIDs?: DocumentID[]
  },
]

/**
 * Provides an _execution function_ that can be used to run the given query.
 *
 * This hook does not run the query immediately and does not set up a sync
 * subscription. Use this hook for running mutating queries and ad-hoc queries
 * in response to user actions. Be aware that mutations will not be synced to
 * other peers unless you also set up a {@link SyncSubscription} for the same
 * query, which can be done with a {@link useQuery} hook.
 *
 * Query arguments can be supplied when setting up the hook and when calling the
 * execution function. When query arguments contain the same key in both places,
 * a shallow merge is performed, with the arguments passed to the execution
 * function taking precedence. Below is an example of how to use this feature.
 *
 * To avoid overly complex types, partial query arguments are only allowed on
 * the execution function. This means that the query arguments passed when
 * setting up the hook must be complete.
 *
 * Errors that occur during query execution are stored in the `error` property
 * of the return value and are reset on each subsequent execution. You can also
 * provide an `onError` callback in the hook parameters or when calling the
 * execution function to handle errors as they occur.
 *
 * @example Basic Usage
 * ```tsx
 * const [insertTask] = useExecuteQuery(
 *  'insert into tasks documents (:task)',
 *   {
 *     queryArguments: { task: { description: 'Buy milk' } },
 *   },
 * )
 * ```
 * @example Merging query arguments
 * ```tsx
 * const [executeQuery] = useExecuteQuery(
 *   'insert into tasks documents (:task)',
 *   {
 *     queryArguments: { task: { author: 'Alice' } },
 *   },
 * )
 *
 * // Clicking the button will execute the query with query arguments
 * // `{ task: { author: 'Alice', description: 'Buy milk' } }`.
 * return <button
 *  onClick={() => executeQuery({ task: { description: 'Buy milk' } })}
 * >Add Task</button>
 * ```
 *
 * @param query - The query to run. Must be a non-mutating query.
 * @param params - Additional parameters to configure how the query is run.
 * @template T - The type of the items returned by the query. Be aware that this
 * is a convenience type that is not checked against the query being run.
 * @template U - The type of query arguments.
 */
export function useExecuteQuery<
  // We want this to allow for any query arguments.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T = any,
  U extends DittoQueryArguments = DittoQueryArguments,
>(
  query: string,
  params?: UseExecuteQueryParams<U>,
): UseExecuteQueryReturn<T, U> {
  const { queryArguments, onError, persistenceDirectory } = params ?? {}
  const { dittoHash, isLazy, load } = useDittoContext()
  const paramsVersion = useVersion(params)

  const [ditto, setDitto] = useState<Ditto>()
  const [error, setError] = useState<unknown>(null)
  const [items, setItems] = useState<QueryResultItem[]>()
  const [isLoading, setIsLoading] = useState(false)
  const [mutatedDocumentIDs, setMutatedDocumentIDs] = useState<DocumentID[]>()

  const execute = useCallback(
    async (
      localQueryArguments?: Partial<U>,
      localOnError?: (error: unknown) => void,
    ) => {
      setItems(null)
      setMutatedDocumentIDs(null)
      setIsLoading(true)
      setError(null)

      let nextDitto: Ditto | undefined
      if (isLazy) {
        nextDitto = (await load(persistenceDirectory)) as Ditto
        console.log(`nextDitto: ${nextDitto?.persistenceDirectory}`)
      } else {
        nextDitto = dittoHash[persistenceDirectory ?? Object.keys(dittoHash)[0]]
      }

      if (nextDitto == null) {
        throw new Error(
          `Provider does not have a loaded Ditto instance${
            persistenceDirectory
              ? ` with persistence directory ${persistenceDirectory}.`
              : '.'
          }${
            !isLazy
              ? ' Make sure your provider finished loading the instance before ' +
                'you call the execution function.'
              : ''
          }`,
        )
      }
      setDitto(nextDitto)

      const finalQueryArguments: U = {} as U
      if (queryArguments) {
        Object.assign(finalQueryArguments, queryArguments)
      }

      if (localQueryArguments) {
        Object.assign(finalQueryArguments, localQueryArguments)
      }

      try {
        const result = await nextDitto.store.execute(query, finalQueryArguments)
        setItems(result.items)
        setMutatedDocumentIDs(result.mutatedDocumentIDs())
      } catch (e: unknown) {
        setError(e)
        onError?.(e)
        localOnError?.(e)
      } finally {
        setIsLoading(false)
      }
    },

    // ESlint does not recognize `paramsVersion` as a dependency but it should
    // be as it ensures that deep changes in `queryArguments` trigger a re-run
    // of the hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      dittoHash,
      isLazy,
      load,
      onError,
      paramsVersion,
      persistenceDirectory,
      query,
      queryArguments,
    ],
  )

  const reset = useCallback(() => {
    setError(null)
    setItems(undefined)
    setMutatedDocumentIDs(null)
  }, [])

  return [
    execute,
    {
      ditto,
      error,
      isLoading,
      items,
      mutatedDocumentIDs,
      reset,
    },
  ]
}
