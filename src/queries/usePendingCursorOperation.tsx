import {
  Ditto,
  Document,
  LiveQuery,
  LiveQueryEvent,
  PendingCursorOperation,
  QueryArguments,
  SortDirection,
} from '@dittolive/ditto'
import { useEffect, useRef, useState } from 'react'

import { useDitto } from '../useDitto'

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
}

/**
 * Runs a ditto live query immediately with the passed in query params. We're using useEffect
 * to update the Ditto live query based on the input params. useEffect doesn't perform a deep equality
 * check on it's dependencies, so it's important to use `useMemo` when you create your params to avoid
 * unnecessary rerenders and infinite loops with useEffect. Eg:
 *
 * @example
 * ```tsx
 * const params = useMemo(
 *   () => ({
 *     path: myPath,
 *     offset: 0,
 *     collection: 'collection'
 *     sort: {
 *       propertyPath: 'createdAt',
 *       direction: 'descending' as SortDirection,
 *     },
 *   }),
 *   [myPath],
 *  )
 *  const { documents } = usePendingCursorOperation<Webhook>(params)
 * ```
 * @param params live query parameters.
 * @returns
 */
export function usePendingCursorOperation<T = Document>(
  params: LiveQueryParams,
): {
  ditto: Ditto | null
  documents: T[]
  liveQueryEvent: LiveQueryEvent | undefined
  liveQuery: LiveQuery | undefined
} {
  const { ditto } = useDitto(params.path)
  const [documents, setDocuments] = useState<T[]>([])
  const [liveQueryEvent, setLiveQueryEvent] = useState<
    LiveQueryEvent | undefined
  >()
  const liveQueryRef = useRef<LiveQuery>()

  useEffect(() => {
    if (ditto && !liveQueryRef.current) {
      const collection = ditto.store.collection(params.collection)
      let cursor: PendingCursorOperation
      if (params.query) {
        cursor = collection.find(params.query, params.args)
      } else {
        cursor = collection.findAll()
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
      liveQueryRef.current = cursor.observe((docs, event) => {
        setDocuments(docs)
        setLiveQueryEvent(event)
      })

      return (): void => {
        liveQueryRef.current?.stop()
        liveQueryRef.current = null
      }
    }
  }, [ditto, params])

  return {
    ditto,
    documents,
    liveQueryEvent,
    liveQuery: liveQueryRef.current,
  }
}
