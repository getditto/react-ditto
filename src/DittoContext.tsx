import { Ditto } from '@dittolive/ditto'
import { createContext, useContext, useEffect, useState } from 'react'

export interface DittoHash {}

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
