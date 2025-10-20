/**
 * Custom Assertions
 *
 * Custom Jest matchers and assertion helpers for tests.
 */

/**
 * Assert that an object matches a subset
 */
export function assertObjectContains(actual: any, expected: Partial<any>) {
  for (const key in expected) {
    expect(actual).toHaveProperty(key, expected[key]);
  }
}

/**
 * Assert that an array contains objects matching criteria
 */
export function assertArrayContainsObject(
  array: any[],
  criteria: Partial<any>,
) {
  const match = array.find((item) => {
    return Object.keys(criteria).every((key) => item[key] === criteria[key]);
  });
  expect(match).toBeDefined();
}

/**
 * Assert that a database query was called with specific parameters
 */
export function assertQueryCalled(
  mockDb: any,
  method: string,
  tableName: string,
) {
  expect(mockDb[method]).toHaveBeenCalled();
  if (method === "from") {
    expect(mockDb.from).toHaveBeenCalledWith(
      expect.objectContaining({
        name: tableName,
      }),
    );
  }
}

/**
 * Assert that an error is thrown with specific message
 */
export async function assertThrowsError(
  fn: () => any,
  expectedMessage?: string,
) {
  await expect(fn()).rejects.toThrow(expectedMessage);
}

/**
 * Assert that a value is a valid date
 */
export function assertValidDate(value: any) {
  expect(value).toBeInstanceOf(Date);
  expect(value.getTime()).not.toBeNaN();
}

/**
 * Assert that a value is a valid UUID/nanoid
 */
export function assertValidId(value: any) {
  expect(typeof value).toBe("string");
  expect(value.length).toBeGreaterThan(0);
}

/**
 * Assert that an email is valid format
 */
export function assertValidEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  expect(email).toMatch(emailRegex);
}

/**
 * Assert that pagination metadata is correct
 */
export function assertValidPagination(pagination: any) {
  expect(pagination).toHaveProperty("page");
  expect(pagination).toHaveProperty("perPage");
  expect(pagination).toHaveProperty("total");
  expect(pagination).toHaveProperty("totalPages");
  expect(pagination.page).toBeGreaterThanOrEqual(1);
  expect(pagination.perPage).toBeGreaterThan(0);
  expect(pagination.total).toBeGreaterThanOrEqual(0);
}

/**
 * Assert response has correct structure
 */
export function assertApiResponse(response: any, expectedData?: any) {
  expect(response).toHaveProperty("success");

  if (expectedData) {
    expect(response).toHaveProperty("data");
    expect(response.data).toMatchObject(expectedData);
  }
}

/**
 * Assert error response has correct structure
 */
export function assertErrorStructure(response: any) {
  expect(response).toHaveProperty("error");
  expect(response).toHaveProperty("message");
  expect(typeof response.error).toBe("string");
  expect(typeof response.message).toBe("string");
}
