import { Ditto } from '@dittolive/ditto'
import { createContext } from 'react'

export interface DittoHash {
  [key: string]: unknown
}

export type RegisterDitto = (ditto: Ditto) => void
export type UnregisterDitto = (path: string) => void

export interface DittoContext {
  dittoHash: DittoHash
  registerDitto?: RegisterDitto
  unregisterDitto?: UnregisterDitto
}

export const DittoContext = createContext<DittoContext>({
  dittoHash: {},
})
