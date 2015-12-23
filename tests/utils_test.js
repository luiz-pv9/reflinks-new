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

        it('ignores if the first value isnt an object', () => {
            let merged = utils.mergeObjects(null, {a: 10});
            merged.should.eql({
                a: 10
            });
        });

        it('ignores if the second value isnt an object', () => {
            let merged = utils.mergeObjects({a: 15}, null);
            merged.should.eql({
                a: 15
            });
        });
    });

    describe('#stringToElements', () => {
        it('creates a span class with no attributes', () => {
            let span = utils.stringToElements('<span></span>');
            span.length.should.eq(1);
            span[0].tagName.should.eql("SPAN");
        });

        it('creates a span with class and id', () => {
            let span = utils.stringToElements('<span class="test" id="foo"></span>');
            span.length.should.eq(1);
            span[0].tagName.should.eql("SPAN");
            span[0].className.should.eql("test");
            span[0].id.should.eql("foo");
        });

        it('creates multiple elements in the in the NodeList', () => {
            let multiple = utils.stringToElements('<h1>Teste</h1><p>More test</p>');
            multiple.length.should.eq(2);
            multiple[0].tagName.should.eql("H1");
            multiple[1].tagName.should.eql("P");
        });

        it('applies whatever correction the browser supports', () => {
            let invalid = utils.stringToElements('<h1>Test</h2>');
            invalid.length.should.eq(1);
            invalid[0].tagName.should.eq("H1");
        });
    });
});