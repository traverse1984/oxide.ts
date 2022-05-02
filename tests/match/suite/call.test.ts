import { expect } from "chai";
import { match, _, Default, Some } from "../../../src";

export default function call() {
   it("Default and _ are the same", () => expect(_).to.equal(Default));
   it("Default type throws the exhausted error", () =>
      expect(() => _()).to.throw(/exhausted/));

   it("Mapped matching without a pattern throws exhausted", () =>
      expect(() => match(Some(1), {})).to.throw(/exhausted/));
   it("Chained matching without a pattern throws exhausted", () =>
      expect(() => match("never", [])).to.throw(/exhausted/));

   it("Throws when trying to use mapped matching on a non-monad", () =>
      expect(
         () => match("never", { _: () => true } as any) //
      ).to.throw(/invalid pattern/));
   it("Throws when the pattern is not object-like", () =>
      expect(
         () => match(true as any, null as any) //
      ).to.throw(/invalid pattern/));
}
