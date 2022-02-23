import { Option, Some, None } from "./option";

export type Result<T, E> = Ok<T, E> | Err<E, T>;
export type Ok<T, E> = ResultType<T, E> & { __IsOk__: true };
export type Err<E, T> = ResultType<T, E> & { __IsOk__: false };

class ResultType<T, E> {
   private val: T | E;
   readonly __IsOk__: boolean;

   constructor(val: T | E, ok: boolean) {
      this.val = val;
      this.__IsOk__ = ok;
      Object.freeze(this);
   }

   /**
    * Compares the Result to `cmp`, returns true if both are `Ok` or both
    * are `Err`. Acts as a type guard for `cmp is Result<unknown, unknown>`.
    *
    * @example
    * const o = Ok(1);
    * const e = Err(1);
    *
    * assert.equal(o.is(Ok(1))), true);
    * assert.equal(e.is(Err(1)), true);
    * assert.equal(o.is(e), false);
    */
   is(cmp: unknown): cmp is Result<unknown, unknown> {
      return cmp instanceof ResultType && this.__IsOk__ === cmp.__IsOk__;
   }

   /**
    * Compares the Result to `cmp` for equality. Returns `true` when both are
    * the same type (`Ok`/`Err`) and their contained values are identical
    * (`===`).
    *
    * const val = { x: 10 };
    * const o: Result<{ x: number; }, { x: number; }> = Ok(val);
    * const e: Result<{ x: number; }, { x: number; }> = Err(val);
    *
    * assert.equal(o.eq(Ok(val)), true);
    * assert.equal(e.eq(Err(val)), true):
    * assert.equal(o.eq(Ok({ x: 10 })), false);
    * assert.equal(e.eq(Err({ x: 10 })), false);
    * assert.equal(o.eq(e), false);
    */
   eq(cmp: Result<T, E>): boolean {
      return this.__IsOk__ === cmp.__IsOk__ && this.val === cmp.val;
   }

   /**
    * Compares the Result to `cmp` for inequality. Returns true when both are
    * different types (`Ok`/`Err`) or their contained values are not identical
    * (`!==`).
    *
    * const val = { x: 10 };
    * const o: Result<{ x: number; }, { x: number; }> = Ok(val);
    * const e: Result<{ x: number; }, { x: number; }> = Err(val);
    *
    * assert.equal(o.neq(Ok(val)), false);
    * assert.equal(e.neq(Err(val)), false):
    * assert.equal(o.neq(Ok({ x: 10 })), true);
    * assert.equal(e.neq(Err({ x: 10 })), true);
    * assert.equal(o.neq(e), true);
    */
   neq(cmp: Result<T, E>): boolean {
      return this.__IsOk__ !== cmp.__IsOk__ || this.val !== cmp.val;
   }

   /**
    * Returns true if the Result is `Ok`. Acts as a type guard for
    * `this is Ok<T, E>`.
    *
    * @example
    * const x = Ok(10);
    * assert.equal(x.is_ok(), true);
    *
    * const x = Err(10);
    * assert.equal(x.is_ok(), false);
    */
   is_ok(): this is Ok<T, E> {
      return this.__IsOk__;
   }

   /**
    * Returns true if the Result is `Err`. Acts as a type guard for
    * `this is Err<E, T>`.
    *
    * @example
    * const x = Ok(10);
    * assert.equal(x.is_err(), false);
    *
    * const x = Err(10);
    * assert.equal(x.is_err(), true);
    */
   is_err(): this is Err<E, T> {
      return !this.__IsOk__;
   }

   /**
   Returns the contained `Ok` value and throws `Error(msg)` if `Err`.

   To avoid throwing, consider `is_ok`, `unwrap_or`, `unwrap_or_else` or
   `match` to handle the `Err` case.
   
   @example
   const x = Ok(1);
   assert.equal(x.expect("Was Err"), 1);
   
   const x = Err(1);
   const y = x.expect("Was Err"); // throws
   */
   expect(msg: string): T {
      if (this.__IsOk__) {
         return this.val as T;
      } else {
         throw new Error(msg);
      }
   }

   /**
   Returns the contained `Err` value and throws `Error(msg)` if `Ok`.

   To avoid throwing, consider `is_err` or `match` to handle the `Ok` case.
   
   @example
   const x = Ok(1);
   const y = x.expect_err("Was Ok"); // throws

   const x = Err(1);
   assert.equal(x.expect_err("Was Ok"), 1);
   */
   expect_err(msg: string): E {
      if (this.__IsOk__) {
         throw new Error(msg);
      } else {
         return this.val as E;
      }
   }

   /**
   Returns the contained `Ok` value and throws if `Err`.

   To avoid throwing, consider `is_ok`, `unwrap_or`, `unwrap_or_else` or
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

   To avoid throwing, consider `is_err` or `match` to handle the `Ok` case.
   To throw a more informative error use `expect_err`.
   
   @example
   const x = Ok(1);
   const y = x.unwrap(); // throws
   
   const x = Err(1);
   assert.equal(x.unwrap(), 1);
   */
   unwrap_err(): E {
      return this.expect_err("Failed to unwrap_err Result (found Ok)");
   }

   /**
    * Returns the contained `Ok` value or a provided default.
    *
    * The provided default is eagerly evaluated. If you are passing the result
    * of a function call, consider `unwrap_or_else`, which is lazily evaluated.
    *
    * @example
    * const x = Ok(10);
    * assert.equal(x.unwrap_or(1), 10);
    *
    * const x = Err(10);
    * assert.equal(x.unwrap_or(1), 1);
    */
   unwrap_or(def: T): T {
      return this.__IsOk__ ? (this.val as T) : def;
   }

   /**
    * Returns the contained `Ok` value or computes it from a function.
    *
    * @example
    * const x = Ok(10);
    * assert.equal(x.unwrap_or_else(() => 1 + 1), 10);
    *
    * const x = Err(10);
    * assert.equal(x.unwrap_or_else(() => 1 + 1), 2);
    */
   unwrap_or_else(f: () => T): T {
      return this.__IsOk__ ? (this.val as T) : f();
   }

   /**
    * Returns the contained `Ok` or `Err` value.
    *
    * Most problems are better solved using one of the other `unwrap_` methods.
    * This method should only be used when you are certain that you need it.
    *
    * @example
    * const x = Ok(10);
    * assert.equal(x.unwrap_unchecked(), 10);
    *
    * const x = Err(20);
    * assert.equal(x.unwrap_unchecked(), 20);
    */
   unwrap_unchecked(): T | E {
      return this.val;
   }

   /**
    * Returns the Option if it is `Ok`, otherwise returns `resb`.
    *
    * `resb` is eagerly evaluated. If you are passing the result of a function
    * call, consider `or_else`, which is lazily evaluated.
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
      return this.__IsOk__ ? this : resb;
   }

   /**
    * Returns the Result if it is `Ok`, otherwise returns the value of `f()`
    * mapping `Result<T, E>` to `Result<T, F>`.
    *
    * @example
    * const x = Ok(10);
    * const xor = x.or_else(() => Ok(1));
    * assert.equal(xor.unwrap(), 10);
    *
    * const x = Err(10);
    * const xor = x.or_else(() => Ok(1));
    * assert.equal(xor.unwrap(), 1);
    *
    * const x = Err(10);
    * const xor = x.or_else((e) => Err(`val ${e}`));
    * assert.equal(xor.unwrap_err(), "val 10");
    */
   or_else<F>(f: (err: E) => Result<T, F>): Result<T, F> {
      return this.__IsOk__
         ? (this as unknown as Result<T, F>)
         : f(this.val as E);
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
    * assert.equal(xand.unwrap_err(), 10);
    *
    * const x = Ok(10);
    * const xand = x.and(Err(1));
    * assert.equal(xand.unwrap_err(), 1);
    */
   and(resb: Result<T, E>): Result<T, E> {
      return this.__IsOk__ ? resb : this;
   }

   /**
    * Returns itself if the Result is `Err`, otherwise calls `f` with the `Ok`
    * value and returns the result.
    *
    * @example
    * const x = Ok(10);
    * const xand = x.and_then((n) => n + 1);
    * assert.equal(xand.unwrap(), 11);
    *
    * const x = Err(10);
    * const xand = x.and_then((n) => n + 1);
    * assert.equal(xand.unwrap_err(), 10);
    *
    * const x = Ok(10);
    * const xand = x.and(Err(1));
    * assert.equal(xand.unwrap_err(), 1);
    */
   and_then<U>(f: (val: T) => Result<U, E>): Result<U, E> {
      return this.__IsOk__ ? f(this.val as T) : (this as Err<E, any>);
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
         this.__IsOk__ ? f(this.val as T) : (this.val as E),
         this.__IsOk__
      );
   }

   /**
    * Maps a `Result<T, E>` to `Result<T, F>` by applying a function to the
    * `Err` value.
    *
    * @example
    * const x = Err(10);
    * const xmap = x.map_err((n) => `number ${n}`);
    * assert.equal(xmap.unwrap_err(), "number 10");
    */
   map_err<F>(op: (err: E) => F): Result<T, F> {
      return new ResultType(
         this.__IsOk__ ? (this.val as T) : op(this.val as E),
         this.__IsOk__
      );
   }

   /**
    * Returns the provided default if `Err`, otherwise calls `f` with the
    * `Ok` value and returns the result.
    *
    * The provided default is eagerly evaluated. If you are passing the result
    * of a function call, consider `map_or_else`, which is lazily evaluated.
    *
    * @example
    * const x = Ok(10);
    * const xmap = x.map_or(1, (n) => n + 1);
    * assert.equal(xmap.unwrap(), 11);
    *
    * const x = Err(10);
    * const xmap = x.map_or(1, (n) => n + 1);
    * assert.equal(xmap.unwrap(), 1);
    */
   map_or<U>(def: U, f: (val: T) => U): U {
      return this.__IsOk__ ? f(this.val as T) : def;
   }

   /**
    * Computes a default return value if `Err`, otherwise calls `f` with the
    * `Ok` value and returns the result.
    *
    * const x = Ok(10);
    * const xmap = x.map_or_else(() => 1 + 1, (n) => n + 1);
    * assert.equal(xmap.unwrap(), 11);
    *
    * const x = Err(10);
    * const xmap = x.map_or_else(() => 1 + 1, (n) => n + 1);
    * assert.equal(xmap.unwrap(), 2);
    */
   map_or_else<U>(def: (err: E) => U, f: (val: T) => U): U {
      return this.__IsOk__ ? f(this.val as T) : def(this.val as E);
   }

   /**
    * Transforms the `Result<T, E>` into an `Option<T>`, mapping `Ok(v)` to
    * `Some(v)`, discarding any `Err` value and mapping to None.
    *
    * @example
    * const x = Ok(10);
    * const opt = x.ok();
    * assert.equal(x.is_some(), true);
    * assert.equal(x.unwrap(), 10);
    *
    * const x = Err(10);
    * const opt = x.ok();
    * assert.equal(x.is_none(), true);
    * const y = x.unwrap(); // throws
    */
   ok(): Option<T> {
      return this.__IsOk__ ? Some(this.val as T) : None;
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
export function IsResult(val: unknown): val is Result<unknown, unknown> {
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
 * assert.equal(x.is_some(), true);
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
 * assert.equal(x.is_err(), true);
 * assert.equal(x.unwrap_err(), 10);
 */
export function Err<E, T = E>(val: E): Err<E, T> {
   return new ResultType<T, E>(val, false) as Err<E, T>;
}

interface ResultType<T, E> {
   isOk: ResultType<T, E>["is_ok"];
   isErr: ResultType<T, E>["is_err"];
   expectErr: ResultType<T, E>["expect_err"];
   unwrapErr: ResultType<T, E>["unwrap_err"];
   unwrapOr: ResultType<T, E>["unwrap_or"];
   unwrapOrElse: ResultType<T, E>["unwrap_or_else"];
   unwrapUnchecked: ResultType<T, E>["unwrap_unchecked"];
   orElse: ResultType<T, E>["or_else"];
   andThen: ResultType<T, E>["and_then"];
   mapErr: ResultType<T, E>["map_err"];
   mapOr: ResultType<T, E>["map_or"];
   mapOrElse: ResultType<T, E>["map_or_else"];
}

Object.assign(ResultType.prototype, {
   isOk: ResultType.prototype.is_ok,
   isErr: ResultType.prototype.is_err,
   expectErr: ResultType.prototype.expect_err,
   unwrapErr: ResultType.prototype.unwrap_err,
   unwrapOr: ResultType.prototype.unwrap_or,
   unwrapOrElse: ResultType.prototype.unwrap_or_else,
   unwrapUnchecked: ResultType.prototype.unwrap_unchecked,
   orElse: ResultType.prototype.or_else,
   andThen: ResultType.prototype.and_then,
   mapErr: ResultType.prototype.map_err,
   mapOr: ResultType.prototype.map_or,
   mapOrElse: ResultType.prototype.map_or_else,
});

Object.freeze(ResultType.prototype);
Object.freeze(IsResult);
Object.freeze(Ok);
Object.freeze(Err);
