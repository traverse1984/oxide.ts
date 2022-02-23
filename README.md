# oxide.ts

[Rust](https://rust-lang.org)'s `Option<T>` and `Result<T, E>`, implemented
for TypeScript.

## Features

-  Add more meaning to return types.
-  Express, chain and map values as if you were writing in Rust.
-  Make guarded functions that return at the first sign of trouble (`?`).
-  Use the `match` adaptation to simplify conditionals.
-  API available both `snake_case` and `camelCase`.

Zero dependencies, full test coverage and examples for every function at your
fingertips with JSDoc comments.

<sub>Exported functions are also types, so VSCode shows them a different
colour. This might not be a feature but I'm really digging it. YMMV.</sub>

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
-  [Match](#match)

### Advanced Features

-  [Word to the wise](#word-to-the-wise)
-  [Guarded Option function](#guarded-option-function)
-  [Guarded Result function](#guarded-result-function)
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
const res: number = val.unwrap_or(1);

// Map the Option<T> to Option<U> by applying a function:
const strval: Option<string> = val.map((num) => `Result = ${num}`);
// Then unwrap the value or use a default if None:
const res: string = strval.unwrap_or("Error");
// Map, assign a default and unwrap in one line:
const res: string = val.map_or("Error", (num) => `Result = ${num}`);
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
      return Some(x / by);
   }
}

const val = divide(100, 20);

// These are the same as Option (as are many of the other methods):
const res: number = val.unwrap();
const res: number = val.expect("Division Failed");
const res: number = val.unwrap_or(1);
// Map Result<T, E> to Result<U, E>, similar to mapping Option<T> to Option<U>
const strval: Result<string, string> = val.map((num) => `Result = ${num}`);
const res: string = strval.unwrap_or("Error");
const res: string = val.map_or("Error", (num) => `Result = ${num}`);

// We can unwrap the error, which throws if the Result is Ok:
const err: string = val.unwrap_err();
const err: string = val.expect_err("Expected this to fail");

// Or map the error, mapping Result<T, E> to Result<T, F>
const objerr: Result<number, Error> = val.map_err((message) => {
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
const res: Result<number, string> = val.ok_or("Division Error");

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

# Advanced Features

This section talks about `match`, `Guard` and `_`. Examples here are lifted
straight from the JSDoc.

## Word to the wise

At it's heart this library is an implementation of `Option<T>` and
`Result<T, E>` - it aims to bring them seamlessly to TypeScript. The
`match` adaptation and guarded functions shift the TypeScript idiom and may
not be suitable for your project - especially if you work with others.

<sub>They are cool, though...</sub>

# Guarded Option Function

Calling `Option(fn)` creates a new function with an `OptionGuard` helper.
The guard lets you quickly and safely unwrap other `Option` values, and
causes the function to return early with `None` if an unwrap fails. A
function created in this way always returns an `Option<T>`.

```ts
import { Option, Some, None } from "oxide.ts";

function to_pos(pos: number): Option<number> {
   return pos > 0 && pos < 100 ? Some(pos * 10) : None;
}

// Creates (x: number, y: number) => Option<{ x: number; y: number }>;
const get_pos = Option((guard, x: number, y: number) => {
   return Some({
      x: guard(to_pos(x)),
      y: guard(to_pos(y)),
   });
});

function show_pos(x: number, y: number): string {
   return get_pos(x, y).map_or("Invalid Pos", ({ x, y }) => `Pos (${x},${y})`);
}

assert.equal(show_pos(10, 20), "Pos (100,200)");
assert.equal(show_pos(1, 99), "Pos (10,990)");
assert.equal(show_pos(0, 50), "Invalid Pos");
assert.equal(show_pos(50, 100), "Invalid Pos");
```

_See tests/examples/guard-bubbling.ts for some possible pitfalls when_
_combined with `try`/`catch`._

[&laquo; To contents](#usage)

# Guarded Result Function

Calling `Result(fn)` creates a new function with a `ResultGuard<E>` helper.
The guard lets you quickly and safely unwrap other `Result` values
(providing that they have the same `E` type), and causes the function to
return early with `Err<E>` if an unwrap fails. A function create in this way
always returns a `Result<T, E>`.

```ts
import { Result, Guard, Ok, Err } from "oxide.ts";

function to_pos(pos: number): Result<number, string> {
   return pos > 0 && pos < 100 ? Ok(pos * 10) : Err("Invalid Pos");
}

// (x: number, y: number) => Result<{ x: number; y: number }, string>;
const get_pos = Result((guard: Guard<string>, x: number, y: number) => {
   return Ok({
      x: guard(to_pos(x)),
      y: guard(to_pos(y)),
   });
});

function show_pos(x: number, y: number): string {
   return get_pos(x, y).map_or_else(
      (err) => `Error: ${err}`,
      ({ x, y }) => `Pos (${x},${y})`
   );
}

assert.equal(show_pos(10, 20), "Pos (100,200)");
assert.equal(show_pos(1, 99), "Pos (10,990)");
assert.equal(show_pos(0, 50), "Error: Invalid Pos");
assert.equal(show_pos(50, 100), "Error: Invalid Pos");
```

_See tests/examples/guard-bubbling.ts for some possible pitfalls when_
_combined with `try`/`catch`._

[&laquo; To contents](#usage)

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
