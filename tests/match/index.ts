import call from "./suite/call.test";
import primitives from "./suite/primitives.test";
import object from "./suite/object.test";
import array from "./suite/array.test";
import option from "./suite/option.test";
import result from "./suite/result.test";
import fn from "./suite/function.test";
import nested from "./suite/nested.test";
import a_sync from "./suite/async.test";

export default function match() {
   describe("Call Signature", call);
   describe("Primitives", primitives);
   describe("Objects", object);
   describe("Arrays", array);
   describe("Option<T>", option);
   describe("Result<T, E>", result);
   describe("Fn within Option/Result", fn);
   describe("Nested", nested);
   describe("Async", a_sync);
}
