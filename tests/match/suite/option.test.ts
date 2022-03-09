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

export default function option() {
   function mappedMatch(input: Option<number>): string {
      return match(input, {
         Some: (n) => `some ${n}`,
         None: () => "none",
      });
   }

   function chainMatch(input: Option<number>): string {
      return match(input, [
         [Some(1), "some 1"],
         [Some(_), "some default"],
         [None, "none"],
      ]);
   }

   function condMatch(input: Option<number>): string {
      return match(input, [
         [Some(35), "35"],
         [SomeIs((n) => n > 30), "gt 30"],
         [SomeIs((n) => n < 20), "lt 20"],
         () => "no match",
      ]);
   }

   function objMatch(input: Option<{ a: number; c?: { d: number } }>): string {
      return match(input, [
         [Some({ a: 1 }), "a 1"],
         [Some({ c: { d: 10 } }), "cd 10"],
         () => "default",
      ]);
   }

   function arrMatch(input: Option<number[]>): string {
      return match(input, [
         [Some([1, 2]), "1 2"],
         [Some([2, _, 6]), "2 _ 6"],
         () => "default",
      ]);
   }

   function hybridMatch(input: Option<number>): string {
      return match(input, {
         Some: [
            [1, "some 1"],
            [(n) => n > 10, "some gt 10"],
            () => "some default",
         ],
         None: () => "none",
      });
   }

   function partialMatch(input: Option<number>): string {
      return match(input, {
         Some: [
            [1, "some 1"],
            [(n) => n > 10, "some gt 10"],
         ],
         _: () => "default",
      });
   }

   it("Executes the mapped Some branch", () =>
      expect(mappedMatch(Some(1))).to.equal("some 1"));
   it("Executes the mapped None branch", () =>
      expect(mappedMatch(None)).to.equal("none"));
   it("Matches the chained branches", () => {
      expect(chainMatch(Some(1))).to.equal("some 1");
      expect(chainMatch(Some(2))).to.equal("some default");
   });
   it("Matches the chained branches based on conditions", () => {
      expect(condMatch(Some(5))).to.equal("lt 20");
      expect(condMatch(Some(25))).to.equal("no match");
      expect(condMatch(Some(35))).to.equal("35");
      expect(condMatch(Some(40))).to.equal("gt 30");
      expect(condMatch(None)).to.equal("no match");
   });
   it("Deeply matches objects within chains", () => {
      expect(objMatch(Some({ a: 1 }))).to.equal("a 1");
      expect(objMatch(Some({ a: 2 }))).to.equal("default");
      expect(objMatch(Some({ a: 2, c: { d: 10 } }))).to.equal("cd 10");
   });
   it("Deeply matches arrays within chains", () => {
      expect(arrMatch(Some([1, 2, 3]))).to.equal("1 2");
      expect(arrMatch(Some([2, 4, 6]))).to.equal("2 _ 6");
      expect(arrMatch(Some([2, 3, 4]))).to.equal("default");
   });
   it("Matches chained branches within mapped branches", () => {
      expect(hybridMatch(Some(1))).to.equal("some 1");
      expect(hybridMatch(Some(14))).to.equal("some gt 10");
      expect(hybridMatch(Some(5))).to.equal("some default");
      expect(hybridMatch(None)).to.equal("none");
   });
   it("Falls back to the default case", () => {
      expect(partialMatch(Some(1))).to.equal("some 1");
      expect(partialMatch(Some(15))).to.equal("some gt 10");
      expect(partialMatch(Some(5))).to.equal("default");
      expect(partialMatch(None)).to.equal("default");
   });
   it("Throws when there is no match", () =>
      expect(() => match(Some(1), { None: () => true })).to.throw(/exhausted/));
}
