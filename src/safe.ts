export const _safe = Symbol();

declare global {
   interface String {
      readonly [_safe]: boolean;
   }

   interface Number {
      readonly [_safe]: boolean;
   }
}
