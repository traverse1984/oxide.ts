export const _promise = Symbol();
export const _value = Symbol();
export const _safe = Symbol();
export const _some = Symbol();
export const _none = Symbol();
export const _ok = Symbol();
export const _err = Symbol();

export type Safe<T> = { [_safe]: true } & T;
export type Unsafe<T> = { [_safe]: false } & T;

export type SafeVariants<T> = Safe<T> | Promise<Safe<T>>;

export type UnsafeVariants<T> =
   | T
   | Safe<T>
   | Unsafe<T>
   | PromiseLike<T>
   | PromiseLike<Safe<T>>
   | PromiseLike<Unsafe<T>>
   | Safe<PromiseLike<T>>
   | Unsafe<PromiseLike<T>>;

export function Safe<T>(val: T): Safe<T> {
   return val as Safe<T>;
}
