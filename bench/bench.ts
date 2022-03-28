export function Bench(
   name: string,
   count: number,
   testfn: (count: number) => any,
   compare?: (count: number) => any
): void {
   const { dur, iter } = test(count, testfn);
   const cmp = compare ? test(count, compare) : null;

   let Duration = `${(dur / 1000).toFixed(3)}`;
   let PerIter = `${iter.toFixed(3)}`;

   if (cmp) {
      const { dur, iter } = cmp;
      Duration += ` (vs ${(dur / 1000).toFixed(3)})`;
      PerIter += ` (vs ${iter.toFixed(3)})`;
   }

   console.log(name);
   console.log("  Iterations ......", new Intl.NumberFormat().format(count));
   console.log("  Duration ........", Duration, "sec");
   console.log("  Per Iteration ...", PerIter, "micros");

   if (cmp) {
      const diff = cmp.dur - dur;
      const pct = ((Math.abs(diff) / cmp.dur) * 100).toFixed(1);
      const word = diff > 0 ? "faster" : "slower";
      console.log("  Difference ......", `${pct}%`, word);
   }

   console.log("");
}

function test(
   count: number,
   fn: (count: number) => any
): { dur: number; iter: number } {
   const start = new Date();
   for (let i = 0; i < count; i++) {
      fn(i);
   }
   const end = new Date();
   const dur = end.getTime() - start.getTime();
   const iter = 1000 * (dur / count);

   return { dur, iter };
}
