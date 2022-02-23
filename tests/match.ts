import { expect } from "chai";
import {
   Option,
   Result,
   Some,
   None,
   Ok,
   Err,
   match,
   Fn,
   SomeIs,
   OkIs,
   ErrIs,
   _,
   Default,
} from "../src";

describe("Match", () => {
   describe("Call Signature", () => {
      it("Throws when input is neither Option or Result and pattern is not an array", () =>
         expect(() => match("test", {} as any)).to.throw(/call signature/));
      it("Throws when first-position pattern is not object-like", () =>
         expect(() => match(true as any)).to.throw(/call signature/));
      it("Default and _ are the same", () => expect(_).to.equal(Default));
      it("Default type throws the exhausted error", () =>
         expect(() => _()).to.throw(/exhausted/));
   });

   describe("Primitives", () => {
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
   });

   describe("Object matching", () => {
      function matchObj(input: Record<string, any>): string {
         return match(input, [
            [{ a: 5, b: _, c: 1 }, "a 5 b _ c 1"],
            [{ a: 4, b: { c: 1 } }, "a 4 bc 1"],
            [{ a: 3, b: 1 }, "a 3 b 1"],
            [{ a: 2 }, "a 2"],
            [{ a: 1 }, "a 1"],
            () => "default",
         ]);
      }

      it("Should match a single key", () => {
         expect(matchObj({ a: 1 })).to.equal("a 1");
         expect(matchObj({ a: 2 })).to.equal("a 2");
         expect(matchObj({ b: 1 })).to.equal("default");
         expect(matchObj({ a: 6 })).to.equal("default");
      });
      it("Should match multiple keys", () => {
         expect(matchObj({ a: 3, b: 1 })).to.equal("a 3 b 1");
         expect(matchObj({ a: 3, b: 2 })).to.equal("default");
      });
      it("Skips keys with the _ value", () =>
         expect(matchObj({ a: 5, b: 5, c: 1 })).to.equal("a 5 b _ c 1"));
      it("Should match nested structures", () =>
         expect(
            matchObj({
               a: 4,
               b: { c: 1 },
            })
         ).to.equal("a 4 bc 1"));
      it("Does not match an array", () =>
         expect(
            match([1] as any, [[{ "0": 1 }, "match"], () => "default"])
         ).to.equal("default"));
   });

   describe("Array matching", () => {
      function matchArr(input: number[]): string {
         return match(input, [
            [[2, _, 6], "2 _ 6"],
            [[1, 2, 3], "1 2 3"],
            [[2], "2"],
            [[1], "1"],
            () => "default",
         ]);
      }

      it("Should match a single element", () => {
         expect(matchArr([1])).to.equal("1");
         expect(matchArr([2])).to.equal("2");
         expect(matchArr([0])).to.equal("default");
      });
      it("Should match multiple elements", () => {
         expect(matchArr([1, 2, 3])).to.equal("1 2 3");
         expect(matchArr([1, 2, 4])).to.equal("1");
      });
      it("Should skip elements with the _ value", () =>
         expect(matchArr([2, 4, 6])).to.equal("2 _ 6"));
      it("Does not match an object", () =>
         expect(
            match({ "0": 1 } as any, [[[1], "match"], () => "default"])
         ).to.equal("default"));
   });

   describe("Option<T>", () => {
      function mappedMatch(input: Option<number>): string {
         return match(input, {
            Some: (n) => `some ${n}`,
            None: () => "none",
         });
      }

      function chainMatch(input: Option<number>): string {
         return match(input, [
            [Some(1), "some 1"],
            [Some(_), "some default"],
            [None, "none"],
         ]);
      }

      function condMatch(input: Option<number>): string {
         return match(input, [
            [Some(35), "35"],
            [SomeIs((n) => n > 30), "gt 30"],
            [SomeIs((n) => n < 20), "lt 20"],
            () => "no match",
         ]);
      }

      function objMatch(
         input: Option<{ a: number; c?: { d: number } }>
      ): string {
         return match(input, [
            [Some({ a: 1 }), "a 1"],
            [Some({ c: { d: 10 } }), "cd 10"],
            () => "default",
         ]);
      }

      function arrMatch(input: Option<number[]>): string {
         return match(input, [
            [Some([1, 2]), "1 2"],
            [Some([2, _, 6]), "2 _ 6"],
            () => "default",
         ]);
      }

      function hybridMatch(input: Option<number>): string {
         return match(input, {
            Some: [
               [1, "some 1"],
               [(n) => n > 10, "some gt 10"],
               () => "some default",
            ],
            None: () => "none",
         });
      }

      function partialMatch(input: Option<number>): string {
         return match(input, {
            Some: [
               [1, "some 1"],
               [(n) => n > 10, "some gt 10"],
            ],
            _: () => "default",
         });
      }

      it("Executes the mapped Some branch", () =>
         expect(mappedMatch(Some(1))).to.equal("some 1"));
      it("Executes the mapped None branch", () =>
         expect(mappedMatch(None)).to.equal("none"));
      it("Matches the chained branches", () => {
         expect(chainMatch(Some(1))).to.equal("some 1");
         expect(chainMatch(Some(2))).to.equal("some default");
      });
      it("Matches the chained branches based on conditions", () => {
         expect(condMatch(Some(5))).to.equal("lt 20");
         expect(condMatch(Some(25))).to.equal("no match");
         expect(condMatch(Some(35))).to.equal("35");
         expect(condMatch(Some(40))).to.equal("gt 30");
         expect(condMatch(None)).to.equal("no match");
      });
      it("Deeply matches objects within chains", () => {
         expect(objMatch(Some({ a: 1 }))).to.equal("a 1");
         expect(objMatch(Some({ a: 2 }))).to.equal("default");
         expect(objMatch(Some({ a: 2, c: { d: 10 } }))).to.equal("cd 10");
      });
      it("Deeply matches arrays within chains", () => {
         expect(arrMatch(Some([1, 2, 3]))).to.equal("1 2");
         expect(arrMatch(Some([2, 4, 6]))).to.equal("2 _ 6");
         expect(arrMatch(Some([2, 3, 4]))).to.equal("default");
      });
      it("Matches chained branches within mapped branches", () => {
         expect(hybridMatch(Some(1))).to.equal("some 1");
         expect(hybridMatch(Some(14))).to.equal("some gt 10");
         expect(hybridMatch(Some(5))).to.equal("some default");
         expect(hybridMatch(None)).to.equal("none");
      });
      it("Falls back to the default case", () => {
         expect(partialMatch(Some(1))).to.equal("some 1");
         expect(partialMatch(Some(15))).to.equal("some gt 10");
         expect(partialMatch(Some(5))).to.equal("default");
         expect(partialMatch(None)).to.equal("default");
      });
      it("Throws when there is no match", () =>
         expect(() => match(Some(1), { None: () => true })).to.throw(
            /exhausted/
         ));
   });

   describe("Result<T, E>", () => {
      function mappedMatch(input: Result<number, string>): string {
         return match(input, {
            Ok: (n) => `ok ${n}`,
            Err: (n) => `err ${n}`,
         });
      }

      function chainMatch(input: Result<number, string>): string {
         return match(input, [
            [Ok(1), "ok 1"],
            [Err("err"), "err err"],
            [Ok(_), "ok default"],
            [Err(_), "err default"],
         ]);
      }

      function condMatch(input: Result<number, string>): string {
         return match(input, [
            [Ok(35), "ok 35"],
            [OkIs((n) => n > 30), "ok gt 30"],
            [OkIs((n) => n < 10), "ok lt 10"],
            [Err("err"), "err err"],
            [ErrIs((str) => str.startsWith("a")), "err a"],
            () => "no match",
         ]);
      }

      function objMatch(
         input: Result<
            { a: number; c?: { d: number } },
            { b: number; c?: { d: number } }
         >
      ): string {
         return match(input, [
            [Ok({ a: 1 }), "ok a 1"],
            [Err({ b: 1 }), "err b 1"],
            [Ok({ c: { d: 10 } }), "ok cd 10"],
            [Err({ c: { d: 5 } }), "err cd 5"],
            () => "default",
         ]);
      }

      function arrMatch(input: Result<number[], string[]>): string {
         return match(input, [
            [Ok([1, 2]), "ok 1 2"],
            [Ok([2, _, 6]), "ok 2 _ 6"],
            [Err(["a", "b"]), "err a b"],
            [Err([_, "c", "d"]), "err _ c d"],
            () => "default",
         ]);
      }

      function hybridMatch(input: Result<number, string>): string {
         return match(input, {
            Ok: [
               [1, "ok 1"],
               [(n) => n > 10, "ok gt 10"], //
               () => "ok default",
            ],
            Err: [
               ["err", "err err"],
               [(str) => str.startsWith("a"), "err a"],
               () => "err default",
            ],
         });
      }

      function partialMatch(input: Result<number, string>): string {
         return match(input, {
            Ok: [
               [1, "ok 1"],
               [(n) => n > 10, "ok gt 10"],
            ],
            Err: [["err", "err err"]],
            _: () => "default",
         });
      }

      it("Executes the mapped Ok branch", () =>
         expect(mappedMatch(Ok(1))).to.equal("ok 1"));
      it("Executes the mapped Err branch", () =>
         expect(mappedMatch(Err("err"))).to.equal("err err"));
      it("Matches the chained branches", () => {
         expect(chainMatch(Ok(1))).to.equal("ok 1");
         expect(chainMatch(Ok(2))).to.equal("ok default");
         expect(chainMatch(Err("err"))).to.equal("err err");
         expect(chainMatch(Err("nomatch"))).to.equal("err default");
      });
      it("Matches chained branches based on conditions", () => {
         expect(condMatch(Ok(5))).to.equal("ok lt 10");
         expect(condMatch(Ok(25))).to.equal("no match");
         expect(condMatch(Ok(35))).to.equal("ok 35");
         expect(condMatch(Ok(40))).to.equal("ok gt 30");
         expect(condMatch(Err("err"))).to.equal("err err");
         expect(condMatch(Err("abc"))).to.equal("err a");
         expect(condMatch(Err("def"))).to.equal("no match");
      });
      it("Should deeply match objects in chains", () => {
         expect(objMatch(Ok({ a: 1 }))).to.equal("ok a 1");
         expect(objMatch(Ok({ a: 2, c: { d: 5 } }))).to.equal("default");
         expect(objMatch(Ok({ a: 2, c: { d: 10 } }))).to.equal("ok cd 10");
         expect(objMatch(Err({ b: 1 }))).to.equal("err b 1");
         expect(objMatch(Err({ b: 2, c: { d: 10 } }))).to.equal("default");
         expect(objMatch(Err({ b: 2, c: { d: 5 } }))).to.equal("err cd 5");
      });
      it("Should deeply match arrays in chains", () => {
         expect(arrMatch(Ok([1, 2, 3]))).to.equal("ok 1 2");
         expect(arrMatch(Ok([2, 4, 6]))).to.equal("ok 2 _ 6");
         expect(arrMatch(Ok([2, 3, 4]))).to.equal("default");
         expect(arrMatch(Err(["a", "b", "c"]))).to.equal("err a b");
         expect(arrMatch(Err(["b", "c", "d"]))).to.equal("err _ c d");
         expect(arrMatch(Err(["c", "d", "e"]))).to.equal("default");
      });
      it("Matches chained branches within mapped branches", () => {
         expect(hybridMatch(Ok(1))).to.equal("ok 1");
         expect(hybridMatch(Ok(15))).to.equal("ok gt 10");
         expect(hybridMatch(Ok(5))).to.equal("ok default");
         expect(hybridMatch(Err("err"))).to.equal("err err");
         expect(hybridMatch(Err("abc"))).to.equal("err a");
         expect(hybridMatch(Err("def"))).to.equal("err default");
      });
      it("Falls back to the default case", () => {
         expect(partialMatch(Ok(1))).to.equal("ok 1");
         expect(partialMatch(Ok(15))).to.equal("ok gt 10");
         expect(partialMatch(Err("err"))).to.equal("err err");
         expect(partialMatch(Ok(5))).to.equal("default");
         expect(partialMatch(Err("nomatch"))).to.equal("default");
      });
      it("Throws when there is no matching branch", () =>
         expect(() => match(Ok(1), { Err: () => true })).to.throw(/exhausted/));
   });

   describe("Function Matching (monads)", () => {
      let called = false;
      const testFn = () => {
         called = true;
         return "test";
      };

      function functionMatch(input: Option<() => string>): string {
         return match(input, [
            [Some(Fn(testFn)), "test"],
            () => "default", //
         ]);
      }

      it("Matches", () => {
         expect(functionMatch(Some(testFn))).to.equal("test");
         expect(called).to.be.false;
         expect(functionMatch(Some(() => "none"))).to.equal("default");
      });
   });

   describe("Nested matching (mapped)", () => {
      function mappedNested(
         input: Result<Option<Result<number, number>>, number>
      ): string {
         return match(input, {
            Ok: match({
               Some: match({
                  Ok: (n) => `ok ${n}`,
                  Err: (e) => `err b ${e}`,
               }),
               None: () => "none",
            }),
            Err: (e) => `err a ${e}`,
         });
      }

      function commonDefault(
         input: Result<Option<Result<number, string>>, number>
      ): string {
         return match(input, {
            Ok: match({
               Some: match({
                  Ok: (n) => `ok ${n}`,
                  _: () => "inner default",
               }),
            }),
            _: () => "default",
         });
      }

      it("Matches", () => {
         expect(mappedNested(Ok(Some(Ok(1))))).to.equal("ok 1");
         expect(mappedNested(Ok(Some(Err(1))))).to.equal("err b 1");
         expect(mappedNested(Ok(None))).to.equal("none");
         expect(mappedNested(Err(1))).to.equal("err a 1");
      });

      it("Falls back to the closest default (_)", () => {
         expect(commonDefault(Ok(Some(Ok(1))))).to.equal("ok 1");
         expect(commonDefault(Ok(Some(Err("_"))))).to.equal("inner default");
         expect(commonDefault(Ok(None))).to.equal("default");
         expect(commonDefault(Err(1))).to.equal("default");
      });
   });

   describe("Nested matching (chained)", () => {
      function chainNested(
         input: Result<Option<Result<number, string>>, number>
      ): string {
         return match(input, [
            [Ok(Some(Ok(1))), "ok some ok"],
            [Ok(Some(Err("err"))), "ok some err"],
            [Ok(None), "ok none"],
            [Err(1), "err"],
            () => "default",
         ]);
      }

      function chainCond(
         input: Result<Option<Result<number, string>>, number>
      ): string {
         return match(input, [
            [OkIs(SomeIs(OkIs((val) => val > 10))), "ok gt 10"],
            [OkIs(SomeIs(ErrIs((err) => err.startsWith("a")))), "err a"],
            [Ok(None), "ok none"],
            [ErrIs((n) => n > 10), "err gt 10"],
            () => "default",
         ]);
      }

      it("Matches", () => {
         expect(chainNested(Ok(Some(Ok(1))))).to.equal("ok some ok");
         expect(chainNested(Ok(Some(Ok(2))))).to.equal("default");
         expect(chainNested(Ok(Some(Err("err"))))).to.equal("ok some err");
         expect(chainNested(Ok(Some(Err("nomatch"))))).to.equal("default");
         expect(chainNested(Ok(None))).to.equal("ok none");
         expect(chainNested(Err(1))).to.equal("err");
         expect(chainNested(Err(2))).to.equal("default");
      });

      it("Matches based on conditions", () => {
         expect(chainCond(Ok(Some(Ok(15))))).to.equal("ok gt 10");
         expect(chainCond(Ok(Some(Ok(5))))).to.equal("default");
         expect(chainCond(Ok(Some(Err("abc"))))).to.equal("err a");
         expect(chainCond(Ok(Some(Err("def"))))).to.equal("default");
         expect(chainCond(Ok(None))).to.equal("ok none");
         expect(chainCond(Err(15))).to.equal("err gt 10");
         expect(chainCond(Err(5))).to.equal("default");
      });
   });

   describe("Async (mapped)", () => {
      function mappedAsync(input: Option<Result<string, number>>) {
         return match(input, {
            Some: match({
               Ok: async (str) => `ok ${str}`,
               Err: async (num) => `err ${num}`,
            }),
            _: async () => "none",
         });
      }

      it("Matches Some.Ok", async () =>
         expect(await mappedAsync(Some(Ok("test")))).to.equal("ok test"));
      it("Matches Some.Err", async () =>
         expect(await mappedAsync(Some(Err(1)))).to.equal("err 1"));
      it("Matches None", async () =>
         expect(await mappedAsync(None)).to.equal("none"));
   });

   describe("Async (chained)", () => {
      function chainedAsync(input: Option<Result<string, number>>) {
         return match(input, [
            [Some(Ok("test")), async () => `some ok`],
            [Some(Err(1)), async () => `some err`],
            [None, async () => "none"],
            async () => "no match",
         ]);
      }

      it("Matches Some.Ok", async () =>
         expect(await chainedAsync(Some(Ok("test")))).to.equal("some ok"));
      it("Matches Some.Err", async () =>
         expect(await chainedAsync(Some(Err(1)))).to.equal("some err"));
      it("Matches None", async () =>
         expect(await chainedAsync(None)).to.equal("none"));
      it("Returns the default when there is no match", async () =>
         expect(await chainedAsync(Some(Ok("no match")))).to.equal("no match"));
   });
});
