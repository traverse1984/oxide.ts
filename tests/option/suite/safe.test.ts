import { expect } from "chai";
import { Option, Some, None } from "../../../src";

export default function safe() {
   const fn = (throws: boolean) => {
      if (throws) {
         throw new Error("test_err");
      } else {
         return "testing";
      }
   };

   it("Should be Some when the provided function returns", () =>
      expect(Option.safe(fn, false).unwrap()).to.equal("testing"));

   it("Should be None when the provided function throws", () =>
      expect(Option.safe(fn, true).isNone()).to.be.true);

   const fnAsync = async (throws: boolean) => {
      if (throws) {
         throw new Error("test_err");
      } else {
         return "testing";
      }
   };

   it("Should be Ok when the provided Promise resolves", async () =>
      expect((await Option.safe(fnAsync(false))).unwrap()).to.equal("testing"));

   it("Should be Err when the provided Promise rejects", async () =>
      expect((await Option.safe(fnAsync(true))).isNone()).to.be.true);
}
