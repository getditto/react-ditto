import { expect } from "chai";
import { render, unmountComponentAtNode } from "react-dom";
import { act } from "react-dom/test-utils";
import { renderHook } from '@testing-library/react-hooks'
import { DittoProvider, useDitto } from "..";



describe('useMutations tests', function() {
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
  
})