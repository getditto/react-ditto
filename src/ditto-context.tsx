import { Ditto } from "@dittolive/ditto";
import { createContext, useContext } from "react";

export const DittoContext = createContext<Ditto | undefined>(undefined);

export const useDitto = (): Ditto => {
  const ditto = useContext(DittoContext);
  return ditto;
};
