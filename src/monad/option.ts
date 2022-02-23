import { Result, Ok, Err } from "./result";

export type Option<T> = Some<T> | None<T>;
export type Some<T> = OptionType<T> & { __IsSome__: true };
export type None<T> = OptionType<T> & { __IsSome__: false };

class OptionType<T> {
   private val: T;
   readonly __IsSome__: boolean;

   constructor(val: T, some: boolean) {
      this.val = val;
      this.__IsSome__ = some;
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
      return cmp instanceof OptionType && this.__IsSome__ === cmp.__IsSome__;
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
      return this.__IsSome__ === cmp.__IsSome__ && this.val === cmp.val;
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
      return this.__IsSome__ !== cmp.__IsSome__ || this.val !== cmp.val;
   }

   /**
    * Returns true if the Option is `Some`. Acts as a type guard for
    * `this is Some<T>`.
    *
    * ```
    * const x = Some(10);
    * assert.equal(x.is_some(), true);
    *
    * const x: Option<number> = None;
    * assert.equal(x.is_some(), false);
    * ```
    */
   is_some(): this is Some<T> {
      return this.__IsSome__;
   }

   /**
    * Returns true if the Option is `None`. Acts as a type guard for
    * `this is None<never>`.
    *
    * ```
    * const x = Some(10);
    * assert.equal(x.is_none(), false);
    *
    * const x: Option<number> = None;
    * assert.equal(x.is_none(), true);
    * ```
    */
   is_none(): this is None<never> {
      return !this.__IsSome__;
   }

   /**
   Returns the contained `Some` value and throws `Error(msg)` if `None`.

   To avoid throwing, consider `is_some`, `unwrap_or`, `unwrap_or_else` or
   `match` to handle the `None` case.
   
   ```
   const x = Some(1);
   assert.equal(x.expect("Is empty"), 1);
   
   const x: Option<number> = None;
   const y = x.expect("Is empty"); // throws
   * ```
   */
   expect(msg: string): T {
      if (this.__IsSome__) {
         return this.val;
      } else {
         throw new Error(msg);
      }
   }

   /**
   Returns the contained `Some` value and throws if `None`.

   To avoid throwing, consider `is_some`, `unwrap_or`, `unwrap_or_else` or
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
    * of a function call, consider `unwrap_or_else`, which is lazily evaluated.
    *
    * ```
    * const x = Some(10);
    * assert.equal(x.unwrap_or(1), 10);
    *
    * const x: Option<number> = None;
    * assert.equal(x.unwrap_or(1), 1);
    * ```
    */
   unwrap_or(def: T): T {
      return this.__IsSome__ ? this.val : def;
   }

   /**
    * Returns the contained `Some` value or computes it from a function.
    *
    * ```
    * const x = Some(10);
    * assert.equal(x.unwrap_or_else(() => 1 + 1), 10);
    *
    * const x: Option<number> = None;
    * assert.equal(x.unwrap_or_else(() => 1 + 1), 2);
    * ```
    */
   unwrap_or_else(f: () => T): T {
      return this.__IsSome__ ? this.val : f();
   }

   /**
    * Returns the contained `Some` value or undefined if `None`.
    *
    * Most problems are better solved using one of the other `unwrap_` methods.
    * This method should only be used when you are certain that you need it.
    *
    * ```
    * const x = Some(10);
    * assert.equal(x.unwrap_unchecked(), 10);
    *
    * const x: Option<number> = None;
    * assert.equal(x.unwrap_unchecked(), undefined);
    * ```
    */
   unwrap_unchecked(): T | undefined {
      return this.val;
   }

   /**
    * Returns the Option if it is `Some`, otherwise returns `optb`.
    *
    * `optb` is eagerly evaluated. If you are passing the result of a function
    * call, consider `or_else`, which is lazily evaluated.
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
      return this.__IsSome__ ? this : optb;
   }

   /**
    * Returns the Option if it is `Some`, otherwise returns the value of `f()`.
    *
    * ```
    * const x = Some(10);
    * const xor = x.or_else(() => Some(1));
    * assert.equal(xor.unwrap(), 10);
    *
    * const x: Option<number> = None;
    * const xor = x.or_else(() => Some(1));
    * assert.equal(xor.unwrap(), 1);
    * ```
    */
   or_else(f: () => Option<T>): Option<T> {
      return this.__IsSome__ ? this : f();
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
    * assert.equal(xand.is_none(), true);
    *
    * const x = Some(10);
    * const xand = x.and(None);
    * assert.equal(xand.is_none(), true);
    * ```
    */
   and<U>(optb: Option<U>): Option<U> {
      return this.__IsSome__ ? optb : None;
   }

   /**
    * Returns `None` if the option is `None`, otherwise calls `f` with the
    * `Some` value and returns the result.
    *
    * ```
    * const x = Some(10);
    * const xand = x.and_then((n) => n + 1);
    * assert.equal(xand.unwrap(), 11);
    *
    * const x: Option<number> = None;
    * const xand = x.and_then((n) => n + 1);
    * assert.equal(xand.is_none(), true);
    *
    * const x = Some(10);
    * const xand = x.and_then(() => None);
    * assert.equal(xand.is_none(), true);
    * ```
    */
   and_then<U>(f: (val: T) => Option<U>): Option<U> {
      return this.__IsSome__ ? f(this.val) : None;
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
      return this.__IsSome__ ? new OptionType(f(this.val), true) : None;
   }

   /**
    * Returns the provided default if `None`, otherwise calls `f` with the
    * `Some` value and returns the result.
    *
    * The provided default is eagerly evaluated. If you are passing the result
    * of a function call, consider `map_or_else`, which is lazily evaluated.
    *
    * ```
    * const x = Some(10);
    * const xmap = x.map_or(1, (n) => n + 1);
    * assert.equal(xmap.unwrap(), 11);
    *
    * const x: Option<number> = None;
    * const xmap = x.map_or(1, (n) => n + 1);
    * assert.equal(xmap.unwrap(), 1);
    * ```
    */
   map_or<U>(def: U, f: (val: T) => U): U {
      return this.__IsSome__ ? f(this.val) : def;
   }

   /**
    * Computes a default return value if `None`, otherwise calls `f` with the
    * `Some` value and returns the result.
    *
    * const x = Some(10);
    * const xmap = x.map_or_else(() => 1 + 1, (n) => n + 1);
    * assert.equal(xmap.unwrap(), 11);
    *
    * const x: Option<number> = None;
    * const xmap = x.map_or_else(() => 1 + 1, (n) => n + 1);
    * assert.equal(xmap.unwrap(), 2);
    * ```
    */
   map_or_else<U>(def: () => U, f: (val: T) => U): U {
      return this.__IsSome__ ? f(this.val) : def();
   }

   /**
    * Transforms the `Option<T>` into a `Result<T, E>`, mapping `Some(v)` to
    * `Ok(v)` and `None` to `Err(err)`.
    *
    * ```
    * const x = Some(10);
    * const res = x.ok_or("Is empty");
    * assert.equal(x.is_ok(), true);
    * assert.equal(x.unwrap(), 10);
    *
    * const x: Option<number> = None;
    * const res = x.ok_or("Is empty");
    * assert.equal(x.is_err(), true);
    * assert.equal(x.unwrap_err(), "Is empty");
    * ```
    */
   ok_or<E>(err: E): Result<T, E> {
      return this.__IsSome__ ? Ok<T, E>(this.val) : Err<E, T>(err);
   }

   /**
    * Transforms the `Option<T>` into a `Result<T, E>`, mapping `Some(v)` to
    * `Ok(v)` and `None` to `Err(f())`.
    *
    * ```
    * const x = Some(10);
    * const res = x.ok_or_else(() => ["Is", "empty"].join(" "));
    * assert.equal(x.is_ok(), true);
    * assert.equal(x.unwrap(), 10);
    *
    * const x: Option<number> = None;
    * const res = x.ok_or_else(() => ["Is", "empty"].join(" "));
    * assert.equal(x.is_err(), true);
    * assert.equal(x.unwrap_err(), "Is empty");
    * ```
    */
   ok_or_else<E>(f: () => E): Result<T, E> {
      return this.__IsSome__ ? Ok<T, E>(this.val) : Err<E, T>(f());
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
export function IsOption(val: unknown): val is Option<unknown> {
   return val instanceof OptionType;
}

/**
 * Creates a `Some<T>` value, which can be used where an `Option<T>` is
 * required. See Option for more examples.
 *
 * ```
 * const x = Some(10);
 * assert.equal(x.is_some(), true);
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
 * assert.equal(x.is_none(), true);
 * const y = x.unwrap(); // throws
 * ```
 */
export const None = new OptionType(undefined, false) as None<never>;

interface OptionType<T> {
   isSome: OptionType<T>["is_some"];
   isNone: OptionType<T>["is_none"];
   unwrapOr: OptionType<T>["unwrap_or"];
   unwrapOrElse: OptionType<T>["unwrap_or_else"];
   unwrapUnchecked: OptionType<T>["unwrap_unchecked"];
   orElse: OptionType<T>["or_else"];
   andThen: OptionType<T>["and_then"];
   mapOr: OptionType<T>["map_or"];
   mapOrElse: OptionType<T>["map_or_else"];
   okOr: OptionType<T>["ok_or"];
   okOrElse: OptionType<T>["ok_or_else"];
}

Object.assign(OptionType.prototype, {
   isSome: OptionType.prototype.is_some,
   isNone: OptionType.prototype.is_none,
   unwrapOr: OptionType.prototype.unwrap_or,
   unwrapOrElse: OptionType.prototype.unwrap_or_else,
   unwrapUnchecked: OptionType.prototype.unwrap_unchecked,
   orElse: OptionType.prototype.or_else,
   andThen: OptionType.prototype.and_then,
   mapOr: OptionType.prototype.map_or,
   mapOrElse: OptionType.prototype.map_or_else,
   okOr: OptionType.prototype.ok_or,
   okOrElse: OptionType.prototype.ok_or_else,
});

Object.freeze(OptionType.prototype);
Object.freeze(IsOption);
Object.freeze(Some);
Object.freeze(None);
