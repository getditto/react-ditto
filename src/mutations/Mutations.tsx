import {
  Ditto,
  Document,
  DocumentID,
  DocumentValue,
  InsertOptions,
  PendingCursorOperation,
  PendingIDSpecificOperation,
  Store,
  UpdateResult,
  UpdateResultsMap,
} from "@dittolive/ditto";
import { useDitto } from "..";

/**
 * Parameters for {@link useMutation} hook. These parameters are _optional_.
 * 
 * @example
 * 
 * ```ts
 * const { update } = useMutations();
 * ```
 * 
 * 
 * If you have registered multiple {@link Ditto} instances you can specify a `path` in the parameters
 *  
 * ```ts
 * const { update } = useMutations({ path: '/foo })
 * ```
 */
export interface UseMutationsParams {
  /**
   * If you have multiple {@link Ditto} instances, you can specify a path to use for this mutation hook.
   */
  path?: string;
}

export type PendingCursorOperationResolver = (
  store: Store
) => PendingCursorOperation;
export type UpdateClosure<T = Document> = (documents: T[]) => void;

export type PendingIDSpecificOperationResolver = (
  store: Store
) => PendingIDSpecificOperation;
export type UpdateByIDClosure<T = Document> = (document: T | undefined) => void;

/**
 * Updates a document by a query
 * 
 * @example
 * 
 * To update cars with a property that is equal to "Ford" and set its "color" property to "red"
 * 
 * ```ts
 * const { update } = useMutation()
 * update((store) => store.collection('cars').find('make == $args.make', { make: "Ford" }), (mutableDoc) => {
 *  mutableDoc?.color = "red"
 * })
 * ```
 */
export type UpdateMutationFunction<T = Document> = (
  resolver: PendingCursorOperationResolver,
  updateClosure: UpdateClosure<T>
) => Promise<UpdateResultsMap>;

/**
 * Updates a document by it's DocumentID
 * 
 * @example
 * 
 * To update a car with an `_id == '123abc'` and set its `mileage` property to `53000`
 * 
 * ```ts
 * const { updateByID } = useMutation()
 * updateByID((store) => store.collection('cars').findByID("123abc"), (mutableDoc) => {
 *  mutableDoc?.mileage = 53000
 * })
 * ```
 */
export type UpdateByIDMutationFunction<T = Document> = (
  resolver: PendingIDSpecificOperationResolver,
  updateClosure: UpdateByIDClosure<T>
) => Promise<UpdateResult[]>;

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
export type RemoveMutationFunction = (
  pendingCursorResolver: PendingCursorOperationResolver
) => Promise<DocumentID[]>;

/**
 * 
 */
export type RemoveByIDMutationFunction = (
  pendingCursorResolver: PendingIDSpecificOperationResolver
) => Promise<boolean>;

/**
 * Insert a document into a collection
 */
export type InsertFunction<V = DocumentValue> = (
  collection: string,
  value: V,
  insertOptions?: InsertOptions
) => Promise<DocumentID>;

/**
 * @example
 
 * ```js
 * 
 * const { update, updateByID, remove, removeByID, insert } = useMutations();
 * ```
 * ```js
 * interface Car {
 *  _id: DocumentID,
 *  
 * }
 * 
 * const { update, updateByID, remove, removeByID, insert } = useMutations<Car>();
 * ```
 * 
 * A hook for inserting, updating and removing documents from {@link Ditto}
 * @param param Parameters to execute the mutation
 */
export function useMutations<T = Document>(
  param: UseMutationsParams
): {
  update: UpdateMutationFunction<T>;
  updateByID: UpdateByIDMutationFunction<T>;
  remove: RemoveMutationFunction;
  removeByID: RemoveByIDMutationFunction;
  insert: InsertFunction;
} {
  const { ditto } = useDitto(param.path);

  const update: UpdateMutationFunction<T> = (resolver, updateClosure) => {
    const cursor = resolver(ditto.store);
    return cursor.update((documents: T[]) => {
      updateClosure(documents);
    });
  };

  const updateByID: UpdateByIDMutationFunction<T> = (
    resolver,
    updateClosure
  ) => {
    const cursor = resolver(ditto.store);
    return cursor.update((document: T) => {
      updateClosure(document);
    });
  };

  const remove: RemoveMutationFunction = (
    resolver: PendingCursorOperationResolver
  ): Promise<DocumentID[]> => {
    const cursor = resolver(ditto.store);
    return cursor.remove();
  };

  const removeByID: RemoveByIDMutationFunction = (
    resolver: PendingIDSpecificOperationResolver
  ) => {
    const cursor = resolver(ditto.store);
    return cursor.remove();
  };

  const insert: InsertFunction = (collection, value, insertOptions) => {
    return ditto.store.collection(collection).insert(value, insertOptions);
  };

  return {
    update,
    updateByID,
    remove,
    removeByID,
    insert,
  };
}
