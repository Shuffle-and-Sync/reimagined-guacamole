/**
 * MSW Browser Setup for Browser Test Environment
 *
 * This sets up a mock service worker for use in browser-based tests.
 */

import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);
