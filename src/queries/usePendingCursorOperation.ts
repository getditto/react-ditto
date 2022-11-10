import {
  Collection,
  Ditto,
  Document,
  LiveQuery,
  LiveQueryEvent,
  PendingCursorOperation,
  QueryArguments,
  SortDirection,
  Subscription,
} from '@dittolive/ditto'
import { useEffect, useRef, useState } from 'react'

import { useDitto } from '../useDitto'
import { useVersion } from './useVersion'

export interface LiveQueryParams {
  collection: string
  /**
   * The path of the Ditto string. If you omit this, it will fetch the first registered Ditto value.
   */
  path?: string
  /**
   * A Ditto query string. For more information on the query string syntax refer to https://docs.ditto.live/concepts/querying
   * For example to query for a color property equal to red use:
   * `color == 'red'`
   */
  query?: string
  /**
   * Optional arguments that will interpolate the values into the `query` string. For example, if your query string is
   * ```
   * "color == $args.color && mileage >= $args.mileage"
   * ```. You can provide an args dictionary like:
   * ```js
   * { color: "red", mileage: "1200" }
   * ```
   */
  args?: QueryArguments
  sort?: {
    /**
     * An optional sort parameter for your query. For example, if you want to sort with ascending values on a specific field like `"createdOn"` use:
     *
     * ```js
     * {
     *   propertyPath: "createdOn",
     *   direction: "ascending"
     * }
     * ```
     *
     * For descending values use:
     *
     * ```js
     * {
     *   propertyPath: "createdOn",
     *   direction: "ascending"
     * }
     * ```
     * For more information on the query string syntax refer to https://docs.ditto.live/concepts/querying
     */
    propertyPath: string
    direction?: SortDirection
  }
  /**
   * An optional number to limit the results of the query. If you omit this value, the query will return all values
   */
  limit?: number
  /**
   * An optional number to use as an offset of the results of the query. If you omit this value, an offset of 0 is assumed.
   */
  offset?: number
  /** When true the query will only on local data mutations and will not rely on replication. */
  localOnly?: boolean
}

export interface PendingCursorOperationReturn {
  /** The initialized Ditto instance if one could be found for the provided path. */
  ditto: Ditto | null
  /** The set of documents found for the current query. */
  documents: Document[]
  /** The last LiveQueryEvent received by the query observer. */
  liveQueryEvent: LiveQueryEvent | undefined
  /** Currently active live query. */
  liveQuery: LiveQuery | undefined
  /** Currently active subscription. */
  subscription: Subscription | undefined
  /** A function used to stop the currect live query and create a new one using the current input params.*/
  reset: () => void
  /** Current Ditto collection instance. */
  collection: Collection | undefined
}

/**
 * Runs a ditto live query immediately with the passed in query params. Eg:
 *
 * @example
 * ```tsx
 *  const { documents } = usePendingCursorOperation<Webhook>({
 *     path: myPath,
 *     offset: 0,
 *     collection: 'collection'
 *     sort: {
 *       propertyPath: 'createdAt',
 *       direction: 'descending' as SortDirection,
 *     },
 *   })
 * ```
 * @param params live query parameters.
 * @returns
 */
export function usePendingCursorOperation(
  params: LiveQueryParams,
): PendingCursorOperationReturn {
  const { ditto } = useDitto(params.path)
  const [documents, setDocuments] = useState<Document[]>([])
  const [liveQueryEvent, setLiveQueryEvent] = useState<
    LiveQueryEvent | undefined
  >()
  const [collection, setCollection] = useState<Collection>()
  const liveQueryRef = useRef<LiveQuery>()
  const subscriptionRef = useRef<Subscription>()
  const paramsVersion = useVersion(params)

  const createLiveQuery = () => {
    if (ditto && !liveQueryRef.current) {
      const nextCollection = ditto.store.collection(params.collection)
      let cursor: PendingCursorOperation
      if (params.query) {
        cursor = nextCollection.find(params.query, params.args)
      } else {
        cursor = nextCollection.findAll()
      }
      if (params.sort) {
        cursor = cursor.sort(params.sort.propertyPath, params.sort.direction)
      }
      if (params.limit) {
        cursor = cursor.limit(params.limit)
      }
      if (params.offset) {
        cursor = cursor.offset(params.offset)
      }
      if (!params.localOnly) {
        subscriptionRef.current = cursor.subscribe()
      }

      liveQueryRef.current = cursor.observeLocal((docs, event) => {
        setDocuments(docs)
        setLiveQueryEvent(event)
      })
      setCollection(nextCollection)
    }
  }

  const handleResetLiveQuery = () => {
    liveQueryRef.current?.stop()
    liveQueryRef.current = undefined
    subscriptionRef.current?.cancel()
    subscriptionRef.current = undefined

    setCollection(null)
    setLiveQueryEvent(null)
    setDocuments([])

    createLiveQuery()
  }

  useEffect(() => {
    createLiveQuery()

    return () => {
      liveQueryRef.current?.stop()
      liveQueryRef.current = undefined
      subscriptionRef.current?.cancel()
      subscriptionRef.current = undefined
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ditto, paramsVersion])

  return {
    collection,
    ditto,
    documents,
    liveQueryEvent,
    liveQuery: liveQueryRef.current,
    subscription: subscriptionRef.current,
    reset: handleResetLiveQuery,
  }
}
