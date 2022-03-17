import { expect } from "chai";
import { match, Fn } from "../../../src";

export default function primitives() {
   const testObj = {};
   const returnTrue = () => true;
   const returnFalse = () => false;

   function matchPrimitive(input: unknown): string {
      return match(input, [
         [1, "number"],
         [testObj, "object"],
         ["test", (val) => `string ${val}`],
         [(val) => val === true, "true"],
         [(val) => (val as number) > 5, (val) => `num ${val}`],
         [Fn(returnTrue), "fn true"],
         [Fn(returnFalse), "fn false"],
         () => "default",
      ]);
   }

   function returnFunction(input: number): () => boolean {
      return match(input, [
         [1, Fn(returnTrue)],
         () => returnFalse,
         //
      ]);
   }

   it("Should match a primitive and return a value", () =>
      expect(matchPrimitive(1)).to.equal("number"));
   it("Should match an exact reference", () =>
      expect(matchPrimitive(testObj)).to.equal("object"));
   it("Should match a primitive and call a function with that value", () =>
      expect(matchPrimitive("test")).to.equal("string test"));
   it("Should match based on a function and return a primitive value", () =>
      expect(matchPrimitive(true)).to.equal("true"));
   it("Should match based on a function and call a function with that value", () =>
      expect(matchPrimitive(10)).to.equal("num 10"));
   it("Should match an an exact funtion", () => {
      expect(matchPrimitive(returnTrue)).to.equal("fn true");
      expect(matchPrimitive(returnFalse)).to.equal("fn false");
   });
   it("Should return an exact function", () => {
      expect(returnFunction(1)).to.equal(returnTrue);
      expect(returnFunction(2)).to.equal(returnFalse);
   });
   it("Should return the default value when nothing else matches", () =>
      expect(matchPrimitive("none")).to.equal("default"));
   it("Should call a default function when nothing else matches", () =>
      expect(match(null, [() => "default"])).to.equal("default"));
   it("Should throw if nothing matches and no default is present", () =>
      expect(() => match(2, [[1, "one"]] as any)).to.throw(/exhausted/));
}
