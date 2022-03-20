import { expect } from "chai";
import { match, _ } from "../../../src";

export default function array() {
   function test(val: number[]): string {
      return match(val, [
         [[2, _, 6], "2 _ 6"],
         [[1, 2, 3], "1 2 3"],
         [[2], "2"],
         [[1], "1"],
         () => "default",
      ]);
   }

   it("Should match a single element", () => {
      expect(test([1])).to.equal("1");
      expect(test([2])).to.equal("2");
      expect(test([0])).to.equal("default");
   });
   it("Should match multiple elements", () => {
      expect(test([1, 2, 3])).to.equal("1 2 3");
      expect(test([1, 2, 4])).to.equal("1");
   });
   it("Should skip elements with the _ value", () =>
      expect(test([2, 4, 6])).to.equal("2 _ 6"));
   it("Should not match an object", () =>
      expect(
         match({ "0": 1 } as any, [
            [[1], "match"], //
            () => "default",
         ])
      ).to.equal("default"));
}
