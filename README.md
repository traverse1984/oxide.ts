# oxide.ts

[Rust](https://rust-lang.org)'s `Option<T>` and `Result<T, E>`, implemented
for TypeScript.

## Features

Zero dependencies, full test coverage and examples for every function at your
fingertips with JSDoc comments.

-  Add more meaning to return types.
-  Express, chain and map values as if you were writing in Rust.
-  Use the `match` adaptation to simplify conditionals.
-  Quickly test multiple Results or Options with `.all` and `.any`.
-  Convert throws and rejections into Results and Options with `.safe`.

## Patch 0.9.10

-  ~~Make guarded functions that return at the first sign of trouble (`?`).~~
-  ~~API available both `snake_case` and `camelCase`.~~

# Installation

```
$ npm install oxide.ts --save
```

# Usage

The the best documentation is in the JSDoc and tests directory, there are
several examples there not covered in this Readme. If you're using VSCode
you should also be able to hover over methods to see some examples.

### Core Features

-  [Option type](#option)
-  [Result type](#result)
-  [Transformation](#transformation)
-  [Nesting](#nesting)
-  [All](#all)
-  [Any](#any)
-  [Match](#match)

### Advanced Features

-  [Word to the wise](#word-to-the-wise)
-  [Safe functions and Promises](#safe)
-  [Combined Match](#combined-matching)
-  [Match Chains](#chained-matching)

### Tests

```
npm run test
```

# Option

An Option represents either something, or nothing. If we hold a value of type `Option<T>`, we know it is either `Some<T>` or `None`. Both types share a
common API, so we can chain operations without having to worry whether we have
Some or None until pulling the value out:

```ts
import { Option, Some, None } from "oxide.ts";

function divide(x: number, by: number): Option<number> {
   if (by === 0) {
      return None;
   } else {
      return Some(x / by);
   }
}

const val = divide(100, 20);

// Pull the value out, or throw if None:
const res: number = val.unwrap();
// Throw our own error message in the case of None:
const res: number = val.expect("Division Failed");
// Pull the value out, or use a default if None:
const res: number = val.unwrapOr(1);

// Map the Option<T> to Option<U> by applying a function:
const strval: Option<string> = val.map((num) => `Result = ${num}`);
// Then unwrap the value or use a default if None:
const res: string = strval.unwrapOr("Error");
// Map, assign a default and unwrap in one line:
const res: string = val.mapOr("Error", (num) => `Result = ${num}`);
```

_The type annotations applied to the const variables are for information -_
_the correct types would be inferred._

[&laquo; To contents](#usage)

# Result

A Result represents either something good (`T`) or something not so good (`E`).
If we hold a value of type `Result<T, E>` we know it's either `Ok<T>` or
`Err<E>`. You could think of a Result as an Option where None has a value.

```ts
import { Result, Ok, Err } from "oxide.ts";

function divide(x: number, by: number): Result<number, string> {
   if (by === 0) {
      return Err("Division Failed");
   } else {
      return Ok(x / by);
   }
}

const val = divide(100, 20);

// These are the same as Option (as are many of the other methods):
const res: number = val.unwrap();
const res: number = val.expect("Division Failed");
const res: number = val.unwrapOr(1);
// Map Result<T, E> to Result<U, E>, similar to mapping Option<T> to Option<U>
const strval: Result<string, string> = val.map((num) => `Result = ${num}`);
const res: string = strval.unwrapOr("Error");
const res: string = val.mapOr("Error", (num) => `Result = ${num}`);

// We can unwrap the error, which throws if the Result is Ok:
const err: string = val.unwrapErr();
const err: string = val.expectErr("Expected this to fail");

// Or map the error, mapping Result<T, E> to Result<T, F>
const objerr: Result<number, Error> = val.mapErr((message) => {
   return new Error(message);
});
```

[&laquo; To contents](#usage)

# Transformation

Because they are so similar, it's possible to transform an `Option<T>` into a
`Result<T, E>` and vice versa:

```ts
const val: Option<number> = divide(100, 10);

// Here, the argument provides the Err value to be used if val is None:
const res: Result<number, string> = val.okOr("Division Error");

// And to turn it back into an Option:
const opt: Option<number> = res.ok();
```

_Note that converting from `Result<T, E>` to `Option<T>` causes the `Err`_
_value (if any) to be discarded._

[&laquo; To contents](#usage)

# Nesting

There is no reason you can't nest `Option` and `Result` structures. The
following is completely valid:

```ts
const res: Result<Option<number>, string> = Ok(Some(10));
const val: number = res.unwrap().unwrap();
```

There are times when this makes sense, consider something like:

```ts
import { Result, Option, Some, None, Ok, Err, match } from "oxide.ts";

function search(query: string): Result<Option<SearchResult>, string> {
   const [err, result] = database.search(query);
   if (err) {
      return Err(err);
   } else {
      return result.count > 0 ? Ok(Some(result)) : Ok(None);
   }
}

const result = search("testing");
const output: string = match(result, {
   Ok: match({
      Some: (res) => `Found ${res.count} entries.`,
      None: () => "No results for that search.",
   }),
   Err: (err) => `Error: ${err}`,
});
```

[&laquo; To contents](#usage)

# Match

Concisely determine what action should be taken for a given input value.
For all the different ways you can use `match` (including the advanced uses
discussed later), the following rules apply:

-  Every branch must have the same return type.
-  As soon as a matching branch is found, no others are checked.

The most basic `match` can be performed on `Option` and `Result` types. This
is called _mapped_ matching.

```ts
const num: Option<number> = Some(10);
const res = match(num, {
   Some: (n) => n + 1,
   None: () => 0,
});

assert.equal(res, 11);
```

It's also possible to nest mapped matching and provide defaults. You don't
have to include every named branch:

```ts
const matchNest = (input: Result<Option<number>, string>) =>
   match(input, {
      Ok: match({
         Some: (n) => `num ${n}`,
      }),
      _: () => "nothing",
   });

assert.equal(matchNest(Ok(Some(10))), "num 10");
assert.equal(matchNest(Ok(None)), "nothing");
assert.equal(matchNest(Err("none")), "nothing");
```

**Note:** Using `match` without the first-position value is not a way to
"compile" a match function. Only call match like this within a nested
match structure.

[&laquo; To contents](#usage)

# Safe

Capture the outcome of a function or Promise as an `Option<T>` or
`Result<T, E>`, preventing throwing (function) or rejection (Promise).

## Safe Functions

Calls the passed function with the arguments provided and returns an
`Option<T>` or `Result<T, Error>`. The outcome is `Some`/`Ok` if the function
returned, or `None`/`Err` if it threw. In the case of `Result.safe`, any thrown
value which is not an `Error` is converted.

```ts
function mightThrow(throws: boolean) {
   if (throws) {
      throw new Error("Throw");
   }
   return "Hello World";
}

const x: Result<string, Error> = Result.safe(mightThrow, true);
assert.equal(x.unwrapErr() instanceof Error, true);
assert.equal(x.unwrapErr().message, "Throw");

const x = Result.safe(() => mightThrow(false));
assert.equal(x.unwrap(), "Hello World");
```

**Note:** Any function which returns a Promise (or PromiseLike) value is
rejected by the type signature. `Result<Promise<T>, Error>` or
`Option<Promise<T>>` are not useful types - using it in this way is likely
to be a mistake.

## Safe Promises

Accepts a `Promise` and returns a new Promise which always resolves to either
an `Option<T>` or `Result<T, Error>`. The Result is `Some`/`Ok` if the original
promise resolved, or `None`/`Err` if it rejected. In the case of `Result.safe`,
any rejection value which is not an `Error` is converted.

```ts
async function mightThrow(throws: boolean) {
   if (throws) {
      throw new Error("Throw");
   }
   return "Hello World";
}

const x = await Result.safe(mightThrow(true));
assert.equal(x.unwrapErr() instanceof Error, true);
assert.equal(x.unwrapErr().message, "Throw");

const x = await Result.safe(mightThrow(false));
assert.equal(x.unwrap(), "Hello World");
```

[&laquo; To contents](#usage)

# All

Reduce multiple `Option`s or `Result`s to a single one. The first `None` or
`Err` encountered is returned, otherwise the outcome is a `Some`/`Ok`
containing an array of all the unwrapped values.

```ts
function num(val: number): Result<number, string> {
   return val > 10 ? Ok(val) : Err(`Value ${val} is too low.`);
}

const xyz = Result.all(num(20), num(30), num(40));
const [x, y, z] = xyz.unwrap();
assert.equal(x, 20);
assert.equal(y, 30);
assert.equal(z, 40);

const err = Result.all(num(20), num(5), num(40));
assert.equal(err.isErr(), true);
assert.equal(err.unwrapErr(), "Value 5 is too low.");
```

[&laquo; To contents](#usage)

# Any

Reduce multiple `Option`s or `Result`s into a single one. The first `Some`/`Ok`
found (if any) is returned, otherwise the outcome is `None`, or in the case of `Result` - an `Err` containing an array of all the unwrapped errors.

```ts
function num(val: number): Result<number, string> {
   return val > 10 ? Ok(val) : Err(`Value ${val} is too low.`);
}

const x = Result.any(num(5), num(20), num(2));
assert.equal(x.unwrap(), 20);

const efg = Result.any(num(2), num(5), num(8));
const [e, f, g] = efg.unwrapErr();
assert.equal(e, "Value 2 is too low.");
assert.equal(f, "Value 5 is too low.");
assert.equal(g, "Value 8 is too low.");
```

[&laquo; To contents](#usage)

# Advanced Features

## Word to the wise

The `match` adaptation shifts the TypeScript idiom and may not be suitable for your project - especially if you work with others.

### Combined Matching

It's possible to combine the [mapped](#match) and [chained](#chained-matching) matching approach.

```ts
import { Option, match } from "oxide.ts";

// Easiest to build upon
function player_allowed(player: Option<Player>): boolean {
   return match(player, {
      Some: [
         [{ status: "banned" }, false],
         [{ age: (n) => n > 18 }, true],
      ],
      _: () => false,
   });
}
```

[&laquo; To contents](#usage)

## Chained Matching

Can be performed on any type. A chain is an array of branches which are
tested in sequence. A branch is a tuple of [`<condition>`, `<result>`].
Chain branches follow the following rules:

-  Primitive comparisons test for exact equality (`===`).
-  Any comparison with the condition `_` (`Default`) succeeds automatically.
-  Matching against arrays is a key-to-key comparison (just like objects). As
   such, a match condition of `[10, 20]` doesn't check if 10 and 20 are in
   the array, but instead checks specifically that index `0` is 10 and index
   `1` is 20.
-  Tuple elements are "functions first", such that any `<condition>` that is
   a function will be called to determine if the branch matches, and any
   `<result>` that is a function is called with the input value to determine
   the return value. To match or return a function, see `Fn`.
-  On the matter of functions, a `<condition>` is always a sync function.
   A `<result>` can be async, but if so every branch must return an async
   function.
-  `Option` and `Result` types are recursively evaluated to their deepest
   reachable values and evaluated like any other condition. Using mapped or
   combined matching for these types is better.

At the end of a chain, an optional default branch may be included which is
called with the input value when no other branch matches. If no default is
provided, `match` will throw an error if no other branch matches.

**Note:** Deeply nesting `Option`/`Result` matches may not allow for
complete type information to be presented to the user (though they should
still be verified). It is also slower (execution time and type computation)
than mapped matching or combined matching.

### Primitive Example

```ts
import { match } from "oxide.ts";

const matchNum = (num: number) =>
   match(num, [
      [5, "five"],
      [(n) => n > 100, "big number"],
      [(n) => n < 0, (n) => `negative ${n}`],
      () => "other",
   ]);

assert.equal(matchNum(5), "five");
assert.equal(matchNum(150), "big number");
assert.equal(matchNum(-20), "negative -20");
assert.equal(matchNum(50), "other");
```

### Object Example

```ts
import { match } from "oxide.ts";

const matchObj = (obj: { a: number; b: { c: number } }) =>
   match(obj, [
      [{ a: 5 }, "a is 5"],
      [{ b: { c: 5 } }, "c is 5"],
      [{ a: 10, b: { c: (n) => n > 10 } }, "a 10 c gt10"],
      () => "other",
   ]);

assert.equal(matchObj({ a: 5, b: { c: 5 } }), "a is 5");
assert.equal(matchObj({ a: 50, b: { c: 5 } }), "c is 5");
assert.equal(matchObj({ a: 10, b: { c: 20 } }), "a 10 c gt 10");
assert.equal(matchObj({ a: 8, b: { c: 8 } }), "other");
```

### Array Example

```ts
import { match, _ } from "oxide.ts";

const matchArr = (arr: number[]) =>
   match(arr, [
      [[1], "1"],
      [[2, (n) => n > 10], "2 gt10"],
      [[_, 6, _, 12], "_ 6 _ 12"],
      () => "other",
   ]);

assert.equal(matchArr([1, 2, 3]), "1");
assert.equal(matchArr([2, 12, 6]), "2 gt10");
assert.equal(matchArr([3, 6, 9, 12]), "_ 6 _ 12");
assert.equal(matchArr([2, 4, 6]), "other");
```

[&laquo; To contents](#usage)
