import { Bench } from "../bench";
import { Option, Some, Result, Ok, match } from "../../src";

Bench("Match (Compiled vs Not Compiled)", 1000000, compiled(), inline);

function inline(i: number) {
   match(i, [
      [50, "50"],
      [100, "100"],
      [100000, "100000"],
      [(n) => n > 50000, ">500"],
      () => "default",
   ]);

   const res = Ok(Option.from(i));
   match(res, {
      Ok: {
         Some: [
            [50, "50"],
            [100, "100"],
            [100000, "100000"],
            [(n) => n < 5000, "<5000"],
         ],
      },
      _: () => "default",
   });

   match({ i, j: i % 100 }, [
      [{ i: 1 }, "i=1"],
      [{ j: 1 }, "j=1"],
      [{ i: (n) => n < 5000 }, "i<5000"],
      [{ j: (n) => n > 90 }, "j>90"],
      [{ i: (n) => n > 20000, j: (n) => n < 50 }, "i>20k;j<50"],
      () => "default",
   ]);

   match(Some({ i: Option.from(i) }), {
      Some: [
         [{ i: Some(1) }, "1"],
         [{ i: Some(10) }, "10"],
         [{ i: Some(100) }, "100"],
      ],
      _: () => "default",
   });
}

function compiled(): (i: number) => void {
   const matchNum = match.compile([
      [50, "50"],
      [100, "100"],
      [100000, "100000"],
      [(n: number) => n > 50000, ">500"],
      () => "default",
   ]);

   const matchMonad = match.compile<Result<Option<number>, any>, string>({
      Ok: {
         Some: [
            [50, "50"],
            [100, "100"],
            [100000, "100000"],
            [(n) => n < 5000, "<5000"],
         ],
      },
      _: () => "default",
   });

   const matchObject = match.compile<{ i: number; j: number }, string>([
      [{ i: 1 }, "i=1"],
      [{ j: 1 }, "j=1"],
      [{ i: (n) => n < 5000 }, "i<5000"],
      [{ j: (n) => n > 90 }, "j>90"],
      [{ i: (n) => n > 20000, j: (n) => n < 50 }, "i>20k;j<50"],
      () => "default",
   ]);

   const matchMonadInObject = match.compile<
      Option<{ i: Option<number> }>,
      string
   >({
      Some: [
         [{ i: Some(1) }, "1"],
         [{ i: Some(10) }, "10"],
         [{ i: Some(100) }, "100"],
      ],
      _: () => "default",
   });

   return (i: number) => {
      matchNum(i);
      matchMonad(Ok(Option.from(i)));
      matchObject({ i, j: i % 100 });
      matchMonadInObject(Some({ i: Option.from(i) }));
   };
}
