import { expect } from "chai";
import { Result } from "../../../src";

export default function cast() {
   it("Should cast undefined, null and NaN to Err<null>", () => {
      expect(Result(null).unwrapErr()).to.equal(null);
      expect(Result(undefined).unwrapErr()).to.equal(null);
      expect(Result(NaN).unwrapErr()).to.equal(null);
   });

   it("Should cast other values to Ok<T>", () =>
      expect(Result("test").unwrap()).to.equal("test"));
}
