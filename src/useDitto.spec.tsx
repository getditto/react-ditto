import { expect } from "chai";
import { render, unmountComponentAtNode } from "react-dom";
import { act } from "react-dom/test-utils";
import { renderHook } from "@testing-library/react-hooks/dom";
import { DittoProvider, useDitto } from "./";
import { Ditto, IdentityDevelopment } from "@dittolive/ditto";
import React, { ReactChildren, ReactNode } from "react";

const identity: IdentityDevelopment = {
  appName: "live.ditto.test",
  siteID: 234,
  type: "development",
};

describe("useDittoSpec tests", function () {
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

  it("should return a ditto instance with a matching path variable", async function () {
    const setup = (): Ditto => {
      const ditto = new Ditto(identity, "/test");
      return ditto;
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <DittoProvider setup={setup}>
        {({ loading, error }) => {
          return children;
        }}
      </DittoProvider>
    );
    const { result, waitFor } = renderHook(() => useDitto("/test"), {
      wrapper,
    });

    await waitFor(() => !!result.current?.ditto);

    expect(result.current?.ditto?.path).to.eq("/test");
  });
});
