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
}
