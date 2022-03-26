import { expect } from "chai";
import { Result, Ok, Err } from "../../../src";

export default function iter() {
   it("Should create an iterator from Ok", () => {
      const iter = Ok([1, 2])[Symbol.iterator]();
      expect(iter.next()).to.eql({ value: 1, done: false });
      expect(iter.next()).to.eql({ value: 2, done: false });
      expect(iter.next()).to.eql({ value: undefined, done: true });
   });

   it("Should create an empty iterator from Err", () => {
      const err = Err([1, 2]) as Result<number[], number[]>;
      const iter = err[Symbol.iterator]();
      expect(iter.next()).to.eql({ value: undefined, done: true });
   });

   it("Should throw if the contained value is not iterable", () =>
      expect(() => Ok(1)[Symbol.iterator]()).to.throw(/not a function/));
}
