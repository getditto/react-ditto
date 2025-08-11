// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// JSDom, which is used by @testing-library/react, doesn't support TextEncoder and TextDecoder,
// even though they have broad support in modern browsers. This polyfill adds them to the global
// object so that they can be used by @dittolive/ditto.
// cf. https://github.com/jsdom/jsdom/issues/2524
import { TextDecoder, TextEncoder } from 'util'
global.TextEncoder = TextEncoder
// @ts-expect-error - TextDecoder type not available on global in test environment
global.TextDecoder = TextDecoder
