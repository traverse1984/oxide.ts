import { expect } from "chai";
import { Option, Some, match, Fn } from "../../../src";

export default function fn() {
   const first = createWatchFn("first");
   const second = createWatchFn("second");

   function test(input: Option<() => string>): string {
      return match(input, [
         [Some(Fn(first)), "match-first"],
         [Some(Fn(second)), "match-second"],
         () => "default",
      ]);
   }

   it("Matches", () => {
      expect(test(Some(first))).to.equal("match-first");
      expect(first.wasCalled()).to.be.false;
      expect(test(Some(() => "none"))).to.equal("default");
   });

   it("Does not call functions within Monads", () => {
      expect(test(Some(second))).to.equal("match-second");
      expect(second.wasCalled()).to.be.false;
   });
}

function createWatchFn(returns: string): { (): string; wasCalled(): boolean } {
   let called = false;
   const fn = () => {
      called = true;
      return returns;
   };

   fn.wasCalled = () => called;
   return fn;
}
