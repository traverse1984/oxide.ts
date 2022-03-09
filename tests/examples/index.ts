import number_facts from "./number-facts";
import guard_bubbling from "./guard-bubbling";
import player_tags from "./player-tags";

export default function examples() {
   describe("Guard Bubbling", guard_bubbling);
   describe("Number Facts", number_facts);
   describe("Player Tags", player_tags);
}
