import { Ditto } from '@dittolive/ditto'
import { createContext, useContext } from 'react'

export interface DittoHash {
  [key: string]: Ditto
}

export type RegisterDitto = (ditto: Ditto) => void
export type UnregisterDitto = (persistenceDirectory: string) => void

/**
 * Computes the key under which a Ditto instance is registered in the provider's
 * {@link DittoHash}.
 *
 * Uses the persistence directory configured on the instance — matching the
 * value a consumer passes to {@link useDitto} or a hook's `persistenceDirectory`
 * option — and falls back to the resolved absolute directory when none was set.
 */
export const dittoInstanceKey = (ditto: Ditto): string =>
  ditto.config.persistenceDirectory ?? ditto.absolutePersistenceDirectory

export interface DittoContextProps {
  dittoHash: DittoHash
  registerDitto?: RegisterDitto
  unregisterDitto?: UnregisterDitto
  /**
   * Provided only by the DittoLazyProvider. Will fail on the non-lazy DittoContext provider.
   * */
  load: (appPath: string) => Promise<Ditto | void>
  /** True if the context is initialized through a DittoLazyProvider. */
  isLazy: boolean
}

export const DittoContext = createContext<DittoContextProps>({
  dittoHash: {},
  load: () => Promise.resolve(),
  isLazy: false,
})

export const useDittoContext = (): DittoContextProps => {
  const dittoContext = useContext(DittoContext)
  if (!dittoContext)
    throw new Error('useDittoContext must be called within a DittoProvider tag')
  return dittoContext
}
