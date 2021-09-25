import { Ditto } from "@dittolive/ditto";
import { createContext, useContext, useEffect, useState } from "react";

export interface DittoHash {
  [path: string]: Ditto;
}

export type RegisterDitto = (ditto: Ditto) => void;
export type UnregisterDitto = (path: string) => void;

export interface DittoContext {
  dittoHash: DittoHash;
  registerDitto?: RegisterDitto;
  unregisterDitto?: UnregisterDitto;
}

export const DittoContext = createContext<DittoContext>({
  dittoHash: {},
});

export const useDitto = (
  path?: string
): {
  ditto: Ditto | undefined;
  dittoHash: DittoHash;
  registerDitto?: RegisterDitto;
  unregisterDitto?: UnregisterDitto;
} => {
  const { dittoHash, registerDitto, unregisterDitto } =
    useContext(DittoContext);
    
  const [ditto, setDitto] = useState<Ditto | undefined>()

  useEffect(() => {
    let foundDitto: Ditto;
    if (path) {
      foundDitto = dittoHash[path];
    } else {
      const [first] = Object.values(dittoHash);
      foundDitto = first;
    }
    if (foundDitto) {
      setDitto(foundDitto);  
    } else {
      setDitto(undefined);
    }
    
  }, [path, dittoHash]);

  return {
    ditto,
    dittoHash,
    registerDitto,
    unregisterDitto,
  };
};
