import { expect } from "chai";
import { Option, Result, Guard, Some, None, Ok, Err } from "../src";

describe("Guard Pattern", () => {
   describe("Option Guard", () => {
      const fn = Option((guard, val: Option<number>) => {
         const num = guard(val);
         if (num === 0) {
            return None;
         } else if (num === 1) {
            throw new Error("test");
         } else if (num === 2) {
            try {
               guard(None);
            } catch (err) {
               guard.bubble(err);
               return Some(6);
            }
         } else if (num === 3) {
            try {
               throw new Error("test_bubble_err");
            } catch (err) {
               guard.bubble(err);
               throw err;
            }
         }
         return Some(num + 1);
      });

      it("Returns None when assertion fails", () =>
         expect(fn(None)).to.equal(None));
      it("Returns None", () => expect(fn(Some(0))).to.equal(None));
      it("Propogates thrown errors", () =>
         expect(() => fn(Some(1))).to.throw("test"));
      it("Guard bubbles caught None", () =>
         expect(fn(Some(2)).is_none()).to.be.true);
      it("Guard does not bubble caught error", () =>
         expect(() => fn(Some(3))).to.throw("test_bubble_err"));
      it("Returns Some", () => expect(fn(Some(4)).unwrap()).to.equal(5));
   });

   describe("Result Guard", () => {
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
         expect(fn(Err("test_outer_err")).unwrap_err()).to.equal(
            "test_outer_err"
         ));
      it("Returns Err", () =>
         expect(fn(Ok(0)).unwrap_err()).to.equal("test_err"));
      it("Bubbles thrown errors", () =>
         expect(() => fn(Ok(1))).to.throw("test_throw"));
      it("Guard can bubble caught Err", () =>
         expect(fn(Ok(2)).unwrap_err()).to.equal("test_bubble"));
      it("Guard does not bubble caught error", () =>
         expect(() => fn(Ok(3))).to.throw("test_bubble_err"));
      it("Returns Ok", () => expect(fn(Ok(4)).unwrap()).to.equal(5));
   });
});
