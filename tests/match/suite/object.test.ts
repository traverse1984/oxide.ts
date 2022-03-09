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

export default function object() {
   function matchObj(input: Record<string, any>): string {
      return match(input, [
         [{ a: 5, b: _, c: 1 }, "a 5 b _ c 1"],
         [{ a: 4, b: { c: 1 } }, "a 4 bc 1"],
         [{ a: 3, b: 1 }, "a 3 b 1"],
         [{ a: 2 }, "a 2"],
         [{ a: 1 }, "a 1"],
         () => "default",
      ]);
   }

   it("Should match a single key", () => {
      expect(matchObj({ a: 1 })).to.equal("a 1");
      expect(matchObj({ a: 2 })).to.equal("a 2");
      expect(matchObj({ b: 1 })).to.equal("default");
      expect(matchObj({ a: 6 })).to.equal("default");
   });
   it("Should match multiple keys", () => {
      expect(matchObj({ a: 3, b: 1 })).to.equal("a 3 b 1");
      expect(matchObj({ a: 3, b: 2 })).to.equal("default");
   });
   it("Skips keys with the _ value", () =>
      expect(matchObj({ a: 5, b: 5, c: 1 })).to.equal("a 5 b _ c 1"));
   it("Should match nested structures", () =>
      expect(
         matchObj({
            a: 4,
            b: { c: 1 },
         })
      ).to.equal("a 4 bc 1"));
   it("Does not match an array", () =>
      expect(
         match([1] as any, [[{ "0": 1 }, "match"], () => "default"])
      ).to.equal("default"));
}
