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

  it("should load ditto", function(done) {
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
              expect(error).to.be.undefined
              expect(ditto).to.be.undefined
            }
            if (error) {
              expect(loading).to.be.false
              expect(ditto).to.be.undefined
            }
            if (ditto) {
              expect(loading).to.be.false
              expect(error).to.be.undefined
              expect(ditto.identity).to.deep.eq(identity)
              expect(ditto.path).to.eq("/foo")
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
