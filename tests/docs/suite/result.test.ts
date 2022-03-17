import { expect } from "chai";
import { Result, Ok, Err } from "../../../src";

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
}
