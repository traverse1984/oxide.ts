import { Bench } from "../bench";
import { Some } from "../../src";

Bench("Create Some<number>", 10000000, (i) => Some(i));
