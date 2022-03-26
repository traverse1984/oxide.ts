import { expect } from "chai";
import { Option, Result, Some, None, Ok, Err, match } from "../../../src";

export default function nesting() {
   describe("Mapped", mapped);
   describe("Chained", chained);
}

function mapped() {
   mappedNestingTest();
   closestDefaultTest();
}

function mappedNestingTest() {
   function test(val: Result<Option<Result<number, number>>, number>): string {
      return match(val, {
         Ok: {
            Some: {
               Ok: (n) => `ok ${n}`,
               Err: (e) => `err b ${e}`,
            },
            None: () => "none",
         },
         Err: (e) => `err a ${e}`,
      });
   }

   it("Matches", () => {
      expect(test(Ok(Some(Ok(1))))).to.equal("ok 1");
      expect(test(Ok(Some(Err(1))))).to.equal("err b 1");
      expect(test(Ok(None))).to.equal("none");
      expect(test(Err(1))).to.equal("err a 1");
   });
}

function closestDefaultTest() {
   function test(val: Result<Option<Result<number, string>>, number>): string {
      return match(val, {
         Ok: {
            Some: {
               Ok: (n) => `ok ${n}`,
               _: () => "inner default",
            },
         },
         _: () => "default",
      });
   }

   it("Falls back to the closest default", () => {
      expect(test(Ok(Some(Ok(1))))).to.equal("ok 1");
      expect(test(Ok(Some(Err("_"))))).to.equal("inner default");
      expect(test(Ok(None))).to.equal("default");
      expect(test(Err(1))).to.equal("default");
   });
}

function chained() {
   function test(val: Result<Option<Result<number, string>>, number>): string {
      return match(val, [
         [Ok(Some(Ok(1))), "ok some ok"],
         [Ok(Some(Err("err"))), "ok some err"],
         [Ok(None), "ok none"],
         [Err(1), "err"],
         () => "default",
      ]);
   }

   it("Matches", () => {
      expect(test(Ok(Some(Ok(1))))).to.equal("ok some ok");
      expect(test(Ok(Some(Ok(2))))).to.equal("default");
      expect(test(Ok(Some(Err("err"))))).to.equal("ok some err");
      expect(test(Ok(Some(Err("nomatch"))))).to.equal("default");
      expect(test(Ok(None))).to.equal("ok none");
      expect(test(Err(1))).to.equal("err");
      expect(test(Err(2))).to.equal("default");
   });
}
