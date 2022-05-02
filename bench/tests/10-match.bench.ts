import { Bench } from "../bench";
import { match } from "../../src";

Bench("Simple Match (vs if/else)", 50000000, library, native);
Bench("Simple Match Compiled (vs if/else)", 50000000, compiled(), native);

function library(i: number) {
   return match(i, [
      [1, "1"],
      [2, "2"],
      [3, "3"],
      [(n) => n < 5000, "<5000"],
      () => "default",
   ]);
}

function compiled(): (i: number) => string {
   const matchNum = match.compile([
      [1, "1"],
      [2, "2"],
      [3, "3"],
      [(n) => n < 5000, "<5000"],
      () => "default",
   ]);

   return matchNum;
}

function native(i: number) {
   if (i === 1) {
      return "number 1";
   } else if (i === 2) {
      return "number 2";
   } else if (i === 3) {
      return "number 3";
   } else if (i < 5000) {
      return "<5000";
   } else {
      return "default";
   }
}
