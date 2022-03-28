import { T, Val, MarkFn } from "./common";
import { Option, Some, None } from "./option";
import { Result, Ok, Err } from "./result";

type MappedBranches<T, U> =
   | (T extends Option<infer V> ? OptionMapped<V, U> : never)
   | (T extends Result<infer V, infer E> ? ResultMapped<V, E, U> : never);

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
}

interface ResultMapped<T, E, U> {
   Ok?: MonadMapped<T, U>;
   Err?: MonadMapped<E, U>;
   _?: DefaultBranch<U>;
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

/**
 * Concisely determine what action should be taken for a given input value.
 *
 * ### Mapped Matching
 *
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
 * not found in the current level it will fall back to the previous level. When
 * no suitable match or default is found, an exhausted error is thrown.
 *
 * ```
 * function nested(val: Result<Option<number>, string>): string {
 *    return match(val, {
 *       Ok: { Some: (num) => `found ${num}` },
 *       _: () => "nothing",
 *    });
 * }
 *
 * assert.equal(nested(Ok(Some(10))), "found 10");
 * assert.equal(nested(Ok(None)), "nothing");
 * assert.equal(nested(Err("Not a number")), "nothing");
 * ```
 *
 * ### Combined Matching
 *
 * Mapped Matching and Chained Matching can be combined. A match chain can be
 * provided instead of a function for `Some`, `Ok` and `Err`. E.g.
 *
 * ```
 * function matchNum(val: Option<number>): string {
 *    return match(val, {
 *       Some: [
 *          [5, "5"],
 *          [(x) => x < 10, "< 10"],
 *          [(x) => x > 20, "> 20"],
 *       ],
 *       _: () => "none or not matched",
 *    });
 * }
 *
 * assert.equal(matchNum(Some(5)), "5");
 * assert.equal(matchNum(Some(7)), "< 10");
 * assert.equal(matchNum(Some(25)), "> 20");
 * assert.equal(matchNum(Some(15)), "none or not matched");
 * assert.equal(matchNum(None), "none or not matched");
 * ```
 *
 * ### Async
 *
 * A `condition` is always a sync function. The `result` can be an async
 * function, providing that all branches return an async function.
 *
 * ### Chained Matching
 *
 * Chained matching is possible on any type. Branches are formed by associating
 * a `condition` with a `result`, and the chain is an array of branches. The
 * last item in a chain may be a function (called to determine the default
 * result when no branches match).
 *
 * A `condition` can be a:
 * - primitive (to test for equality)
 * - filter function which returns a boolean (to use a custom test)
 * - partial object/array of `conditions` (to test for matching keys)
 * - `Some`, `Ok` or `Err` containing a `condition` which is not a filter
 *   function (and which does not included a nested filter function).
 * - function wrapped with `Fn` (to test for equality)
 * - `_` or `Default` (to match any value at this position)
 *
 * A `result` can be:
 * - any non-function value to be used as the result
 * - a function which returns the result when called
 * - a function wrapped with `Fn` to be used as the result
 *
 * If no branch matches and there is no default available, an exhausted error
 * is thrown.
 *
 * #### Primitive
 *
 * The branch succeeds if the `condition` is strictly equal to the provided
 * value.
 *
 * ```
 * function matchNum(num: number): string {
 *    return match(num, [
 *       [5, "five"],
 *       [10, "ten"],
 *       [15, (x) => `fifteen (${x})`], // result function
 *       () => "other",
 *    ]);
 * }
 *
 * assert.equal(matchNum(5), "five");
 * assert.equal(matchNum(10), "ten");
 * assert.equal(matchNum(15), "fifteen (15)");
 * assert.equal(matchNum(20), "other");
 * ```
 *
 * #### Filter Function
 *
 * The branch succeeds if the `condition` returns true.
 *
 * ```
 * function matchNum(num: number): string {
 *    return match(num, [
 *       [5, "five"], // Primitive Match
 *       [(x) => x < 20, "< 20"],
 *       [(x) => x > 30, "> 30"],
 *       () => "other",
 *    ]);
 * }
 *
 * assert.equal(matchNum(5), "five");
 * assert.equal(matchNum(15), "< 20");
 * assert.equal(matchNum(50), "> 30");
 * assert.equal(matchNum(25), "other");
 * ```
 *
 * #### Object
 *
 * The branch succeeds if all the keys in `condition` match those in the
 * provided value. Using `_` allows any value (even undefined), but the key
 * must still be present.
 *
 *
 * ```
 * interface ExampleObj {
 *    a: number;
 *    b?: { c: number };
 *    o?: number;
 * }
 *
 * function matchObj(obj: ExampleObj): string {
 *    return match(obj, [
 *       [{ a: 5 }, "a = 5"],
 *       [{ b: { c: 5 } }, "c = 5"],
 *       [{ a: 10, o: _ }, "a = 10, o = _"],
 *       [{ a: 15, b: { c: (n) => n > 10 } }, "a = 15; c > 10"],
 *       () => "other",
 *    ]);
 * }
 *
 * assert.equal(matchObj({ a: 5 }), "a = 5");
 * assert.equal(matchObj({ a: 50, b: { c: 5 } }), "c = 5");
 * assert.equal(matchObj({ a: 10 }), "other");
 * assert.equal(matchObj({ a: 10, o: 1 }), "a = 10, o = _");
 * assert.equal(matchObj({ a: 15, b: { c: 20 } }), "a = 15; c > 10");
 * assert.equal(matchObj({ a: 8, b: { c: 8 }, o: 1 }), "other");
 * ```
 *
 * #### Array
 *
 * The branch succeeds if all the indexes in `condition` match those in the
 * provided value. Using `_` allows any value (even undefined), but the index
 * must still be present.
 *
 * ```
 * function matchArr(arr: number[]): string {
 *    return match(arr, [
 *       [[1], "1"],
 *       [[2, (x) => x > 10], "2, > 10"],
 *       [[_, 6, 9, _], (a) => a.join(", ")],
 *       () => "other",
 *    ]);
 * }
 *
 * assert.equal(matchArr([1, 2, 3]), "1");
 * assert.equal(matchArr([2, 12, 6]), "2, > 10");
 * assert.equal(matchArr([3, 6, 9]), "other");
 * assert.equal(matchArr([3, 6, 9, 12]), "3, 6, 9, 12");
 * assert.equal(matchArr([2, 4, 6]), "other");
 * ```
 *
 * #### Some, Ok and Err
 *
 * The branch succeeds if the wrapping monad (e.g. `Some`) is the same as the
 * provided value and the inner `condition` matches the inner value.
 *
 * **Note:** Filter functions are not called for any condition wrapped in a
 * monad. See the section on Combined Matching for a way to match inner values.
 *
 * ```
 * type NumberMonad = Option<number> | Result<number, number>;
 *
 * function matchMonad(val: NumberMonad): string {
 *    return match(val, [
 *       [Some(1), "Some"],
 *       [Ok(1), "Ok"],
 *       [Err(1), "Err"],
 *       () => "None",
 *    ]);
 * }
 *
 * assert.equal(matchMonad(Some(1)), "Some");
 * assert.equal(matchMonad(Ok(1)), "Ok");
 * assert.equal(matchMonad(Err(1)), "Err");
 * assert.equal(matchMonad(None), "None");
 * ```
 *
 * #### Fn (function as value)
 *
 * This wrapper distinguishes between a function to be called and a function to
 * be treated as a value. It is needed where the function value could be confused
 * with a filter function or result function.
 *
 * ```
 * const fnOne = () => 1;
 * const fnTwo = () => 2;
 * const fnDefault = () => "fnDefault";
 *
 * function matchFn(fnVal: (...args: any) => any): () => string {
 *    return match(fnVal, [
 *       [Fn(fnOne), () => () => "fnOne"], // Manual result wrapper
 *       [Fn(fnTwo), Fn(() => "fnTwo")], // Fn result wrapper
 *       () => fnDefault,
 *    ]);
 * }
 *
 * assert.equal(matchFn(fnOne)(), "fnOne");
 * assert.equal(matchFn(fnTwo)(), "fnTwo");
 * assert.equal(matchFn(() => 0)(), "fnDefault");
 * ```
 */
export function match<T, U>(
   val: T,
   pattern: MappedBranches<T, U> | ChainedBranches<T, U>
): U {
   return matchDispatch(val, pattern, Default);
}

match.compile = compile;
export type match = typeof match;

/**
 * Compile a `match` pattern to a new function. This can improve performance
 * by re-using the same pattern object on every invocation.
 *
 * #### Mapped Match
 *
 * ```
 * const matchSome = match.compile({
 *    Some: (n: number) => `got some ${n}`,
 *    None: () => "got none",
 * });
 *
 * assert.equal(matchSome(Some(1)), "got some 1");
 * assert.equal(matchSome(None), "got none");
 * ```
 *
 * #### Chained Match
 *
 * ```
 * const matchNum = match.compile([
 *    [1, "got 1"],
 *    [2, "got 2"],
 *    [(n) => n > 100, "got > 100"],
 *    () => "default",
 * ]);
 *
 * assert.equal(matchNum(1), "got 1");
 * assert.equal(matchNum(2), "got 2");
 * assert.equal(matchNum(5), "default");
 * assert.equal(matchNum(150), "got > 100");
 * ```
 *
 * #### Advanced Types
 *
 * The compiler can't always infer the correct input type from the pattern. In
 * these cases we need to provide them:
 *
 * ```
 * type ResOpt = Result<Option<string>, number>;
 * const matchResOpt = match.compile<ResOpt, string>({
 *    Ok: { Some: (s) => `some ${s}` },
 *    _: () => "default",
 * });
 *
 * assert.equal(matchResOpt(Ok(Some("test"))), "some test");
 * assert.equal(matchResOpt(Ok(None)), "default");
 * assert.equal(matchResOpt(Err(1)), "default");
 * ```
 */
function compile<T, U>(
   pattern: MappedBranches<T, U> | ChainedBranches<T, U>
): (val: T) => U;
function compile<T, U>(
   pattern: MappedBranches<Option<T>, U>
): (val: Option<T>) => U;
function compile<T, E, U>(
   pattern: MappedBranches<Result<T, E>, U>
): (val: Result<T, E>) => U;
function compile<T, U>(
   pattern: MappedBranches<T, U> | ChainedBranches<T, U>
): (val: T) => U {
   return (val) => match(val, pattern);
}

/**
 * The `Default` (or `_`) value. Used as a marker to indicate "any value".
 */
export const Default: any = () => {
   throw new Error("Match failed (exhausted)");
};
export type Default = any;

/**
 * The `_` value. Used as a marker to indicate "any value".
 */
export const _ = Default;
export type _ = any;

/**
 * Creates a wrapper for a function so that it will be treated as a value
 * within a chained matching block. See `match` for more information about
 * when this needs to be used.
 */
export function Fn<T extends (...args: any) => any>(fn: T): () => T {
   const val: any = () => throwFnCalled();
   (val as any)[MarkFn] = fn;
   return Object.freeze(val);
}

export type Fn<T> = { (): never; [MarkFn]: T };

function matchMapped<T, U>(
   val: T,
   pattern: OptionMapped<any, U> & ResultMapped<any, any, U>,
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
         return (branch as Fn<U>)[MarkFn]
            ? (branch as Fn<U>)[MarkFn]
            : branch();
      } else {
         const [cond, result] = branch;
         if (matches(cond, val, true)) {
            if (typeof result === "function") {
               return (result as Fn<U>)[MarkFn]
                  ? (result as Fn<U>)[MarkFn]
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
      return (cond as Fn<T>)[MarkFn]
         ? (cond as Fn<T>)[MarkFn] === val
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
            if (
               !(key in val) ||
               !matches((cond as any)[key], (val as any)[key], evaluate)
            ) {
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

function isObjectLike(value: unknown): value is Record<string | number, any> {
   return value !== null && typeof value === "object";
}

function throwInvalidPattern(): never {
   throw new Error("Match failed (invalid pattern)");
}

function throwFnCalled(): never {
   throw new Error("Match error (wrapped function called)");
}

Object.freeze(match);
Object.freeze(Default);
Object.freeze(Fn);

Object.freeze(compile);
