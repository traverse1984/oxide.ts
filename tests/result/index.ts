import some from "./suite/ok.test";
import none from "./suite/err.test";
import methods from "./suite/methods.test";
import safe from "./suite/safe.test";
import all from "./suite/all.test";
import any from "./suite/any.test";
import guard from "./suite/guard.test";

export default function option() {
   describe("Ok<T>", some);
   describe("Err<E>", none);
   describe("Methods", methods);
   describe("Result.safe", safe);
   describe("Result.all", all);
   describe("Result.any", any);
   describe("ResultGuard<T>", guard);
}
