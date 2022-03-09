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

export default function array() {
   function matchArr(input: number[]): string {
      return match(input, [
         [[2, _, 6], "2 _ 6"],
         [[1, 2, 3], "1 2 3"],
         [[2], "2"],
         [[1], "1"],
         () => "default",
      ]);
   }

   it("Should match a single element", () => {
      expect(matchArr([1])).to.equal("1");
      expect(matchArr([2])).to.equal("2");
      expect(matchArr([0])).to.equal("default");
   });
   it("Should match multiple elements", () => {
      expect(matchArr([1, 2, 3])).to.equal("1 2 3");
      expect(matchArr([1, 2, 4])).to.equal("1");
   });
   it("Should skip elements with the _ value", () =>
      expect(matchArr([2, 4, 6])).to.equal("2 _ 6"));
   it("Does not match an object", () =>
      expect(
         match({ "0": 1 } as any, [[[1], "match"], () => "default"])
      ).to.equal("default"));
}
