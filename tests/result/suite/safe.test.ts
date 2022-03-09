import { expect } from "chai";
import { Result } from "../../../src";

export default function safe() {
   const fn = (throws: any) => {
      if (throws) {
         throw throws;
      } else {
         return "testing";
      }
   };

   it("Should be Ok when the provided function returns", () =>
      expect(Result.safe(fn, false).unwrap()).to.equal("testing"));

   it("Should be Err when the provided function throws", () =>
      expect(Result.safe(fn, new Error("test_err")).unwrapErr())
         .to.be.instanceof(Error)
         .with.property("message", "test_err"));

   it("Should convert thrown non-errors into Error instances", () =>
      expect(Result.safe(fn, "test_str").unwrapErr())
         .to.be.instanceof(Error)
         .with.property("message", "test_str"));

   const fnAsync = async (throws: any) => {
      if (throws) {
         throw throws;
      } else {
         return "testing";
      }
   };

   it("Should be Ok when the provided Promise resolves", async () =>
      expect((await Result.safe(fnAsync(false))).unwrap()).to.equal("testing"));

   it("Should be Err when the provided Promise rejects", async () =>
      expect((await Result.safe(fnAsync(new Error("test_err")))).unwrapErr())
         .to.be.instanceof(Error)
         .with.property("message", "test_err"));

   it("Should convert rejected non-errors into Error instances", async () =>
      expect((await Result.safe(fnAsync("test_str"))).unwrapErr())
         .to.be.instanceof(Error)
         .with.property("message", "test_str"));
}
