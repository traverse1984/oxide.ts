import { expect } from "chai";
import { Result, Guard, Ok, Err } from "../../../src";

export default function guard() {
   const fn = Result((guard: Guard<string>, val: Result<number, string>) => {
      const num = guard(val);
      if (num === 0) {
         return Err("test_err");
      } else if (num === 1) {
         throw new Error("test_throw");
      } else if (num === 2) {
         try {
            guard(Err("test_bubble"));
         } catch (err) {
            guard.bubble(err);
            return Ok(5);
         }
      } else if (num === 3) {
         try {
            throw new Error("test_bubble_err");
         } catch (err) {
            guard.bubble(err);
            throw err;
         }
      }
      return Ok(num + 1);
   });

   it("Returns Err when assertion fails", () =>
      expect(fn(Err("test_outer_err")).unwrapErr()).to.equal("test_outer_err"));
   it("Returns Err", () => expect(fn(Ok(0)).unwrapErr()).to.equal("test_err"));
   it("Bubbles thrown errors", () =>
      expect(() => fn(Ok(1))).to.throw("test_throw"));
   it("Guard can bubble caught Err", () =>
      expect(fn(Ok(2)).unwrapErr()).to.equal("test_bubble"));
   it("Guard does not bubble caught error", () =>
      expect(() => fn(Ok(3))).to.throw("test_bubble_err"));
   it("Returns Ok", () => expect(fn(Ok(4)).unwrap()).to.equal(5));
}
