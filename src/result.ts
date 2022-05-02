import {
   T_,
   Val,
   EmptyArray,
   IterType,
   FalseyValues,
   isTruthy,
} from "./common";
import { Option, Some, None } from "./option";

export type Ok<T> = Result<T, never>;
export type Err<E> = Result<never, E>;

type From<T> = Exclude<T, Error | FalseyValues>;

type Results<R> = {
   [K in keyof R]: R[K] extends Result<infer T, any> ? T : never;
};

type ResultErrors<R> = {
   [K in keyof R]: R[K] extends Result<any, infer U> ? U : never;
};

class UnreachableError extends Error {
   constructor() {
      super("Unreachable code reached");
   }
}

function unreachable(): never {
   throw new UnreachableError();
}

export class Result<T, E> {
   private readonly [T_]: boolean;
   private readonly [Val]: T | E;

   private constructor(val: T, ok: true);
   private constructor(val: E, ok: false);
   private constructor(val: T | E, ok: boolean) {
      this[Val] = val;
      this[T_] = ok;
   }

   /**
    * Tests the provided `val` is an Result and acts as a type guard.
    *
    * ```
    * assert.equal(Result.is(Ok(1), true);
    * assert.equal(Result.is(Err(1), true));
    * assert.equal(Result.is(Some(1), false));
    * ```
    */
   static is(val: unknown): val is Result<unknown, unknown> {
      return val instanceof Result;
   }

   /**
    * Creates an `Ok<T>` value, which can be used where a `Result<T, E>` is
    * required. See Result for more examples.
    *
    * Note that the counterpart `Err` type `E` is set to the same type as `T`
    * by default. TypeScript will usually infer the correct `E` type from the
    * context (e.g. a function which accepts or returns a Result).
    *
    * ```
    * const x = Ok(10);
    * assert.equal(x.isSome(), true);
    * assert.equal(x.unwrap(), 10);
    * ```
    */
   static Ok<T>(val: T): Ok<T> {
      return new Result(val, true);
   }

   /**
    * Creates an `Err<E>` value, which can be used where a `Result<T, E>` is
    * required. See Result for more examples.
    *
    * Note that the counterpart `Ok` type `T` is set to the same type as `E`
    * by default. TypeScript will usually infer the correct `T` type from the
    * context (e.g. a function which accepts or returns a Result).
    *
    * ```
    * const x = Err(10);
    * assert.equal(x.isErr(), true);
    * assert.equal(x.unwrapErr(), 10);
    * ```
    */
   static Err<E>(val: E): Err<E> {
      return new Result(val, false);
   }

   [Symbol.iterator](this: Result<T, E>): IterType<T> {
      return this.isOk()
         ? (this[Val] as any)[Symbol.iterator]()
         : EmptyArray[Symbol.iterator]();
   }

   /**
    * Returns the contained `T`, or `err` if the result is `Err`. The `err`
    * value must be falsey and defaults to `undefined`.
    *
    * ```
    * const x = Ok(1);
    * assert.equal(x.into(), 1);
    *
    * const x = Err(1);
    * assert.equal(x.into(), undefined);
    *
    * const x = Err(1);
    * assert.equal(x.into(null), null);
    * ```
    */
   into(this: Result<T, E>): T | undefined;
   into<U extends FalseyValues>(this: Result<T, E>, err: U): T | U;
   into(this: Result<T, E>, err?: FalseyValues): T | FalseyValues {
      return this.isOk() ? this[Val] : err;
   }

   /**
    * Compares the Result to `cmp`, returns true if both are `Ok` or both
    * are `Err` and acts as a type guard.
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
   isLike(this: Result<T, E>, cmp: unknown): cmp is Result<unknown, unknown> {
      return cmp instanceof Result && this[T_] === cmp[T_];
   }

   /**
    * Returns true if the Result is `Ok` and acts as a type guard.
    *
    * ```
    * const x = Ok(10);
    * assert.equal(x.isOk(), true);
    *
    * const x = Err(10);
    * assert.equal(x.isOk(), false);
    * ```
    */
   isOk(this: Result<T, E>): this is Ok<T> {
      return this[T_];
   }

   /**
    * Returns true if the Result is `Err` and acts as a type guard.
    *
    * ```
    * const x = Ok(10);
    * assert.equal(x.isErr(), false);
    *
    * const x = Err(10);
    * assert.equal(x.isErr(), true);
    * ```
    */
   isErr(this: Result<T, E>): this is Err<E> {
      return !this[T_];
   }

   /**
    * Creates an `Option<T>` by calling `f` with the contained `Ok` value.
    * Converts `Ok` to `Some` if the filter returns true, or `None` otherwise.
    *
    * For more advanced filtering, consider `match`.
    *
    * ```
    * const x = Ok(1);
    * assert.equal(x.filter((v) => v < 5).isLike(Some(1)), true);
    * assert.equal(x.filter((v) => v < 5).unwrap(), 1);
    *
    * const x = Ok(10);
    * assert.equal(x.filter((v) => v < 5).isNone(), true);
    *
    * const x = Err(1);
    * assert.equal(x.filter((v) => v < 5).isNone(), true);
    * ```
    */
   filter(this: Result<T, E>, f: (val: T) => boolean): Option<T> {
      return this[T_] && f(this[Val] as T) ? Some(this[Val] as T) : None;
   }

   /**
    * Returns the contained `Ok` value and throws `Error(msg)` if `Err`.
    *
    * To avoid throwing, consider `isOk`, `unwrapOr`, `unwrapOrElse` or
    * `match` to handle the `Err` case.
    *
    * ```
    * const x = Ok(1);
    * assert.equal(x.expect("Was Err"), 1);
    *
    * const x = Err(1);
    * const y = x.expect("Was Err"); // throws
    * ```
    */
   expect(this: Result<T, E>, msg: string): T {
      if (this.isOk()) {
         return this[Val];
      } else {
         throw new Error(msg);
      }
   }

   /**
    * Returns the contained `Err` value and throws `Error(msg)` if `Ok`.
    *
    * To avoid throwing, consider `isErr` or `match` to handle the `Ok` case.
    *
    * ```
    * const x = Ok(1);
    * const y = x.expectErr("Was Ok"); // throws
    *
    * const x = Err(1);
    * assert.equal(x.expectErr("Was Ok"), 1);
    * ```
    */
   expectErr(this: Result<T, E>, msg: string): E {
      if (this.isErr()) {
         return this[Val];
      } else {
         throw new Error(msg);
      }
   }

   /**
    * Returns the contained `Ok` value and throws if `Err`.
    *
    * To avoid throwing, consider `isOk`, `unwrapOr`, `unwrapOrElse` or
    * `match` to handle the `Err` case. To throw a more informative error use
    * `expect`.
    *
    * ```
    * const x = Ok(1);
    * assert.equal(x.unwrap(), 1);
    *
    * const x = Err(1);
    * const y = x.unwrap(); // throws
    * ```
    */
   unwrap(this: Result<T, E>): T {
      return this.expect("Failed to unwrap Result (found Err)");
   }

   /**
    * Returns the contained `Err` value and throws if `Ok`.
    *
    * To avoid throwing, consider `isErr` or `match` to handle the `Ok` case.
    * To throw a more informative error use `expectErr`.
    *
    * ```
    * const x = Ok(1);
    * const y = x.unwrap(); // throws
    *
    * const x = Err(1);
    * assert.equal(x.unwrap(), 1);
    * ```
    */
   unwrapErr(this: Result<T, E>): E {
      return this.expectErr("Failed to unwrapErr Result (found Ok)");
   }

   /**
    * Returns the contained `Ok` value or a provided default.
    *
    * The provided default is eagerly evaluated. If you are passing the result
    * of a function call, consider `unwrapOrElse`, which is lazily evaluated.
    *
    * ```
    * const x = Ok(10);
    * assert.equal(x.unwrapOr(1), 10);
    *
    * const x = Err(10);
    * assert.equal(x.unwrapOr(1), 1);
    * ```
    */
   unwrapOr(this: Result<T, E>, def: T): T {
      return this.isOk() ? this[Val] : def;
   }

   /**
    * Returns the contained `Ok` value or computes it from a function.
    *
    * ```
    * const x = Ok(10);
    * assert.equal(x.unwrapOrElse(() => 1 + 1), 10);
    *
    * const x = Err(10);
    * assert.equal(x.unwrapOrElse(() => 1 + 1), 2);
    * ```
    */
   unwrapOrElse(this: Result<T, E>, f: () => T): T {
      return this.isOk() ? this[Val] : f();
   }

   /**
    * Returns the contained `Ok` or `Err` value.
    *
    * Most problems are better solved using one of the other `unwrap_` methods.
    * This method should only be used when you are certain that you need it.
    *
    * ```
    * const x = Ok(10);
    * assert.equal(x.unwrapUnchecked(), 10);
    *
    * const x = Err(20);
    * assert.equal(x.unwrapUnchecked(), 20);
    * ```
    */
   unwrapUnchecked(this: Result<T, E>): T | E {
      return this[Val];
   }

   /**
    * Returns the Option if it is `Ok`, otherwise returns `resb`.
    *
    * `resb` is eagerly evaluated. If you are passing the result of a function
    * call, consider `orElse`, which is lazily evaluated.
    *
    * ```
    * const x = Ok(10);
    * const xor = x.or(Ok(1));
    * assert.equal(xor.unwrap(), 10);
    *
    * const x = Err(10);
    * const xor = x.or(Ok(1));
    * assert.equal(xor.unwrap(), 1);
    * ```
    */
   or(resb: Result<T, E>): Result<T, E> {
      return this.isOk() ? this : resb;
   }

   /**
    * Returns the Result if it is `Ok`, otherwise returns the value of `f()`
    * mapping `Result<T, E>` to `Result<T, F>`.
    *
    * ```
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
    * ```
    */
   orElse<F>(f: (err: E) => Result<T, F>): Result<T, F> {
      return this.isOk() ? this : this.isErr() ? f(this[Val]) : unreachable();
   }

   /**
    * Returns itself if the Result is `Err`, otherwise returns `resb`.
    *
    * ```
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
    * ```
    */
   and<U>(resb: Result<U, E>): Result<U, E> {
      return this.isErr() ? this : resb;
   }

   /**
    * Returns itself if the Result is `Err`, otherwise calls `f` with the `Ok`
    * value and returns the result.
    *
    * ```
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
    * ```
    */
   andThen<U>(this: Result<T, E>, f: (val: T) => Result<U, E>): Result<U, E> {
      return this.isOk() ? f(this[Val]) : this.isErr() ? this : unreachable();
   }

   /**
    * Maps a `Result<T, E>` to `Result<U, E>` by applying a function to the
    * `Ok` value.
    *
    * ```
    * const x = Ok(10);
    * const xmap = x.map((n) => `number ${n}`);
    * assert.equal(xmap.unwrap(), "number 10");
    * ```
    */
   map<U>(this: Result<T, E>, f: (val: T) => U): Result<U, E> {
      return new Result(
         this.isOk() ? f(this[Val]) : this.isErr() ? this[Val] : unreachable(),
         this[T_] as any
      ) as Result<U, E>;
   }

   /**
    * Maps a `Result<T, E>` to `Result<T, F>` by applying a function to the
    * `Err` value.
    *
    * ```
    * const x = Err(10);
    * const xmap = x.mapErr((n) => `number ${n}`);
    * assert.equal(xmap.unwrapErr(), "number 10");
    * ```
    */
   mapErr<F>(this: Result<T, E>, op: (err: E) => F): Result<T, F> {
      return new Result(
         this.isOk() ? this[Val] : this.isErr() ? op(this[Val]) : unreachable(),
         this[T_] as any
      ) as Result<T, F>;
   }

   /**
    * Returns the provided default if `Err`, otherwise calls `f` with the
    * `Ok` value and returns the result.
    *
    * The provided default is eagerly evaluated. If you are passing the result
    * of a function call, consider `mapOrElse`, which is lazily evaluated.
    *
    * ```
    * const x = Ok(10);
    * const xmap = x.mapOr(1, (n) => n + 1);
    * assert.equal(xmap.unwrap(), 11);
    *
    * const x = Err(10);
    * const xmap = x.mapOr(1, (n) => n + 1);
    * assert.equal(xmap.unwrap(), 1);
    * ```
    */
   mapOr<U>(def: U, f: (val: T) => U): U {
      return this.isOk() ? f(this[Val]) : def;
   }

   /**
    * Computes a default return value if `Err`, otherwise calls `f` with the
    * `Ok` value and returns the result.
    *
    * ```
    * const x = Ok(10);
    * const xmap = x.mapOrElse(() => 1 + 1, (n) => n + 1);
    * assert.equal(xmap.unwrap(), 11);
    *
    * const x = Err(10);
    * const xmap = x.mapOrElse(() => 1 + 1, (n) => n + 1);
    * assert.equal(xmap.unwrap(), 2);
    * ```
    */
   mapOrElse<U>(this: Result<T, E>, def: (err: E) => U, f: (val: T) => U): U {
      return this.isOk()
         ? f(this[Val])
         : this.isErr()
         ? def(this[Val])
         : unreachable();
   }

   /**
    * Transforms the `Result<T, E>` into an `Option<T>`, mapping `Ok(v)` to
    * `Some(v)`, discarding any `Err` value and mapping to None.
    *
    * ```
    * const x = Ok(10);
    * const opt = x.ok();
    * assert.equal(x.isSome(), true);
    * assert.equal(x.unwrap(), 10);
    *
    * const x = Err(10);
    * const opt = x.ok();
    * assert.equal(x.isNone(), true);
    * const y = x.unwrap(); // throws
    * ```
    */
   ok(this: Result<T, E>): Option<T> {
      return this[T_] ? Some(this[Val] as T) : None;
   }

   /**
    * Transforms the `Option<Option<T>>` into an `Option<T>`
    *
    * ```
    * const x = Some(Some(10));
    * assert.equal(x.flatten().unwrap(), 10);
    * const y = x.flatten();
    * assert.equal(y.flatten(), Ok(10));
    *
    * const x = Some(None);
    * const y = x.flatten();
    * assert.equal(y.isNone(), true);
    * const z = y.unwrap(); // throws
    * ```
    */
   flatten<T, E>(this: Result<Result<T, E>, E>): Result<T, E> {
      return this.andThen((x) => x);
   }

   /**
    * Creates a new `Result<T, E>` which is `Ok<T>` unless the provided `val` is
    * falsey, an instance of `Error` or an invalid `Date`.
    *
    * The `T` is narrowed to exclude any falsey values or Errors.
    *
    * The `E` type includes:
    * - `null` (if `val` could have been falsey or an invalid date)
    * - `Error` types excluded from `T` (if there are any)
    *
    * **Note:** `null` is not a useful value. Consider `Option.from` or `mapErr`.
    *
    * ```
    * assert.equal(Result.from(1).unwrap(), 1);
    * assert.equal(Result(0).isErr(), true);
    *
    * const err = Result.from(new Error("msg"));
    * assert.equal(err.unwrapErr().message, "msg");
    *
    * // Create a Result<number, string>
    * const x = Option.from(1).okOr("Falsey Value");
    * ```
    */
   static from<T>(
      val: T
   ): Result<
      From<T>,
      | (T extends Error ? T : never)
      | (Extract<FalseyValues, T> extends never ? never : null)
   > {
      return isTruthy(val)
         ? new Result(val as any, !(val instanceof Error) as any)
         : (Result.Err(null) as any);
   }

   /**
    * Creates a new `Result<T, null>` which is `Ok` unless the provided `val` is
    * `undefined`, `null` or `NaN`.
    *
    * **Note:** `null` is not a useful value. Consider `Option.nonNull` or
    * `mapErr`.
    *
    * ```
    * assert.equal(Result.nonNull(1).unwrap(), 1);
    * assert.equal(Result.nonNull(0).unwrap(), 0);
    * assert.equal(Result.nonNull(null).isErr(), true);
    *
    * // Create a Result<number, string>
    * const x = Option.nonNull(1).okOr("Nullish Value");
    * ```
    */
   static nonNull<T>(val: T | null | undefined): Result<T, null> {
      return val === undefined || val === null || val !== val
         ? Result.Err(null)
         : Result.Ok(val);
   }

   /**
    * Creates a new Result<number, null> which is `Ok` when the provided `val` is
    * a finite integer greater than or equal to 0.
    *
    * **Note:** `null` is not a useful value. Consider `Option.qty` or `mapErr`.
    *
    * ```
    * const x = Result.qty("test".indexOf("s"));
    * assert.equal(x.unwrap(), 2);
    *
    * const x = Result.qty("test".indexOf("z"));
    * assert.equal(x.unwrapErr(), null);
    *
    * // Create a Result<number, string>
    * const x = Result.qty("test".indexOf("s")).mapErr(() => "Not Found");
    * ```
    */
   static qty<T extends number>(val: T): Result<number, null> {
      return val >= 0 && Number.isInteger(val)
         ? Result.Ok(val)
         : Result.Err(null);
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
   static safe<T, A extends any[]>(
      fn: (...args: A) => T extends PromiseLike<any> ? never : T,
      ...args: A
   ): Result<T, Error>;
   static safe<T>(promise: Promise<T>): Promise<Result<T, Error>>;
   static safe<T, A extends any[]>(
      fn: ((...args: A) => T) | Promise<T>,
      ...args: A
   ): Result<T, Error> | Promise<Result<T, Error>> {
      if (fn instanceof Promise) {
         return fn.then((val) => Result.Ok(val), Result.toError);
      }

      try {
         return Result.Ok(fn(...args));
      } catch (err) {
         return Result.toError(err);
      }
   }

   static toError(err: unknown): Err<Error> {
      return err instanceof Error
         ? Result.Err(err)
         : Result.Err(new Error(String(err)));
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
   static all<R extends Result<unknown, unknown>[]>(
      ...results: R
   ): Result<Results<R>, ResultErrors<R>[number]> {
      const ok = [];
      for (const result of results) {
         if (result.isOk()) {
            ok.push(result.unwrapUnchecked());
         } else {
            return result as any;
         }
      }

      return Result.Ok(ok as Results<R>);
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
   static any<R extends Result<unknown, unknown>[]>(
      ...results: R
   ): Result<Results<R>[number], ResultErrors<R>> {
      const err = [];
      for (const result of results) {
         if (result.isOk()) {
            return result as any;
         } else {
            err.push(result.unwrapUnchecked());
         }
      }

      return Result.Err(err as ResultErrors<R>);
   }
}

export const Ok = Result.Ok;
export const Err = Result.Err;
