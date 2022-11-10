import {
  Collection,
  Ditto,
  Document,
  LiveQuery,
  SingleDocumentLiveQueryEvent,
  Subscription,
} from '@dittolive/ditto'
import { useEffect, useRef, useState } from 'react'

import { useDittoContext } from '../DittoContext'
import { UsePendingIDSpecificOperationParams } from './usePendingIDSpecificOperation'

export interface LazyPendingIDSpecificOperationReturn {
  /** The initialized Ditto instance if one could be found for the provided path. */
  ditto: Ditto | null
  /** The document found for the current query. */
  document: Document | undefined
  /** The last SingleDocumentLiveQueryEvent received by the query observer. */
  event?: SingleDocumentLiveQueryEvent
  /** Currently active live query. */
  liveQuery: LiveQuery | undefined
  /** Currently active live query. */
  subscription: Subscription | undefined
  /** Current Ditto collection instance. */
  collection: Collection | undefined
  /** Function used to trigger a query on a collection */
  exec: (params: UsePendingIDSpecificOperationParams) => Promise<void>
}

/**
 * Runs a ditto live query lazily, once the exec function is called with the passed in query params, over a know document ID.
 * As a result of this the live query may return a document with the ID passed in as a parameter, if it exists.
 *
 * @example
 * ```tsx
 *  const { document, exec } = useLazyPendingIDSpecificOperation<Webhook>()
 *
 *
 *  const handleSomeEvent = () => {
 *    exec({
 *     path: myPath,
 *     collection: 'collection'
 *     _id: new DocumentID("some_id")
 *   })
 *  }
 * ```
 * @param params live query parameters.
 * @returns LazyPendingIDSpecificOperationReturn
 */
export function useLazyPendingIDSpecificOperation(): LazyPendingIDSpecificOperationReturn {
  const { dittoHash, isLazy, load } = useDittoContext()
  const liveQueryRef = useRef<LiveQuery>()
  const subscriptionRef = useRef<Subscription>()
  const [ditto, setDitto] = useState<Ditto>()
  const [document, setDocument] = useState<Document>()
  const [collection, setCollection] = useState<Collection>()
  const [event, setEvent] = useState<SingleDocumentLiveQueryEvent>()

  const createLiveQuery = async (
    params: UsePendingIDSpecificOperationParams,
  ) => {
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
      const pendingOperation = nextCollection.findByID(params._id)

      if (!params.localOnly) {
        subscriptionRef.current = pendingOperation.subscribe()
      }

      liveQueryRef.current = pendingOperation.observeLocal((doc, e) => {
        setEvent(e)
        setDocument(doc)
      })
      setDitto(nextDitto)
      setCollection(nextCollection)
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

  const exec = async (params: UsePendingIDSpecificOperationParams) => {
    liveQueryRef.current?.stop()
    liveQueryRef.current = undefined
    subscriptionRef.current?.cancel()
    subscriptionRef.current = undefined

    setDocument(undefined)
    setDitto(undefined)
    setEvent(undefined)
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
    document,
    event,
    exec,
    liveQuery: liveQueryRef.current,
    subscription: subscriptionRef.current,
  }
}
