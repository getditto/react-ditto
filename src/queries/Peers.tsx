import { Ditto, RemotePeer, Observer } from "@dittolive/ditto";
import { useEffect, useState } from "react";
import { useDitto } from "../DittoContext";

export interface UsePeersParams {
  /**
   * Ditto Path
   */
  path?: string;
}

/**
 * Returns all the connected peers for this client.
 * @param params live query parameters.
 * @returns
 */
export function useRemotePeers(params: UsePeersParams = {}): {
  ditto: Ditto;
  remotePeers: RemotePeer[];
} {
  const { ditto } = useDitto(params.path);
  const [remotePeers, setRemotePeers] = useState<RemotePeer[]>([]);

  useEffect(() => {
    let observer: Observer | undefined;
    if (ditto) {
      observer = ditto.observePeers((peers: RemotePeer[]) => {
        setRemotePeers(peers);
      });
    } else {
      setRemotePeers([]);
      observer = undefined;
    }
    return (): void => {
      observer?.stop();
    };
  }, [ditto]);

  return {
    ditto,
    remotePeers,
  };
}
