import { expect } from "chai";
import {
   Result,
   Ok,
   Err,
   Option,
   Some,
   None,
   match,
   Fn,
   _,
   Default,
} from "../../../src";

const CommonMethods = ["is", "from", "nonNull", "qty", "safe", "all", "any"];

export default function immutable() {
   describe("Option", option);
   describe("Result", result);
   describe("Match", match_);
}

function option() {
   test("Option", Option, CommonMethods);
   test("Some", Some);
   test("Some<T>", Some(1));
   test("Some (prototype)", Object.getPrototypeOf(Some(1)));
   test("None", None);
   test("None (prototype)", Object.getPrototypeOf(None));
}

function result() {
   test("Result", Result, CommonMethods);
   test("Ok", Ok);
   test("Ok<T>", Ok(1));
   test("Ok (prototype)", Object.getPrototypeOf(Ok(1)));
   test("Err", Err);
   test("Err<E>", Err(1));
   test("Err (prototype)", Object.getPrototypeOf(Err(1)));
}

function match_() {
   const testFn = () => true;
   test("match", match, ["compile"]);
   test("Default", Default);
   test("_", _);
   test("Fn", Fn);
   test("Fn<T>", Fn(testFn));
}

function test(name: string, val: any, keys: string[] = []): void {
   it(name, () => expect(Object.isFrozen(val)).to.be.true);
   for (const key of keys) {
      test([name, key].join("."), val[key]);
   }
}
