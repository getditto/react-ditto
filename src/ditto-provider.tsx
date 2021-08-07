import React, { useState, useEffect, ReactNode, ReactElement } from "react";
import { Ditto, init, Identity } from "@dittolive/ditto";
import { DittoContext } from "./ditto-context";

type RenderFunction = (params: {
  loading: boolean;
  error?: Error;
  ditto?: Ditto;
}) => ReactNode;

export interface DittoProviderProps extends React.PropsWithChildren<unknown> {
  identity: Identity;
  licenseToken?: string;
  path?: string;
  render?: RenderFunction;
  children?: RenderFunction;
  initOptions?: {
    webAssemblyModule?:
      | RequestInfo
      | URL
      | Response
      | BufferSource
      | WebAssembly.Module
      | string
      | null;
  };
}

/**
 *
 * @param props
 * @returns A function that needs to return a React.Element
 */
export const DittoProvider: React.FunctionComponent<DittoProviderProps> = (
  props
): ReactElement => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [ditto, setDitto] = useState<Ditto | undefined>(undefined);

  useEffect(() => {
    init(props.initOptions).then(
      () => {
        const ditto = new Ditto(props.identity, props.path);
        if (props.licenseToken) {
          ditto.setLicenseToken(props.licenseToken);
        }
        setError(undefined);
        setLoading(false);
        setDitto(ditto);
      },
      (err) => {
        setError(err);
      }
    );
  });

  const renderFunction: RenderFunction | undefined =
    props.render || props.children;
  let children: ReactNode = <></>;
  if (renderFunction) {
    children = renderFunction({ loading, error, ditto });
  }

  return (
    <DittoContext.Provider value={ditto}>{children}</DittoContext.Provider>
  );
};
