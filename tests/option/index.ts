import some from "./suite/some.test";
import none from "./suite/none.test";
import methods from "./suite/methods.test";
import iter from "./suite/iter.test";
import convert from "./suite/convert.test";
import safe from "./suite/safe.test";
import all from "./suite/all.test";
import any from "./suite/any.test";

export default function option() {
   describe("Some<T>", some);
   describe("None", none);
   describe("Methods", methods);
   describe("Iterable", iter);
   describe("Convert", convert);
   describe("Option.safe", safe);
   describe("Option.all", all);
   describe("Option.any", any);
}
