import { expect } from "chai";
import { Result } from "../../../src";

export default function from() {
   it("Should cast undefined, null and NaN to Err<null>", () => {
      expect(Result.from(null).unwrapErr()).to.equal(null);
      expect(Result(null).unwrapErr()).to.equal(null);
      expect(Result.from(undefined).unwrapErr()).to.equal(null);
      expect(Result.from(NaN).unwrapErr()).to.equal(null);
   });

   it("Should cast other values to Ok<T>", () => {
      expect(Result.from("test").unwrap()).to.equal("test");
      expect(Result("test").unwrap()).to.equal("test");
   });
}
