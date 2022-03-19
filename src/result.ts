import { Option, Some, None } from "./option";

const Is = Symbol("Is");
const Val = Symbol("Val");

export type Ok<T> = ResultType<T, never>;
export type Err<E> = ResultType<never, E>;
export type Result<T, E> = ResultType<T, E>;

type ResultTypes<R> = {
   [K in keyof R]: R[K] extends Result<infer T, any> ? T : never;
};

type ResultErrors<R> = {
   [K in keyof R]: R[K] extends Result<any, infer U> ? U : never;
};

class ResultType<T, E> {
   readonly [Is]: boolean;
   readonly [Val]: T | E;

   constructor(val: T | E, ok: boolean) {
      this[Val] = val;
      this[Is] = ok;
      Object.freeze(this);
   }

   /**
    * Compares the Result to `cmp`, returns true if both are `Ok` or both
    * are `Err`. Acts as a type guard for `cmp is Result<unknown, unknown>`.
    *
    * const o = Ok(1);
    * const e = Err(1);
    *
    * assert.equal(o.is(Ok(1))), true);
    * assert.equal(e.is(Err(1)), true);
    * assert.equal(o.is(e), false);
    */
   is(cmp: unknown): cmp is Result<unknown, unknown> {
      return cmp instanceof ResultType && this[Is] === cmp[Is];
   }

   /**
    * Returns the contained `T` if the Result is `Ok`, otherwise returns
    * `null`.
    *
    * ```
    * const x = Ok(1);
    * assert.equal(x.into(), 1);
    *
    * const x = Err(1);
    * assert.equal(x.into(), null);
    * ```
    */
   into(): T | null {
      return this[Is] ? (this[Val] as T) : null;
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
      return this[Is] === cmp[Is] && this[Val] === cmp[Val];
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
      return this[Is] !== cmp[Is] || this[Val] !== cmp[Val];
   }

   /**
    * Returns true if the Result is `Ok`. Acts as a type guard for
    * `this is Ok<T>`.
    *
    * @example
    * const x = Ok(10);
    * assert.equal(x.isOk(), true);
    *
    * const x = Err(10);
    * assert.equal(x.isOk(), false);
    */
   isOk(): this is Ok<T> {
      return this[Is];
   }

   /**
    * Returns true if the Result is `Err`. Acts as a type guard for
    * `this is Err<E>`.
    *
    * @example
    * const x = Ok(10);
    * assert.equal(x.isErr(), false);
    *
    * const x = Err(10);
    * assert.equal(x.isErr(), true);
    */
   isErr(): this is Err<E> {
      return !this[Is];
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
      if (this[Is]) {
         return this[Val] as T;
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
      if (this[Is]) {
         throw new Error(msg);
      } else {
         return this[Val] as E;
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
      return this[Is] ? (this[Val] as T) : def;
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
      return this[Is] ? (this[Val] as T) : f();
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
      return this[Val];
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
      return this[Is] ? (this as any) : resb;
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
      return this[Is] ? (this as unknown as Result<T, F>) : f(this[Val] as E);
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
      return this[Is] ? resb : (this as any);
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
      return this[Is] ? f(this[Val] as T) : (this as any);
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
         this[Is] ? f(this[Val] as T) : (this[Val] as E),
         this[Is]
      ) as Result<U, E>;
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
         this[Is] ? (this[Val] as T) : op(this[Val] as E),
         this[Is]
      ) as Result<T, F>;
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
      return this[Is] ? f(this[Val] as T) : def;
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
      return this[Is] ? f(this[Val] as T) : def(this[Val] as E);
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
      return this[Is] ? Some(this[Val] as T) : None;
   }
}

class OkType<T> extends ResultType<T, never> {
   [Is]: true;
}

class ErrType<E> extends ResultType<never, E> {
   [Is]: false;
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
function is(val: unknown): val is Result<unknown, unknown> {
   return val instanceof ResultType;
}

/**
 * Creates an `Ok<T>` value, which can be used where a `Result<T, E>` is
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
export function Ok<T>(val: T): Ok<T> {
   return new OkType(val, true);
}

/**
 * Creates an `Err<E>` value, which can be used where a `Result<T, E>` is
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
export function Err<E>(val: E): Err<E> {
   return new ErrType(val, false);
}

/**
 * A Result represents success, or failure. If we hold a value
 * of type `Result<T, E>`, we know it is either `Ok<T>` or `Err<E>`.
 *
 * ```
 * const users = ["Simon", "Garfunkel"];
 * function fetch_user(username: string): Result<string, string> {
 *    return users.includes(username)
 *       ? Ok(username)
 *       : Err("*silence*");
 * }
 *
 * function greet(username: string): string {
 *    return fetch_user(username).mapOrElse(
 *       (err) => `Error: ${err}`,
 *       (user) => `Hello ${user}, my old friend!`
 *    );
 * }
 *
 * assert.equal(greet("Simon"), "Hello Simon, my old friend!")
 * assert.equal(greet("SuperKing77"), "Error: *silence*");
 * ```
 *
 * @todo Document new Result
 */
export function Result<T>(val: T): Result<NonNullable<T>, null> {
   return from(val);
}

/**
 * @todo Docs for Result.from
 */
function from<T>(val: T): Result<NonNullable<T>, null> {
   return val === undefined || val === null || val !== val
      ? Err(null)
      : Ok(val as NonNullable<T>);
}

/**
 * Capture the outcome of a function or Promise as a `Result<T, Error>`,
 * preventing throwing (function) or rejection (Promise).
 *
 * **Note:** If the function throws (or the Promise rejects with) a value that
 * is not an instance of `Error`, the value is converted to a string and used
 * as the message text for a new Error instance.
 *
 * ### Usage for functions
 *
 * Calls `fn` with the provided `args` and returns a `Result<T, Error>`. The
 * Result is `Ok` if the provided function returned, or `Err` if it threw.
 *
 * **Note:** Any function which returns a Promise (or PromiseLike) value is
 * rejected by the type signature. `Result<Promise<T>, Error>` is not a useful
 * type, and using it in this way is likely to be a mistake.
 *
 * ```
 * function mightThrow(throws: boolean) {
 *    if (throws) {
 *       throw new Error("Throw");
 *    }
 *    return "Hello World";
 * }
 *
 * const x: Result<string, Error> = Result.safe(mightThrow, true);
 * assert.equal(x.unwrapErr() instanceof Error, true);
 * assert.equal(x.unwrapErr().message, "Throw");
 *
 * const x = Result.safe(() => mightThrow(false));
 * assert.equal(x.unwrap(), "Hello World");
 * ```
 *
 * ### Usage for Promises
 *
 * Accepts `promise` and returns a new Promise which always resolves to
 * `Result<T, Error>`. The Result is `Ok` if the original promise
 * resolved, or `Err` if it rejected.
 *
 * ```
 * async function mightThrow(throws: boolean) {
 *    if (throws) {
 *       throw new Error("Throw")
 *    }
 *    return "Hello World";
 * }
 *
 * const x = await Result.safe(mightThrow(true));
 * assert.equal(x.unwrapErr() instanceof Error, true);
 * assert.equal(x.unwrapErr().message, "Throw");
 *
 * const x = await Result.safe(mightThrow(false));
 * assert.equal(x.unwrap(), "Hello World");
 * ```
 */

function safe<T, A extends any[]>(
   fn: (...args: A) => T extends PromiseLike<any> ? never : T,
   ...args: A
): Result<T, Error>;
function safe<T>(promise: Promise<T>): Promise<Result<T, Error>>;
function safe<T, A extends any[]>(
   fn: ((...args: A) => T) | Promise<T>,
   ...args: A
): Result<T, Error> | Promise<Result<T, Error>> {
   if (fn instanceof Promise) {
      return fn.then(
         (value) => Ok(value),
         (err) =>
            err instanceof Error ? Err(err) : Err(new Error(String(err)))
      );
   }

   try {
      return Ok(fn(...args));
   } catch (err) {
      return err instanceof Error ? Err(err) : Err(new Error(String(err)));
   }
}

/**
 * Converts a number of `Result`s into a single Result. The first `Err` found
 * (if any) is returned, otherwise the new Result is `Ok` and contains an array
 * of all the unwrapped values.
 *
 * ```
 * function num(val: number): Result<number, string> {
 *    return val > 10 ? Ok(val) : Err(`Value ${val} is too low.`);
 * }
 *
 * const xyz = Result.all(num(20), num(30), num(40));
 * const [x, y, z] = xyz.unwrap();
 * assert.equal(x, 20);
 * assert.equal(y, 30);
 * assert.equal(z, 40);
 *
 * const err = Result.all(num(20), num(5), num(40));
 * assert.equal(err.isErr(), true);
 * assert.equal(err.unwrapErr(), "Value 5 is too low.");
 * ```
 */
function all<R extends Result<any, any>[]>(
   ...results: R
): Result<ResultTypes<R>, ResultErrors<R>[number]> {
   const ok = [];
   for (const result of results) {
      if (result.isOk()) {
         ok.push(result.unwrapUnchecked());
      } else {
         return result;
      }
   }

   return Ok(ok) as Ok<ResultTypes<R>>;
}

/**
 * Converts a number of `Result`s into a single Result. The first `Ok` found
 * (if any) is returned, otherwise the new Result is an `Err` containing an
 * array of all the unwrapped errors.
 *
 * ```
 * function num(val: number): Result<number, string> {
 *    return val > 10 ? Ok(val) : Err(`Value ${val} is too low.`);
 * }
 *
 * const x = Result.any(num(5), num(20), num(2));
 * assert.equal(x.unwrap(), 20);
 *
 * const efg = Result.any(num(2), num(5), num(8));
 * const [e, f, g] = efg.unwrapErr();
 * assert.equal(e, "Value 2 is too low.");
 * assert.equal(f, "Value 5 is too low.");
 * assert.equal(g, "Value 8 is too low.");
 * ```
 */
function any<R extends Result<any, any>[]>(
   ...results: R
): Result<ResultTypes<R>[number], ResultErrors<R>> {
   const err = [];
   for (const result of results) {
      if (result.isOk()) {
         return result;
      } else {
         err.push(result.unwrapUnchecked());
      }
   }

   return Err(err) as Err<ResultErrors<R>>;
}

Result.is = Object.freeze(is);
Result.from = Object.freeze(from);
Result.safe = Object.freeze(safe);
Result.all = Object.freeze(all);
Result.any = Object.freeze(any);

Object.freeze(Result);
Object.freeze(Ok);
Object.freeze(Err);
Object.freeze(ResultType);
Object.freeze(ResultType.prototype);
