import { T, Val, EmptyArray, IterType, FalseyValues, isTruthy } from "./common";
import { Result, Ok, Err } from "./result";
import { Option, Some, None } from "./option";
import {
   _promise,
   _safe,
   _some,
   _value,
   Safe,
   Unsafe,
   SafeVariants,
   UnsafeVariants,
} from "./symbols";

type From<T> = Exclude<T, Error | FalseyValues>;

type OptionTypes<O> = {
   [K in keyof O]: O[K] extends Option<infer T> ? T : never;
};

class OptionAsyncRejection extends Error {
   originalError: unknown;

   constructor(message: string, originalError: unknown) {
      super(message);
      this.originalError = originalError;
   }
}

export class OptionAsync<T> {
   readonly [_promise]: Promise<Option<T>>;
   readonly [_safe]: boolean;

   constructor(val: Promise<Option<T>>, safe = true) {
      this[_promise] = val;
      this[_safe] = safe;
   }

   [Symbol.iterator](this: Option<T>): IterType<T> {
      return this[_some]
         ? (this[_value] as any)[Symbol.iterator]()
         : EmptyArray[Symbol.iterator]();
   }

   /**
    * Return the contained `T`, or `none` if the option is `None`. The `none`
    * value must be falsey and defaults to `undefined`.
    *
    * ```
    * const x: Option<number> = Some(1);
    * assert.equal(x.into(), 1);
    *
    * const x: Option<number> = None;
    * assert.equal(x.into(), undefined);
    *
    * const x: Option<number> = None;
    * assert.equal(x.into(null), null);
    * ```
    */
   into(this: Option<T>): T | undefined;
   into<U extends FalseyValues>(this: Option<T>, none: U): T | U;
   into(this: Option<T>, none?: FalseyValues): T | FalseyValues {
      return this[_some] ? this[_value] : none;
   }

   /**
    * Calls `f` with the contained `Some` value, converting `Some` to `None` if
    * the filter returns false.
    *
    * For more advanced filtering, consider `match`.
    *
    * ```
    * const x = Some(1);
    * assert.equal(x.filter((v) => v < 5).unwrap(), 1);
    *
    * const x = Some(10);
    * assert.equal(x.filter((v) => v < 5).isNone(), true);
    *
    * const x: Option<number> = None;
    * assert.equal(x.filter((v) => v < 5).isNone(), true);
    * ```
    */
   filter(this: Option<T>, f: (val: T) => boolean): Option<T> {
      return this[_some] && f(this[_value]) ? this : None;
   }

   /**
    * Flatten a nested `Option<Option<T>>` to an `Option<T>`.
    *
    * ```
    * type NestedOption = Option<Option<number>>;
    *
    * const x: NestedOption = Some(Some(1));
    * assert.equal(x.flatten().unwrap(), 1);
    *
    * const x: NestedOption = Some(None);
    * assert.equal(x.flatten().isNone(), true);
    *
    * const x: NestedOption = None;
    * assert.equal(x.flatten().isNone(), true);
    * ```
    */
   flatten<U>(this: Option<Option<U>>): Option<U> {
      return this[_some] ? this[_value] : None;
   }

   /**
    * Returns the contained `Some` value and throws `Error(msg)` if `None`.
    *
    * To avoid throwing, consider `Is`, `unwrapOr`, `unwrapOrElse` or
    * `match` to handle the `None` case.
    *
    * ```
    * const x = Some(1);
    * assert.equal(x.expect("Is empty"), 1);
    *
    * const x: Option<number> = None;
    * const y = x.expect("Is empty"); // throws
    * ```
    */
   async expect(this: OptionAsync<T>, msg: string): Promise<T> {
      let option: Option<T>;
      try {
         option = await this[_promise];
      } catch (err) {
         throw new Error(msg);
      }

      return option.expect(msg);
   }

   /**
    * Returns the contained `Some` value and throws if `None`.
    *
    * To avoid throwing, consider `isSome`, `unwrapOr`, `unwrapOrElse` or
    * `match` to handle the `None` case. To throw a more informative error use
    * `expect`.
    *
    * ```
    * const x = Some(1);
    * assert.equal(x.unwrap(), 1);
    *
    * const x: Option<number> = None;
    * const y = x.unwrap(); // throws
    * ```
    */
   unwrap(this: OptionAsync<T>): Promise<T> {
      return this.expect("Failed to unwrap Option (found None)");
   }

   /**
    * Returns the contained `Some` value or a provided default.
    *
    * The provided default is eagerly evaluated. If you are passing the result
    * of a function call, consider `unwrapOrElse`, which is lazily evaluated.
    *
    * ```
    * const x = Some(10);
    * assert.equal(x.unwrapOr(1), 10);
    *
    * const x: Option<number> = None;
    * assert.equal(x.unwrapOr(1), 1);
    * ```
    */
   unwrapOr(this: Option<T>, def: T): T {
      return this[_some] ? this[_value] : def;
   }

   /**
    * Returns the contained `Some` value or computes it from a function.
    *
    * ```
    * const x = Some(10);
    * assert.equal(x.unwrapOrElse(() => 1 + 1), 10);
    *
    * const x: Option<number> = None;
    * assert.equal(x.unwrapOrElse(() => 1 + 1), 2);
    * ```
    */
   unwrapOrElse(this: Option<T>, f: () => T): T {
      return this[_some] ? this[_value] : f();
   }

   /**
    * Returns the contained `Some` value or undefined if `None`.
    *
    * Most problems are better solved using one of the other `unwrap_` methods.
    * This method should only be used when you are certain that you need it.
    *
    * ```
    * const x = Some(10);
    * assert.equal(x.unwrapUnchecked(), 10);
    *
    * const x: Option<number> = None;
    * assert.equal(x.unwrapUnchecked(), undefined);
    * ```
    */
   unwrapUnchecked(this: Option<T>): T | undefined {
      return this[_value];
   }

   /**
    * Returns the Option if it is `Some`, otherwise returns `optb`.
    *
    * `optb` is eagerly evaluated. If you are passing the result of a function
    * call, consider `orElse`, which is lazily evaluated.
    *
    * ```
    * const x = Some(10);
    * const xor = x.or(Some(1));
    * assert.equal(xor.unwrap(), 10);
    *
    * const x: Option<number> = None;
    * const xor = x.or(Some(1));
    * assert.equal(xor.unwrap(), 1);
    * ```
    */
   or(this: Option<T>, optb: Option<T>): Option<T> {
      return this[_some] ? this : optb;
   }

   /**
    * Returns the Option if it is `Some`, otherwise returns the value of `f()`.
    *
    * ```
    * const x = Some(10);
    * const xor = x.orElse(() => Some(1));
    * assert.equal(xor.unwrap(), 10);
    *
    * const x: Option<number> = None;
    * const xor = x.orElse(() => Some(1));
    * assert.equal(xor.unwrap(), 1);
    * ```
    */
   orElse(this: Option<T>, f: () => Option<T>): Option<T> {
      return this[_some] ? this : f();
   }

   /**
    * Returns `None` if the Option is `None`, otherwise returns `optb`.
    *
    * ```
    * const x = Some(10);
    * const xand = x.and(Some(1));
    * assert.equal(xand.unwrap(), 1);
    *
    * const x: Option<number> = None;
    * const xand = x.and(Some(1));
    * assert.equal(xand.isNone(), true);
    *
    * const x = Some(10);
    * const xand = x.and(None);
    * assert.equal(xand.isNone(), true);
    * ```
    */
   and<U>(this: Option<T>, optb: Option<U>): Option<U> {
      return this[_some] ? optb : None;
   }

   /**
    * Returns `None` if the option is `None`, otherwise calls `f` with the
    * `Some` value and returns the result.
    *
    * ```
    * const x = Some(10);
    * const xand = x.andThen((n) => n + 1);
    * assert.equal(xand.unwrap(), 11);
    *
    * const x: Option<number> = None;
    * const xand = x.andThen((n) => n + 1);
    * assert.equal(xand.isNone(), true);
    *
    * const x = Some(10);
    * const xand = x.andThen(() => None);
    * assert.equal(xand.isNone(), true);
    * ```
    */
   andThen<U>(this: Option<T>, f: (val: T) => Option<U>): Option<U> {
      return this[_some] ? f(this[_value]) : None;
   }

   /**
    * Maps an `Option<T>` to `Option<U>` by applying a function to the `Some`
    * value.
    *
    * ```
    * const x = Some(10);
    * const xmap = x.map((n) => `number ${n}`);
    * assert.equal(xmap.unwrap(), "number 10");
    * ```
    */
   map<U>(
      this: Safe<OptionAsync<T>>,
      f: (val: T) => SafeVariants<U>
   ): Safe<OptionAsync<T>>;
   map<U>(
      this: Unsafe<OptionAsync<T>>,
      f: (val: T) => UnsafeVariants<U>
   ): Unsafe<OptionAsync<U>>;
   map<U>(
      this: OptionAsync<T>,
      f: (val: T) => U | PromiseLike<U>
   ): OptionAsync<U> {
      return new OptionAsync(
         this[_promise]
            .then(async (option) =>
               option[_some] ? Some(await f(option[_value])) : None
            )
            .catch((err) => this._error(err)),
         this[_safe]
      );
   }

   private _error(this: OptionAsync<T>, err: unknown): Option<never> {
      if (this[_safe]) {
         return None;
      } else {
         throw err;
      }
   }

   /**
    * Returns the provided default if `None`, otherwise calls `f` with the
    * `Some` value and returns the result.
    *
    * The provided default is eagerly evaluated. If you are passing the result
    * of a function call, consider `mapOrElse`, which is lazily evaluated.
    *
    * ```
    * const x = Some(10);
    * const xmap = x.mapOr(1, (n) => n + 1);
    * assert.equal(xmap.unwrap(), 11);
    *
    * const x: Option<number> = None;
    * const xmap = x.mapOr(1, (n) => n + 1);
    * assert.equal(xmap.unwrap(), 1);
    * ```
    */
   async mapOr<U>(
      this: OptionAsync<T>,
      def: U,
      f: (val: T) => U | PromiseLike<U>
   ): Promise<U> {
      const result = await this._resolve();
      if (result[_some]) {
         return f(result[_value]);
      }

      return def;
   }

   private async _resolve(this: OptionAsync<T>): Promise<Option<T>> {
      try {
         return await this[_promise];
      } catch (err) {
         return this._error(err);
      }
   }

   /**
    * Computes a default return value if `None`, otherwise calls `f` with the
    * `Some` value and returns the result.
    *
    * const x = Some(10);
    * const xmap = x.mapOrElse(() => 1 + 1, (n) => n + 1);
    * assert.equal(xmap.unwrap(), 11);
    *
    * const x: Option<number> = None;
    * const xmap = x.mapOrElse(() => 1 + 1, (n) => n + 1);
    * assert.equal(xmap.unwrap(), 2);
    * ```
    */
   async mapOrElse<U>(
      this: OptionAsync<T>,
      def: () => U | PromiseLike<U>,
      f: (val: T) => U | PromiseLike<U>
   ): Promise<U> {
      const option = await this._resolve();
      return option[_some] ? f(option[_value] as T) : def();
   }

   /**
    * Transforms the `Option<T>` into a `Result<T, E>`, mapping `Some(v)` to
    * `Ok(v)` and `None` to `Err(err)`.
    *
    * ```
    * const x = Some(10);
    * const res = x.okOr("Is empty");
    * assert.equal(x.isOk(), true);
    * assert.equal(x.unwrap(), 10);
    *
    * const x: Option<number> = None;
    * const res = x.okOr("Is empty");
    * assert.equal(x.isErr(), true);
    * assert.equal(x.unwrap_err(), "Is empty");
    * ```
    */
   okOr<E>(this: Option<T>, err: E): Result<T, E> {
      return this[_some] ? Ok(this[_value]) : Err(err);
   }

   /**
    * Transforms the `Option<T>` into a `Result<T, E>`, mapping `Some(v)` to
    * `Ok(v)` and `None` to `Err(f())`.
    *
    * ```
    * const x = Some(10);
    * const res = x.okOrElse(() => ["Is", "empty"].join(" "));
    * assert.equal(x.isOk(), true);
    * assert.equal(x.unwrap(), 10);
    *
    * const x: Option<number> = None;
    * const res = x.okOrElse(() => ["Is", "empty"].join(" "));
    * assert.equal(x.isErr(), true);
    * assert.equal(x.unwrap_err(), "Is empty");
    * ```
    */
   okOrElse<E>(this: Option<T>, f: () => E): Result<T, E> {
      return this[_some] ? Ok(this[_value]) : Err(f());
   }
}
