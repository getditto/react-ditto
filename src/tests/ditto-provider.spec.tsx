import { assert, expect } from "chai";
import { Ditto, IdentityDevelopment } from "@dittolive/ditto";
import { render, unmountComponentAtNode } from "react-dom";
import { act } from "react-dom/test-utils";
import React from "react";

import { DittoProvider } from "../ditto-provider";

describe("Ditto Provider Tests", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    unmountComponentAtNode(container);
    container.remove();
    container = null;
  });

  it("should load", function(done) {
    const identity: IdentityDevelopment = {
      appName: "live.ditto.test",
      siteID: 234,
      type: "development",
    };
    const initOptions = {
      webAssemblyModule: "/base/node_modules/@dittolive/ditto/web/ditto.wasm"
    }

    act(() => {
      render(
        <DittoProvider identity={identity} path="/foo" initOptions={initOptions}>
          {({loading, error, ditto}) => {
            if (loading) {
              done()
            }
            return <></>
          }}
        </DittoProvider>,
        container
      );
    });
  });
});
