import { expect } from "chai";
import { Option } from "../../../src";

export default function safe() {
   functionTest();
   promiseTest();
}

function functionTest() {
   const test = (throws: boolean) => {
      if (throws) {
         throw new Error("test_err");
      } else {
         return "testing";
      }
   };

   it("Should be Some when the provided function returns", () =>
      expect(Option.safe(test, false).unwrap()).to.equal("testing"));

   it("Should be None when the provided function throws", () =>
      expect(Option.safe(test, true).isNone()).to.be.true);
}

function promiseTest() {
   const test = async (throws: boolean) => {
      if (throws) {
         throw new Error("test_err");
      } else {
         return "testing";
      }
   };

   it("Should be Ok when the provided Promise resolves", async () =>
      expect((await Option.safe(test(false))).unwrap()).to.equal("testing"));

   it("Should be Err when the provided Promise rejects", async () =>
      expect((await Option.safe(test(true))).isNone()).to.be.true);
}
