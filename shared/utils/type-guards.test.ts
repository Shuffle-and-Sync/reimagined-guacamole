/**
 * Tests for Type Guards and Defensive Programming Utilities
 *
 * @jest-environment node
 */

import { describe, it, expect } from "@jest/globals";
import {
  isDefined,
  assertDefined,
  isNonEmptyArray,
  safeAccess,
  isNonEmptyString,
  isValidNumber,
  isValidArray,
  isPlainObject,
  assertNonEmptyArray,
  isTruthy,
  isNullish,
  safeJsonParse,
  safeProperty,
  hasProperty,
  assertType,
  makeSafe,
  ensureBounds,
  isError,
  safeArrayAccess,
} from "./type-guards";

describe("Type Guards - isDefined", () => {
  it("should return false for undefined", () => {
    expect(isDefined(undefined)).toBe(false);
  });

  it("should return false for null", () => {
    expect(isDefined(null)).toBe(false);
  });

  it("should return true for defined values", () => {
    expect(isDefined(0)).toBe(true);
    expect(isDefined("")).toBe(true);
    expect(isDefined(false)).toBe(true);
    expect(isDefined([])).toBe(true);
    expect(isDefined({})).toBe(true);
  });

  it("should narrow type correctly", () => {
    const value: string | undefined = Math.random() > 0.5 ? "hello" : undefined;
    if (isDefined(value)) {
      // Type should be narrowed to string
      const upper: string = value.toUpperCase();
      expect(typeof upper).toBe("string");
    }
  });
});

describe("Type Guards - assertDefined", () => {
  it("should not throw for defined values", () => {
    expect(() => assertDefined(0)).not.toThrow();
    expect(() => assertDefined("")).not.toThrow();
    expect(() => assertDefined(false)).not.toThrow();
  });

  it("should throw for undefined", () => {
    expect(() => assertDefined(undefined)).toThrow("Value is required");
  });

  it("should throw for null", () => {
    expect(() => assertDefined(null)).toThrow("Value is required");
  });

  it("should use custom error message", () => {
    expect(() => assertDefined(null, "Custom error")).toThrow("Custom error");
  });

  it("should narrow type after assertion", () => {
    const value: number | undefined = 42;
    assertDefined(value);
    const doubled: number = value * 2;
    expect(doubled).toBe(84);
  });
});

describe("Type Guards - isNonEmptyArray", () => {
  it("should return false for undefined", () => {
    expect(isNonEmptyArray(undefined)).toBe(false);
  });

  it("should return false for null", () => {
    expect(isNonEmptyArray(null)).toBe(false);
  });

  it("should return false for empty array", () => {
    expect(isNonEmptyArray([])).toBe(false);
  });

  it("should return true for non-empty array", () => {
    expect(isNonEmptyArray([1])).toBe(true);
    expect(isNonEmptyArray([1, 2, 3])).toBe(true);
  });

  it("should narrow type to non-empty array tuple", () => {
    const arr: number[] | undefined = [1, 2, 3];
    if (isNonEmptyArray(arr)) {
      // Type should guarantee at least one element
      const first: number = arr[0];
      expect(first).toBe(1);
    }
  });
});

describe("Type Guards - safeAccess", () => {
  it("should access nested properties safely", () => {
    const obj = {
      user: {
        profile: {
          name: "John",
          age: 30,
        },
      },
    };

    expect(safeAccess(obj, "user.profile.name")).toBe("John");
    expect(safeAccess(obj, "user.profile.age")).toBe(30);
  });

  it("should return default value for missing properties", () => {
    const obj = { user: { name: "John" } };
    expect(safeAccess(obj, "user.age", 0)).toBe(0);
    expect(safeAccess(obj, "user.profile.name", "Unknown")).toBe("Unknown");
  });

  it("should handle null and undefined objects", () => {
    expect(safeAccess(null, "user.name", "default")).toBe("default");
    expect(safeAccess(undefined, "user.name", "default")).toBe("default");
  });

  it("should handle non-object values", () => {
    expect(safeAccess("string", "length", 0)).toBe(0);
    expect(safeAccess(123, "toString", "default")).toBe("default");
  });

  it("should return undefined if no default provided", () => {
    const obj = { user: { name: "John" } };
    expect(safeAccess(obj, "user.age")).toBeUndefined();
  });
});

describe("Type Guards - isNonEmptyString", () => {
  it("should return false for non-strings", () => {
    expect(isNonEmptyString(undefined)).toBe(false);
    expect(isNonEmptyString(null)).toBe(false);
    expect(isNonEmptyString(123)).toBe(false);
    expect(isNonEmptyString([])).toBe(false);
  });

  it("should return false for empty string", () => {
    expect(isNonEmptyString("")).toBe(false);
  });

  it("should return false for whitespace-only string", () => {
    expect(isNonEmptyString("   ")).toBe(false);
    expect(isNonEmptyString("\t\n")).toBe(false);
  });

  it("should return true for non-empty strings", () => {
    expect(isNonEmptyString("hello")).toBe(true);
    expect(isNonEmptyString(" hello ")).toBe(true);
  });
});

describe("Type Guards - isValidNumber", () => {
  it("should return false for non-numbers", () => {
    expect(isValidNumber(undefined)).toBe(false);
    expect(isValidNumber(null)).toBe(false);
    expect(isValidNumber("123")).toBe(false);
    expect(isValidNumber([])).toBe(false);
  });

  it("should return false for NaN", () => {
    expect(isValidNumber(NaN)).toBe(false);
  });

  it("should return false for Infinity", () => {
    expect(isValidNumber(Infinity)).toBe(false);
    expect(isValidNumber(-Infinity)).toBe(false);
  });

  it("should return true for valid numbers", () => {
    expect(isValidNumber(0)).toBe(true);
    expect(isValidNumber(123)).toBe(true);
    expect(isValidNumber(-456)).toBe(true);
    expect(isValidNumber(3.14)).toBe(true);
  });
});

describe("Type Guards - isValidArray", () => {
  it("should return false for non-arrays", () => {
    expect(isValidArray(undefined)).toBe(false);
    expect(isValidArray(null)).toBe(false);
    expect(isValidArray("string")).toBe(false);
    expect(isValidArray({ length: 0 })).toBe(false);
  });

  it("should return true for arrays", () => {
    expect(isValidArray([])).toBe(true);
    expect(isValidArray([1, 2, 3])).toBe(true);
    expect(isValidArray(new Array(10))).toBe(true);
  });
});

describe("Type Guards - isPlainObject", () => {
  it("should return false for non-objects", () => {
    expect(isPlainObject(undefined)).toBe(false);
    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject("string")).toBe(false);
    expect(isPlainObject(123)).toBe(false);
  });

  it("should return false for arrays", () => {
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject([1, 2, 3])).toBe(false);
  });

  it("should return false for Date objects", () => {
    expect(isPlainObject(new Date())).toBe(false);
  });

  it("should return true for plain objects", () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ key: "value" })).toBe(true);
    expect(isPlainObject(Object.create(null))).toBe(true);
  });
});

describe("Type Guards - assertNonEmptyArray", () => {
  it("should not throw for non-empty arrays", () => {
    expect(() => assertNonEmptyArray([1])).not.toThrow();
    expect(() => assertNonEmptyArray([1, 2, 3])).not.toThrow();
  });

  it("should throw for empty array", () => {
    expect(() => assertNonEmptyArray([])).toThrow("Array must not be empty");
  });

  it("should throw for undefined", () => {
    expect(() => assertNonEmptyArray(undefined)).toThrow(
      "Array must not be empty",
    );
  });

  it("should throw for null", () => {
    expect(() => assertNonEmptyArray(null)).toThrow("Array must not be empty");
  });

  it("should use custom error message", () => {
    expect(() => assertNonEmptyArray([], "Custom error")).toThrow(
      "Custom error",
    );
  });
});

describe("Type Guards - isTruthy", () => {
  it("should return false for falsy values", () => {
    expect(isTruthy(undefined)).toBe(false);
    expect(isTruthy(null)).toBe(false);
    expect(isTruthy(false)).toBe(false);
    expect(isTruthy(0)).toBe(false);
    expect(isTruthy("")).toBe(false);
  });

  it("should return true for truthy values", () => {
    expect(isTruthy(true)).toBe(true);
    expect(isTruthy(1)).toBe(true);
    expect(isTruthy("hello")).toBe(true);
    expect(isTruthy([])).toBe(true);
    expect(isTruthy({})).toBe(true);
  });
});

describe("Type Guards - isNullish", () => {
  it("should return true for null and undefined", () => {
    expect(isNullish(null)).toBe(true);
    expect(isNullish(undefined)).toBe(true);
  });

  it("should return false for other values", () => {
    expect(isNullish(0)).toBe(false);
    expect(isNullish("")).toBe(false);
    expect(isNullish(false)).toBe(false);
    expect(isNullish([])).toBe(false);
    expect(isNullish({})).toBe(false);
  });
});

describe("Type Guards - safeJsonParse", () => {
  it("should parse valid JSON", () => {
    expect(safeJsonParse('{"name":"John"}', {})).toEqual({ name: "John" });
    expect(safeJsonParse("[1,2,3]", [])).toEqual([1, 2, 3]);
    expect(safeJsonParse('"hello"', "")).toBe("hello");
  });

  it("should return fallback for invalid JSON", () => {
    expect(safeJsonParse("invalid json", { default: true })).toEqual({
      default: true,
    });
    expect(safeJsonParse("{broken", [])).toEqual([]);
  });
});

describe("Type Guards - safeProperty", () => {
  it("should access defined properties", () => {
    const obj = { name: "John", age: 30 };
    expect(safeProperty(obj, "name")).toBe("John");
    expect(safeProperty(obj, "age")).toBe(30);
  });

  it("should return default for undefined object", () => {
    expect(safeProperty(undefined, "name", "default")).toBe("default");
    expect(safeProperty(null, "name", "default")).toBe("default");
  });

  it("should return undefined for missing property without default", () => {
    const obj = { name: "John" };
    expect(safeProperty(obj, "age" as keyof typeof obj)).toBeUndefined();
  });

  it("should return default for undefined property", () => {
    const obj: { name: string; age?: number } = { name: "John" };
    expect(safeProperty(obj, "age", 0)).toBe(0);
  });
});

describe("Type Guards - hasProperty", () => {
  it("should return true if property exists", () => {
    const obj = { name: "John", age: 30 };
    expect(hasProperty(obj, "name")).toBe(true);
    expect(hasProperty(obj, "age")).toBe(true);
  });

  it("should return false if property doesn't exist", () => {
    const obj = { name: "John" };
    expect(hasProperty(obj, "age")).toBe(false);
  });

  it("should return false for non-objects", () => {
    expect(hasProperty(undefined, "name")).toBe(false);
    expect(hasProperty(null, "name")).toBe(false);
    expect(hasProperty("string", "name")).toBe(false);
  });
});

describe("Type Guards - assertType", () => {
  it("should not throw if type guard passes", () => {
    expect(() => assertType({}, isPlainObject)).not.toThrow();
    expect(() => assertType([1, 2], isValidArray)).not.toThrow();
  });

  it("should throw if type guard fails", () => {
    expect(() => assertType(null, isPlainObject)).toThrow(
      "Type assertion failed",
    );
    expect(() => assertType("string", isValidArray)).toThrow(
      "Type assertion failed",
    );
  });

  it("should use custom error message", () => {
    expect(() => assertType(null, isPlainObject, "Must be object")).toThrow(
      "Must be object",
    );
  });
});

describe("Type Guards - makeSafe", () => {
  it("should return function result if no error", () => {
    const fn = (x: number) => x * 2;
    const safeFn = makeSafe(fn, 0);
    expect(safeFn(5)).toBe(10);
  });

  it("should return fallback if function throws", () => {
    const fn = () => {
      throw new Error("Failed");
    };
    const safeFn = makeSafe(fn, "fallback");
    expect(safeFn()).toBe("fallback");
  });

  it("should work with JSON.parse", () => {
    const safeParse = makeSafe((s: string) => JSON.parse(s), null);
    expect(safeParse('{"name":"John"}')).toEqual({ name: "John" });
    expect(safeParse("invalid json")).toBe(null);
  });
});

describe("Type Guards - ensureBounds", () => {
  it("should clamp value within bounds", () => {
    expect(ensureBounds(50, 0, 100)).toBe(50);
    expect(ensureBounds(-10, 0, 100)).toBe(0);
    expect(ensureBounds(150, 0, 100)).toBe(100);
  });

  it("should return min for invalid numbers", () => {
    expect(ensureBounds(NaN, 0, 100)).toBe(0);
    expect(ensureBounds(Infinity, 0, 100)).toBe(0);
  });
});

describe("Type Guards - isError", () => {
  it("should return true for Error objects", () => {
    expect(isError(new Error("Test"))).toBe(true);
    expect(isError(new TypeError("Test"))).toBe(true);
    expect(isError(new RangeError("Test"))).toBe(true);
  });

  it("should return false for non-Error values", () => {
    expect(isError("error")).toBe(false);
    expect(isError({ message: "error" })).toBe(false);
    expect(isError(null)).toBe(false);
  });
});

describe("Type Guards - safeArrayAccess", () => {
  it("should access array elements safely", () => {
    const arr = [1, 2, 3];
    expect(safeArrayAccess(arr, 0)).toBe(1);
    expect(safeArrayAccess(arr, 2)).toBe(3);
  });

  it("should return undefined for out-of-bounds access", () => {
    const arr = [1, 2, 3];
    expect(safeArrayAccess(arr, 10)).toBeUndefined();
    expect(safeArrayAccess(arr, -1)).toBeUndefined();
  });

  it("should return undefined for null/undefined arrays", () => {
    expect(safeArrayAccess(null, 0)).toBeUndefined();
    expect(safeArrayAccess(undefined, 0)).toBeUndefined();
  });

  it("should return undefined for invalid index", () => {
    const arr = [1, 2, 3];
    expect(safeArrayAccess(arr, NaN)).toBeUndefined();
    expect(safeArrayAccess(arr, Infinity)).toBeUndefined();
  });
});
