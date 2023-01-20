import { Ditto, Observer, Peer } from '@dittolive/ditto'
import { useEffect, useState } from 'react'

import { useDitto } from '../useDitto'

export interface UsePeersParams {
  /**
   * Ditto Path
   */
  path?: string
}

/**
 * Returns all the connected peers for this client.
 * @param params live query parameters.
 * @returns
 */
export function useRemotePeers(params: UsePeersParams = {}): {
  ditto: Ditto
  remotePeers: Peer[]
} {
  const { ditto } = useDitto(params.path)
  const [remotePeers, setRemotePeers] = useState<Peer[]>([])

  useEffect(() => {
    let observer: Observer | undefined
    if (ditto) {
      observer = ditto.presence.observe(
        ({ remotePeers: peers }: { remotePeers: Peer[] }) => {
          setRemotePeers(peers)
        },
      )
    } else {
      setRemotePeers([])
      observer = undefined
    }
    return (): void => {
      observer?.stop()
    }
  }, [ditto])

  return {
    ditto,
    remotePeers,
  }
}
