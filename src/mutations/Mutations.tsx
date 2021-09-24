import { Collection, dittoBridge, DocumentID, PendingCursorOperation, PendingIDSpecificOperation, Store, UpdateResult, UpdateResultsMap } from "@dittolive/ditto";
import React from "react";
import { useDitto } from "..";

export interface UseMutationsParams {
  /**
   * The path of the Ditto instance to execute the mutation
   */
  path?: string;
}

export type PendingCursorOperationResolver = (store: Store) => PendingCursorOperation
export type UpdateClosure<T = Document> = (documents: T[]) => void;

export type PendingIDSpecificOperationResolver = (store: Store) => PendingIDSpecificOperation
export type UpdateByIDClosure<T = Document> = (document: T | undefined) => void;

/**
 * A hook for inserting, updating and removing documents from {@link Ditto}
 * @param param Parameters to execute the mutation 
 */
export function useMutations<T = Document>(param: UseMutationsParams) {
  const { ditto } = useDitto(param.path);
  function update<T = Document>(resolver: PendingCursorOperationResolver, updateClosure: UpdateClosure<T>): Promise<UpdateResultsMap> {
    const cursor = resolver(ditto.store);
    return cursor.update((documents: T[]) => {
      updateClosure(documents);
    })
  }
  
  function updateByID<T = Document>(resolver: PendingIDSpecificOperationResolver, updateClosure: UpdateByIDClosure<T>): Promise<UpdateResult[]> {
    const cursor = resolver(ditto.store);
    return cursor.update((document: T | undefined) => {
      updateClosure(document);
    })
  }
  
  async function removeByID(resolver: PendingIDSpecificOperationResolver): Promise<boolean> {
    const cursor = resolver(ditto.store);
    return cursor.remove();
  }
  
  /**
   * Removes documents from a query via a {@link PendingCursorOperation}
   * @example
   * To remove all red cars from the "cars" collection:
   * 
   * ```ts
   * remove((store) => store.collection('cars').find(`color == $args.color`, { color: "red" }))
   * ```
   * 
   * @param resolver A function to resolve a {@link PendingCursorOperationResolver}
   * @returns The documents that were removed from the local instance. It will be an array of {@link DocumentID}.
   */
  async function remove(resolver: PendingCursorOperationResolver): Promise<DocumentID[]> {
    const cursor = resolver(ditto.store);
    return cursor.remove();
  }
  
  return {
    update,
    updateByID,
    
    removeByID
  }
}
