import { expect } from "chai";
import { Option, Result, Some, None, Ok, Err, match } from "../../../src";

export default function async_() {
   describe("Mapped", mapped);
   describe("Chained", chained);
}

function mapped() {
   function test(val: Option<Result<string, number>>) {
      return match(val, {
         Some: match({
            Ok: async (str) => `ok ${str}`,
            Err: async (num) => `err ${num}`,
         }),
         _: async () => "none",
      });
   }

   it("Matches Ok within Some", async () =>
      expect(await test(Some(Ok("test")))).to.equal("ok test"));
   it("Matches Err within Some", async () =>
      expect(await test(Some(Err(1)))).to.equal("err 1"));
   it("Matches None", async () => expect(await test(None)).to.equal("none"));
}

function chained() {
   function test(val: Option<Result<string, number>>) {
      return match(val, [
         [Some(Ok("test")), async () => `some ok`],
         [Some(Err(1)), async () => `some err`],
         [None, async () => "none"],
         async () => "no match",
      ]);
   }

   it("Matches Ok within Some", async () =>
      expect(await test(Some(Ok("test")))).to.equal("some ok"));
   it("Matches Err within Some", async () =>
      expect(await test(Some(Err(1)))).to.equal("some err"));
   it("Matches None", async () => expect(await test(None)).to.equal("none"));
   it("Returns the default when there is no match", async () =>
      expect(await test(Some(Ok("no match")))).to.equal("no match"));
}
