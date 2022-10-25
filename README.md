# oxide.ts

[Rust](https://rust-lang.org)'s `Option<T>` and `Result<T, E>`, implemented
for TypeScript. Zero dependencies, full test coverage and complete in-editor documentation.

## Installation

```
$ npm install oxide.ts --save
```

## New features in 1.1.0

-  Added [intoTuple](#intotuple) to `Result`
-  Added `flatten` to `Option` and `Result`

## Usage

### Core Features

-  [Importing](#importing)
-  [Option](#option)
-  [Result](#result)
-  [Converting](#converting)
-  [Nesting](#nesting)
-  [Iteration](#iteration)
-  [Safe](#safe)
-  [All](#all)
-  [Any](#any)

### Advanced

-  [Match](#match)
-  [Combined Match](#combined-match)
-  [Match Chains](#chained-match)
-  [Compiling](#compiling)

## Importing

You can import the complete **oxide.ts** library:

```ts
import { Option, Some, None, Result, Ok, Err, match, Fn, _ } from "oxide.ts";
```

Or just the **core** library, which exclues the `match` feature:

```ts
import { Option, Some, None, Result, Ok, Err } from "oxide.ts/core";
```

## Option

An Option represents either something, or nothing. If we hold a value of type `Option<T>`, we know it is either `Some<T>` or `None`. Both types share a
common API, so we can chain operations without having to worry whether we have
Some or None until pulling the value out:

```ts
import { Option, Some, None } from "oxide.ts";

function divide(x: number, by: number): Option<number> {
   return by === 0 ? None : Some(x / by);
}

const val = divide(100, 20);

// Pull the value out, or throw if None:
const res: number = val.unwrap();
// Throw a custom error message in the case of None:
const res: number = val.expect("Don't divide by zero!");
// Pull the value out, or use a default if None:
const res: number = val.unwrapOr(1);

// Map the Option<T> to Option<U> by applying a function:
const strval: Option<string> = val.map((num) => `val = ${num}`);
// Unwrap the value or use a default if None:
const res: string = strval.unwrapOr("val = <none>");
// Map, assign a default and unwrap in one line:
const res: string = val.mapOr("val = <none>", (num) => `val = ${num}`);
```

_The type annotations applied to the const variables are for information -_
_the correct types would be inferred._

[&laquo; To contents](#usage)

## Result

A Result represents either something good (`T`) or something not so good (`E`).
If we hold a value of type `Result<T, E>` we know it's either `Ok<T>` or
`Err<E>`. You could think of a Result as an Option where None has a value.

```ts
import { Result, Ok, Err } from "oxide.ts";

function divide(x: number, by: number): Result<number, string> {
   return by === 0 ? Err("Division by zero") : Ok(x / by);
}

const val = divide(100, 20);

// These are the same as Option (as are many of the other methods):
const res: number = val.unwrap();
const res: number = val.expect("Don't divide by zero!");
const res: number = val.unwrapOr(1);

// Map Result<T, E> to Result<U, E>
const strval: Result<string, string> = val.map((num) => `val = ${num}`);
const res: string = strval.unwrapOr("val = <err>");
const res: string = val.mapOr("val = <err>", (num) => `val = ${num}`);

// Unwrap or expect the Err (throws if the Result is Ok):
const err: string = val.unwrapErr();
const err: string = val.expectErr("Expected division by zero!");

// Or map the Err, converting Result<T, E> to Result<T, F>
const errobj: Result<string, Error> = val.mapErr((msg) => new Error(msg));
```

## Converting

These methods provide a way to jump in to (and out of) `Option` and `Result`
types. Particularly these methods can streamline things where:

-  A function returns `T | null`, `T | false` or similar.
-  You are working with physical quantities or using an `indexOf` method.
-  A function accepts an optional argument, `T | null` or similar.

**Note:** Converting to a Result often leaves you with a `Result<T, null>`.
The null value here is not very useful - consider the equivalent Option method
to create an `Option<T>`, or use `mapErr` to change the `E` type.

### into

Convert an existing `Option`/`Result` into a union type containing `T` and
`undefined` (or a provided falsey value).

```ts
function maybeName(): Option<string>;
function maybeNumbers(): Result<number[], Error>;
function printOut(msg?: string): void;

const name: string | undefined = maybeName().into();
const name: string | null = maybeName().into(null);

// Note that the into type does not reflect the E type:
const numbers: number[] | undefined = maybeNumbers().into();
const numbers: number[] | false = maybeNumbers().into(false);

// As a function argument:
printOut(name.into());
```

### intoTuple

Convert a `Result<T, E>` into a tuple of `[null, T]` if the result is `Ok`,
or `[E, null]` otherwise.

```ts
function getUsername(): Result<string, Error>;

const query = getUsername();
const [err, res] = query.intoTuple();

if (err) {
   console.error(`Query Error: ${err}`);
} else {
   console.log(`Welcome: ${res.toLowerCase()}`);
}
```

### from

Convert to an `Option`/`Result` which is `Some<T>`/`Ok<T>` unless the value is
falsey, an instance of `Error` or an invalid `Date`.

The `T` is narrowed to exclude any falsey values or Errors.

```ts
const people = ["Fry", "Leela", "Bender"];
// Create an Option<string> from a find:
const person = Option.from(people.find((name) => name === "Fry"));
// or shorter:
const person = Option(people.find((name) => name === "Bender"));
```

In the case of `Result`, the `E` type includes:

-  `null` (if `val` could have been falsey or an invalid date)
-  `Error` types excluded from `T` (if there are any)

```ts
function randomName(): string | false;
function tryName(): string | Error;
function randomNumbers(): number[] | Error;

// Create a Result<string, null>
const person = Result.from(randomName());
// Create a Result<string, Error | null>
const name = Result(tryName());
// Create a Result<number[], Error>
const num = Result(randomNumbers());
```

### nonNull

Convert to an `Option`/`Result` which is `Some<T>`/`Ok<T>` unless the value
provided is `undefined`, `null` or `NaN`.

```ts
function getNum(): number | null;
const num = Option.nonNull(getNum()).unwrapOr(100); // Could be 0

const words = ["express", "", "planet"];
const str = Option.nonNull(words[getNum()]);
str.unwrapOr("No such index"); // Could be ""
```

### qty

Convert to an `Option`/`Result` which is `Some<number>`/`Ok<number>`
when the provided `val` is a finite integer greater than or equal to 0.

```ts
const word = "Buggalo";

const g = Option.qty(word.indexOf("g"));
assert.equal(g.unwrap(), 2);

const z = Option.qty(word.indexOf("z"));
assert.equal(z.isNone(), true);
```

[&laquo; To contents](#usage)

## Nesting

You can nest `Option` and `Result` structures. The following example uses
nesting to distinguish between _found something_, _found nothing_ and
_database error_:

```ts
function search(query: string): Result<Option<SearchResult>, string> {
   const [err, result] = database.search(query);
   if (err) {
      return Err(err);
   } else {
      return Ok(result.count > 0 ? Some(result) : None);
   }
}

const result = search("testing");
const output: string = match(result, {
   Ok: {
      Some: (result) => `Found ${result.count} entries.`,
      None: () => "No results for that search.",
   },
   Err: (err) => `Error: ${err}.`,
});
```

[&laquo; To contents](#usage)

## Iteration

An `Option` or `Result` that contains an iterable `T` type can be iterated upon
directly. In the case of `None` or `Err`, an empty iterator is returned.

The compiler will complain if the inner type is not definitely iterable
(including `any`), or if the monad is known to be `None` or `Err`.

```ts
const numbers = Option([1.12, 2.23, 3.34]);
for (const num of numbers) {
   console.log("Number is:", num.toFixed(1));
}

const numbers: Option<number[]> = None;
for (const num of numbers) {
   console.log("Unreachable:", num.toFixed());
}
```

It's also possible to iterate over nested monads in the same way:

```ts
const numbers = Option(Result(Option([1, 2, 3])));
for (const num of numbers) {
   console.log("Number is:", num.toFixed(1));
}
```

[&laquo; To contents](#usage)

## Safe

Capture the outcome of a function or Promise as an `Option<T>` or
`Result<T, E>`, preventing throwing (function) or rejection (Promise).

### Safe Functions

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

### Safe Promises

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

## All

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

## Any

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

## Match

Mapped matching is possible on `Option` and `Result` types:

```ts
const num = Option(10);
const res = match(num, {
   Some: (n) => n + 1,
   None: () => 0,
});

assert.equal(res, 11);
```

You can nest mapped matching patterns and provide defaults. If a default is
not found in the current level it will fall back to the previous level. When
no suitable match or default is found, an exhausted error is thrown.

```ts
function nested(val: Result<Option<number>, string>): string {
   return match(val, {
      Ok: { Some: (num) => `found ${num}` },
      _: () => "nothing",
   });
}

assert.equal(nested(Ok(Some(10))), "found 10");
assert.equal(nested(Ok(None)), "nothing");
assert.equal(nested(Err("Not a number")), "nothing");
```

[&laquo; To contents](#usage)

## Combined Match

[Mapped](#match) Matching and [Chained](#chained-match) Matching can be
combined. A match chain can be provided instead of a function for `Some`,
`Ok` and `Err`.

```ts
function matchNum(val: Option<number>): string {
   return match(val, {
      Some: [
         [5, "5"],
         [(x) => x < 10, "< 10"],
         [(x) => x > 20, "> 20"],
      ],
      _: () => "none or not matched",
   });
}

assert.equal(matchNum(Some(5)), "5");
assert.equal(matchNum(Some(7)), "< 10");
assert.equal(matchNum(Some(25)), "> 20");
assert.equal(matchNum(Some(15)), "none or not matched");
assert.equal(matchNum(None), "none or not matched");
```

[&laquo; To contents](#usage)

## Match Chains

Chained matching is possible on any type. Branches are formed by associating
a `condition` with a `result` (with an optional default at the end). The first
matching branch is the result.

More detail about chained matching patterns is available in the bundled JSDoc.

### Examples

```ts
function matchArr(arr: number[]): string {
   return match(arr, [
      [[1], "1"],
      [[2, (x) => x > 10], "2, > 10"],
      [[_, 6, 9, _], (a) => a.join(", ")],
      () => "other",
   ]);
}

assert.equal(matchArr([1, 2, 3]), "1");
assert.equal(matchArr([2, 12, 6]), "2, > 10");
assert.equal(matchArr([3, 6, 9]), "other");
assert.equal(matchArr([3, 6, 9, 12]), "3, 6, 9, 12");
assert.equal(matchArr([2, 4, 6]), "other");
```

```ts
interface ExampleObj {
   a: number;
   b?: { c: number };
   o?: number;
}

function matchObj(obj: ExampleObj): string {
   return match(obj, [
      [{ a: 5 }, "a = 5"],
      [{ b: { c: 5 } }, "c = 5"],
      [{ a: 10, o: _ }, "a = 10, o = _"],
      [{ a: 15, b: { c: (n) => n > 10 } }, "a = 15; c > 10"],
      () => "other",
   ]);
}

assert.equal(matchObj({ a: 5 }), "a = 5");
assert.equal(matchObj({ a: 50, b: { c: 5 } }), "c = 5");
assert.equal(matchObj({ a: 10 }), "other");
assert.equal(matchObj({ a: 10, o: 1 }), "a = 10, o = _");
assert.equal(matchObj({ a: 15, b: { c: 20 } }), "a = 15; c > 10");
assert.equal(matchObj({ a: 8, b: { c: 8 }, o: 1 }), "other");
```

[&laquo; To contents](#usage)

## Compiling

Match patterns can also be _compiled_ into a function. More detail about
compiling is available in the bundled JSDoc.

```ts
const matchSome = match.compile({
   Some: (n: number) => `some ${n}`,
   None: () => "none",
});

assert.equal(matchSome(Some(1)), "some 1");
assert.equal(matchSome(None), "none");
```

[&laquo; To contents](#usage)

[&laquo; To top of page](#oxidets)
