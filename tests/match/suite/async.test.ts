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
} from "../../../src";

export default function ________() {
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
}
