import { expect } from "chai";
import { Option } from "../../../src";

export default function cast() {
   it("Should cast undefined, null and NaN to None", () => {
      expect(Option(null).isNone()).to.be.true;
      expect(Option(undefined).isNone()).to.be.true;
      expect(Option(NaN).isNone()).to.be.true;
   });

   it("Should cast other values to Some<T>", () =>
      expect(Option("test").unwrap()).to.equal("test"));
}
