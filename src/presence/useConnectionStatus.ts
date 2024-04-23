import { ConnectionType, Observer } from '@dittolive/ditto'
import { useEffect, useRef, useState } from 'react'

import { useDitto } from '../useDitto'

export interface ConnectionStatusParams {
  /**
   * The path of the Ditto string. If you omit this, it will fetch the first registered Ditto value.
   */
  path?: string
  /** Transport for which the connection status is retrieved. */
  forTransport: ConnectionType
}

/** Hook used to retrieve the connection status over a given transport.
 * @param Connection status hook params.
 * @returns True if a connection is active for the transport, false otherwise.
 * */
export const useConnectionStatus = (
  params: ConnectionStatusParams,
): boolean => {
  const { ditto } = useDitto(params.path)
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const peersObserverRef = useRef<Observer>()

  useEffect(() => {
    if (ditto) {
      peersObserverRef.current = ditto.presence.observe(({ remotePeers }) => {
        const nextActiveConnections = remotePeers.reduce((acc, peer) => {
          peer.connections.forEach((connection) =>
            acc.add(connection.connectionType),
          )

          return acc
        }, new Set<ConnectionType>())
        if (Array.from(nextActiveConnections).includes(params.forTransport)) {
          setIsConnected(true)
        } else {
          setIsConnected(false)
        }
      })

      return function disconnect() {
        if (peersObserverRef.current) {
          peersObserverRef.current.stop()
        }
      }
    }
  }, [ditto, params.forTransport])

  return isConnected
}
