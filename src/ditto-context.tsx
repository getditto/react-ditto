import { Ditto} from "@dittolive/ditto";
import { createContext, useContext } from "react";

export const DittoContext = createContext<Ditto | undefined>(undefined)

export const useDitto = (): Ditto => {
  const ditto = useContext(DittoContext)
  if (!ditto) {
    throw new Error("Ditto has not been initialized or the calling component has not been wrapped in a DittoProvider")
  }
  return ditto;
}