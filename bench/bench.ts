export function Bench(
   name: string,
   count: number,
   fn: (count: number) => any
): void {
   const start = new Date();
   for (let i = 0; i < count; i++) {
      fn(i);
   }
   const end = new Date();
   const diff = end.getTime() - start.getTime();
   const iter = (1000 * (diff / count)).toFixed(3);

   console.log(name);
   console.log("  Iterations ......", new Intl.NumberFormat().format(count));
   console.log("  Duration ........", `${(diff / 1000).toFixed(3)} sec`);
   console.log("  Per Iteration ...", `${iter} micros`);

   console.log("");
}
