/**
 * Async Error Wrapper Utility
 *
 * Wraps async route handlers to automatically catch errors and pass them to next()
 * Eliminates the need for try-catch blocks in every route handler
 *
 * @example
 * ```typescript
 * // Without catchAsync (requires try-catch)
 * app.get('/users/:id', async (req, res) => {
 *   try {
 *     const user = await getUserById(req.params.id);
 *     res.json(user);
 *   } catch (error) {
 *     next(error);
 *   }
 * });
 *
 * // With catchAsync (automatic error handling)
 * app.get('/users/:id', catchAsync(async (req, res) => {
 *   const user = await getUserById(req.params.id);
 *   res.json(user);
 * }));
 * ```
 */

import { Request, Response, NextFunction } from "express";

/**
 * Wraps an async route handler to catch errors
 * @param fn Async route handler function
 * @returns Wrapped function that catches errors
 */
export const catchAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
