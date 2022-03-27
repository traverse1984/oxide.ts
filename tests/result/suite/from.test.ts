import { expect } from "chai";
import { Result } from "../../../src";

export default function from() {
   describe("nonNull", () => {
      it("Should cast undefined, null and NaN to Err<null>", () => {
         expect(Result.nonNull(null).unwrapErr()).to.equal(null);
         expect(Result.nonNull(undefined).unwrapErr()).to.equal(null);
         expect(Result.nonNull(NaN).unwrapErr()).to.equal(null);
      });

      it("Should cast other values to Ok<T>", () => {
         [false, 0, -0, 0n, ""].forEach((falsey) =>
            expect(Result.nonNull(falsey).unwrap()).to.equal(falsey)
         );
      });
   });

   describe("from", () => {
      it("Should cast falsey values to Err", () => {
         expect(Result.from(NaN).unwrapErr()).to.be.NaN;
         [false, null, undefined, 0, -0, 0n, ""].forEach((falsey) =>
            expect(Result.from(falsey).unwrapErr()).to.equal(falsey)
         );
      });

      it("Should cast Error (and subclasses) to Err", () => {
         class TestError extends Error {}
         const errInstance = new Error("test");
         const testErrInstance = new TestError("test");
         expect(Result.from(errInstance).unwrapErr()).to.equal(errInstance);
         expect(Result.from(testErrInstance).unwrapErr()).to.equal(
            testErrInstance
         );
      });

      it("Should cast other values to Ok<T>", () => {
         expect(Result.from("truthy").unwrap()).to.equal("truthy");
      });

      it("Option should alias from", () => {
         expect(Result(0).unwrapErr()).to.equal(0);
         expect(Result(1).unwrap()).to.equal(1);
      });
   });
}
