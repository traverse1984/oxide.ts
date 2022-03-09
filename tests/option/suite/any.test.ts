import { expect } from "chai";
import { Option, Some, None } from "../../../src";

export default function any() {
   it("Should return an Ok tuple when all results are Ok", () =>
      expect(
         Option.any(None, None, Some(1), Some("test_string")).unwrap()
      ).to.equal(1));

   it("Should return the first Err if any Err is present", () =>
      expect(Option.any(None, None, None).isNone()).to.be.true);
}
