/**
 * Tests for common utilities
 */

import {
  isNullish,
  isDefined,
  isString,
  isNumber,
  isBoolean,
  isObject,
  isPlainObject,
  isArray,
  isFunction,
  isDate,
  isEmpty,
  safeJsonParse,
  safeJsonStringify,
  deepClone,
  deepMerge,
  pick,
  omit,
  getNestedValue,
  setNestedValue,
  unique,
  uniqueBy,
  groupBy,
  mapBy,
  sortBy,
  chunk,
  flatten,
  compact,
  difference,
  intersection,
  shuffle,
  sample,
  sampleSize,
  sleep,
  clamp,
  randomInt,
  randomString,
} from "../../shared/utils/common.utils";

describe("common.utils", () => {
  describe("Type guards", () => {
    it("should check for nullish values", () => {
      expect(isNullish(null)).toBe(true);
      expect(isNullish(undefined)).toBe(true);
      expect(isNullish(0)).toBe(false);
      expect(isNullish("")).toBe(false);
    });

    it("should check for defined values", () => {
      expect(isDefined(null)).toBe(false);
      expect(isDefined(undefined)).toBe(false);
      expect(isDefined(0)).toBe(true);
      expect(isDefined("")).toBe(true);
    });

    it("should check for strings", () => {
      expect(isString("hello")).toBe(true);
      expect(isString(123)).toBe(false);
    });

    it("should check for numbers", () => {
      expect(isNumber(123)).toBe(true);
      expect(isNumber(NaN)).toBe(false);
      expect(isNumber("123")).toBe(false);
    });

    it("should check for booleans", () => {
      expect(isBoolean(true)).toBe(true);
      expect(isBoolean(false)).toBe(true);
      expect(isBoolean(1)).toBe(false);
    });

    it("should check for objects", () => {
      expect(isObject({})).toBe(true);
      expect(isObject([])).toBe(false);
      expect(isObject(null)).toBe(false);
    });

    it("should check for plain objects", () => {
      expect(isPlainObject({})).toBe(true);
      expect(isPlainObject(new Date())).toBe(false);
      expect(isPlainObject([])).toBe(false);
    });

    it("should check for arrays", () => {
      expect(isArray([])).toBe(true);
      expect(isArray([1, 2, 3])).toBe(true);
      expect(isArray({})).toBe(false);
    });

    it("should check for functions", () => {
      expect(isFunction(() => {})).toBe(true);
      expect(isFunction(function () {})).toBe(true);
      expect(isFunction({})).toBe(false);
    });

    it("should check for dates", () => {
      expect(isDate(new Date())).toBe(true);
      expect(isDate(new Date("invalid"))).toBe(false);
      expect(isDate("2024-01-01")).toBe(false);
    });

    it("should check for empty values", () => {
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
      expect(isEmpty("")).toBe(true);
      expect(isEmpty([])).toBe(true);
      expect(isEmpty({})).toBe(true);
      expect(isEmpty("hello")).toBe(false);
      expect(isEmpty([1])).toBe(false);
      expect(isEmpty({ a: 1 })).toBe(false);
    });
  });

  describe("JSON utilities", () => {
    it("should safely parse JSON", () => {
      expect(safeJsonParse('{"a":1}', {})).toEqual({ a: 1 });
      expect(safeJsonParse("invalid", { default: true })).toEqual({
        default: true,
      });
    });

    it("should safely stringify JSON", () => {
      expect(safeJsonStringify({ a: 1 })).toBe('{"a":1}');
      // Note: JSON.stringify(undefined) returns undefined (not an error), which is valid behavior
      expect(safeJsonStringify({ a: 1, b: undefined })).toBe('{"a":1}');
    });
  });

  describe("Object utilities", () => {
    it("should deep clone objects", () => {
      const obj = { a: 1, b: { c: 2 }, d: [1, 2] };
      const cloned = deepClone(obj);
      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
      expect(cloned.b).not.toBe(obj.b);
    });

    it("should deep merge objects", () => {
      const target = { a: 1, b: { c: 2 } };
      const source = { b: { d: 3 }, e: 4 };
      const result = deepMerge(target, source);
      expect(result).toEqual({ a: 1, b: { c: 2, d: 3 }, e: 4 });
    });

    it("should pick keys from object", () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(pick(obj, ["a", "c"])).toEqual({ a: 1, c: 3 });
    });

    it("should omit keys from object", () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(omit(obj, ["b"])).toEqual({ a: 1, c: 3 });
    });

    it("should get nested values", () => {
      const obj = { a: { b: { c: 123 } } };
      expect(getNestedValue(obj, "a.b.c")).toBe(123);
      expect(getNestedValue(obj, "a.b.d", "default")).toBe("default");
    });

    it("should set nested values", () => {
      const obj: Record<string, unknown> = {};
      setNestedValue(obj, "a.b.c", 123);
      expect(obj).toEqual({ a: { b: { c: 123 } } });
    });
  });

  describe("Array utilities", () => {
    it("should remove duplicates", () => {
      expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
    });

    it("should remove duplicates by key", () => {
      const items = [{ id: 1 }, { id: 2 }, { id: 1 }];
      expect(uniqueBy(items, "id")).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it("should group by key", () => {
      const items = [
        { type: "a", value: 1 },
        { type: "b", value: 2 },
        { type: "a", value: 3 },
      ];
      const grouped = groupBy(items, "type");
      expect(grouped.a).toHaveLength(2);
      expect(grouped.b).toHaveLength(1);
    });

    it("should create map by key", () => {
      const items = [
        { id: "a", value: 1 },
        { id: "b", value: 2 },
      ];
      const map = mapBy(items, "id");
      expect(map.get("a")).toEqual({ id: "a", value: 1 });
    });

    it("should sort array", () => {
      const items = [{ value: 3 }, { value: 1 }, { value: 2 }];
      const sorted = sortBy(items, "value");
      expect(sorted[0].value).toBe(1);
      expect(sorted[2].value).toBe(3);
    });

    it("should chunk array", () => {
      const chunks = chunk([1, 2, 3, 4, 5], 2);
      expect(chunks).toEqual([[1, 2], [3, 4], [5]]);
    });

    it("should flatten arrays", () => {
      expect(flatten([1, [2, 3], [4, 5]])).toEqual([1, 2, 3, 4, 5]);
    });

    it("should compact array", () => {
      expect(compact([1, null, 2, undefined, 3, false, 0, ""])).toEqual([
        1, 2, 3,
      ]);
    });

    it("should find difference", () => {
      expect(difference([1, 2, 3], [2, 3, 4])).toEqual([1]);
    });

    it("should find intersection", () => {
      expect(intersection([1, 2, 3], [2, 3, 4])).toEqual([2, 3]);
    });

    it("should shuffle array", () => {
      const arr = [1, 2, 3, 4, 5];
      const shuffled = shuffle(arr);
      expect(shuffled).toHaveLength(5);
      expect(shuffled).toEqual(expect.arrayContaining(arr));
    });

    it("should sample from array", () => {
      const arr = [1, 2, 3, 4, 5];
      const sampled = sample(arr);
      expect(arr).toContain(sampled);
    });

    it("should sample multiple items", () => {
      const arr = [1, 2, 3, 4, 5];
      const sampled = sampleSize(arr, 3);
      expect(sampled).toHaveLength(3);
      sampled.forEach((item) => expect(arr).toContain(item));
    });
  });

  describe("Utility functions", () => {
    it("should sleep/delay", async () => {
      const start = Date.now();
      await sleep(50);
      const end = Date.now();
      expect(end - start).toBeGreaterThanOrEqual(45); // Allow slight variance
    });

    it("should clamp numbers", () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it("should generate random integers", () => {
      const num = randomInt(1, 10);
      expect(num).toBeGreaterThanOrEqual(1);
      expect(num).toBeLessThanOrEqual(10);
    });

    it("should generate random strings", () => {
      const str = randomString(10);
      expect(str).toHaveLength(10);
      expect(/^[A-Za-z0-9]+$/.test(str)).toBe(true);
    });
  });
});
