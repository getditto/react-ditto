import {
  Collection,
  Ditto,
  Document,
  LiveQuery,
  LiveQueryEvent,
  PendingCursorOperation,
  Subscription,
} from '@dittolive/ditto'
import { useEffect, useRef, useState } from 'react'

import { useDittoContext } from '../DittoContext.js'
import { LiveQueryParams } from './usePendingCursorOperation.js'

export interface LazyPendingCursorOperationReturn {
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
  /** Function used to trigger a query on a collection */
  exec: (params: LiveQueryParams) => Promise<void>
  /** Current Ditto collection instance. */
  collection: Collection | undefined
}

/**
 * Runs a ditto live query lazily, once the exec function is called with the passed in query params, Eg:
 *
 * @example
 * ```tsx
 *  const { documents, exec } = useLazyPendingCursorOperation<Webhook>()
 *
 *  const handleSomeEvent = () => {
 *    exec({
 *     path: myPath,
 *     offset: 0,
 *     collection: 'collection'
 *     sort: {
 *       propertyPath: 'createdAt',
 *       direction: 'descending' as SortDirection,
 *     },
 *   })
 *  }
 *
 * ```
 * @param params live query parameters.
 * @returns LazyPendingCursorOperationReturn
 */
export function useLazyPendingCursorOperation(): LazyPendingCursorOperationReturn {
  const { dittoHash, isLazy, load } = useDittoContext()
  const [documents, setDocuments] = useState<Document[]>([])
  const [liveQueryEvent, setLiveQueryEvent] = useState<
    LiveQueryEvent | undefined
  >()
  const liveQueryRef = useRef<LiveQuery>()
  const subscriptionRef = useRef<Subscription>()
  const [ditto, setDitto] = useState<Ditto>()
  const [collection, setCollection] = useState<Collection>()

  const createLiveQuery = async (params: LiveQueryParams) => {
    let nextDitto

    if (isLazy) {
      nextDitto = await load(params.path)
    } else {
      nextDitto = params.path
        ? dittoHash[params.path]
        : Object.values(dittoHash)[0]
    }

    if (nextDitto) {
      const nextCollection = nextDitto.store.collection(params.collection)
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
      setDitto(nextDitto)
    } else {
      return Promise.reject(
        new Error(
          `Could not load a Ditto instance${
            params.path ? ' for path ' + params.path : ''
          }.${
            !isLazy
              ? ' Make sure your provider finished loading the instance before you call exec'
              : ''
          }.`,
        ),
      )
    }
  }

  const exec = async (params: LiveQueryParams) => {
    liveQueryRef.current?.stop()
    liveQueryRef.current = undefined
    subscriptionRef.current?.cancel()
    subscriptionRef.current = undefined

    setDocuments([])
    setDitto(undefined)
    setLiveQueryEvent(undefined)
    setCollection(undefined)

    return createLiveQuery(params)
  }

  useEffect(() => {
    return () => {
      liveQueryRef.current?.stop()
      subscriptionRef.current?.cancel()
    }
  }, [])

  return {
    collection,
    ditto,
    documents,
    liveQueryEvent,
    exec,
    liveQuery: liveQueryRef.current,
    subscription: subscriptionRef.current,
  }
}
