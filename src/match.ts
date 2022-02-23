import { Option } from "./option";
import { Result, Ok, Err } from "./result";

type Mapped<T, U> = (val: T) => U;
type AnyMonadic = Option<any> | Result<any, any>;
type Branches<T, U> = Branch<T, U>[] | [...Branch<T, U>[], Mapped<T, U>];
type Branch<T, U> = [BranchCondition<T>, BranchResult<T, U>];
type BranchResult<T, U> = U | ((val: T) => U);

type BranchCondition<T> =
   | Mapped<T, boolean>
   | (T extends AnyMonadic ? MonadCondition<T> : PrimitiveCondition<T>);

type PrimitiveCondition<T> = T extends object
   ? { [K in keyof T]?: BranchCondition<T[K]> }
   : T;

type MonadCondition<T> = T extends Option<infer U>
   ? Option<MonadCondition<U>>
   : T extends Result<infer U, infer E>
   ? Ok<MonadCondition<U>, any> | Err<MonadCondition<E>, any>
   : Partial<T>;

type OptionBranches<T, U> = Branches<Option<T>, U>;

interface MappedOption<T, U> {
   Some?: Mapped<T, U> | Branches<T, U>;
   None?: Mapped<Default, U>;
   Ok?: never;
   Err?: never;
   _?: (val: T | Default) => U;
}

type ResultBranches<T, E, U> = Branches<Result<T, E>, U>;

interface MappedResult<T, E, U> {
   Ok?: Mapped<T, U> | Branches<T, U>;
   Err?: Mapped<E, U> | Branches<E, U>;
   Some?: never;
   None?: never;
   _?: (val: T | E) => U;
}

/**
 * Concisely determine what action should be taken for a given input value.
 * Of all the different ways you can use `match`, the following rules are
 * always true:
 *
 * * Every branch must have the same return type.
 * * As soon as a matching branch is found, no others are checked.
 *
 * ### Mapped Matching
 * Can be performed on `Option` and `Result` types.
 *
 * ```
 * const num: Option<number> = Some(10);
 * const res = match(num, {
 *    Some: (n) => n + 1,
 *    None: () => 0,
 * });
 *
 * assert.equal(res, 11);
 * ```
 *
 * It's also possible to nest mapped matching and provide a higher-level
 * default. You don't have to include every named branch:
 *
 * ```
 * const matchNest = (input: Result<Option<number>, string>) =>
 * match(input, {
 *    Ok: match({
 *       Some: (n) => `num ${n}`,
 *    }),
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
function match<T, U>(pat: MappedOption<T, U>): (opt: Option<T>) => U;
function match<T, E, U>(pat: MappedResult<T, E, U>): (res: Result<T, E>) => U;
function match<T, U>(opt: Option<T>, pat: MappedOption<T, U>): U;
function match<T, E, U>(res: Result<T, E>, pat: MappedResult<T, E, U>): U;
function match<T, U>(opt: Option<T>, pat: OptionBranches<T, U>): U;
function match<T, E, U>(opt: Result<T, E>, pat: ResultBranches<T, E, U>): U;
function match<T, U>(val: T, pat: Branches<T, U>): U;
function match<T, E, U>(
   val:
      | T
      | MappedOption<T, U>
      | MappedResult<T, E, U>
      | Option<T>
      | Result<T, E>,
   pat?:
      | Branches<T, U>
      | MappedOption<T, U>
      | MappedResult<T, E, U>
      | OptionBranches<T, U>
      | ResultBranches<T, E, U>
): U | ((opt: Option<T>) => U) | ((res: Result<T, E>) => U) {
   if (is_object_like(pat)) {
      if (Array.isArray(pat)) {
         return match_branches<T, U>(val as any, pat as any);
      }

      if (Option.is(val) && is_object_like(pat)) {
         const { Some, None, _ } = pat as MappedOption<T, U>;
         return val.is_some()
            ? call_or_branch(val.unwrap_unchecked() as T, Some, _)
            : call_or_branch(Default, None, _);
      }

      if (Result.is(val) && is_object_like(pat)) {
         const { Ok, Err, _ } = pat as MappedResult<T, E, U>;
         return val.is_ok()
            ? call_or_branch(val.unwrap_unchecked() as T, Ok, _)
            : call_or_branch(val.unwrap_unchecked() as E, Err, _);
      }
   }

   if (pat === undefined && is_object_like(val)) {
      const mapped = { _: () => BubbleToDefault, ...val };
      return (val: Option<T> | Result<T, E>) =>
         match(val, mapped as any) as any;
   }

   throw new Error("Match failed, unknown call signature");
}

function call_or_branch<T, U>(
   val: T,
   branch?: Mapped<T, U> | Branches<T, U>,
   default_branch?: Mapped<T, U>
): U {
   if (typeof branch === "function") {
      const result = branch(val);
      return (result as any) === BubbleToDefault
         ? match_branches(val, undefined, default_branch)
         : result;
   } else {
      return match_branches(val, branch, default_branch);
   }
}

function match_branches<T, U>(
   val: T,
   branches?: Branches<T, U>,
   default_branch?: Mapped<T, U>
): U {
   if (branches) {
      for (const branch of branches) {
         if (typeof branch === "function") {
            return branch(val);
         } else {
            const [cond, res] = branch;
            if (matches(cond, val)) {
               return typeof res === "function"
                  ? (res as (val: T | Default) => U)(val)
                  : res;
            }
         }
      }
   }

   if (typeof default_branch === "function") {
      return default_branch(val);
   }

   return Default() as never;
}

function is_object_like(value: unknown): value is Record<string | number, any> {
   return value !== null && typeof value === "object";
}

function matches<T>(cond: BranchCondition<T> | Default, val: T): boolean {
   if (cond === Default || cond === val) {
      return true;
   }

   if (typeof cond === "function") {
      return is_fn_value(cond as () => any)
         ? (cond as () => any)() === val
         : (cond as (val: T | Default) => boolean)(val);
   }

   if ((Option.is(cond) || Result.is(cond)) && cond.is(val)) {
      return matches(cond.unwrap_unchecked(), val.unwrap_unchecked());
   }

   if (
      is_object_like(cond) &&
      is_object_like(val) &&
      Array.isArray(cond) === Array.isArray(val)
   ) {
      return match_deep(cond, val);
   }

   return false;
}

function match_deep(
   cond: Record<string | number, any>,
   val: Record<string | number, any>
): boolean {
   for (const key of Object.keys(cond)) {
      if (cond[key] !== Default && !matches(cond[key], val[key])) {
         return false;
      }
   }
   return true;
}

function is_fn_value(fn: (...args: any) => any): boolean {
   return (fn as any).__IsFnValue__ === true;
}

export { match };

/**
 * Creates a wrapper for a function-value within a chained match block. See
 * `match` for more information about when this needs to be used.
 */
export function Fn<T extends (...args: any) => any>(fn: T): () => T {
   const output = () => fn;
   output.__IsFnValue__ = true;
   return output;
}

/**
 * Creates a new function that accepts an `Option<T>` and returns `fn(T)` or
 * `false` if the Option is `None`. This implementation kind of sucks, I'll
 * probably remove it.
 * @deprecated
 */
export function SomeIs<T>(fn: (val: T) => boolean): Mapped<Option<T>, boolean> {
   return (opt: Option<T>) => opt.is_some() && fn(opt.unwrap_unchecked() as T);
}

/**
 * Creates a new function that accepts a `Result<T, E>` and returns `fn(T)`
 * or `false` if the Result is `Err`. Typically used in a `match` block.
 * This implementation kind of sucks, I'll probably remove it.
 * @deprecated
 */
export function OkIs<T, E>(
   fn: (val: T) => boolean
): Mapped<Result<T, E>, boolean> {
   return (res: Result<T, E>) => res.is_ok() && fn(res.unwrap_unchecked() as T);
}

/**
 * Creates a new function that accepts a `Result<T, E>` and returns `fn(E)`
 * or `false` if the Result is `Ok`. This implementation kind of sucks, I'll
 * probably remove it.
 * @deprecated
 */
export function ErrIs<E, T>(
   fn: (val: E) => boolean
): Mapped<Result<T, E>, boolean> {
   return (res: Result<T, E>) =>
      res.is_err() && fn(res.unwrap_unchecked() as E);
}

const BubbleToDefault = Symbol("BubbleToDefault");

/**
 * The `Default` (or `_`) value. This function is used as a marker to indicate
 * "any value", and is also the function called when all patterns are
 * exhausted.
 */
export const Default: any = Object.freeze(() => {
   throw new Error("Match failed, patterns exhausted and no default present");
});

/**
 * The `_` value. This function is used as a marker to indicate "any value".
 * It is an alias of `Default`.
 */
export const _ = Default;
export type Default = any;
export type _ = any;

export type Fn = typeof Fn;
export type SomeIs = typeof SomeIs;
export type OkIs = typeof OkIs;
export type ErrIs = typeof ErrIs;
