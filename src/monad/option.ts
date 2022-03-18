import { Result, Ok, Err } from "./result";

const IsSome = Symbol("IsSome");

export type Option<T> = Some<T> | None<T>;
export type Some<T> = OptionType<T> & { [IsSome]: true };
export type None<T> = OptionType<T> & { [IsSome]: false };

class OptionType<T> {
   private val: T;
   readonly [IsSome]: boolean;

   constructor(val: T, some: boolean) {
      this.val = val;
      this[IsSome] = some;
      Object.freeze(this);
   }

   /**
    * Compares the Option to `cmp`, returns true if both are `Some` or both
    * are `None`. Acts as a type guard for `cmp is Option<unknown>`.
    *
    * ```
    * const s: Option<number> = Some(1);
    * const n: Option<number> = None;
    *
    * assert.equal(s.is(Some(10)), true);
    * assert.equal(n.is(None), true);
    * assert.equal(s.is(n), false);
    * ```
    */
   is(cmp: unknown): cmp is Option<unknown> {
      return cmp instanceof OptionType && this[IsSome] === cmp[IsSome];
   }

   /**
    * Return the contained `T`, or `null` if the Option is `None`.
    *
    * ```
    * const x: Option<number> = Some(1);
    * assert.equal(x.into(), 1);
    *
    * const x: Option<number> = None;
    * assert.equal(x.into(), null);
    * ```
    */
   into(): T | null {
      return this[IsSome] ? this.val : null;
   }

   /**
    * Compares the Option to `cmp` for equality. Returns `true` when both are
    * the same type (`Some`/`None`) and their contained values are identical
    * (`===`).
    *
    * const val = { x: 10 };
    * const s: Option<{ x: number; }> = Some(val);
    * const n: Option<{ x: number; }> = None;
    *
    * assert.equal(s.eq(Some(val)), true);
    * assert.equal(n.eq(None), true):
    * assert.equal(s.eq(Some({ x: 10 })), false);
    * assert.equal(s.eq(n), false);
    * ```
    */
   eq(cmp: Option<T>): boolean {
      return this[IsSome] === cmp[IsSome] && this.val === cmp.val;
   }

   /**
    * Compares the Option to `cmp` for inequality. Returns true when both are
    * different types (`Some`/`None`) or their contained values are not
    * identical (`!==`).
    *
    * const val = { x: 10 };
    * const s: Option<{ x: number; }> = Some(val);
    * const n: Option<{ x: number; }> = None;
    *
    * assert.equal(s.neq(Some(val)), false);
    * assert.equal(n.neq(None), false);
    * assert.equal(s.neq(Some({ x: 10})), true);
    * assert.equal(s.new(n), true);
    * ```
    */
   neq(cmp: Option<T>): boolean {
      return this[IsSome] !== cmp[IsSome] || this.val !== cmp.val;
   }

   /**
    * Test the contained `Some` value with provided `f`, returning the
    * original Option if true, or `None` otherwise.
    *
    * ```
    * const cond = (x) => x === 1;
    *
    * const x: Option<number> = Some(1);
    * assert.equal(x.if(cond).unwrap(), 1);
    *
    * const x: Option<number> = Some(2);
    * assert.equal(x.if(cond).isNone(), true);
    *
    * const x: Option<number> = None;
    * assert.equal(x.if(cond).isNone(), true);
    * ```
    */
   must(f: (val: T) => boolean): Option<T> {
      return this[IsSome] && f(this.val) ? this : None;
   }

   /**
    * Returns true if the Option is `Some`. Acts as a type guard for
    * `this is Some<T>`.
    *
    * ```
    * const x = Some(10);
    * assert.equal(x.isSome(), true);
    *
    * const x: Option<number> = None;
    * assert.equal(x.isSome(), false);
    * ```
    */
   isSome(): this is Some<T> {
      return this[IsSome];
   }

   /**
    * Returns true if the Option is `None`. Acts as a type guard for
    * `this is None<never>`.
    *
    * ```
    * const x = Some(10);
    * assert.equal(x.isNone(), false);
    *
    * const x: Option<number> = None;
    * assert.equal(x.isNone(), true);
    * ```
    */
   isNone(): this is None<never> {
      return !this[IsSome];
   }

   /**
   Returns the contained `Some` value and throws `Error(msg)` if `None`.

   To avoid throwing, consider `isSome`, `unwrapOr`, `unwrapOrElse` or
   `match` to handle the `None` case.
   
   ```
   const x = Some(1);
   assert.equal(x.expect("Is empty"), 1);
   
   const x: Option<number> = None;
   const y = x.expect("Is empty"); // throws
   * ```
   */
   expect(msg: string): T {
      if (this[IsSome]) {
         return this.val;
      } else {
         throw new Error(msg);
      }
   }

   /**
   Returns the contained `Some` value and throws if `None`.

   To avoid throwing, consider `isSome`, `unwrapOr`, `unwrapOrElse` or
   `match` to handle the `None` case. To throw a more informative error use
   `expect`.
   
   ```
   const x = Some(1);
   assert.equal(x.unwrap(), 1);
   
   const x: Option<number> = None;
   const y = x.unwrap(); // throws
   * ```
   */
   unwrap(): T {
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
   unwrapOr(def: T): T {
      return this[IsSome] ? this.val : def;
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
   unwrapOrElse(f: () => T): T {
      return this[IsSome] ? this.val : f();
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
   unwrapUnchecked(): T | undefined {
      return this.val;
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
   or(optb: Option<T>): Option<T> {
      return this[IsSome] ? this : optb;
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
   orElse(f: () => Option<T>): Option<T> {
      return this[IsSome] ? this : f();
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
   and<U>(optb: Option<U>): Option<U> {
      return this[IsSome] ? optb : None;
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
   andThen<U>(f: (val: T) => Option<U>): Option<U> {
      return this[IsSome] ? f(this.val) : None;
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
   map<U>(f: (val: T) => U): Option<U> {
      return this[IsSome] ? new OptionType(f(this.val), true) : None;
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
   mapOr<U>(def: U, f: (val: T) => U): U {
      return this[IsSome] ? f(this.val) : def;
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
   mapOrElse<U>(def: () => U, f: (val: T) => U): U {
      return this[IsSome] ? f(this.val) : def();
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
   okOr<E>(err: E): Result<T, E> {
      return this[IsSome] ? Ok<T, E>(this.val) : Err<E, T>(err);
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
   okOrElse<E>(f: () => E): Result<T, E> {
      return this[IsSome] ? Ok<T, E>(this.val) : Err<E, T>(f());
   }
}

/**
 * Tests the provided `val` is an Option. Acts as a type guard for
 * `val is Option<unknown>`.
 *
 * ```
 * assert.equal(Option.is(Some(1), true);
 * assert.equal(Option.is(None, true));
 * assert.equal(Option.is(Ok(1), false));
 * ```
 */
export function isOption(val: unknown): val is Option<unknown> {
   return val instanceof OptionType;
}

/**
 * Creates a `Some<T>` value, which can be used where an `Option<T>` is
 * required. See Option for more examples.
 *
 * ```
 * const x = Some(10);
 * assert.equal(x.isSome(), true);
 * assert.equal(x.unwrap(), 10);
 * ```
 */
export function Some<T>(val: T): Some<T> {
   return new OptionType(val, true) as Some<T>;
}

/**
 * The `None` value, which can be used where an `Option<T>` is required.
 * See Option for more examples.
 *
 * ```
 * const x = None;
 * assert.equal(x.isNone(), true);
 * const y = x.unwrap(); // throws
 * ```
 */
export const None = new OptionType(undefined, false) as None<never>;

Object.freeze(OptionType.prototype);
Object.freeze(isOption);
Object.freeze(Some);
Object.freeze(None);
