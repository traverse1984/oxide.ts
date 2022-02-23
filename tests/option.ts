import { expect } from "chai";
import { Option, Some, None } from "../src";

function AsOpt(val: Option<any>): Option<number> {
   return val;
}

describe("Option<T>", () => {
   describe("Some<T>", () => {
      it("Creates Some<T> when called with any other value", () =>
         expect(Some(1)).to.be.an("object"));
      it("Can be nested", () =>
         expect(Some(Some(1)).unwrap().unwrap()).to.equal(1));
      it("Is matched by Option.is", () =>
         expect(Option.is(Some(1))).to.be.true);
   });

   describe("None", () => {
      it("Is an object", () => expect(None).to.be.an("object"));
      it("Is matched by Option.is", () => expect(Option.is(None)).to.be.true);
      it("Is a single instance", () =>
         expect(None.map(() => 1)).to.equal(None));
   });

   describe("Methods", () => {
      it("is", () => {
         expect(Some(1).is(Some(2))).to.be.true;
         expect(AsOpt(None).is(Some(1))).to.be.false;
         expect(Some(1).is(None)).to.be.false;
         expect(None.is(None)).to.be.true;
      });

      it("eq", () => {
         expect(Some(1).eq(Some(1))).to.be.true;
         expect(None.eq(None)).to.be.true;
         expect(Some(1).eq(None)).to.be.false;
         expect(AsOpt(None).eq(Some(1))).to.be.false;
         expect(Some(1).eq(Some(2))).to.be.false;
      });

      it("neq", () => {
         expect(Some(1).neq(Some(1))).to.be.false;
         expect(None.neq(None)).to.be.false;
         expect(Some(1).neq(None)).to.be.true;
         expect(AsOpt(None).neq(Some(1))).to.be.true;
         expect(Some(1).neq(Some(2))).to.be.true;
      });

      it("is_some", () => {
         expect(Some(1).is_some()).to.be.true;
         expect(None.is_some()).to.be.false;
      });

      it("is_none", () => {
         expect(Some(1).is_none()).to.be.false;
         expect(None.is_none()).to.be.true;
      });

      it("expect", () => {
         expect(Some(1).expect("test")).to.equal(1);
         expect(() => None.expect("test")).to.throw("test");
      });

      it("unwrap", () => {
         expect(Some(1).unwrap()).to.equal(1);
         expect(() => None.unwrap()).to.throw(/unwrap/);
      });

      it("unwrap_or", () => {
         expect(Some(1).unwrap_or(2)).to.equal(1);
         expect(AsOpt(None).unwrap_or(2)).to.equal(2);
      });

      it("unwrap_or_else", () => {
         expect(Some(1).unwrap_or_else(() => 2)).to.equal(1);
         expect(AsOpt(None).unwrap_or_else(() => 2)).to.equal(2);
      });

      it("unwrap_unchecked", () => {
         expect(Some(1).unwrap_unchecked()).to.equal(1);
         expect(None.unwrap_unchecked()).to.be.undefined;
      });

      it("or", () => {
         expect(Some(1).or(Some(2)).unwrap()).to.equal(1);
         expect(AsOpt(None).or(Some(2)).unwrap()).to.equal(2);
      });

      it("or_else", () => {
         expect(
            Some(1)
               .or_else(() => Some(2))
               .unwrap()
         ).to.equal(1);
         expect(
            AsOpt(None)
               .or_else(() => Some(2))
               .unwrap()
         ).to.equal(2);
      });

      it("and", () => {
         expect(Some(1).and(None).is_none()).to.be.true;
         expect(AsOpt(None).and(Some(2)).is_none()).to.be.true;
         expect(Some(1).and(Some("two")).unwrap()).to.equal("two");
      });

      it("and_then", () => {
         expect(
            Some(1)
               .and_then(() => None)
               .is_none()
         ).to.be.true;
         expect(
            AsOpt(None)
               .and_then(() => Some(2))
               .is_none()
         ).to.be.true;
         expect(
            Some(1)
               .and_then((n) => Some(`num ${n + 1}`))
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

      it("map_or", () => {
         expect(Some(1).map_or(3, (val) => val + 1)).to.equal(2);
         expect(None.map_or(3, (val) => val + 1)).to.equal(3);
      });

      it("map_or_else", () => {
         expect(
            Some(1).map_or_else(
               () => 3,
               (val) => val + 1
            )
         ).to.equal(2);
         expect(
            None.map_or_else(
               () => 3,
               (val) => val + 1
            )
         ).to.equal(3);
      });

      it("ok_or", () => {
         expect(Some(1).ok_or("err").is_ok()).to.be.true;
         expect(Some(1).ok_or("err").unwrap()).to.equal(1);
         expect(None.ok_or("err").is_err()).to.be.true;
         expect(None.ok_or("err").unwrap_err()).to.equal("err");
      });

      it("ok_or_else", () => {
         expect(
            Some(1)
               .ok_or_else(() => "err")
               .is_ok()
         ).to.be.true;
         expect(
            Some(1)
               .ok_or_else(() => "err")
               .unwrap()
         ).to.equal(1);
         expect(None.ok_or_else(() => "err").is_err()).to.be.true;
         expect(None.ok_or_else(() => "err").unwrap_err()).to.equal("err");
      });
   });
});
