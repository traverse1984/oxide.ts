/**
 * Unique marker for `Option` and `Result` types.
 *
 * ### Warning
 * This library sometimes assumes a value with this key is an Option or Result
 * without explicitly checking the instance type or other properties.
 */
export const T_ = Symbol("T");
export const Val = Symbol("Val");
export const FnVal = Symbol("FnVal");
export const EmptyArray = Object.freeze([] as any[]);

export type FalseyValues = false | null | undefined | 0 | 0n | "";
export function isTruthy(val: unknown): boolean {
   return val instanceof Date ? val.getTime() === val.getTime() : !!val;
}

export type IterType<T> = T extends { [Symbol.iterator](): infer I }
   ? I
   : unknown;
