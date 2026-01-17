import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

// Polyfill for Radix UI Select components in JSDOM
// JSDOM doesn't implement pointer capture APIs used by Radix primitives
Element.prototype.hasPointerCapture = (): boolean => false;
Element.prototype.setPointerCapture = (): void => {};
Element.prototype.releasePointerCapture = (): void => {};

// Mock scrollIntoView for Radix components
Element.prototype.scrollIntoView = (): void => {};

afterEach((): void => {
  cleanup();
});
