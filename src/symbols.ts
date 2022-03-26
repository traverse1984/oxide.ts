/**
 * Unique marker for `Option` and `Result` types.
 *
 * ### Warning
 * This library sometimes assumes a value with this key is an Option or Result
 * without explicitly checking the instance type or properties.
 */
export const T = Symbol("T");
export const Val = Symbol("Val");
export const MarkFn = Symbol("MarkFn");

export const EmptyArray = Object.freeze([] as any[]);
export type IterType<T> = T extends { [Symbol.iterator](): infer I }
   ? I
   : unknown;
