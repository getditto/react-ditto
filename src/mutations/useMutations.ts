import {
  Ditto,
  DocumentIDValue,
  DocumentLike,
  DocumentValue,
  PendingCursorOperation,
  PendingIDSpecificOperation,
  QueryArguments,
  UpdateResult,
  UpdateResultsMap,
  UpsertOptions,
} from '@dittolive/ditto'
import { useCallback } from 'react'

import { useDitto } from '../useDitto'

export interface UpdateParams<T> {
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
  updateClosure: (mutableDocuments: T[]) => void
}

export type UpdateFunction<T> = (
  params: UpdateParams<T>,
) => Promise<UpdateResultsMap>

export interface UpdateByIDParams<T> {
  /**
   * The _id of the document to remove
   */
  _id: DocumentIDValue
  /**
   * The update function to perform on the specified document
   */
  updateClosure: (mutableDocument: T) => void
}

export type UpdateByIDFunction<T> = (
  params: UpdateByIDParams<T>,
) => Promise<UpdateResult[]>

export interface UpsertParams<T> {
  value: T
  upsertOptions?: UpsertOptions
}

export type UpsertFunction<T> = (
  params: UpsertParams<T>,
) => Promise<DocumentIDValue>

export interface RemoveParams {
  query?: string
  args?: QueryArguments
}

export type RemoveFunction = (
  params: RemoveParams,
) => Promise<DocumentIDValue[]>

export interface RemoveByIDParams {
  _id: unknown | DocumentIDValue
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

export function useMutations<T = DocumentLike>(
  useMutationParams: UseMutationParams,
): {
  ditto: Ditto
  update: UpdateFunction<T>
  updateByID: UpdateByIDFunction<T>
  upsert: UpsertFunction<T>
  remove: RemoveFunction
  removeByID: RemoveByIDFunction
} {
  const { ditto } = useDitto(useMutationParams.path)

  const update: UpdateFunction<T> = useCallback(
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

  const updateByID: UpdateByIDFunction<T> = useCallback(
    (params) => {
      const pendingIDSpecificOperation: PendingIDSpecificOperation = ditto.store
        .collection(useMutationParams.collection)
        .findByID(params._id)
      return pendingIDSpecificOperation.update((mutableDoc: T) => {
        params.updateClosure(mutableDoc)
      })
    },
    [ditto, useMutationParams.collection],
  )

  const upsert: UpsertFunction<T> = useCallback(
    (params) => {
      return ditto.store
        .collection(useMutationParams.collection)
        .upsert(params.value as unknown as DocumentValue, params.upsertOptions)
    },
    [ditto, useMutationParams.collection],
  )

  const remove: RemoveFunction = useCallback(
    (params: RemoveParams): Promise<DocumentIDValue[]> => {
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
