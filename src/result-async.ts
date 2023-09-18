import { T, Val, EmptyArray, IterType, FalseyValues, isTruthy } from "./common";
import { Option, Some, None } from "./option";
import { OptionAsync } from "./option-async";
import { Result, Ok, Err } from "./result";
import {
   _promise,
   _safe,
   _ok,
   _value,
   Safe,
   Unsafe,
   SafeVariants,
   UnsafeVariants,
} from "./symbols";

type ResultTypes<R> = {
   [K in keyof R]: R[K] extends Result<infer T, any> ? T : never;
};

type ResultErrors<R> = {
   [K in keyof R]: R[K] extends Result<any, infer U> ? U : never;
};

class ResultAsyncRejection extends Error {
   originalError: unknown;

   constructor(message: string, originalError: unknown) {
      super(message);
      this.originalError = originalError;
   }
}

export class ResultAsync<T, E> implements PromiseLike<Result<T, E>> {
   // readonly [T]: boolean;
   readonly [_promise]: Promise<Result<T, E>>;
   readonly [_safe]: boolean = true;

   then<U, F>(
      onfulfilled?: ((value: Result<T, E>) => U | PromiseLike<U>) | null,
      onrejected?: ((reason: unknown) => F | PromiseLike<F>) | null
   ): PromiseLike<U | F> {
      return this[_promise].then(onfulfilled, onrejected);
   }

   constructor(promise: Promise<Result<T, E>>, safe = true) {
      this[_promise] = promise;
      this[_safe] = safe;
   }

   /** @todo Not verified */
   [Symbol.asyncIterator](this: ResultAsync<T, E>): Promise<IterType<T>> {
      return this[_promise].then((val) => val[Symbol.iterator]());
   }

   [Symbol.iterator](this: Result<T, E>): IterType<T> {
      return this[_ok]
         ? (this[_value] as any)[Symbol.iterator]()
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
   async into(this: ResultAsync<T, E>): Promise<T | undefined>;
   async into<U extends FalseyValues>(
      this: ResultAsync<T, E>,
      err: U
   ): Promise<T | U>;
   async into(
      this: ResultAsync<T, E>,
      err?: FalseyValues
   ): Promise<T | FalseyValues> {
      return (await this._resolve()).into(err);
   }

   /**
    * Returns a tuple of `[null, T]` if the result is `Ok`, or `[E, null]`
    * otherwise.
    *
    * ```
    * const x: Result<number, string> = Ok(1);
    * assert.deepEqual(x.intoTuple(), [null, 1]);
    *
    * const x: Result<number, string> = Err("error")
    * assert.deepEqual(x.intoTuple(), ["error", null]);
    * ```
    */
   // intoTuple<U, F>(
   //    this: ResultAsync<UnsafeResult<U, F>, E>
   // ): Promise<[undefined, U] | [E | F, undefined]>;
   // intoTuple<U, F>(
   //    this: ResultAsync<SafeResult<U, F>, E>
   // ): Promise<[undefined, U] | [F, undefined]>;
   // intoTuple(this: ResultAsync<T, E>): Promise<[undefined, T] | [E, undefined]>;
   // intoTuple(this: any): any {
   //    // return this[_promise].then(async () => {
   //    //    const res = await this[_promise];
   //    //    (result) => result.intoTuple(), (error) => [error, undefined];
   //    // });
   //    return null as any;
   // }

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
      return this[_ok] && f(this[_value] as T) ? Some(this[_value] as T) : None;
   }

   /**
    * Flatten a nested `Result<Result<T, E>, F>` to a `Result<T, E | F>`.
    *
    * ```
    * type NestedResult = Result<Result<string, number>, boolean>;
    *
    * const x: NestedResult = Ok(Ok(1));
    * assert.equal(x.flatten().unwrap(), 1);
    *
    * const x: NestedResult = Ok(Err(1));
    * assert.equal(x.flatten().unwrapErr(), 1);
    *
    * const x: NestedResult = Err(false);
    * assert.equal(x.flatten().unwrapErr(), false);
    * ```
    */
   flatten<U, F>(
      this: Safe<ResultAsync<Result<U, F>, E>>
   ): Safe<ResultAsync<U, E | F>>;
   flatten<U, F>(
      this: Unsafe<ResultAsync<Result<U, F>, E>>
   ): Unsafe<ResultAsync<U, E | F>>;
   flatten<U, F>(
      this: ResultAsync<Result<U, F>, E>
   ): ResultAsync<U, E | F | ResultAsyncRejection>;
   flatten<U, F>(
      this: ResultAsync<Result<U, F>, E>
   ): ResultAsync<U, E | F | ResultAsyncRejection> {
      return new ResultAsync<U, E | F | ResultAsyncRejection>(
         this[_promise].then(
            (result) => result.flatten(),
            (err) => this._error(err)
         ),
         this[_safe]
      );
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
   async expect(this: ResultAsync<T, E>, msg: string): Promise<T>;
   async expect<E extends Error>(
      this: ResultAsync<T, E>,
      msg?: string
   ): Promise<T>;
   async expect(this: ResultAsync<T, E>, msg?: string): Promise<T> {
      return this._resolve().then((result) => result.expect(msg as string));
   }

   private async _resolve(this: Safe<ResultAsync<T, E>>): Promise<Result<T, E>>;
   private async _resolve(
      this: Unsafe<ResultAsync<T, E>>
   ): Promise<Result<T, E>>;
   private async _resolve(
      this: ResultAsync<T, E>
   ): Promise<Result<T, E | ResultAsyncRejection>>;
   private async _resolve(this: ResultAsync<T, E>): Promise<Result<T, E>> {
      try {
         return await this[_promise];
      } catch (err) {
         /** @todo Check casting */
         return this._error(err) as Err<E>;
      }
   }

   private _error(err: unknown): Err<ResultAsyncRejection> {
      if (this[_safe]) {
         const message = err instanceof Error ? err.message : `${err}`;
         return Err(new ResultAsyncRejection(message, err));
      } else {
         throw err;
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
   async expectErr(this: ResultAsync<T, E>, msg: string): Promise<E> {
      const result = await this._resolve();
      if (result[_ok]) {
         throw new Error(msg);
      } else {
         return result[_value] as E;
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
   async unwrap(this: ResultAsync<T, E>): Promise<T> {
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
   unwrapErr(this: ResultAsync<T, E>): Promise<E> {
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
      return this[_ok] ? (this[_value] as T) : def;
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
      return this[_ok] ? (this[_value] as T) : f();
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
   unwrapUnchecked(this: Safe<ResultAsync<T, E>>): Promise<Safe<Result<T, E>>>;
   unwrapUnchecked(
      this: Unsafe<ResultAsync<T, E>>
   ): Promise<Unsafe<Result<T, E>>>;
   unwrapUnchecked(this: ResultAsync<T, E>): Promise<Result<T, E>>;
   unwrapUnchecked(this: ResultAsync<T, E>): Promise<Result<T, E>> {
      return this[_promise];
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
   or(this: Result<T, E>, resb: Result<T, E>): Result<T, E> {
      return this[_ok] ? (this as any) : resb;
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
   orElse<F>(this: Result<T, E>, f: (err: E) => Result<T, F>): Result<T, F> {
      return this[_ok]
         ? (this as unknown as Result<T, F>)
         : f(this[_value] as E);
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
   and<U>(this: Result<T, E>, resb: Result<U, E>): Result<U, E> {
      return this[_ok] ? resb : (this as any);
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
   andThen<U>(
      this: Safe<ResultAsync<T, E>>,
      f: (val: T) => SafeVariants<Result<U, E>>
   ): Safe<ResultAsync<T, E>>;
   andThen<U>(
      this: Unsafe<ResultAsync<T, E>>,
      f: (val: T) => UnsafeVariants<Result<U, E>>
   ): Unsafe<ResultAsync<U, E>>;
   andThen<U>(
      this: ResultAsync<T, E>,
      f: (val: T) => UnsafeVariants<Result<T, E>>
   ): ResultAsync<U, E | ResultAsyncRejection>;
   andThen<U>(
      this: ResultAsync<T, E>,
      f: (val: T) => UnsafeVariants<Result<T, E>>
   ): ResultAsync<U, E | ResultAsyncRejection> {
      return new ResultAsync(
         this[_promise]
            .then((result) =>
               result[_ok] ? f(result[_value] as T) : Err(result[_value] as E)
            )
            .then(null, (err) => this._error(err)),
         this[_safe]
      );
   }

   unsafe(): Unsafe<ResultAsync<T, Exclude<E, ResultAsyncRejection>>> {
      return new ResultAsync(this[_promise], false) as any;
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
   map<U>(
      this: Safe<ResultAsync<T, E>>,
      f: (val: T) => SafeVariants<U>
   ): Safe<ResultAsync<U, E>>;
   map<U>(
      this: Unsafe<ResultAsync<T, E>>,
      f: (val: T) => UnsafeVariants<U>
   ): Unsafe<ResultAsync<U, E>>;
   map<U>(
      this: ResultAsync<T, E>,
      f: (val: T) => UnsafeVariants<U>
   ): ResultAsync<U, E | ResultAsyncRejection>;
   map<U>(
      this: ResultAsync<T, E>,
      f: (val: T) => U | Promise<U>
   ): ResultAsync<U, E | ResultAsyncRejection> {
      return new ResultAsync<U, E | ResultAsyncRejection>(
         this[_promise]
            .then(async (result) =>
               result[_ok]
                  ? Ok(await f(result[_value] as T))
                  : Err(result[_value] as E)
            )
            .catch((err) => this._error(err)),
         this[_safe]
      );
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
   mapErr<F>(
      this: Safe<ResultAsync<T, E>>,
      op: (err: E) => SafeVariants<F>
   ): Safe<ResultAsync<T, F>>;
   mapErr<F>(
      this: Unsafe<ResultAsync<T, E>>,
      op: (err: E) => UnsafeVariants<F>
   ): Unsafe<ResultAsync<T, F>>;
   mapErr<F>(
      this: ResultAsync<T, E>,
      op: (err: E) => UnsafeVariants<F>
   ): ResultAsync<T, F | ResultAsyncRejection>;
   mapErr<F>(
      this: ResultAsync<T, E>,
      op: (err: E) => UnsafeVariants<F>
   ): ResultAsync<T, F | ResultAsyncRejection> {
      return new ResultAsync<T, F | ResultAsyncRejection>(
         this[_promise]
            .then(async (result) =>
               result[_ok]
                  ? Ok(result[_value] as T)
                  : Err(await op(result[_value] as E))
            )
            .catch((err) => this._error(err)),
         this[_safe]
      );
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
   async mapOr<U>(
      this: ResultAsync<T, E>,
      def: U,
      f: (val: T) => U | PromiseLike<U>
   ): Promise<U> {
      const result = await this._resolve();
      if (result[_ok]) {
         return f(result[_value] as T);
      }

      return def;
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
   async mapOrElse<U>(
      this: ResultAsync<T, E>,
      def: (err: E) => U | PromiseLike<U>,
      f: (val: T) => U | PromiseLike<U>
   ): Promise<U> {
      const result = await this._resolve();
      return result[_ok] ? f(result[_value] as T) : def(result[_value] as E);
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
   ok(this: Safe<ResultAsync<T, E>>): Safe<OptionAsync<T>>;
   ok(this: Unsafe<ResultAsync<T, E>>): Safe<OptionAsync<T>>;
   ok(this: ResultAsync<T, E>): OptionAsync<T>;
   ok(this: ResultAsync<T, E>): OptionAsync<T> {
      return new OptionAsync(
         this[_promise].then((result) => result.ok()),
         this[_safe]
      );
   }
}
