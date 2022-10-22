import { expect } from "chai";
import { Result, Ok, Err, Some } from "../../../src";

function AsRes<T>(val: unknown): Result<T, T> {
   return val as Result<T, T>;
}

export default function methods() {
   it("into", () => {
      expect(Ok(1).into()).to.equal(1);
      expect(Err(1).into()).to.equal(undefined);
      expect(Err(1).into(false)).to.equal(false);
      expect(Err(1).into(null)).to.equal(null);
   });

   it("intoTuple", () => {
      expect(Ok(1).intoTuple()).to.deep.equal([undefined, 1]);
      expect(Err(1).intoTuple()).to.deep.equal([undefined, 1]);
      expect(Err(1).intoTuple(false)).to.deep.equal([false, 1]);
      expect(Err(1).intoTuple(null)).to.deep.equal([null, 1]);
   });

   it("isLike", () => {
      expect(Ok(1).isLike(Ok(2))).to.be.true;
      expect(Err(1).isLike(Ok(1))).to.be.false;
      expect(Ok(1).isLike(Err(1))).to.be.false;
      expect(Err(1).isLike(Err(2))).to.be.true;
   });

   it("isOk", () => {
      expect(Ok(1).isOk()).to.be.true;
      expect(Err(1).isOk()).to.be.false;
   });

   it("isErr", () => {
      expect(Ok(1).isErr()).to.be.false;
      expect(Err(1).isErr()).to.be.true;
   });

   it("filter", () => {
      const lessThan5 = (x: number) => x < 5;
      expect(Ok(1).filter(lessThan5).isLike(Some(1))).to.be.true;
      expect(Ok(1).filter(lessThan5).unwrap()).to.equal(1);
      expect(Ok(10).filter(lessThan5).isNone()).to.be.true;
      expect(Err(1).filter(lessThan5).isNone()).to.be.true;
   });

   it("expect", () => {
      expect(Ok(1).expect("test")).to.equal(1);
      expect(() => Err(1).expect("test")).to.throw("test");
   });

   it("expectErr", () => {
      expect(Err(1).expectErr("test")).to.equal(1);
      expect(() => Ok(1).expectErr("test")).to.throw("test");
   });

   it("unwrap", () => {
      expect(Ok(1).unwrap()).to.equal(1);
      expect(() => Err(1).unwrap()).to.throw(/unwrap/);
   });

   it("unwrapErr", () => {
      expect(Err(1).unwrapErr()).to.equal(1);
      expect(() => Ok(1).unwrapErr()).to.throw(/unwrap/);
   });

   it("unwrapOr", () => {
      expect(Ok(1).unwrapOr(2)).to.equal(1);
      expect(AsRes(Err(1)).unwrapOr(2)).to.equal(2);
   });

   it("unwrapOrElse", () => {
      expect(Ok(1).unwrapOrElse(() => 2)).to.equal(1);
      expect(AsRes(Err(1)).unwrapOrElse(() => 2)).to.equal(2);
   });

   it("unwrapUnchecked", () => {
      expect(Ok(1).unwrapUnchecked()).to.equal(1);
      expect(Err(1).unwrapUnchecked()).to.equal(1);
   });

   it("or", () => {
      expect(Ok(1).or(Ok(2)).unwrap()).to.equal(1);
      expect(AsRes(Err(1)).or(Ok(2)).unwrap()).to.equal(2);
   });

   it("orElse", () => {
      expect(
         Ok(1)
            .orElse(() => Ok(2))
            .unwrap()
      ).to.equal(1);
      expect(
         Err(2)
            .orElse((n) => Err(`err ${n}`))
            .unwrapErr()
      ).to.equal("err 2");
   });

   it("and", () => {
      expect(AsRes(Ok(1)).and(Err(2)).isErr()).to.be.true;
      expect(Err(1).and(Ok(2)).isErr()).to.be.true;
      expect(Ok(1).and(Ok("two")).unwrap()).to.equal("two");
   });

   it("andThen", () => {
      expect(
         AsRes(Ok(1))
            .andThen(() => Err(1))
            .isErr()
      ).to.be.true;
      expect(
         Err(1)
            .andThen(() => Ok(2))
            .isErr()
      ).to.be.true;
      expect(
         Ok(1)
            .andThen((n) => Ok(`num ${n + 1}`))
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

   it("mapErr", () => {
      expect(
         Err(1)
            .mapErr((val) => val + 1)
            .unwrapErr()
      ).to.equal(2);
      expect(() =>
         Ok(1)
            .mapErr((val) => val + 1)
            .unwrapErr()
      ).to.throw(/unwrap/);
   });

   it("mapOr", () => {
      expect(Ok(1).mapOr(3, (val) => val + 1)).to.equal(2);
      expect(Err(1).mapOr(3, (val) => val + 1)).to.equal(3);
   });

   it("mapOrElse", () => {
      expect(
         Ok(1).mapOrElse(
            () => 3,
            (val) => val + 1
         )
      ).to.equal(2);
      expect(
         Err(1).mapOrElse(
            (err) => err + 2,
            (val) => val + 1
         )
      ).to.equal(3);
   });

   it("ok", () => {
      expect(Ok(1).ok().isSome()).to.be.true;
      expect(Ok(1).ok().unwrap()).to.equal(1);
      expect(Err(1).ok().isNone()).to.be.true;
      expect(() => Err(1).ok().unwrap()).to.throw(/unwrap/);
   });
}
