import { expect } from "chai";
import { Option, None } from "../../../src";

export default function none() {
   it("Is an object", () => expect(None).to.be.an("object"));
   it("Is matched by Option.is", () => expect(Option.is(None)).to.be.true);
   it("Is a single instance", () => expect(None.map(() => 1)).to.equal(None));
}
