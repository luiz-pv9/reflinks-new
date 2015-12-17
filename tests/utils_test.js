import * as utils from '../src/utils';

describe('utils specs', () => {
    it('is an object', () => {
        utils.should.be.an.Object;
    });

    describe('#mergeObjects', () => {
        it('returns an object with properties from the second and first', () => {
            let obj = utils.mergeObjects({a: 10}, {b: 20});
            obj.should.eql({a: 10, b: 20});
        });

        it('overrides the second object value with the first', () => {
            let obj = utils.mergeObjects({a: 10}, {a: 20});
            obj.should.eql({a: 10});
        });

        it('doesnt modify the specified objects', () => {
            let first = { a: 10 };
            let second = { b: 20 };
            let third = utils.mergeObjects(first, second);
            first.should.eql({a: 10});
            second.should.eql({b: 20});
            third.should.eql({a: 10, b: 20});
        });

        it('shallow copies each value', () => {
            let first = { a: { b: 10 } };
            let merged = utils.mergeObjects(first, { c: 20 });
            merged.should.eql({
                a: { b: 10 },
                c: 20
            });
            merged.a.should.eq(first.a); // same reference
        });
    });
});