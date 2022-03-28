import { Bench } from "../bench";
import { Some, Ok, Err } from "../../src";

Bench("Monads (Deep + Unwrap)", 5000000, (i) => {
   Some(Ok(Err(Ok(Some(Ok(Err(Ok(Some(Ok(Err(Ok(Some(i)))))))))))))
      .unwrap()
      .unwrap()
      .unwrapErr()
      .unwrap()
      .unwrap()
      .unwrap()
      .unwrapErr()
      .unwrap()
      .unwrap()
      .unwrap()
      .unwrapErr()
      .unwrap()
      .unwrap();
});
