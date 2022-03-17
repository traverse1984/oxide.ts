import { Option as BaseOption, isOption, Some, None } from "./monad/option";
export { Some, None } from "./monad/option";

export type Option<T> = BaseOption<T>;

type OptionTypes<O> = {
   [K in keyof O]: O[K] extends Option<infer T> ? T : never;
};

/**
 * An Option represents either something, or nothing. If we hold a value
 * of type `Option<T>`, we know it is either `Some<T>` or `None`.
 *
 * ```
 * const users = ["Simon", "Garfunkel"];
 * function fetch_user(username: string): Option<string> {
 *    return users.includes(username) ? Some(username) : None;
 * }
 *
 * function greet(username: string): string {
 *    return fetch_user(username)
 *       .map((user) => `Hello ${user}, my old friend!`)
 *       .unwrapOr("*silence*");
 * }
 *
 * assert.equal(greet("Simon"), "Hello Simon, my old friend!")
 * assert.equal(greet("SuperKing77"), "*silence*");
 * ```
 *
 * @todo Document new Option
 */
export function Option<T>(val: T): Option<NonNullable<T>> {
   if (val === undefined || val === null || val !== val) {
      return None;
   } else {
      return Some(val) as any;
   }
}

Option.is = isOption;
Option.safe = safe;
Option.all = all;
Option.any = any;

/**
 * Capture the outcome of a function or Promise as an `Option<T>`, preventing
 * throwing (function) or rejection (Promise).
 *
 * ### Usage for functions
 *
 * Calls `fn` with the provided `args` and returns an `Option<T>`. The Option
 * is `Some` if the provided function returned, or `None` if it threw.
 *
 * **Note:** Any function which returns a Promise (or PromiseLike) value is
 * rejected by the type signature. `Option<Promise<T>>` is not a useful type,
 * and using it in this way is likely to be a mistake.
 *
 * ```
 * function mightThrow(throws: boolean) {
 *    if (throws) {
 *       throw new Error("Throw");
 *    }
 *    return "Hello World";
 * }
 *
 * const x: Option<string> = Option.safe(mightThrow, true);
 * assert.equal(x.isNone(), true);
 *
 * const x = Option.safe(() => mightThrow(false));
 * assert.equal(x.unwrap(), "Hello World");
 * ```
 *
 * ### Usage for Promises
 *
 * Accepts `promise` and returns a new Promise which always resolves to
 * `Option<T>`. The Result is `Some` if the original promise resolved, or
 * `None` if it rejected.
 *
 * ```
 * async function mightThrow(throws: boolean) {
 *    if (throws) {
 *       throw new Error("Throw")
 *    }
 *    return "Hello World";
 * }
 *
 * const x = await Option.safe(mightThrow(true));
 * assert.equal(x.isNone(), true);
 *
 * const x = await Option.safe(mightThrow(false));
 * assert.equal(x.unwrap(), "Hello World");
 * ```
 */
function safe<T, A extends any[]>(
   fn: (...args: A) => T extends PromiseLike<any> ? never : T,
   ...args: A
): Option<T>;
function safe<T>(promise: Promise<T>): Promise<Option<T>>;
function safe<T, A extends any[]>(
   fn: ((...args: A) => T) | Promise<T>,
   ...args: A
): Option<T> | Promise<Option<T>> {
   if (fn instanceof Promise) {
      return fn.then(
         (value) => Some(value),
         () => None
      );
   }

   try {
      return Some(fn(...args));
   } catch (err) {
      return None;
   }
}

/**
 * Converts a number of `Option`s into a single Option. If any of the provided
 * Options are `None` then the new Option is also None. Otherwise the new
 * Option is `Some` and contains an array of all the unwrapped values.
 *
 * ```
 * function num(val: number): Option<number> {
 *    return val > 10 ? Some(val) : None;
 * }
 *
 * const xyz = Option.all(num(20), num(30), num(40));
 * const [x, y, z] = xyz.unwrap();
 * assert.equal(x, 20);
 * assert.equal(y, 30);
 * assert.equal(z, 40);
 *
 * const x = Option.all(num(20), num(5), num(40));
 * assert.equal(x.isNone(), true);
 * ```
 */
function all<O extends Option<any>[]>(...options: O): Option<OptionTypes<O>> {
   const some = [];
   for (const option of options) {
      if (option.isSome()) {
         some.push(option.unwrapUnchecked());
      } else {
         return None;
      }
   }

   return Some(some) as Some<OptionTypes<O>>;
}

/**
 * Converts a number of `Options`s into a single Option. The first `Some` found
 * (if any) is returned, otherwise the new Option is `None`.
 *
 * ```
 * function num(val: number): Option<number> {
 *    return val > 10 ? Some(val) : None;
 * }
 *
 * const x = Option.any(num(5), num(20), num(2));
 * assert.equal(x.unwrap(), 20);
 *
 * const x = Option.any(num(2), num(5), num(8));
 * assert.equal(x.isNone(), true);
 * ```
 */
function any<O extends Option<any>[]>(
   ...options: O
): Option<OptionTypes<O>[number]> {
   for (const option of options) {
      if (option.isSome()) {
         return option;
      }
   }
   return None;
}

Object.freeze(Option);
Object.freeze(safe);
Object.freeze(all);
Object.freeze(any);
