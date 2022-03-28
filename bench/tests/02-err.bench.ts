import { Bench } from "../bench";
import { Err } from "../../src";

Bench("Create Err<number>", 10000000, (i) => Err(i));
