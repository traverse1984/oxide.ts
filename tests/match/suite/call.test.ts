import { expect } from "chai";
import { match, _, Default } from "../../../src";

export default function call() {
   it("Throws when input is neither Option or Result and pattern is not an array", () =>
      expect(() => match("test", {} as any)).to.throw(/call signature/));
   it("Throws when first-position pattern is not object-like", () =>
      expect(() => match(true as any)).to.throw(/call signature/));
   it("Default and _ are the same", () => expect(_).to.equal(Default));
   it("Default type throws the exhausted error", () =>
      expect(() => _()).to.throw(/exhausted/));
}
