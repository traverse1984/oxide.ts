import { expect } from "chai";
import { Option, Some } from "../../../src";

export default function some() {
   it("Creates Some<T> when called with any other value", () =>
      expect(Some(1)).to.be.an("object"));
   it("Can be nested", () =>
      expect(Some(Some(1)).unwrap().unwrap()).to.equal(1));
   it("Is matched by Option.is", () => expect(Option.is(Some(1))).to.be.true);
}
