import { ResultAsync } from "./result-async";
import { Result, Ok, Err } from "./result";
import { Safe, Unsafe } from "./symbols";

function prom<T>(x: T): ResultAsync<T, string> {
   return new ResultAsync(new Promise((res) => res(Ok(x))));
}

function promsafe<T>(x: T): Safe<ResultAsync<T, string>> {
   return prom(x) as any;
}

async function m(x: number): Promise<string> {
   throw new Error("Fuck");
   return "hello";
}

async function ms(x: number): Promise<Safe<string>> {
   return "hello-world" as Safe<string>;
}

async function addAsync(x: number): Promise<Safe<Result<number, string>>> {
   return Safe(Ok(x + 1));
}

function throwAsync(x: number): Safe<Result<number, string>> {
   throw new Error("Thrown error");
}

const res = promsafe(10);

// Unsafe variants of andThen are not working...
(async () => {
   const y = await res
      .andThen(addAsync)
      .andThen(addAsync)
      .andThen(throwAsync)
      .unwrapUnchecked();

   console.log(y);
})();
