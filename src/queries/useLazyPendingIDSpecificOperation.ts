import {
  Collection,
  Ditto,
  DocumentLike,
  LiveQuery,
  SingleDocumentLiveQueryEvent,
} from '@dittolive/ditto'
import { useContext, useRef, useState } from 'react'

import { DittoContext } from '../DittoContext'
import { UsePendingIDSpecificOperationParams } from './usePendingIDSpecificOperation'

export interface LazyPendingIDSpecificOperationReturn<T> {
  /** The initialized Ditto instance if one could be found for the provided path. */
  ditto: Ditto | null
  /** The documents found for the current query. */
  document: T | undefined
  /** The last SingleDocumentLiveQueryEvent received by the query observer. */
  event?: SingleDocumentLiveQueryEvent
  /** Currently active live query. */
  liveQuery: LiveQuery | undefined
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
export function useLazyPendingIDSpecificOperation<
  T = DocumentLike,
>(): LazyPendingIDSpecificOperationReturn<T> {
  const { dittoHash, isLazy, load } = useContext(DittoContext)
  const liveQueryRef = useRef<LiveQuery>()
  const [ditto, setDitto] = useState<Ditto>()
  const [document, setDocument] = useState<T>()
  const [collection, setCollection] = useState<Collection>()
  const [event, setEvent] = useState<SingleDocumentLiveQueryEvent>()

  const createLiveQuery = async (
    params: UsePendingIDSpecificOperationParams,
  ) => {
    let nextDitto

    if (isLazy) {
      nextDitto = await load(params.path)
    } else {
      nextDitto = !!params.path
        ? dittoHash[params.path]
        : Object.values(dittoHash)[0]
    }

    if (nextDitto) {
      const nextCollection = nextDitto.store.collection(params.collection)
      liveQueryRef.current = nextCollection
        .findByID(params._id)
        .observe((doc: T, e) => {
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
    if (liveQueryRef.current) {
      liveQueryRef.current.stop()
      liveQueryRef.current = null
    }
    setDocument(undefined)
    setDitto(undefined)
    setEvent(undefined)
    setCollection(undefined)

    return createLiveQuery(params)
  }

  return {
    collection,
    ditto,
    document,
    event,
    liveQuery: liveQueryRef.current,
    exec,
  }
}
