import { expect } from "chai";
import { Option, Some, None } from "../../../src";

export default function option() {
   it("Main", () => {
      const users = ["Simon", "Garfunkel"];
      function fetch_user(username: string): Option<string> {
         return users.includes(username) ? Some(username) : None;
      }

      function greet(username: string): string {
         return fetch_user(username)
            .map((user) => `Hello ${user}, my old friend!`)
            .unwrapOr("*silence*");
      }

      expect(greet("Simon")).to.equal("Hello Simon, my old friend!");
      expect(greet("SuperKing777")).to.equal("*silence*");
   });

   it("Guarded Function", () => {
      function to_pos(pos: number): Option<number> {
         return pos > 0 && pos < 100 ? Some(pos * 10) : None;
      }

      // (x: number, y: number) => Option<{ x: number; y: number }>;
      const get_pos = Option((guard, x: number, y: number) => {
         return Some({
            x: guard(to_pos(x)),
            y: guard(to_pos(y)),
         });
      });

      function show_pos(x: number, y: number): string {
         return get_pos(x, y).mapOr(
            "Invalid Pos",
            ({ x, y }) => `Pos (${x},${y})`
         );
      }

      expect(show_pos(10, 20)).to.equal("Pos (100,200)");
      expect(show_pos(-20, 50)).to.equal("Invalid Pos");
      expect(show_pos(50, 100)).to.equal("Invalid Pos");
   });
}
