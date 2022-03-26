import { T, Val, MarkFn } from "./symbols";
import { Option, Some, None } from "./option";
import { Result, Ok, Err } from "./result";

type MappedBranches<T, U> = T extends Option<infer V>
   ? OptionMapped<V, U>
   : T extends Result<infer V, infer E>
   ? ResultMapped<V, E, U>
   : never;

type ChainedBranches<T, U> =
   | Branch<T, U>[]
   | [...Branch<T, U>[], DefaultBranch<U>];

type BranchCondition<T> =
   | Mapped<T, boolean>
   | (T extends { [T]: boolean } ? MonadCondition<T> : Condition<T>);

type Branch<T, U> = [BranchCondition<T>, BranchResult<T, U>];
type Mapped<T, U> = (val: T) => U;
type Wide<T> = T extends [...infer U] ? U[number][] : Partial<T>;
type BranchResult<T, U> = U | ((val: T) => U);
type DefaultBranch<U> = () => U;

interface OptionMapped<T, U> {
   Some?: MonadMapped<T, U>;
   None?: DefaultBranch<U>;
   _?: DefaultBranch<U>;
   Ok?: never;
   Err?: never;
}

interface ResultMapped<T, E, U> {
   Ok?: MonadMapped<T, U>;
   Err?: MonadMapped<E, U>;
   _?: DefaultBranch<U>;
   Some?: never;
   None?: never;
}

type Condition<T> = T extends object
   ? { [K in keyof T]?: BranchCondition<T[K]> }
   : T;

type MonadCondition<T> = T extends Option<infer U>
   ? Some<MonadCondition<U>> | None
   : T extends Result<infer U, infer E>
   ? Ok<MonadCondition<U>> | Err<MonadCondition<E>>
   : Wide<T>;

type MonadMapped<T, U> =
   | Mapped<T, U>
   | ChainedBranches<T, U>
   | MappedBranches<T, U>;

function isObjectLike(value: unknown): value is Record<string | number, any> {
   return value !== null && typeof value === "object";
}

/**
 * Concisely determine what action should be taken for a given input value.
 *
 * ### Mapped Matching
 * Mapped matching is possible on `Option` and `Result` types. Passing any
 * other type will throw an invalid pattern error.
 *
 * ```
 * const num = Option(10);
 * const res = match(num, {
 *    Some: (n) => n + 1,
 *    None: () => 0,
 * });
 *
 * assert.equal(res, 11);
 * ```
 *
 * You can nest mapped matching patterns and provide defaults. If a default is
 * not found in the current level it will fall back to the previous level. If
 * there is no suitable match, an exhausted error is thrown.
 *
 * ```
 * const matchNest = (input: Result<Option<number>, string>) =>
 * match(input, {
 *    Ok: {
 *       Some: (n) => `num ${n}`,
 *    },
 *    _: () => "nothing",
 * });
 *
 * assert.equal(matchNest(Ok(Some(10))), "num 10");
 * assert.equal(matchNest(Ok(None)), "nothing");
 * assert.equal(matchNest(Err("none")), "nothing");
 * ```
 * **Note:** Using `match` without the first-position value is not a way to
 * "compile" a match function. Only call match like this within a nested
 * match structure.
 *
 * ### Chained Matching
 * Can be performed on any type. A chain is an array of branches which are
 * tested in sequence. A branch is a tuple of `[<condition>, <result>]`.
 * Chain branches follow the following rules:
 *
 * * Primitive comparisons test for exact equality (`===`).
 * * Any comparison with the condition `_` (`Default`) succeeds automatically.
 * * Matching against arrays is a key-to-key comparison (just like objects). As
 *   such, a match condition of `[10, 20]` doesn't check if 10 and 20 are in
 *   the array, but instead checks specifically that index `0` is 10 and index
 *   `1` is 20.
 * * Tuple elements are "functions first", such that any `<condition>` that is
 *   a function will be called to determine if the branch matches, and any
 *   `<result>` that is a function is called with the input value to determine
 *   the return value. To match or return a function, see `Fn`.
 * * On the matter of functions, a `<condition>` is always a sync function.
 *   A `<result>` can be async, but if so every branch must return an async
 *   function.
 * * `Option` and `Result` types are recursively evaluated to their deepest
 *   reachable values and evaluated like any other condition.
 *
 * At the end of a chain, an optional default branch may be included which is
 * called with the input value when no other branch matches. If no default is
 * provided, `match` will throw an error if no other branch matches.
 *
 * **Note:** Deeply nesting `Option`/`Result` matches may not allow for
 * complete type information to be presented to the user (though they should
 * still be verified). It is also slower (execution time and type computation)
 * than mapped matching or combined matching.
 *
 * ```
 * // Primitives
 * const matchNum = (num: number) =>
 *    match(num, [
 *       [5, "five"],
 *       [(n) => n > 100, "big number"],
 *       [(n) => n < 0, (n) => `negative ${n}`],
 *       () => "other",
 *    ]);
 *
 * assert.equal(matchNum(5), "five");
 * assert.equal(matchNum(150), "big number");
 * assert.equal(matchNum(-20), "negative -20");
 * assert.equal(matchNum(50), "other");
 *
 * // Objects
 * const matchObj = (obj: { a: number; b: { c: number } }) =>
 *    match(obj, [
 *       [{ a: 5 }, "a is 5"],
 *       [{ b: { c: 5 } }, "c is 5"],
 *       [{ a: 10, b: { c: (n) => n > 10 } }, "a 10 c gt10"],
 *       () => "other",
 *    ]);
 *
 * assert.equal(matchObj({ a: 5, b: { c: 5 } }), "a is 5");
 * assert.equal(matchObj({ a: 50, b: { c: 5 } }), "c is 5");
 * assert.equal(matchObj({ a: 10, b: { c: 20 } }), "a 10 c gt 10");
 * assert.equal(matchObj({ a: 8, b: { c: 8 } }), "other");
 *
 * // Arrays
 * const matchArr = (arr: number[]) =>
 *    match(arr, [
 *       [[1], "1"],
 *       [[2, (n) => n > 10], "2 gt10"],
 *       [[_, 6, _, 12], "_ 6 _ 12"],
 *       () => "other",
 *    ]);
 *
 * assert.equal(matchArr([1, 2, 3]), "1");
 * assert.equal(matchArr([2, 12, 6]), "2 gt10");
 * assert.equal(matchArr([3, 6, 9, 12]), "_ 6 _ 12");
 * assert.equal(matchArr([2, 4, 6]), "other");
 * ```
 *
 * ### Combined Matching
 * It's possible to combine the mapped and chained approach, to create a chain
 * of rules for the unwrapped mapped type. Here are three ways of doing the
 * same thing:
 *
 * ```
 * interface Player {
 *    name: string;
 *    age: number;
 *    status: string;
 * }
 *
 * Shortest
 * function can_proceed_1(player: Option<Player>): boolean {
 *    return match(player, {
 *       Some: (pl) => pl.age >= 18 && pl.status !== "banned",
 *       None: () => false,
 *    });
 * }
 *
 * // Easiest to read and add to
 * function can_proceed_2(player: Option<Player>): boolean {
 *    return match(player, {
 *       Some: [
 *          [{ status: "banned" }, false],
 *          [{ age: (n) => n > 18 }, true],
 *       ],
 *       _: () => false,
 *    });
 * }
 *
 * // Bad. SomeIs and similar methods may be changed.
 * function can_proceed_3(player: Option<Player>): boolean {
 *    return match(player, [
 *       [Some({ status: "banned" }), false],
 *       [SomeIs((pl) => pl.age >= 18), true],
 *       () => false,
 *    ]);
 * }
 * ```
 */

export function match<T, U>(
   val: T,
   pattern: MappedBranches<T, U> | ChainedBranches<T, U>
): U {
   return matchDispatch(val, pattern, Default);
}

function throwInvalidPattern(): never {
   throw new Error("Match failed (invalid pattern)");
}

function matchMapped<T, U>(
   val: T,
   pattern: MappedBranches<T, U>,
   defaultBranch: DefaultBranch<U>
): U {
   if (Option.is(val)) {
      if (val[T]) {
         if (pattern.Some) {
            if (typeof pattern.Some === "function") {
               return pattern.Some(val[Val]);
            } else {
               return matchDispatch(
                  val[Val],
                  pattern.Some,
                  typeof pattern._ === "function" ? pattern._ : defaultBranch
               );
            }
         }
      } else if (typeof pattern.None === "function") {
         return pattern.None();
      }
   } else if (Result.is(val)) {
      const Branch = val[T] ? pattern.Ok : pattern.Err;
      if (Branch) {
         if (typeof Branch === "function") {
            return Branch(val[Val]);
         } else {
            return matchDispatch(
               val[Val],
               Branch,
               typeof pattern._ === "function" ? pattern._ : defaultBranch
            );
         }
      }
   } else {
      throwInvalidPattern();
   }

   return typeof pattern._ === "function" ? pattern._() : defaultBranch();
}

function matchChained<T, U>(
   val: T,
   pattern: ChainedBranches<T, U>,
   defaultBranch: DefaultBranch<U>
): U {
   for (const branch of pattern) {
      if (typeof branch === "function") {
         return branch();
      } else {
         const [cond, result] = branch;
         if (matches(cond, val, true)) {
            if (typeof result === "function") {
               return (result as any)[MarkFn]
                  ? (result as () => U)()
                  : (result as (val: T) => U)(val);
            } else {
               return result;
            }
         }
      }
   }

   return defaultBranch();
}

function matches<T>(
   cond: BranchCondition<T>,
   val: T,
   evaluate: boolean
): boolean {
   if (cond === Default || cond === val) {
      return true;
   }

   if (typeof cond === "function") {
      return (cond as any)[MarkFn]
         ? (cond as unknown as () => T)() === val
         : evaluate && (cond as (val: T) => boolean)(val);
   }

   if (isObjectLike(cond)) {
      if (T in cond) {
         return (
            (cond as Option<any> | Result<any, any>).isLike(val) &&
            matches((cond as any)[Val], val[Val], false)
         );
      }

      if (isObjectLike(val) && Array.isArray(cond) === Array.isArray(val)) {
         for (const key of Object.keys(cond)) {
            if (!matches((cond as any)[key], (val as any)[key], evaluate)) {
               return false;
            }
         }

         return true;
      }
   }

   return false;
}

function matchDispatch<T, U>(
   val: T,
   pattern: ChainedBranches<T, U> | MappedBranches<T, U>,
   defaultBranch: DefaultBranch<U>
): U {
   if (Array.isArray(pattern)) {
      return matchChained(val, pattern, defaultBranch);
   } else if (isObjectLike(pattern)) {
      return matchMapped(val, pattern, defaultBranch);
   }

   throwInvalidPattern();
}

/**
 * The `Default` (or `_`) value. This function is used as a marker to indicate
 * "any value", and is also the function called when all patterns are
 * exhausted.
 */
export const Default: any = Object.freeze(() => {
   throw new Error("Match failed (exhausted)");
});

/**
 * The `_` value. This function is used as a marker to indicate "any value".
 * It is an alias of `Default`.
 */
export const _ = Default;

/**
 * Creates a wrapper for a function-value within a chained match block. See
 * `match` for more information about when this needs to be used.
 */
export function Fn<T extends (...args: any) => any>(fn: T): () => T {
   const val = () => fn;
   (val as any)[MarkFn] = true;
   return val;
}

export type Default = any;
export type _ = any;

export type Fn = typeof Fn;
