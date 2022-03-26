import { expect } from "chai";
import { Option, Some, None, Result, Ok, Err, match } from "../../../src";

export default function union() {
   describe("Mapped", mapped);
   describe("Combined (chained within mapped)", combined);
}

function mapped() {
   function test(val: Option<number> | Result<number, number>): string {
      return match(val, {
         Some: (x) => `some ${x}`,
         Ok: (x) => `ok ${x}`,
         Err: (x) => `err ${x}`,
         None: () => `none`,
      });
   }

   it("Should match Some", () => expect(test(Some(1))).to.equal("some 1"));
   it("Should match Ok", () => expect(test(Ok(1))).to.equal("ok 1"));
   it("Should match Err", () => expect(test(Err(1))).to.equal("err 1"));
   it("Should match None", () => expect(test(None)).to.equal("none"));
}

function combined() {
   function test(val: Option<number> | Result<number, number>): string {
      return match(val, {
         Some: [[1, "some 1"]],
         Ok: [[1, "ok 1"]],
         Err: [[1, "err 1"]],
         None: () => `none`,
         _: () => "default",
      });
   }

   it("Should match Some", () => expect(test(Some(1))).to.equal("some 1"));
   it("Should match Ok", () => expect(test(Ok(1))).to.equal("ok 1"));
   it("Should match Err", () => expect(test(Err(1))).to.equal("err 1"));
   it("Should match None", () => expect(test(None)).to.equal("none"));
   it("Should return the default otherwise", () => {
      it("Should match Some", () => expect(test(Some(2))).to.equal("default"));
      it("Should match Ok", () => expect(test(Ok(2))).to.equal("default"));
      it("Should match Err", () => expect(test(Err(2))).to.equal("default"));
   });
}
