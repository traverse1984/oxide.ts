import { Option, Some, None } from "./option";

const IsOk = Symbol("IsOk");

export type Result<T, E> = Ok<T, E> | Err<E, T>;
export type Ok<T, E> = ResultType<T, E> & { [IsOk]: true };
export type Err<E, T> = ResultType<T, E> & { [IsOk]: false };

class ResultType<T, E> {
   private val: T | E;
   readonly [IsOk]: boolean;

   constructor(val: T | E, ok: boolean) {
      this.val = val;
      this[IsOk] = ok;
      Object.freeze(this);
   }

   /**
    * See `isLike()`.
    * @deprecated
    */
   is(cmp: unknown): cmp is Result<unknown, unknown> {
      return this.isLike(cmp);
   }

   /**
    * Compares the Result to `cmp`, returns true if both are `Ok` or both
    * are `Err`. Acts as a type guard for `cmp is Result<unknown, unknown>`.
    *
    * ```
    * const o = Ok(1);
    * const e = Err(1);
    *
    * assert.equal(o.isLike(Ok(1))), true);
    * assert.equal(e.isLike(Err(1)), true);
    * assert.equal(o.isLike(e), false);
    * ```
    */
   isLike(cmp: unknown): cmp is Result<unknown, unknown> {
      return cmp instanceof ResultType && this[IsOk] === cmp[IsOk];
   }

   /**
    * See `equals()`.
    * @deprecated
    */
   eq(cmp: Result<T, E>): boolean {
      return this.equals(cmp);
   }

   /**
    * Compares the Result to `cmp` for equality. Returns `true` when both are
    * the same type (`Ok`/`Err`) and their contained values are identical
    * (`===`).
    *
    * ```
    * const val = { x: 10 };
    * const o: Result<{ x: number; }, { x: number; }> = Ok(val);
    * const e: Result<{ x: number; }, { x: number; }> = Err(val);
    *
    * assert.equal(o.equals(Ok(val)), true);
    * assert.equal(e.equals(Err(val)), true):
    * assert.equal(o.equals(Ok({ x: 10 })), false);
    * assert.equal(e.equals(Err({ x: 10 })), false);
    * assert.equal(o.equals(e), false);
    * ```
    */
   equals(cmp: Result<T, E>): boolean {
      return this[IsOk] === cmp[IsOk] && this.val === cmp.val;
   }

   /**
    * Compares the Result to `cmp` for inequality. Returns true when both are
    * different types (`Ok`/`Err`) or their contained values are not identical
    * (`!==`).
    *
    * ```
    * const val = { x: 10 };
    * const o: Result<{ x: number; }, { x: number; }> = Ok(val);
    * const e: Result<{ x: number; }, { x: number; }> = Err(val);
    *
    * assert.equal(o.neq(Ok(val)), false);
    * assert.equal(e.neq(Err(val)), false):
    * assert.equal(o.neq(Ok({ x: 10 })), true);
    * assert.equal(e.neq(Err({ x: 10 })), true);
    * assert.equal(o.neq(e), true);
    * ```
    *
    * @deprecated
    */
   neq(cmp: Result<T, E>): boolean {
      return this[IsOk] !== cmp[IsOk] || this.val !== cmp.val;
   }

   /**
    * Returns true if the Result is `Ok`. Acts as a type guard for
    * `this is Ok<T, any>`.
    *
    * @example
    * const x = Ok(10);
    * assert.equal(x.isOk(), true);
    *
    * const x = Err(10);
    * assert.equal(x.isOk(), false);
    */
   isOk(): this is Ok<T, any> {
      return this[IsOk];
   }

   /**
    * Returns true if the Result is `Err`. Acts as a type guard for
    * `this is Err<E, any>`.
    *
    * @example
    * const x = Ok(10);
    * assert.equal(x.isErr(), false);
    *
    * const x = Err(10);
    * assert.equal(x.isErr(), true);
    */
   isErr(): this is Err<E, any> {
      return !this[IsOk];
   }

   /**
   Returns the contained `Ok` value and throws `Error(msg)` if `Err`.

   To avoid throwing, consider `isOk`, `unwrapOr`, `unwrapOrElse` or
   `match` to handle the `Err` case.
   
   @example
   const x = Ok(1);
   assert.equal(x.expect("Was Err"), 1);
   
   const x = Err(1);
   const y = x.expect("Was Err"); // throws
   */
   expect(msg: string): T {
      if (this[IsOk]) {
         return this.val as T;
      } else {
         throw new Error(msg);
      }
   }

   /**
   Returns the contained `Err` value and throws `Error(msg)` if `Ok`.

   To avoid throwing, consider `isErr` or `match` to handle the `Ok` case.
   
   @example
   const x = Ok(1);
   const y = x.expectErr("Was Ok"); // throws

   const x = Err(1);
   assert.equal(x.expectErr("Was Ok"), 1);
   */
   expectErr(msg: string): E {
      if (this[IsOk]) {
         throw new Error(msg);
      } else {
         return this.val as E;
      }
   }

   /**
   Returns the contained `Ok` value and throws if `Err`.

   To avoid throwing, consider `isOk`, `unwrapOr`, `unwrapOrElse` or
   `match` to handle the `Err` case. To throw a more informative error use
   `expect`.
   
   @example
   const x = Ok(1);
   assert.equal(x.unwrap(), 1);
   
   const x = Err(1);
   const y = x.unwrap(); // throws
   */
   unwrap(): T {
      return this.expect("Failed to unwrap Result (found Err)");
   }

   /**
   Returns the contained `Err` value and throws if `Ok`.

   To avoid throwing, consider `isErr` or `match` to handle the `Ok` case.
   To throw a more informative error use `expectErr`.
   
   @example
   const x = Ok(1);
   const y = x.unwrap(); // throws
   
   const x = Err(1);
   assert.equal(x.unwrap(), 1);
   */
   unwrapErr(): E {
      return this.expectErr("Failed to unwrapErr Result (found Ok)");
   }

   /**
    * Returns the contained `Ok` value or a provided default.
    *
    * The provided default is eagerly evaluated. If you are passing the result
    * of a function call, consider `unwrapOrElse`, which is lazily evaluated.
    *
    * @example
    * const x = Ok(10);
    * assert.equal(x.unwrapOr(1), 10);
    *
    * const x = Err(10);
    * assert.equal(x.unwrapOr(1), 1);
    */
   unwrapOr(def: T): T {
      return this[IsOk] ? (this.val as T) : def;
   }

   /**
    * Returns the contained `Ok` value or computes it from a function.
    *
    * @example
    * const x = Ok(10);
    * assert.equal(x.unwrapOrElse(() => 1 + 1), 10);
    *
    * const x = Err(10);
    * assert.equal(x.unwrapOrElse(() => 1 + 1), 2);
    */
   unwrapOrElse(f: () => T): T {
      return this[IsOk] ? (this.val as T) : f();
   }

   /**
    * Returns the contained `Ok` or `Err` value.
    *
    * Most problems are better solved using one of the other `unwrap_` methods.
    * This method should only be used when you are certain that you need it.
    *
    * @example
    * const x = Ok(10);
    * assert.equal(x.unwrapUnchecked(), 10);
    *
    * const x = Err(20);
    * assert.equal(x.unwrapUnchecked(), 20);
    */
   unwrapUnchecked(): T | E {
      return this.val;
   }

   /**
    * Returns the Option if it is `Ok`, otherwise returns `resb`.
    *
    * `resb` is eagerly evaluated. If you are passing the result of a function
    * call, consider `orElse`, which is lazily evaluated.
    *
    * @example
    * const x = Ok(10);
    * const xor = x.or(Ok(1));
    * assert.equal(xor.unwrap(), 10);
    *
    * const x = Err(10);
    * const xor = x.or(Ok(1));
    * assert.equal(xor.unwrap(), 1);
    */
   or(resb: Result<T, E>): Result<T, E> {
      return this[IsOk] ? this : resb;
   }

   /**
    * Returns the Result if it is `Ok`, otherwise returns the value of `f()`
    * mapping `Result<T, E>` to `Result<T, F>`.
    *
    * @example
    * const x = Ok(10);
    * const xor = x.orElse(() => Ok(1));
    * assert.equal(xor.unwrap(), 10);
    *
    * const x = Err(10);
    * const xor = x.orElse(() => Ok(1));
    * assert.equal(xor.unwrap(), 1);
    *
    * const x = Err(10);
    * const xor = x.orElse((e) => Err(`val ${e}`));
    * assert.equal(xor.unwrapErr(), "val 10");
    */
   orElse<F>(f: (err: E) => Result<T, F>): Result<T, F> {
      return this[IsOk] ? (this as unknown as Result<T, F>) : f(this.val as E);
   }

   /**
    * Returns itself if the Result is `Err`, otherwise returns `resb`.
    *
    * @example
    * const x = Ok(10);
    * const xand = x.and(Ok(1));
    * assert.equal(xand.unwrap(), 1);
    *
    * const x = Err(10);
    * const xand = x.and(Ok(1));
    * assert.equal(xand.unwrapErr(), 10);
    *
    * const x = Ok(10);
    * const xand = x.and(Err(1));
    * assert.equal(xand.unwrapErr(), 1);
    */
   and<U>(resb: Result<U, E>): Result<U, E> {
      return this[IsOk] ? resb : (this as Err<E, any>);
   }

   /**
    * Returns itself if the Result is `Err`, otherwise calls `f` with the `Ok`
    * value and returns the result.
    *
    * @example
    * const x = Ok(10);
    * const xand = x.andThen((n) => n + 1);
    * assert.equal(xand.unwrap(), 11);
    *
    * const x = Err(10);
    * const xand = x.andThen((n) => n + 1);
    * assert.equal(xand.unwrapErr(), 10);
    *
    * const x = Ok(10);
    * const xand = x.and(Err(1));
    * assert.equal(xand.unwrapErr(), 1);
    */
   andThen<U>(f: (val: T) => Result<U, E>): Result<U, E> {
      return this[IsOk] ? f(this.val as T) : (this as Err<E, any>);
   }

   /**
    * Maps a `Result<T, E>` to `Result<U, E>` by applying a function to the
    * `Ok` value.
    *
    * @example
    * const x = Ok(10);
    * const xmap = x.map((n) => `number ${n}`);
    * assert.equal(xmap.unwrap(), "number 10");
    */
   map<U>(f: (val: T) => U): Result<U, E> {
      return new ResultType(
         this[IsOk] ? f(this.val as T) : (this.val as E),
         this[IsOk]
      );
   }

   /**
    * Maps a `Result<T, E>` to `Result<T, F>` by applying a function to the
    * `Err` value.
    *
    * @example
    * const x = Err(10);
    * const xmap = x.mapErr((n) => `number ${n}`);
    * assert.equal(xmap.unwrapErr(), "number 10");
    */
   mapErr<F>(op: (err: E) => F): Result<T, F> {
      return new ResultType(
         this[IsOk] ? (this.val as T) : op(this.val as E),
         this[IsOk]
      );
   }

   /**
    * Returns the provided default if `Err`, otherwise calls `f` with the
    * `Ok` value and returns the result.
    *
    * The provided default is eagerly evaluated. If you are passing the result
    * of a function call, consider `mapOrElse`, which is lazily evaluated.
    *
    * @example
    * const x = Ok(10);
    * const xmap = x.mapOr(1, (n) => n + 1);
    * assert.equal(xmap.unwrap(), 11);
    *
    * const x = Err(10);
    * const xmap = x.mapOr(1, (n) => n + 1);
    * assert.equal(xmap.unwrap(), 1);
    */
   mapOr<U>(def: U, f: (val: T) => U): U {
      return this[IsOk] ? f(this.val as T) : def;
   }

   /**
    * Computes a default return value if `Err`, otherwise calls `f` with the
    * `Ok` value and returns the result.
    *
    * const x = Ok(10);
    * const xmap = x.mapOrElse(() => 1 + 1, (n) => n + 1);
    * assert.equal(xmap.unwrap(), 11);
    *
    * const x = Err(10);
    * const xmap = x.mapOrElse(() => 1 + 1, (n) => n + 1);
    * assert.equal(xmap.unwrap(), 2);
    */
   mapOrElse<U>(def: (err: E) => U, f: (val: T) => U): U {
      return this[IsOk] ? f(this.val as T) : def(this.val as E);
   }

   /**
    * Transforms the `Result<T, E>` into an `Option<T>`, mapping `Ok(v)` to
    * `Some(v)`, discarding any `Err` value and mapping to None.
    *
    * @example
    * const x = Ok(10);
    * const opt = x.ok();
    * assert.equal(x.isSome(), true);
    * assert.equal(x.unwrap(), 10);
    *
    * const x = Err(10);
    * const opt = x.ok();
    * assert.equal(x.isNone(), true);
    * const y = x.unwrap(); // throws
    */
   ok(): Option<T> {
      return this[IsOk] ? Some(this.val as T) : None;
   }
}

/**
 * Tests the provided `val` is an Result. Acts as a type guard for
 * `val is Result<unknown, unknown>`.
 *
 * @example
 * assert.equal(Result.is(Ok(1), true);
 * assert.equal(Result.is(Err(1), true));
 * assert.equal(Result.is(Some(1), false));
 */
export function isResult(val: unknown): val is Result<unknown, unknown> {
   return val instanceof ResultType;
}

/**
 * Creates an `Ok<T, E>` value, which can be used where a `Result<T, E>` is
 * required. See Result for more examples.
 *
 * Note that the counterpart `Err` type `E` is set to the same type as `T`
 * by default. TypeScript will usually infer the correct `E` type from the
 * context (e.g. a function which accepts or returns a Result).
 *
 * @example
 * const x = Ok(10);
 * assert.equal(x.isSome(), true);
 * assert.equal(x.unwrap(), 10);
 */
export function Ok<T, E = T>(val: T): Ok<T, E> {
   return new ResultType<T, E>(val, true) as Ok<T, E>;
}

/**
 * Creates an `Err<E, T>` value, which can be used where a `Result<T, E>` is
 * required. See Result for more examples.
 *
 * Note that the counterpart `Ok` type `T` is set to the same type as `E`
 * by default. TypeScript will usually infer the correct `T` type from the
 * context (e.g. a function which accepts or returns a Result).
 *
 * @example
 * const x = Err(10);
 * assert.equal(x.isErr(), true);
 * assert.equal(x.unwrapErr(), 10);
 */
export function Err<E, T = E>(val: E): Err<E, T> {
   return new ResultType<T, E>(val, false) as Err<E, T>;
}

interface ResultType<T, E> {
   /** @deprecated */
   is_ok: ResultType<T, E>["isOk"];
   /** @deprecated */
   is_err: ResultType<T, E>["isErr"];
   /** @deprecated */
   expect_err: ResultType<T, E>["expectErr"];
   /** @deprecated */
   unwrap_err: ResultType<T, E>["unwrapErr"];
   /** @deprecated */
   unwrap_or: ResultType<T, E>["unwrapOr"];
   /** @deprecated */
   unwrap_or_else: ResultType<T, E>["unwrapOrElse"];
   /** @deprecated */
   unwrap_unchecked: ResultType<T, E>["unwrapUnchecked"];
   /** @deprecated */
   or_else: ResultType<T, E>["orElse"];
   /** @deprecated */
   and_then: ResultType<T, E>["andThen"];
   /** @deprecated */
   map_err: ResultType<T, E>["mapErr"];
   /** @deprecated */
   map_or: ResultType<T, E>["mapOr"];
   /** @deprecated */
   map_or_else: ResultType<T, E>["mapOrElse"];
}

Object.assign(ResultType.prototype, {
   is_ok: ResultType.prototype.isOk,
   is_err: ResultType.prototype.isErr,
   expect_err: ResultType.prototype.expectErr,
   unwrap_err: ResultType.prototype.unwrapErr,
   unwrap_or: ResultType.prototype.unwrapOr,
   unwrap_or_else: ResultType.prototype.unwrapOrElse,
   unwrap_unchecked: ResultType.prototype.unwrapUnchecked,
   or_else: ResultType.prototype.orElse,
   and_then: ResultType.prototype.andThen,
   map_err: ResultType.prototype.mapErr,
   map_or: ResultType.prototype.mapOr,
   map_or_else: ResultType.prototype.mapOrElse,
});

Object.freeze(ResultType.prototype);
Object.freeze(isResult);
Object.freeze(Ok);
Object.freeze(Err);
