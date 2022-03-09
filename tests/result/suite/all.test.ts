import { expect } from "chai";
import { Result, Ok, Err } from "../../../src";

export default function all() {
   it("Should return an Ok tuple when all results are Ok", () =>
      expect(
         Result.all(
            Ok(1),
            Ok("test_string"),
            Ok(true),
            Ok({ a: 1, b: 2 })
         ).unwrap()
      ).to.eql([1, "test_string", true, { a: 1, b: 2 }]));

   it("Should return the first Err if any Err is present", () =>
      expect(
         Result.all(
            Ok(1),
            Ok("two"),
            Err("test_err"),
            Ok({ a: 1, b: 2 }),
            Err("test_err_2")
         ).unwrapErr()
      ).to.equal("test_err"));
}
