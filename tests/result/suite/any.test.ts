import { expect } from "chai";
import { Result, Ok, Err } from "../../../src";

export default function any() {
   it("Should return the first Ok if any Ok is present", () =>
      expect(
         Result.any(
            Err("test_err"),
            Err("test_err_2"),
            Ok(1),
            Ok("test_string")
         ).unwrap()
      ).to.eql(1));

   it("Should return the first Err if any Err is present", () =>
      expect(
         Result.any(
            Err(1),
            Err("test_err"),
            Err({ a: 1, b: 2 }),
            Err("test_err_2")
         ).unwrapErr()
      ).to.eql([1, "test_err", { a: 1, b: 2 }, "test_err_2"]));
}
