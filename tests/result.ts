import { expect } from "chai";
import { Result, Ok, Err } from "../src";

describe("Result<T, E>", () => {
   describe("Ok<T>", () => {
      it("Creates Ok<T> when called with any other value", () =>
         expect(Ok(1)).to.be.an("object"));
      it("Can be nested with Ok.from", () =>
         expect(Ok(Ok(1)).unwrap().unwrap()).to.equal(1));
      it("Is matched by Result.is", () => expect(Result.is(Ok(1))).to.be.true);
   });

   describe("Err<E>", () => {
      it("Creates Err<E> when called with any other value", () =>
         expect(Err(1)).to.be.an("object"));
      it("Can be nested with Err.from", () =>
         expect(Err(Err(1)).unwrap_err().unwrap_err()).to.equal(1));
      it("Is matched by Result.is", () => expect(Result.is(Err(1))).to.be.true);
   });

   describe("Methods", () => {
      it("is", () => {
         expect(Ok(1).is(Ok(2))).to.be.true;
         expect(Err(1).is(Ok(1))).to.be.false;
         expect(Ok(1).is(Err(1))).to.be.false;
         expect(Err(1).is(Err(2))).to.be.true;
      });

      it("eq", () => {
         expect(Ok(1).eq(Ok(1))).to.be.true;
         expect(Err(1).eq(Err(1))).to.be.true;
         expect(Ok(1).eq(Err(1))).to.be.false;
         expect(Ok(1).eq(Ok(2))).to.be.false;
      });

      it("neq", () => {
         expect(Ok(1).neq(Ok(1))).to.be.false;
         expect(Err(1).neq(Err(1))).to.be.false;
         expect(Ok(1).neq(Err(1))).to.be.true;
         expect(Ok(1).neq(Ok(2))).to.be.true;
      });

      it("is_ok", () => {
         expect(Ok(1).is_ok()).to.be.true;
         expect(Err(1).is_ok()).to.be.false;
      });

      it("is_none", () => {
         expect(Ok(1).is_err()).to.be.false;
         expect(Err(1).is_err()).to.be.true;
      });

      it("expect", () => {
         expect(Ok(1).expect("test")).to.equal(1);
         expect(() => Err(1).expect("test")).to.throw("test");
      });

      it("expect_err", () => {
         expect(Err(1).expect_err("test")).to.equal(1);
         expect(() => Ok(1).expect_err("test")).to.throw("test");
      });

      it("unwrap", () => {
         expect(Ok(1).unwrap()).to.equal(1);
         expect(() => Err(1).unwrap()).to.throw(/unwrap/);
      });

      it("unwrap_err", () => {
         expect(Err(1).unwrap_err()).to.equal(1);
         expect(() => Ok(1).unwrap_err()).to.throw(/unwrap/);
      });

      it("unwrap_or", () => {
         expect(Ok(1).unwrap_or(2)).to.equal(1);
         expect(Err(1).unwrap_or(2)).to.equal(2);
      });

      it("unwrap_or_else", () => {
         expect(Ok(1).unwrap_or_else(() => 2)).to.equal(1);
         expect(Err(1).unwrap_or_else(() => 2)).to.equal(2);
      });

      it("unwrap_unchecked", () => {
         expect(Ok(1).unwrap_unchecked()).to.equal(1);
         expect(Err(1).unwrap_unchecked()).to.equal(1);
      });

      it("or", () => {
         expect(Ok(1).or(Ok(2)).unwrap()).to.equal(1);
         expect(Err(1).or(Ok(2)).unwrap()).to.equal(2);
      });

      it("or_else", () => {
         expect(
            Ok(1)
               .or_else(() => Ok(2))
               .unwrap()
         ).to.equal(1);
         expect(
            Err(2)
               .or_else((n) => Err(`err ${n}`))
               .unwrap_err()
         ).to.equal("err 2");
      });

      it("and", () => {
         expect(Ok(1).and(Err(2)).is_err()).to.be.true;
         expect(Err(1).and(Ok(2)).is_err()).to.be.true;
         expect(Ok(1).and(Ok(2)).unwrap()).to.equal(2);
      });

      it("and_then", () => {
         expect(
            Ok(1)
               .and_then(() => Err(1))
               .is_err()
         ).to.be.true;
         expect(
            Err(1)
               .and_then(() => Ok(2))
               .is_err()
         ).to.be.true;
         expect(
            Ok(1)
               .and_then((n) => Ok(`num ${n + 1}`))
               .unwrap()
         ).to.equal("num 2");
      });

      it("map", () => {
         expect(
            Ok(1)
               .map((val) => val + 1)
               .unwrap()
         ).to.equal(2);
         expect(() =>
            Err(1)
               .map((val) => val + 1)
               .unwrap()
         ).to.throw(/unwrap/);
      });

      it("map_err", () => {
         expect(
            Err(1)
               .map_err((val) => val + 1)
               .unwrap_err()
         ).to.equal(2);
         expect(() =>
            Ok(1)
               .map_err((val) => val + 1)
               .unwrap_err()
         ).to.throw(/unwrap/);
      });

      it("map_or", () => {
         expect(Ok(1).map_or(3, (val) => val + 1)).to.equal(2);
         expect(Err(1).map_or(3, (val) => val + 1)).to.equal(3);
      });

      it("map_or_else", () => {
         expect(
            Ok(1).map_or_else(
               () => 3,
               (val) => val + 1
            )
         ).to.equal(2);
         expect(
            Err(1).map_or_else(
               (err) => err + 2,
               (val) => val + 1
            )
         ).to.equal(3);
      });

      it("ok", () => {
         expect(Ok(1).ok().is_some()).to.be.true;
         expect(Ok(1).ok().unwrap()).to.equal(1);
         expect(Err(1).ok().is_none()).to.be.true;
         expect(() => Err(1).ok().unwrap()).to.throw(/unwrap/);
      });
   });
});
