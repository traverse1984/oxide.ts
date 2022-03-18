import { expect } from "chai";
import { Option } from "../../../src";

export default function from() {
   it("Should cast undefined, null and NaN to None", () => {
      expect(Option.from(null).isNone()).to.be.true;
      expect(Option(null).isNone()).to.be.true;
      expect(Option.from(undefined).isNone()).to.be.true;
      expect(Option.from(NaN).isNone()).to.be.true;
   });

   it("Should cast other values to Some<T>", () => {
      expect(Option.from("test").unwrap()).to.equal("test");
      expect(Option("test").unwrap()).to.equal("test");
   });
}
