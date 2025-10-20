/**
 * MSW Server Setup for Node.js Test Environment
 *
 * This sets up a mock service worker server for use in Vitest tests.
 */

import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
