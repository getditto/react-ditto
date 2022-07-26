import {
  Collection,
  Ditto,
  Document,
  DocumentIDValue,
  LiveQuery,
  SingleDocumentLiveQueryEvent,
} from '@dittolive/ditto'
import { useEffect, useRef, useState } from 'react'

import { useDitto } from '../useDitto'

export interface UsePendingIDSpecificOperationParams {
  /**
   * The path
   */
  path?: string
  /**
   * The name of the collection to query
   */
  collection: string
  /**
   * The _id of the document to query
   */
  _id: DocumentIDValue
  /**
   * When true the query will only on local data mutations and will not rely on replication.
   * */
  localOnly?: boolean
}

export interface PendingIDSpecificOperationReturn {
  /** The initialized Ditto instance if one could be found for the provided path. */
  ditto: Ditto | null
  /** The document found for the current query. */
  document: Document | undefined
  /** The last SingleDocumentLiveQueryEvent received by the query observer. */
  event?: SingleDocumentLiveQueryEvent
  /** Currently active live query. */
  liveQuery: LiveQuery | undefined
  /** Current Ditto collection instance. */
  collection: Collection | undefined
}

/**
 * Runs a ditto live query immediately with the passed in query params over a know document ID. As a result of
 * this the live query may return a the document with the ID passed in as a parameter, if it exists.
 *
 * @example
 * ```tsx
 *  const { document } = usePendingIDSpecificOperation<Webhook>({
 *     path: myPath,
 *     collection: 'collection'
 *     _id: new DocumentID("some_id")
 *   })
 * ```
 * @param params live query parameters.
 * @returns PendingIDSpecificOperationReturn
 */
export function usePendingIDSpecificOperation(
  params: UsePendingIDSpecificOperationParams,
): PendingIDSpecificOperationReturn {
  const liveQueryRef = useRef<LiveQuery>()
  const { ditto } = useDitto(params.path)
  const [document, setDocument] = useState<Document>()
  const [collection, setCollection] = useState<Collection>()
  const [event, setEvent] = useState<SingleDocumentLiveQueryEvent>()

  useEffect(() => {
    if (params._id && params.collection && ditto) {
      const nextCollection = ditto.store.collection(params.collection)

      if (!!params.localOnly) {
        liveQueryRef.current = nextCollection
          .findByID(params._id)
          .observeLocal((doc, e) => {
            setEvent(e)
            setDocument(doc)
          })
      } else {
        liveQueryRef.current = nextCollection
          .findByID(params._id)
          .observe((doc, e) => {
            setEvent(e)
            setDocument(doc)
          })
      }
      setCollection(nextCollection)
    } else {
      setDocument(undefined)
      setCollection(undefined)
      setEvent(undefined)
    }
    return () => {
      liveQueryRef.current?.stop()
    }
    /** We need to serialize the _id in order for React's dependency array comparison to work. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.path, params.collection, params._id || '', ditto])

  return {
    collection,
    ditto,
    document,
    event,
    liveQuery: liveQueryRef.current,
  }
}
