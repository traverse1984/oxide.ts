import { expect } from "chai";
import {
   Option,
   Result,
   Some,
   None,
   Ok,
   Err,
   match,
   Fn,
   SomeIs,
   OkIs,
   ErrIs,
   _,
   Default,
} from "../../../src";

export default function result() {
   function mappedMatch(input: Result<number, string>): string {
      return match(input, {
         Ok: (n) => `ok ${n}`,
         Err: (n) => `err ${n}`,
      });
   }

   function chainMatch(input: Result<number, string>): string {
      return match(input, [
         [Ok(1), "ok 1"],
         [Err("err"), "err err"],
         [Ok(_), "ok default"],
         [Err(_), "err default"],
      ]);
   }

   function condMatch(input: Result<number, string>): string {
      return match(input, [
         [Ok(35), "ok 35"],
         [OkIs((n) => n > 30), "ok gt 30"],
         [OkIs((n) => n < 10), "ok lt 10"],
         [Err("err"), "err err"],
         [ErrIs((str) => str.startsWith("a")), "err a"],
         () => "no match",
      ]);
   }

   function objMatch(
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

   function arrMatch(input: Result<number[], string[]>): string {
      return match(input, [
         [Ok([1, 2]), "ok 1 2"],
         [Ok([2, _, 6]), "ok 2 _ 6"],
         [Err(["a", "b"]), "err a b"],
         [Err([_, "c", "d"]), "err _ c d"],
         () => "default",
      ]);
   }

   function hybridMatch(input: Result<number, string>): string {
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

   function partialMatch(input: Result<number, string>): string {
      return match(input, {
         Ok: [
            [1, "ok 1"],
            [(n) => n > 10, "ok gt 10"],
         ],
         Err: [["err", "err err"]],
         _: () => "default",
      });
   }

   it("Executes the mapped Ok branch", () =>
      expect(mappedMatch(Ok(1))).to.equal("ok 1"));
   it("Executes the mapped Err branch", () =>
      expect(mappedMatch(Err("err"))).to.equal("err err"));
   it("Matches the chained branches", () => {
      expect(chainMatch(Ok(1))).to.equal("ok 1");
      expect(chainMatch(Ok(2))).to.equal("ok default");
      expect(chainMatch(Err("err"))).to.equal("err err");
      expect(chainMatch(Err("nomatch"))).to.equal("err default");
   });
   it("Matches chained branches based on conditions", () => {
      expect(condMatch(Ok(5))).to.equal("ok lt 10");
      expect(condMatch(Ok(25))).to.equal("no match");
      expect(condMatch(Ok(35))).to.equal("ok 35");
      expect(condMatch(Ok(40))).to.equal("ok gt 30");
      expect(condMatch(Err("err"))).to.equal("err err");
      expect(condMatch(Err("abc"))).to.equal("err a");
      expect(condMatch(Err("def"))).to.equal("no match");
   });
   it("Should deeply match objects in chains", () => {
      expect(objMatch(Ok({ a: 1 }))).to.equal("ok a 1");
      expect(objMatch(Ok({ a: 2, c: { d: 5 } }))).to.equal("default");
      expect(objMatch(Ok({ a: 2, c: { d: 10 } }))).to.equal("ok cd 10");
      expect(objMatch(Err({ b: 1 }))).to.equal("err b 1");
      expect(objMatch(Err({ b: 2, c: { d: 10 } }))).to.equal("default");
      expect(objMatch(Err({ b: 2, c: { d: 5 } }))).to.equal("err cd 5");
   });
   it("Should deeply match arrays in chains", () => {
      expect(arrMatch(Ok([1, 2, 3]))).to.equal("ok 1 2");
      expect(arrMatch(Ok([2, 4, 6]))).to.equal("ok 2 _ 6");
      expect(arrMatch(Ok([2, 3, 4]))).to.equal("default");
      expect(arrMatch(Err(["a", "b", "c"]))).to.equal("err a b");
      expect(arrMatch(Err(["b", "c", "d"]))).to.equal("err _ c d");
      expect(arrMatch(Err(["c", "d", "e"]))).to.equal("default");
   });
   it("Matches chained branches within mapped branches", () => {
      expect(hybridMatch(Ok(1))).to.equal("ok 1");
      expect(hybridMatch(Ok(15))).to.equal("ok gt 10");
      expect(hybridMatch(Ok(5))).to.equal("ok default");
      expect(hybridMatch(Err("err"))).to.equal("err err");
      expect(hybridMatch(Err("abc"))).to.equal("err a");
      expect(hybridMatch(Err("def"))).to.equal("err default");
   });
   it("Falls back to the default case", () => {
      expect(partialMatch(Ok(1))).to.equal("ok 1");
      expect(partialMatch(Ok(15))).to.equal("ok gt 10");
      expect(partialMatch(Err("err"))).to.equal("err err");
      expect(partialMatch(Ok(5))).to.equal("default");
      expect(partialMatch(Err("nomatch"))).to.equal("default");
   });
   it("Throws when there is no matching branch", () =>
      expect(() => match(Ok(1), { Err: () => true })).to.throw(/exhausted/));
}
