import { Ditto, init, InitOptions } from '@dittolive/ditto'
import React, {
  ReactElement,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react'

import { DittoContext } from './DittoContext.js'
import { DittoHash, RegisterDitto, UnregisterDitto } from './index.js'

export type RenderFunction = (providerState: ProviderState) => ReactNode

export interface DittoProviderProps {
  initOptions?: InitOptions
  /**
   * This function is called when the DittoProvider initialized the Ditto module.
   * Use this function to bootstrap the Ditto instance to the provider.
   *
   * Returns a single Ditto instance or an array of instances.
   */
  setup: () => Ditto | Ditto[] | Promise<Ditto | Ditto[]>
  render?: RenderFunction
  children?: RenderFunction
}

/**
 * A description of the {@link DittoProvider}'s loading state.
 */
export interface ProviderState {
  /**
   * If the Provider is loading the ditto.wasm file.
   */
  loading: boolean
  /**
   * If there was an error loading the ditto.wasm file, the error will have an {@link Error}
   */
  error: Error | undefined
}

/**
 * Implements an eager Ditto provider where all Ditto instances are initialized when the
 * provider is mounted through a call to the setup function, which then returns one or multiple
 * Ditto instances.
 * @param props
 * @returns A function that needs to return a React.Element
 */
export const DittoProvider: React.FunctionComponent<DittoProviderProps> = (
  props,
): ReactElement => {
  const [providerState, setProviderState] = useState<ProviderState>({
    loading: true,
    error: undefined,
  })
  const [dittoHash, setDittoHash] = useState<DittoHash>({})
  const hasMountEffectStarted = useRef(false)

  useEffect(() => {
    if (hasMountEffectStarted.current) {
      return
    }

    ;(async function () {
      hasMountEffectStarted.current = true
      try {
        await init(props.initOptions)
        const setupReturnValue: Ditto | Ditto[] = await props.setup()
        if (Array.isArray(setupReturnValue)) {
          const dittoHash: DittoHash = {}
          const dittos: Ditto[] = setupReturnValue
          for (const ditto of dittos) {
            if (!(ditto instanceof Ditto)) {
              throw new Error(
                // Type is `never` because correct use never reaches this point

                `expected an array of Ditto instances to be returned by the setup function, but at least one element is not a Ditto instance (got ${ditto})`,
              )
            }
            dittoHash[ditto.persistenceDirectory] = ditto
          }
          setDittoHash(dittoHash)
        } else {
          const ditto = setupReturnValue
          if (!(ditto instanceof Ditto)) {
            throw new Error(
              // Type is `never` because correct use never reaches this point

              `expected a Ditto instance to be returned by the setup function, but got ${ditto}`,
            )
          }
          const dittoHash: DittoHash = {}
          dittoHash[ditto.persistenceDirectory] = ditto
          setDittoHash(dittoHash)
        }
        setProviderState({
          error: undefined,
          loading: false,
        })
      } catch (err: unknown) {
        setProviderState({
          error: err instanceof Error ? err : undefined,
          loading: false,
        })
        setDittoHash({})
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const renderFunction: RenderFunction | undefined =
    props.render || props.children
  let children: ReactNode = <></>
  if (renderFunction) {
    children = renderFunction(providerState)
  }

  const registerDitto: RegisterDitto = (ditto) => {
    const hash = { ...dittoHash }
    hash[ditto.persistenceDirectory] = ditto
    setDittoHash(hash)
  }

  const unregisterDitto: UnregisterDitto = (persistenceDirectory) => {
    const hash = { ...dittoHash }
    delete hash[persistenceDirectory]
    setDittoHash(hash)
  }

  return (
    <DittoContext.Provider
      value={{
        dittoHash: dittoHash,
        registerDitto,
        unregisterDitto,
        load: () =>
          Promise.reject(
            'Async loading can only be done using a DittoLazyProvider.',
          ),
        isLazy: false,
      }}
    >
      {children}
    </DittoContext.Provider>
  )
}
