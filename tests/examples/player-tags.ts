import { expect } from "chai";
import { Option, Result, Guard, Some, None, Ok, Err } from "../../src";

const players: Record<string, number> = {
   "player-one": 1234,
   "player-two": 5678,
   "player-three": 9123,
};

const tags: Record<number, string> = {
   1234: "#p1",
   5678: "#p2",
};

function is_valid(pos: number): Result<number, string> {
   return pos > 10 && pos <= 100 ? Ok(pos) : Err("Number too large");
}

function player_id(player: string): Result<number, string> {
   return players.hasOwnProperty(player)
      ? Ok(players[player])
      : Err("Not found");
}

function player_tag(id: number): Option<string> {
   return tags.hasOwnProperty(id) ? Some(tags[id]) : None;
}

const pos = Option(($, left: Option<number>, right: Option<number>) => {
   const [x, y] = [$(left), $(right)];
   $(is_valid(x).and(is_valid(y)).ok());
   return Some([x - 5, y - 5] as const);
});

const move = Result(
   ($: Guard<string>, player: string, x: Option<number>, y: Option<number>) => {
      const id = $(player_id(player));
      const tag = player_tag(id).unwrapOrElse(() => `#default-${id}`);

      return pos(x, y)
         .okOr("Missing position")
         .map(([x, y]) => `move ${id} ${tag} to ${x} ${y}`);
   }
);

describe("Example (player-tags)", () => {
   it("Player one", () =>
      expect(move("player-one", Some(50), Some(50)).unwrap()).to.equal(
         "move 1234 #p1 to 45 45"
      ));

   it("Player two", () =>
      expect(move("player-two", Some(20), Some(80)).unwrap()).to.equal(
         "move 5678 #p2 to 15 75"
      ));

   it("Player three", () =>
      expect(move("player-three", Some(30), Some(60)).unwrap()).to.equal(
         "move 9123 #default-9123 to 25 55"
      ));

   it("Player not found", () =>
      expect(move("player-none", Some(20), Some(40)).unwrapErr()).to.equal(
         "Not found"
      ));

   it("Position input isNone", () => {
      expect(move("player-one", Some(50), None).unwrapErr()).to.equal(
         "Missing position"
      );
      expect(move("player-one", None, Some(50)).unwrapErr()).to.equal(
         "Missing position"
      );
   });

   it("Position input is invalid", () => {
      expect(move("player-one", Some(0), Some(50)).unwrapErr()).to.equal(
         "Missing position"
      );
      expect(move("player-one", Some(50), Some(110)).unwrapErr()).to.equal(
         "Missing position"
      );
   });
});
