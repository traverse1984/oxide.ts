import { expect } from "chai";
import { Option, Some, None, Ok } from "../../../src";

export default function iter() {
   it("Should create an iterator from Some", () => {
      const iter = Some([1, 2])[Symbol.iterator]();
      expect(iter.next()).to.eql({ value: 1, done: false });
      expect(iter.next()).to.eql({ value: 2, done: false });
      expect(iter.next()).to.eql({ value: undefined, done: true });
   });

   it("Should create an empty iterator from None", () => {
      const iter = (None as Option<number[]>)[Symbol.iterator]();
      expect(iter.next()).to.eql({ value: undefined, done: true });
   });

   it("Should create an iterator from nested monads", () => {
      const iter = Some(Ok(Some([1, 2])))[Symbol.iterator]();
      expect(iter.next()).to.eql({ value: 1, done: false });
      expect(iter.next()).to.eql({ value: 2, done: false });
      expect(iter.next()).to.eql({ value: undefined, done: true });

      const noneIter = Some(Ok(None as Option<number[]>))[Symbol.iterator]();
      expect(noneIter.next()).to.eql({ value: undefined, done: true });
   });

   it("Should throw if the contained value is not iterable", () =>
      expect(() => Some(1)[Symbol.iterator]()).to.throw(/not a function/));
}
