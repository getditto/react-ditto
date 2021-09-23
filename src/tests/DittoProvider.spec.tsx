import { expect } from "chai";
import { Ditto, IdentityDevelopment, init } from "@dittolive/ditto";
import { render, unmountComponentAtNode } from "react-dom";
import { act } from "react-dom/test-utils";
import React from "react";
import { DittoProvider } from "../DittoProvider";

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

  it("should load ditto", function () {
    const identity: IdentityDevelopment = {
      appName: "live.ditto.test",
      siteID: 234,
      type: "development",
    };
    const initOptions = {
      webAssemblyModule: "/base/node_modules/@dittolive/ditto/web/ditto.wasm",
    };

    act(() => {
      render(
        <DittoProvider
          setup={async () => {
            await init(initOptions);
            const ditto = new Ditto(identity);
            return ditto;
          }}
        >
          {({ loading, error }) => {
            if (loading) {
              expect(error).to.be.undefined;
            }
            if (error) {
              expect(loading).to.be.false;
            }
            return <></>;
          }}
        </DittoProvider>,
        container
      );
    });
  });
});
