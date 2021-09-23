import { Ditto } from "@dittolive/ditto";
import { createContext, useContext } from "react";

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
  ditto: Ditto;
  registerDitto?: RegisterDitto;
  unregisterDitto?: UnregisterDitto;
} => {
  const { dittoHash, registerDitto, unregisterDitto } =
    useContext(DittoContext);

  let ditto: Ditto;
  if (path) {
    ditto = dittoHash[path];
  } else {
    ditto = Object.values(dittoHash)[0];
  }

  if (!ditto) {
    if (path) {
      throw new Error(`Could not find a ditto with "${path}"`);
    } else {
      throw new Error("Clould not find a ditto instance.");
    }
  }

  return {
    ditto,
    registerDitto,
    unregisterDitto,
  };
};
