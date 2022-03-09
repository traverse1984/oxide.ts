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

export default function nested() {
   function mappedNested(
      input: Result<Option<Result<number, number>>, number>
   ): string {
      return match(input, {
         Ok: match({
            Some: match({
               Ok: (n) => `ok ${n}`,
               Err: (e) => `err b ${e}`,
            }),
            None: () => "none",
         }),
         Err: (e) => `err a ${e}`,
      });
   }

   function commonDefault(
      input: Result<Option<Result<number, string>>, number>
   ): string {
      return match(input, {
         Ok: match({
            Some: match({
               Ok: (n) => `ok ${n}`,
               _: () => "inner default",
            }),
         }),
         _: () => "default",
      });
   }

   it("Matches", () => {
      expect(mappedNested(Ok(Some(Ok(1))))).to.equal("ok 1");
      expect(mappedNested(Ok(Some(Err(1))))).to.equal("err b 1");
      expect(mappedNested(Ok(None))).to.equal("none");
      expect(mappedNested(Err(1))).to.equal("err a 1");
   });

   it("Falls back to the closest default (_)", () => {
      expect(commonDefault(Ok(Some(Ok(1))))).to.equal("ok 1");
      expect(commonDefault(Ok(Some(Err("_"))))).to.equal("inner default");
      expect(commonDefault(Ok(None))).to.equal("default");
      expect(commonDefault(Err(1))).to.equal("default");
   });

   function chainNested(
      input: Result<Option<Result<number, string>>, number>
   ): string {
      return match(input, [
         [Ok(Some(Ok(1))), "ok some ok"],
         [Ok(Some(Err("err"))), "ok some err"],
         [Ok(None), "ok none"],
         [Err(1), "err"],
         () => "default",
      ]);
   }

   function chainCond(
      input: Result<Option<Result<number, string>>, number>
   ): string {
      return match(input, [
         [OkIs(SomeIs(OkIs((val) => val > 10))), "ok gt 10"],
         [OkIs(SomeIs(ErrIs((err) => err.startsWith("a")))), "err a"],
         [Ok(None), "ok none"],
         [ErrIs((n) => n > 10), "err gt 10"],
         () => "default",
      ]);
   }

   it("Matches", () => {
      expect(chainNested(Ok(Some(Ok(1))))).to.equal("ok some ok");
      expect(chainNested(Ok(Some(Ok(2))))).to.equal("default");
      expect(chainNested(Ok(Some(Err("err"))))).to.equal("ok some err");
      expect(chainNested(Ok(Some(Err("nomatch"))))).to.equal("default");
      expect(chainNested(Ok(None))).to.equal("ok none");
      expect(chainNested(Err(1))).to.equal("err");
      expect(chainNested(Err(2))).to.equal("default");
   });

   it("Matches based on conditions", () => {
      expect(chainCond(Ok(Some(Ok(15))))).to.equal("ok gt 10");
      expect(chainCond(Ok(Some(Ok(5))))).to.equal("default");
      expect(chainCond(Ok(Some(Err("abc"))))).to.equal("err a");
      expect(chainCond(Ok(Some(Err("def"))))).to.equal("default");
      expect(chainCond(Ok(None))).to.equal("ok none");
      expect(chainCond(Err(15))).to.equal("err gt 10");
      expect(chainCond(Err(5))).to.equal("default");
   });
}
