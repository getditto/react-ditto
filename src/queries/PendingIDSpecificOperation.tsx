import {
  Document,
  DocumentID,
  LiveQuery,
  SingleDocumentLiveQueryEvent,
} from '@dittolive/ditto'
import { useEffect, useState } from 'react'

import { useDitto } from '../DittoContext'

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
  _id?: unknown | DocumentID
}

export function usePendingIDSpecificOperation<T = Document>(
  params: UsePendingIDSpecificOperationParams,
): { document: T | undefined; event?: SingleDocumentLiveQueryEvent } {
  const { ditto } = useDitto(params.path)
  const [document, setDocument] = useState<T>(undefined)
  const [event, setEvent] = useState<SingleDocumentLiveQueryEvent | undefined>()
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
  }, [params, ditto])

  return {
    document,
    event,
  }
}
