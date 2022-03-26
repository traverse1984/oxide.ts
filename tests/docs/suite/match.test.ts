import { assert } from "chai";
import {
   Option,
   Some,
   None,
   Result,
   Ok,
   Err,
   match,
   Fn,
   _,
} from "../../../src";

export default function match_docs() {
   mappedMatchBasic();
   mappedMatchNested();
   combinedMatch();
   chainedMatchPrimitive();
   chainedMatchFilterFunction();
   chainedMatchObject();
   chainedMatchArray();
   chainedMatchMonad();
   chainedMatchFn();
}

function mappedMatchBasic() {
   const num = Option(10);
   const res = match(num, {
      Some: (n) => n + 1,
      None: () => 0,
   });

   assert.equal(res, 11);
}

function mappedMatchNested() {
   function nested(val: Result<Option<number>, string>): string {
      return match(val, {
         Ok: {
            Some: (num) => `found ${num}`,
         },
         _: () => "nothing",
      });
   }

   assert.equal(nested(Ok(Some(10))), "found 10");
   assert.equal(nested(Ok(None)), "nothing");
   assert.equal(nested(Err("Not a number")), "nothing");
}

function combinedMatch() {
   function matchNum(val: Option<number>): string {
      return match(val, {
         Some: [
            [5, "5"],
            [(x) => x < 10, "< 10"],
            [(x) => x > 20, "> 20"],
         ],
         _: () => "none or not matched",
      });
   }

   assert.equal(matchNum(Some(5)), "5");
   assert.equal(matchNum(Some(7)), "< 10");
   assert.equal(matchNum(Some(25)), "> 20");
   assert.equal(matchNum(Some(15)), "none or not matched");
   assert.equal(matchNum(None), "none or not matched");
}

function chainedMatchPrimitive() {
   function matchNum(num: number): string {
      return match(num, [
         [5, "five"],
         [10, "ten"],
         [15, (x) => `fifteen (${x})`],
         () => "other",
      ]);
   }

   assert.equal(matchNum(5), "five");
   assert.equal(matchNum(10), "ten");
   assert.equal(matchNum(15), "fifteen (15)");
   assert.equal(matchNum(20), "other");
}

function chainedMatchFilterFunction() {
   function matchNum(num: number): string {
      return match(num, [
         [5, "five"],
         [(x) => x < 20, "< 20"],
         [(x) => x > 30, "> 30"],
         () => "other",
      ]);
   }

   assert.equal(matchNum(5), "five");
   assert.equal(matchNum(15), "< 20");
   assert.equal(matchNum(50), "> 30");
   assert.equal(matchNum(25), "other");
}

function chainedMatchObject() {
   interface ExampleObj {
      a: number;
      b?: { c: number };
      o?: number;
   }

   function matchObj(obj: ExampleObj): string {
      return match(obj, [
         [{ a: 5 }, "a = 5"],
         [{ b: { c: 5 } }, "c = 5"],
         [{ a: 10, o: _ }, "a = 10, o = _"],
         [{ a: 15, b: { c: (n) => n > 10 } }, "a = 15; c > 10"],
         () => "other",
      ]);
   }

   assert.equal(matchObj({ a: 5 }), "a = 5");
   assert.equal(matchObj({ a: 50, b: { c: 5 } }), "c = 5");
   assert.equal(matchObj({ a: 10 }), "other");
   assert.equal(matchObj({ a: 10, o: 1 }), "a = 10, o = _");
   assert.equal(matchObj({ a: 15, b: { c: 20 } }), "a = 15; c > 10");
   assert.equal(matchObj({ a: 8, b: { c: 8 }, o: 1 }), "other");
}

function chainedMatchArray() {
   function matchArr(arr: number[]): string {
      return match(arr, [
         [[1], "1"],
         [[2, (x) => x > 10], "2, > 10"],
         [[_, 6, 9, _], (a) => a.join(", ")],
         () => "other",
      ]);
   }

   assert.equal(matchArr([1, 2, 3]), "1");
   assert.equal(matchArr([2, 12, 6]), "2, > 10");
   assert.equal(matchArr([3, 6, 9]), "other");
   assert.equal(matchArr([3, 6, 9, 12]), "3, 6, 9, 12");
   assert.equal(matchArr([2, 4, 6]), "other");
}

function chainedMatchMonad() {
   type NumberMonad = Option<number> | Result<number, number>;
   function matchMonad(val: NumberMonad): string {
      return match(val, [
         [Some(1), "Some"],
         [Ok(1), "Ok"],
         [Err(1), "Err"],
         () => "None",
      ]);
   }

   assert.equal(matchMonad(Some(1)), "Some");
   assert.equal(matchMonad(Ok(1)), "Ok");
   assert.equal(matchMonad(Err(1)), "Err");
   assert.equal(matchMonad(None), "None");
}

function chainedMatchFn() {
   const fnOne = () => 1;
   const fnTwo = () => 2;
   const fnDefault = () => "fnDefault";

   function matchFn(fnVal: (...args: any) => any): () => string {
      return match(fnVal, [
         [Fn(fnOne), () => () => "fnOne"],
         [Fn(fnTwo), Fn(() => "fnTwo")],
         () => fnDefault,
      ]);
   }

   assert.equal(matchFn(fnOne)(), "fnOne");
   assert.equal(matchFn(fnTwo)(), "fnTwo");
   assert.equal(matchFn(() => 0)(), "fnDefault");
}
