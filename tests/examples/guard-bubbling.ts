import { expect } from "chai";
import { Option, Some, None } from "../../src";

/**
 * If you're using try/catch inside a guarded function then you should
 * whether you're using the best solution. This is a solution for if you
 * really want to use the guard function inside a try/catch block.
 *
 * Guarded functions use a try/catch block and look for a very specific
 * thrown value in order to implement early return. This means that if you
 * use a try/catch block inside a guarded function then you can catch that
 * value and prevent the early return happening.
 *
 * To get around this, calling `guard.bubble` will re-throw the error only
 * if it is of that specific type.
 */

const deny_list = [2, 7, 15];

const test_number = Option((guard, num: Option<number>) => {
   try {
      const val = guard(num);
      if (deny_list.includes(val)) {
         throw new Error("That number is simply not acceptable.");
      }
      return Some(val);
   } catch (err) {
      guard.bubble(err);
      return Some(0);
   }
});

export default function suite() {
   it("Bubbles real errors", () => {
      expect(test_number(Some(10)).unwrap()).to.equal(10);
      expect(() => test_number(None).unwrap()).to.throw(/unwrap/);
      expect(test_number(Some(7)).unwrap()).to.equal(0);
   });
}
