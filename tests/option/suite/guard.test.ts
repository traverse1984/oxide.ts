import { expect } from "chai";
import { Option, Some, None } from "../../../src";

export default function guard() {
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
      expect(fn(Some(2)).isNone()).to.be.true);
   it("Guard does not bubble caught error", () =>
      expect(() => fn(Some(3))).to.throw("test_bubble_err"));
   it("Returns Some", () => expect(fn(Some(4)).unwrap()).to.equal(5));
}
