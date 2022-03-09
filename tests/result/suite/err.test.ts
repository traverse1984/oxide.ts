import { expect } from "chai";
import { Result, Err } from "../../../src";

export default function err() {
   it("Creates Err<E> when called with any other value", () =>
      expect(Err(1)).to.be.an("object"));
   it("Can be nested", () =>
      expect(Err(Err(1)).unwrapErr().unwrapErr()).to.equal(1));
   it("Is matched by Result.is", () => expect(Result.is(Err(1))).to.be.true);
}
