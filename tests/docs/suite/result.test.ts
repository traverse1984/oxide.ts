import { assert } from "chai";
import { Result, Ok, Err } from "../../../src";

export default function result_docs() {
   it("Result", resultMain);
   it("Result.safe (function)", resultSafeFunction);
   it("Result.safe (promise)", resultSafePromise);
   it("Result.all", resultAll);
   it("Result.any", resultAny);
}

function resultMain() {
   const users = ["Fry", "Bender"];
   function fetch_user(username: string): Result<string, string> {
      return users.includes(username) ? Ok(username) : Err("Wha?");
   }

   function greet(username: string): string {
      return fetch_user(username).mapOrElse(
         (err) => `Error: ${err}`,
         (user) => `Good news everyone, ${user} is here!`
      );
   }

   assert.equal(greet("Bender"), "Good news everyone, Bender is here!");
   assert.equal(greet("SuperKing"), "Error: Wha?");
}

function resultSafeFunction() {
   function mightThrow(throws: boolean) {
      if (throws) {
         throw new Error("Throw");
      }
      return "Hello World";
   }

   {
      const x: Result<string, Error> = Result.safe(mightThrow, true);
      assert.equal(x.unwrapErr() instanceof Error, true);
      assert.equal(x.unwrapErr().message, "Throw");
   }

   {
      const x = Result.safe(() => mightThrow(false));
      assert.equal(x.unwrap(), "Hello World");
   }
}

async function resultSafePromise() {
   async function mightThrow(throws: boolean) {
      if (throws) {
         throw new Error("Throw");
      }
      return "Hello World";
   }

   {
      const x = await Result.safe(mightThrow(true));
      assert.equal(x.unwrapErr() instanceof Error, true);
      assert.equal(x.unwrapErr().message, "Throw");
   }

   {
      const x = await Result.safe(mightThrow(false));
      assert.equal(x.unwrap(), "Hello World");
   }
}

function resultAll() {
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
}

function resultAny() {
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
}
