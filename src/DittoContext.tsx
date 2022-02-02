import { Ditto } from '@dittolive/ditto'
import { createContext, useContext } from 'react'

export interface DittoHash {
  [key: string]: Ditto
}

export type RegisterDitto = (ditto: Ditto) => void
export type UnregisterDitto = (path: string) => void

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
