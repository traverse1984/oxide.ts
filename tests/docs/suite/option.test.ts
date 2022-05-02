import { assert } from "chai";
import { Option, Some, None } from "../../../src";

export default function optionDocs() {
   it("Option", optionMain);
   it("Option.safe (function)", optionSafeFunction);
   it("Option.safe (promise)", optionSafePromise);
   it("Option.all", optionAll);
   it("Option.any", optionAny);
}

function optionMain() {
   const users = ["Fry", "Bender"];
   function fetch_user(username: string): Option<string> {
      return users.includes(username) ? Some(username) : None;
   }

   function greet(username: string): string {
      return fetch_user(username)
         .map((user) => `Good news everyone, ${user} is here!`)
         .unwrapOr("Wha?");
   }

   assert.equal(greet("Bender"), "Good news everyone, Bender is here!");
   assert.equal(greet("SuperKing"), "Wha?");
}

function optionSafeFunction() {
   function mightThrow(throws: boolean) {
      if (throws) {
         throw new Error("Throw");
      }
      return "Hello World";
   }

   {
      const x: Option<string> = Option.safe(mightThrow, true);
      assert.equal(x.isNone(), true);
   }

   {
      const x = Option.safe(() => mightThrow(false));
      assert.equal(x.unwrap(), "Hello World");
   }
}

async function optionSafePromise() {
   async function mightThrow(throws: boolean) {
      if (throws) {
         throw new Error("Throw");
      }
      return "Hello World";
   }

   {
      const x = await Option.safe(mightThrow(true));
      assert.equal(x.isNone(), true);
   }

   {
      const x = await Option.safe(mightThrow(false));
      assert.equal(x.unwrap(), "Hello World");
   }
}

function optionAll() {
   function num(val: number): Option<number> {
      return val > 10 ? Some(val) : None;
   }

   {
      const xyz = Option.all(num(20), num(30), num(40));
      const [x, y, z] = xyz.unwrap();
      assert.equal(x, 20);
      assert.equal(y, 30);
      assert.equal(z, 40);
   }

   {
      const x = Option.all(num(20), num(5), num(40));
      assert.equal(x.isNone(), true);
   }
}

function optionAny() {
   function num(val: number): Option<number> {
      return val > 10 ? Some(val) : None;
   }

   {
      const x = Option.any(num(5), num(20), num(2));
      assert.equal(x.unwrap(), 20);
   }

   {
      const x = Option.any(num(2), num(5), num(8));
      assert.equal(x.isNone(), true);
   }
}
