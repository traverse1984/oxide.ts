import { expect } from "chai";
import { Option, Some, None } from "../../../src";

function AsOpt(val: Option<any>): Option<number> {
   return val;
}

export default function methods() {
   it("into", () => {
      expect(Some(1).into()).to.equal(1);
      expect(None.into()).to.equal(undefined);
      expect(None.into(false)).to.equal(false);
      expect(None.into(null)).to.equal(null);
   });

   it("isLike", () => {
      expect(Some(1).isLike(Some(2))).to.be.true;
      expect(AsOpt(None).isLike(Some(1))).to.be.false;
      expect(Some(1).isLike(None)).to.be.false;
      expect(None.isLike(None)).to.be.true;
   });

   it("isSome", () => {
      expect(Some(1).isSome()).to.be.true;
      expect(None.isSome()).to.be.false;
   });

   it("isNone", () => {
      expect(Some(1).isNone()).to.be.false;
      expect(None.isNone()).to.be.true;
   });

   it("filter", () => {
      const lessThan5 = (x: number) => x < 5;
      expect(Some(1).filter(lessThan5).unwrap()).to.equal(1);
      expect(Some(10).filter(lessThan5).isNone()).to.be.true;
      expect(None.filter(lessThan5).isNone()).to.be.true;
   });

   it("flatten", () => {
      expect(Some(Some(1)).flatten().unwrap()).to.equal(1);
      expect(Some(None).flatten().isNone()).to.be.true;
      expect(None.flatten().isNone()).to.be.true;
   });

   it("expect", () => {
      expect(Some(1).expect("test")).to.equal(1);
      expect(() => None.expect("test")).to.throw("test");
   });

   it("unwrap", () => {
      expect(Some(1).unwrap()).to.equal(1);
      expect(() => None.unwrap()).to.throw(/unwrap/);
   });

   it("unwrapOr", () => {
      expect(Some(1).unwrapOr(2)).to.equal(1);
      expect(AsOpt(None).unwrapOr(2)).to.equal(2);
   });

   it("unwrapOrElse", () => {
      expect(Some(1).unwrapOrElse(() => 2)).to.equal(1);
      expect(AsOpt(None).unwrapOrElse(() => 2)).to.equal(2);
   });

   it("unwrapUnchecked", () => {
      expect(Some(1).unwrapUnchecked()).to.equal(1);
      expect(None.unwrapUnchecked()).to.be.undefined;
   });

   it("or", () => {
      expect(Some(1).or(Some(2)).unwrap()).to.equal(1);
      expect(AsOpt(None).or(Some(2)).unwrap()).to.equal(2);
   });

   it("orElse", () => {
      expect(
         Some(1)
            .orElse(() => Some(2))
            .unwrap()
      ).to.equal(1);
      expect(
         AsOpt(None)
            .orElse(() => Some(2))
            .unwrap()
      ).to.equal(2);
   });

   it("and", () => {
      expect(Some(1).and(None).isNone()).to.be.true;
      expect(AsOpt(None).and(Some(2)).isNone()).to.be.true;
      expect(Some(1).and(Some("two")).unwrap()).to.equal("two");
   });

   it("andThen", () => {
      expect(
         Some(1)
            .andThen(() => None)
            .isNone()
      ).to.be.true;
      expect(
         AsOpt(None)
            .andThen(() => Some(2))
            .isNone()
      ).to.be.true;
      expect(
         Some(1)
            .andThen((n) => Some(`num ${n + 1}`))
            .unwrap()
      ).to.equal("num 2");
   });

   it("map", () => {
      expect(
         Some(1)
            .map((val) => val + 1)
            .unwrap()
      ).to.equal(2);
      expect(() => None.map((val) => val + 1).unwrap()).to.throw(/unwrap/);
   });

   it("mapOr", () => {
      expect(Some(1).mapOr(3, (val) => val + 1)).to.equal(2);
      expect(None.mapOr(3, (val) => val + 1)).to.equal(3);
   });

   it("mapOrElse", () => {
      expect(
         Some(1).mapOrElse(
            () => 3,
            (val) => val + 1
         )
      ).to.equal(2);
      expect(
         None.mapOrElse(
            () => 3,
            (val) => val + 1
         )
      ).to.equal(3);
   });

   it("okOr", () => {
      expect(Some(1).okOr("err").isOk()).to.be.true;
      expect(Some(1).okOr("err").unwrap()).to.equal(1);
      expect(None.okOr("err").isErr()).to.be.true;
      expect(None.okOr("err").unwrapErr()).to.equal("err");
   });

   it("okOrElse", () => {
      expect(
         Some(1)
            .okOrElse(() => "err")
            .isOk()
      ).to.be.true;
      expect(
         Some(1)
            .okOrElse(() => "err")
            .unwrap()
      ).to.equal(1);
      expect(None.okOrElse(() => "err").isErr()).to.be.true;
      expect(None.okOrElse(() => "err").unwrapErr()).to.equal("err");
   });
}
