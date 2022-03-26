import { expect } from "chai";
import { Result } from "../../../src";

export default function safe() {
   describe("Function", functionTest);
   describe("Promise", promiseTest);
}

function functionTest() {
   const test = (throws: any) => {
      if (throws) {
         throw throws;
      } else {
         return "testing";
      }
   };

   it("Should be Ok when the provided function returns", () =>
      expect(Result.safe(test, false).unwrap()).to.equal("testing"));

   it("Should be Err when the provided function throws", () =>
      expect(Result.safe(test, new Error("test_err")).unwrapErr())
         .to.be.instanceof(Error)
         .with.property("message", "test_err"));

   it("Should convert thrown non-errors into Error instances", () =>
      expect(Result.safe(test, "test_str").unwrapErr())
         .to.be.instanceof(Error)
         .with.property("message", "test_str"));
}

function promiseTest() {
   const test = async (throws: any) => {
      if (throws) {
         throw throws;
      } else {
         return "testing";
      }
   };

   it("Should be Ok when the provided Promise resolves", async () =>
      expect((await Result.safe(test(false))).unwrap()).to.equal("testing"));

   it("Should be Err when the provided Promise rejects", async () =>
      expect((await Result.safe(test(new Error("test_err")))).unwrapErr())
         .to.be.instanceof(Error)
         .with.property("message", "test_err"));

   it("Should convert rejected non-errors into Error instances", async () =>
      expect((await Result.safe(test("test_str"))).unwrapErr())
         .to.be.instanceof(Error)
         .with.property("message", "test_str"));
}
