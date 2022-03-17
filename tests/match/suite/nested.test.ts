import { expect } from "chai";
import { Option, Result, Some, None, Ok, Err, match } from "../../../src";

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

   it("Matches", () => {
      expect(chainNested(Ok(Some(Ok(1))))).to.equal("ok some ok");
      expect(chainNested(Ok(Some(Ok(2))))).to.equal("default");
      expect(chainNested(Ok(Some(Err("err"))))).to.equal("ok some err");
      expect(chainNested(Ok(Some(Err("nomatch"))))).to.equal("default");
      expect(chainNested(Ok(None))).to.equal("ok none");
      expect(chainNested(Err(1))).to.equal("err");
      expect(chainNested(Err(2))).to.equal("default");
   });
}
