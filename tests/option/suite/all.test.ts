import { expect } from "chai";
import { Option, Some, None } from "../../../src";

export default function all() {
   it("Should return a Some tuple when all results are Some", () =>
      expect(
         Option.all(
            Some(1),
            Some("test_string"),
            Some(true),
            Some({ a: 1, b: 2 })
         ).unwrap()
      ).to.eql([1, "test_string", true, { a: 1, b: 2 }]));

   it("Should return the first Err if any Err is present", () =>
      expect(
         Option.all(
            Some(1),
            Some("test_string"),
            None,
            Some({ a: 1, b: 2 }),
            None
         ).isNone()
      ).to.be.true);
}
