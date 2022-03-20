import { expect } from "chai";
import { Result, Ok, Err, match, _ } from "../../../src";

export default function result() {
   describe("Mapped", mapped);
   describe("Chained", chained);
   describe("Hybrid (chained within mapped)", hybrid);
}

function mapped() {
   function test(input: Result<number, string>): string {
      return match(input, {
         Ok: (n) => `ok ${n}`,
         Err: (n) => `err ${n}`,
      });
   }

   it("Executes the mapped Ok branch", () =>
      expect(test(Ok(1))).to.equal("ok 1"));
   it("Executes the mapped Err branch", () =>
      expect(test(Err("err"))).to.equal("err err"));
   it("Throws when there is no matching branch", () =>
      expect(() =>
         match(Ok(1), {
            Err: () => true, //
         })
      ).to.throw(/exhausted/));
}

function chained() {
   chainedTest();
   chainedArrayTest();
   chainedObjectTest();
   chainedConditionsTest();
}

function chainedTest() {
   function test(input: Result<number, string>): string {
      return match(input, [
         [Ok(1), "ok 1"],
         [Err("err"), "err err"],
         [Ok(_), "ok default"],
         [Err(_), "err default"],
      ]);
   }

   it("Matches the chained branches", () => {
      expect(test(Ok(1))).to.equal("ok 1");
      expect(test(Ok(2))).to.equal("ok default");
      expect(test(Err("err"))).to.equal("err err");
      expect(test(Err("nomatch"))).to.equal("err default");
   });
}
function chainedArrayTest() {
   function test(input: Result<number[], string[]>): string {
      return match(input, [
         [Ok([1, 2]), "ok 1 2"],
         [Ok([2, _, 6]), "ok 2 _ 6"],
         [Err(["a", "b"]), "err a b"],
         [Err([_, "c", "d"]), "err _ c d"],
         () => "default",
      ]);
   }

   it("Should deeply match arrays in chains", () => {
      expect(test(Ok([1, 2, 3]))).to.equal("ok 1 2");
      expect(test(Ok([2, 4, 6]))).to.equal("ok 2 _ 6");
      expect(test(Ok([2, 3, 4]))).to.equal("default");
      expect(test(Err(["a", "b", "c"]))).to.equal("err a b");
      expect(test(Err(["b", "c", "d"]))).to.equal("err _ c d");
      expect(test(Err(["c", "d", "e"]))).to.equal("default");
   });
}

function chainedObjectTest() {
   function test(
      input: Result<
         { a: number; c?: { d: number } },
         { b: number; c?: { d: number } }
      >
   ): string {
      return match(input, [
         [Ok({ a: 1 }), "ok a 1"],
         [Err({ b: 1 }), "err b 1"],
         [Ok({ c: { d: 10 } }), "ok cd 10"],
         [Err({ c: { d: 5 } }), "err cd 5"],
         () => "default",
      ]);
   }

   it("Should deeply match objects in chains", () => {
      expect(test(Ok({ a: 1 }))).to.equal("ok a 1");
      expect(test(Ok({ a: 2, c: { d: 5 } }))).to.equal("default");
      expect(test(Ok({ a: 2, c: { d: 10 } }))).to.equal("ok cd 10");
      expect(test(Err({ b: 1 }))).to.equal("err b 1");
      expect(test(Err({ b: 2, c: { d: 10 } }))).to.equal("default");
      expect(test(Err({ b: 2, c: { d: 5 } }))).to.equal("err cd 5");
   });
}

function chainedConditionsTest() {
   function test(input: Result<number, string>): string {
      return match(input, [
         [Ok(35), "ok 35"],
         [(n) => n.unwrapOr(0) > 30, "ok gt 30"],
         [(n) => n.unwrapOr(10) < 10, "ok lt 10"],
         [Err("err"), "err err"],
         [(str) => str.isErr() && str.unwrapErr().startsWith("a"), "err a"],
         () => "no match",
      ]);
   }

   it("Matches chained branches based on conditions", () => {
      expect(test(Ok(5))).to.equal("ok lt 10");
      expect(test(Ok(25))).to.equal("no match");
      expect(test(Ok(35))).to.equal("ok 35");
      expect(test(Ok(40))).to.equal("ok gt 30");
      expect(test(Err("err"))).to.equal("err err");
      expect(test(Err("abc"))).to.equal("err a");
      expect(test(Err("def"))).to.equal("no match");
   });
}

function hybrid() {
   hybridTest();
   hybridPartialTest;
}

function hybridTest() {
   function test(input: Result<number, string>): string {
      return match(input, {
         Ok: [
            [1, "ok 1"],
            [(n) => n > 10, "ok gt 10"], //
            () => "ok default",
         ],
         Err: [
            ["err", "err err"],
            [(str) => str.startsWith("a"), "err a"],
            () => "err default",
         ],
      });
   }

   it("Matches chained branches within mapped branches", () => {
      expect(test(Ok(1))).to.equal("ok 1");
      expect(test(Ok(15))).to.equal("ok gt 10");
      expect(test(Ok(5))).to.equal("ok default");
      expect(test(Err("err"))).to.equal("err err");
      expect(test(Err("abc"))).to.equal("err a");
      expect(test(Err("def"))).to.equal("err default");
   });
}

function hybridPartialTest() {
   function test(input: Result<number, string>): string {
      return match(input, {
         Ok: [
            [1, "ok 1"],
            [(n) => n > 10, "ok gt 10"],
         ],
         Err: [["err", "err err"]],
         _: () => "default",
      });
   }

   it("Falls back to the default case", () => {
      expect(test(Ok(1))).to.equal("ok 1");
      expect(test(Ok(15))).to.equal("ok gt 10");
      expect(test(Err("err"))).to.equal("err err");
      expect(test(Ok(5))).to.equal("default");
      expect(test(Err("nomatch"))).to.equal("default");
   });
}
