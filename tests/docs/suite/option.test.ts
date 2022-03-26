import { assert } from "chai";
import { Option, Some, None } from "../../../src";

export default function option() {
   allExample();
}

function allExample() {
   function num(val: number): Option<number> {
      return val > 10 ? Some(val) : None;
   }

   {
      const xyz = Option.all(num(20), num(30), num(40));
      const [x, y, z] = xyz.unwrap();
      assert.equal(x, 20);
      assert.equal(y, 30);
      assert.equal(z, 40);
   }

   {
      const x = Option.all(num(20), num(5), num(40));
      assert.equal(x.isNone(), true);
   }
}
