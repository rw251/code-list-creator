var array = require('../scripts/Array.js'),
  expect = require("chai").expect;

describe('IsArray', function() {
  Array.isArray = null;

  it("Doesn't work if removed", function() {
    expect(Array.isArray).to.equal(null);

    describe("Once added", function() {
      array.addIsArray();

      it("Identifies arrays", function() {
        expect(Array.isArray([1, 2, 3])).to.equal(true);
        expect(Array.isArray([1, "2"])).to.equal(true);
      });

      it("Rejects non arrays", function() {
        expect(Array.isArray(1)).to.equal(false);
        expect(Array.isArray(false)).to.equal(false);
        expect(Array.isArray("string")).to.equal(false);
        expect(Array.isArray({
          an: "object"
        })).to.equal(false);
      });
    });
  });

});
