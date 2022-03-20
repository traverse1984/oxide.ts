import { expect } from "chai";
import { Option, Some, None, match, _ } from "../../../src";

export default function option() {
   describe("Mapped", mapped);
   describe("Chained", chained);
   describe("Hybrid (chained within mapped)", hybrid);
}

function mapped() {
   function test(val: Option<number>): string {
      return match(val, {
         Some: (n) => `some ${n}`,
         None: () => "none",
      });
   }

   it("Executes the mapped Some branch", () =>
      expect(test(Some(1))).to.equal("some 1"));
   it("Executes the mapped None branch", () =>
      expect(test(None)).to.equal("none"));
   it("Throws when there is no match", () =>
      expect(() =>
         match(Some(1), {
            None: () => true, //
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
   function test(val: Option<number>): string {
      return match(val, [
         [Some(1), "some 1"],
         [Some(_), "some default"],
         [None, "none"],
      ]);
   }

   it("Matches the chained branches", () => {
      expect(test(Some(1))).to.equal("some 1");
      expect(test(Some(2))).to.equal("some default");
   });
}

function chainedArrayTest() {
   function test(input: Option<number[]>): string {
      return match(input, [
         [Some([1, 2]), "1 2"],
         [Some([2, _, 6]), "2 _ 6"],
         () => "default",
      ]);
   }

   it("Deeply matches arrays within chains", () => {
      expect(test(Some([1, 2, 3]))).to.equal("1 2");
      expect(test(Some([2, 4, 6]))).to.equal("2 _ 6");
      expect(test(Some([2, 3, 4]))).to.equal("default");
   });
}

function chainedObjectTest() {
   function test(input: Option<{ a: number; c?: { d: number } }>): string {
      return match(input, [
         [Some({ a: 1 }), "a 1"],
         [Some({ c: { d: 10 } }), "cd 10"],
         () => "default",
      ]);
   }

   it("Deeply matches objects within chains", () => {
      expect(test(Some({ a: 1 }))).to.equal("a 1");
      expect(test(Some({ a: 2 }))).to.equal("default");
      expect(test(Some({ a: 2, c: { d: 10 } }))).to.equal("cd 10");
   });
}

function chainedConditionsTest() {
   function test(input: Option<number>): string {
      return match(input, [
         [Some(35), "35"],
         [(n) => n.unwrapOr(0) > 30, "gt 30"],
         [(n) => n.unwrapOr(20) < 20, "lt 20"],
         () => "no match",
      ]);
   }

   it("Matches the chained branches based on conditions", () => {
      expect(test(Some(5))).to.equal("lt 20");
      expect(test(Some(25))).to.equal("no match");
      expect(test(Some(35))).to.equal("35");
      expect(test(Some(40))).to.equal("gt 30");
      expect(test(None)).to.equal("no match");
   });
}

function hybrid() {
   hybridTest();
   hybridPartialTest;
}

function hybridTest() {
   function test(input: Option<number>): string {
      return match(input, {
         Some: [
            [1, "some 1"],
            [(n) => n > 10, "some gt 10"],
            () => "some default",
         ],
         None: () => "none",
      });
   }

   it("Matches chained branches within mapped branches", () => {
      expect(test(Some(1))).to.equal("some 1");
      expect(test(Some(14))).to.equal("some gt 10");
      expect(test(Some(5))).to.equal("some default");
      expect(test(None)).to.equal("none");
   });
}

function hybridPartialTest() {
   function test(input: Option<number>): string {
      return match(input, {
         Some: [
            [1, "some 1"],
            [(n) => n > 10, "some gt 10"],
         ],
         _: () => "default",
      });
   }

   it("Falls back to the default case", () => {
      expect(test(Some(1))).to.equal("some 1");
      expect(test(Some(15))).to.equal("some gt 10");
      expect(test(Some(5))).to.equal("default");
      expect(test(None)).to.equal("default");
   });
}
