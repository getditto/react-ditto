import React, { useState, useEffect, ReactNode, ReactElement } from "react";
import { Ditto, init, InitOptions } from "@dittolive/ditto";
import { DittoContext } from "./DittoContext";
import { DittoHash, RegisterDitto, UnregisterDitto } from ".";

export type RenderFunction = (providerState: ProviderState) => ReactNode;

export interface DittoProviderProps extends React.PropsWithChildren<unknown> {
  initOptions?: InitOptions;
  /**
   * This function is called when the DittoProvider initialized the Ditto module.
   * Use this function to bootstrap the Ditto instance to the provider.
   *
   * Return a
   */
  setup: () => Promise<Ditto | Ditto[]>;
  render?: RenderFunction;
  children?: RenderFunction;
}

interface ProviderState {
  loading: boolean;
  error: Error | undefined;
}

/**
 *
 * @param props
 * @returns A function that needs to return a React.Element
 */
export const DittoProvider: React.FunctionComponent<DittoProviderProps> = (
  props
): ReactElement => {
  const [providerState, setProviderState] = useState<ProviderState>({
    loading: true,
    error: undefined,
  });

  const [dittoHash, setDittoHash] = useState<DittoHash>({});

  useEffect(() => {
    (async function () {
      try {
        await init(props.initOptions);
        const setupReturnValue: Ditto | Ditto[] = await props.setup();
        const dittoHash: DittoHash = {};

        if (!setupReturnValue) {
          setProviderState({
            loading: false,
            error: new Error(
              "Please return a Ditto instance or an array of Ditto instances in the provider's setup() function."
            ),
          });
          return;
        }

        if (Object.prototype.toString.call(setupReturnValue) === "[object Array]") {
          const dittoHash: DittoHash = {};
          (setupReturnValue as Ditto[]).forEach((ditto) => {
            dittoHash[ditto.path] = ditto;
          });
          setDittoHash(dittoHash);
        } else {
          const singleDitto: Ditto = setupReturnValue as Ditto;
          const dittoHash: DittoHash = {};
          dittoHash[singleDitto.path] = singleDitto;
          setDittoHash(dittoHash);
        }

        setDittoHash(dittoHash);
        setProviderState({
          error: undefined,
          loading: false,
        });
      } catch (err) {
        setDittoHash({});
        setProviderState({
          error: err,
          loading: false,
        });
      }
    })();
  }, [props]);

  const renderFunction: RenderFunction | undefined =
    props.render || props.children;
  let children: ReactNode = <></>;
  if (renderFunction) {
    children = renderFunction(providerState);
  }

  const registerDitto: RegisterDitto = (ditto) => {
    const hash = { ...dittoHash };
    hash[ditto.path] = ditto;
    setDittoHash(hash);
  };

  const unregisterDitto: UnregisterDitto = (path) => {
    const hash = { ...dittoHash };
    delete hash[path];
    setDittoHash(hash);
  };

  return (
    <DittoContext.Provider
      value={{ dittoHash, registerDitto, unregisterDitto }}
    >
      {children}
    </DittoContext.Provider>
  );
};
