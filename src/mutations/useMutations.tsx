import {
  Document,
  DocumentID,
  DocumentValue,
  InsertOptions,
  PendingCursorOperation,
  PendingIDSpecificOperation,
  QueryArguments,
  UpdateResult,
  UpdateResultsMap,
} from '@dittolive/ditto'

import { useDitto } from '..'

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
  _id: unknown | DocumentID
  /**
   * The update function to perform on the specified document
   */
  updateClosure: (mutableDocument: T) => void
}

export type UpdateByIDFunction<T> = (
  params: UpdateByIDParams<T>,
) => Promise<UpdateResult[]>

export interface InsertParams<T> {
  value: T
  insertOptions?: InsertOptions
}

export type InsertFunction<T> = (params: InsertParams<T>) => Promise<DocumentID>

export interface RemoveParams {
  query?: string
  args?: QueryArguments
}

export type RemoveFunction = (params: RemoveParams) => Promise<DocumentID[]>

export interface RemoveByIDParams {
  _id: unknown | DocumentID
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

export function useMutations<T = Document>(
  useMutationParams: UseMutationParams,
): {
  update: UpdateFunction<T>
  updateByID: UpdateByIDFunction<T>
  insert: InsertFunction<T>
  remove: RemoveFunction
  removeByID: RemoveByIDFunction
} {
  const { ditto } = useDitto(useMutationParams.path)

  const update: UpdateFunction<T> = (params) => {
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
    }
    cursor = ditto.store.collection(useMutationParams.collection).findAll()
    return cursor.update((documents: T[]) => {
      params.updateClosure(documents)
    })
  }

  const updateByID: UpdateByIDFunction<T> = (params) => {
    const pendingIDSpecificOperation: PendingIDSpecificOperation = ditto.store
      .collection(useMutationParams.collection)
      .findByID(params._id)
    return pendingIDSpecificOperation.update((mutableDoc: T) => {
      params.updateClosure(mutableDoc)
    })
  }

  const insert: InsertFunction<T> = (params) => {
    return ditto.store
      .collection(useMutationParams.collection)
      .insert(params.value as unknown as DocumentValue, params.insertOptions)
  }

  const remove: RemoveFunction = (
    params: RemoveParams,
  ): Promise<DocumentID[]> => {
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
  }

  const removeByID: RemoveByIDFunction = (
    params: RemoveByIDParams,
  ): Promise<boolean> => {
    return ditto.store
      .collection(useMutationParams.collection)
      .findByID(params._id)
      .remove()
  }

  return {
    update,
    updateByID,
    insert,
    remove,
    removeByID,
  }
}
