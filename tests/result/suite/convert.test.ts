import { expect } from "chai";
import { Result, Ok } from "../../../src";

export default function convert() {
   describe("from", from);
   describe("nonNull", nonNull);
   describe("qty", qty);
}

function from() {
   it("Should cast falsey values to Err<null>", () => {
      expect(Result.from(NaN).unwrapErr()).to.be.null;
      [false, null, undefined, 0, -0, 0n, ""].forEach((falsey) =>
         expect(Result.from(falsey).unwrapErr()).to.equal(null)
      );
   });

   it("Should cast Invalid Date to Err<null>", () =>
      expect(Result.from(new Date("never")).unwrapErr()).to.be.null);

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

   it("Should be aliased by Result", () => {
      expect(Result.from(0).unwrapErr()).to.equal(null);
      expect(Ok(1).unwrap()).to.equal(1);
   });
}

function nonNull() {
   it("Should cast undefined, null and NaN to Err<null>", () => {
      expect(Result.nonNull(null).unwrapErr()).to.equal(null);
      expect(Result.nonNull(undefined).unwrapErr()).to.equal(null);
      expect(Result.nonNull(NaN).unwrapErr()).to.equal(null);
   });

   it("Should cast other values to Ok<T>", () => {
      [false, 0, -0, 0n, "", new Date("never"), new Error("never")].forEach(
         (val) => expect(Result.nonNull(val).unwrap()).to.equal(val)
      );
   });
}

function qty() {
   it("Should cast numbers >= 0 to Ok<number>", () => {
      expect(Result.qty(0).unwrap()).to.equal(0);
      expect(Result.qty(1).unwrap()).to.equal(1);
   });

   it("Should cast numbers < 0 to Err<null>", () =>
      expect(Result.qty(-1).unwrapErr()).to.be.null);

   it("Should cast non-numbers to Err<null>", () =>
      expect(Result.qty("test" as any).unwrapErr()).to.be.null);

   it("Should cast NaN, Infinity and -Infinity to Err<null>", () => {
      expect(Result.qty(NaN).unwrapErr()).to.be.null;
      expect(Result.qty(Infinity).unwrapErr()).to.be.null;
      expect(Result.qty(-Infinity).unwrapErr()).to.be.null;
   });
}
