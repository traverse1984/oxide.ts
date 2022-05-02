import { expect } from "chai";
import { match, _ } from "../../../src";

export default function object() {
   function test(val: Record<string, any>): string {
      return match(val, [
         [{ a: 5, b: _, c: 1 }, "a 5 b _ c 1"],
         [{ a: 4, b: { c: 1 } }, "a 4 bc 1"],
         [{ a: 3, b: 1 }, "a 3 b 1"],
         [{ a: 2 }, "a 2"],
         [{ a: 1 }, "a 1"],
         () => "default",
      ]);
   }

   it("Should match a single key", () => {
      expect(test({ a: 1 })).to.equal("a 1");
      expect(test({ a: 2 })).to.equal("a 2");
      expect(test({ b: 1 })).to.equal("default");
      expect(test({ a: 6 })).to.equal("default");
   });
   it("Should match multiple keys", () => {
      expect(test({ a: 3, b: 1 })).to.equal("a 3 b 1");
      expect(test({ a: 3, b: 2 })).to.equal("default");
   });
   it("Should require the key be present for _", () =>
      expect(test({ a: 5, c: 1 })).to.equal("default"));
   it("Should allow any value for _", () =>
      expect(test({ a: 5, b: 5, c: 1 })).to.equal("a 5 b _ c 1"));
   it("Should match nested structures", () =>
      expect(
         test({
            a: 4,
            b: { c: 1 },
         })
      ).to.equal("a 4 bc 1"));
   it("Does not match an array", () =>
      expect(
         match([1] as any, [
            [{ "0": 1 }, "match"], //
            () => "default",
         ])
      ).to.equal("default"));
}
