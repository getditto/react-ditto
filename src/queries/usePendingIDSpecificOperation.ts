import {
  Ditto,
  Document,
  DocumentID,
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
  _id: unknown | DocumentID
}

/**
 * Runs a ditto live query immediately with the passed in query params over a know document ID. As a result of
 * this the live query may return a the document with the ID passed in as a parameter, if it exists.
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
export function usePendingIDSpecificOperation<T = Document>(
  params: UsePendingIDSpecificOperationParams,
): {
  ditto: Ditto | null
  document: T | undefined
  event?: SingleDocumentLiveQueryEvent
  liveQuery: LiveQuery | undefined
} {
  const liveQueryRef = useRef<LiveQuery>()
  const { ditto } = useDitto(params.path)
  const [document, setDocument] = useState<T>()
  const [event, setEvent] = useState<SingleDocumentLiveQueryEvent>()

  useEffect(() => {
    let liveQuery: LiveQuery
    if (params._id && params.collection && ditto) {
      liveQuery = ditto.store
        .collection(params.collection)
        .findByID(params._id)
        .observe((doc: T, e) => {
          setEvent(e)
          setDocument(doc)
        })
    } else {
      setDocument(undefined)
      setEvent(undefined)
    }
    return () => {
      liveQuery?.stop()
    }
    /** We need to serialize the _id in order for React's dependency array comparison to work. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.path, params.collection, params._id?.toString() || '', ditto])

  return {
    ditto,
    document,
    event,
    liveQuery: liveQueryRef.current,
  }
}
