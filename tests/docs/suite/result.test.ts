import { expect } from "chai";
import { Result, Guard, Ok, Err } from "../../../src";

export default function result() {
   it("Result (fetch_user)", () => {
      const users = ["Simon", "Garfunkel"];
      function fetch_user(username: string): Result<string, string> {
         return users.includes(username) ? Ok(username) : Err("*silence*");
      }

      function greet(username: string): string {
         return fetch_user(username).mapOrElse(
            (err) => `Error: ${err}`,
            (user) => `Hello ${user}, my old friend!`
         );
      }

      expect(greet("Simon")).to.equal("Hello Simon, my old friend!");
      expect(greet("SuperKing777")).to.equal("Error: *silence*");
   });

   it("Result (guard)", () => {
      function to_pos(pos: number): Result<number, string> {
         return pos > 0 && pos < 100 ? Ok(pos * 10) : Err("Invalid Pos");
      }

      // (x: number, y: number) => Result<{ x: number; y: number }, string>;
      const get_pos = Result((guard: Guard<string>, x: number, y: number) => {
         return Ok({
            x: guard(to_pos(x)),
            y: guard(to_pos(y)),
         });
      });

      function show_pos(x: number, y: number): string {
         return get_pos(x, y).mapOrElse(
            (err) => `Error: ${err}`,
            ({ x, y }) => `Pos (${x},${y})`
         );
      }

      expect(show_pos(10, 20)).to.equal("Pos (100,200)");
      expect(show_pos(-20, 50)).to.equal("Error: Invalid Pos");
      expect(show_pos(50, 100)).to.equal("Error: Invalid Pos");
   });
}
