import {
  Collection,
  CollectionsEvent,
  Ditto,
  LiveQuery,
  SortDirection,
  Subscription,
} from '@dittolive/ditto'
import { useEffect, useRef, useState } from 'react'

import { useDitto } from '../useDitto'

export interface CollectionsQueryParams {
  /**
   * The path of the Ditto string. If you omit this, it will fetch the first registered Ditto value.
   */
  path?: string
  sort?: {
    /**
     * An optional sort parameter for your collections query. Allows sorting collections using the _id and names fields, in ascending
     * or descending order:
     *
     * ```js
     * {
     *   propertyPath: "name",
     *   direction: "ascending"
     * }
     * ```
     *
     * For descending values use:
     *
     * ```js
     * {
     *   propertyPath: "name",
     *   direction: "descending"
     * }
     * ```
     * For more information on the query string syntax refer to https://docs.ditto.live/concepts/querying
     */
    propertyPath: '_id' | 'name'
    direction?: SortDirection
  }
  /**
   * An optional number to limit the results of the collections query. If you omit this value, the query will return all values
   */
  limit?: number
}

/**
 * Runs a ditto live query on the collections collection. Eg:
 *
 *  const { documents } = useCollections({
 *     path: myPath,
 *     sort: {
 *       propertyPath: 'name',
 *       direction: 'descending' as SortDirection,
 *     },
 *     limit: 2
 *   })
 *
 * @param params collections query parameters.
 * @returns
 */
export function useCollections(params: CollectionsQueryParams): {
  ditto: Ditto
  documents: Collection[]
  collectionsEvent: CollectionsEvent | undefined // TODO use CollectionsEvent once it's exposed by the SDK
  liveQuery: LiveQuery | undefined
  subscription: Subscription | undefined
} {
  const { ditto } = useDitto(params.path)
  const [documents, setDocuments] = useState<Collection[]>([])
  const [collectionsEvent, setCollectionsEvent] = useState<
    CollectionsEvent | undefined
  >()
  const liveQueryRef = useRef<LiveQuery>()
  const subscriptionRef = useRef<Subscription>()

  useEffect(() => {
    if (ditto) {
      let cursor = ditto.store.collections()

      if (params.sort) {
        cursor = cursor.sort(params.sort.propertyPath, params.sort.direction)
      }
      if (params.limit) {
        cursor = cursor.limit(params.limit)
      }

      subscriptionRef.current = cursor.subscribe()
      liveQueryRef.current = cursor.observeLocal((event) => {
        setDocuments(event.collections || [])
        setCollectionsEvent(event)
      })
    } else {
      liveQueryRef.current?.stop()
      subscriptionRef.current?.cancel()
    }

    return () => {
      liveQueryRef.current?.stop()
      subscriptionRef.current?.cancel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    ditto,
    params.path,
    params.sort?.propertyPath,
    params.sort?.direction,
    params.limit,
  ])

  return {
    ditto,
    documents,
    collectionsEvent,
    liveQuery: liveQueryRef.current,
    subscription: subscriptionRef.current,
  }
}
