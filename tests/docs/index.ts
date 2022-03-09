import option from "./suite/option.test";
import result from "./suite/result.test";
import match from "./suite/match.test";

export default function docs() {
   describe("Option", option);
   describe("Result", result);
   describe("Match", match);
}
