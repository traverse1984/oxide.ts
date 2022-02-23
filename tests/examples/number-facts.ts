import { expect } from "chai";
import { Option, Result, Guard, match, Some, None, Ok, Err } from "../../src";

function fizzbuzz(num: number): string {
   return match(num, [
      [(n) => n % 5 === 0 && n % 3 === 0, "fizzbuzz"],
      [(n) => n % 5 === 0, "buzz"],
      [(n) => n % 3 === 0, "fizz"],
      () => num.toString(),
   ]);
}

function fifty_div(num: number): Result<Option<number>, string> {
   return num === 0
      ? Err("div by 0")
      : Ok(50 % num === 0 ? Some(50 / num) : None);
}

const compute_facts = Result(($: Guard<string>, input: Option<number>) => {
   const num = $(input.ok_or("no number"));
   return Ok([
      fizzbuzz(num),
      $(fifty_div(num)).map_or("not div", (res) => `div ${res}`),
   ]);
});

function facts(input: Option<number>): string {
   return match(compute_facts(input), {
      Ok: (facts) => facts.join(" "),
      Err: (err) => err,
   });
}

describe("Example (number-facts)", () => {
   it("Handles valid cases", () => {
      expect(facts(Some(1))).to.equal("1 div 50");
      expect(facts(Some(3))).to.equal("fizz not div");
      expect(facts(Some(5))).to.equal("buzz div 10");
      expect(facts(Some(15))).to.equal("fizzbuzz not div");
      expect(facts(Some(25))).to.equal("buzz div 2");
   });

   it("Handles invalid cases", () => {
      expect(facts(None)).to.equal("no number");
      expect(facts(Some(0))).to.equal("div by 0");
   });
});
