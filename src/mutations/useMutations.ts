import {
  Ditto,
  DocumentID,
  DocumentIDValue,
  DocumentValue,
  MutableDocument,
  PendingCursorOperation,
  PendingIDSpecificOperation,
  QueryArguments,
  UpdateResult,
  UpdateResultsMap,
  UpsertOptions,
} from '@dittolive/ditto'
import { useCallback } from 'react'

import { useDitto } from '../useDitto'

export interface UpdateParams {
  /**
   * A Ditto query that specifies the documents to update. If this is omitted, then the `updateClosure` will
   * apply to _all documents_.
   */
  query?: string
  /**
   * Arguments to use with the `query`
   */
  args?: QueryArguments
  /**
   * A function used to update all the documents
   */
  updateClosure: (mutableDocuments: MutableDocument[]) => void
}

export type UpdateFunction = (params: UpdateParams) => Promise<UpdateResultsMap>

export interface UpdateByIDParams {
  /**
   * The _id of the document to remove
   */
  // The `DocumentIDValue` type needs to be narrowed in @dittolive/ditto
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  _id: DocumentID | DocumentIDValue
  /**
   * The update function to perform on the specified document
   */
  updateClosure: (mutableDocument: MutableDocument) => void
}

export type UpdateByIDFunction = (
  params: UpdateByIDParams,
) => Promise<UpdateResult[]>

export interface UpsertParams {
  value: DocumentValue
  upsertOptions?: UpsertOptions
}

export type UpsertFunction = (params: UpsertParams) => Promise<DocumentID>

export interface RemoveParams {
  query?: string
  args?: QueryArguments
}

export type RemoveFunction = (params: RemoveParams) => Promise<DocumentID[]>

export interface RemoveByIDParams {
  _id?: DocumentID
}

export type RemoveByIDFunction = (params: RemoveByIDParams) => Promise<boolean>

export interface UseMutationParams {
  /**
   * An optional path of the ditto instance that you'd like to use
   */
  path?: string
  /**
   * The name of the collection
   */
  collection: string
}

export function useMutations(useMutationParams: UseMutationParams): {
  ditto: Ditto
  update: UpdateFunction
  updateByID: UpdateByIDFunction
  upsert: UpsertFunction
  remove: RemoveFunction
  removeByID: RemoveByIDFunction
} {
  const { ditto } = useDitto(useMutationParams.path)

  const update: UpdateFunction = useCallback(
    (params) => {
      let cursor: PendingCursorOperation
      if (params.query) {
        if (params.args) {
          cursor = ditto.store
            .collection(useMutationParams.collection)
            .find(params.query, params.args)
        } else {
          cursor = ditto.store
            .collection(useMutationParams.collection)
            .find(params.query)
        }
      } else {
        cursor = ditto.store.collection(useMutationParams.collection).findAll()
      }
      return cursor.update(params.updateClosure)
    },
    [ditto, useMutationParams.collection],
  )

  const updateByID: UpdateByIDFunction = useCallback(
    (params) => {
      const pendingIDSpecificOperation: PendingIDSpecificOperation = ditto.store
        .collection(useMutationParams.collection)
        .findByID(params._id)
      return pendingIDSpecificOperation.update((mutableDoc) => {
        params.updateClosure(mutableDoc)
      })
    },
    [ditto, useMutationParams.collection],
  )

  const upsert: UpsertFunction = useCallback(
    (params) => {
      return ditto.store
        .collection(useMutationParams.collection)
        .upsert(params.value, params.upsertOptions)
    },
    [ditto, useMutationParams.collection],
  )

  const remove: RemoveFunction = useCallback(
    (params: RemoveParams): Promise<DocumentID[]> => {
      let cursor: PendingCursorOperation
      if (params.query) {
        if (params.args) {
          cursor = ditto.store
            .collection(useMutationParams.collection)
            .find(params.query, params.args)
        } else {
          cursor = ditto.store
            .collection(useMutationParams.collection)
            .find(params.query)
        }
      } else {
        cursor = ditto.store.collection(useMutationParams.collection).findAll()
      }
      return cursor.remove()
    },
    [ditto, useMutationParams.collection],
  )

  const removeByID: RemoveByIDFunction = useCallback(
    (params: RemoveByIDParams): Promise<boolean> => {
      return ditto.store
        .collection(useMutationParams.collection)
        .findByID(params._id)
        .remove()
    },
    [ditto, useMutationParams.collection],
  )

  return {
    ditto,
    update,
    updateByID,
    upsert,
    remove,
    removeByID,
  }
}
