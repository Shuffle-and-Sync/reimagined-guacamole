/**
 * API Test Helpers
 *
 * Utilities for testing API endpoints.
 */

import { mockRequest, mockResponse } from "./mocks";

/**
 * Create authenticated request
 */
export function createAuthenticatedRequest(user: unknown, overrides: unknown = {}) {
  return mockRequest({
    user,
    session: {
      userId: user.id,
      token: "test-token",
    },
    ...overrides,
  });
}

/**
 * Create admin request
 */
export function createAdminRequest(admin: unknown, overrides: unknown = {}) {
  return createAuthenticatedRequest(admin, {
    user: { ...admin, role: "admin" },
    ...overrides,
  });
}

/**
 * Assert successful response
 */
export function assertSuccessResponse(res: unknown, expectedStatus = 200) {
  expect(res.status).toHaveBeenCalledWith(expectedStatus);
  expect(res.json).toHaveBeenCalled();
}

/**
 * Assert error response
 */
export function assertErrorResponse(res: unknown,
  expectedStatus: number,
  expectedError?: string,
) {
  expect(res.status).toHaveBeenCalledWith(expectedStatus);

  if (expectedError) {
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining(expectedError),
      }),
    );
  }
}

/**
 * Extract JSON response from mock response
 */
export function getJsonResponse(res: unknown) {
  const jsonCall = res.json.mock.calls[0];
  return jsonCall ? jsonCall[0] : null;
}

/**
 * Simulate API call
 */
export async function callApi(
  handler: (...args: unknown[]) => any,
  req: unknown = mockRequest(),
  res: unknown = mockResponse(),
) {
  await handler(req, res);
  return { req, res, data: getJsonResponse(res) };
}
