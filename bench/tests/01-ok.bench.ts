import { Bench } from "../bench";
import { Ok } from "../../src";

Bench("Create Ok<number>", 10000000, (i) => Ok(i));
