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

    describe('.isElement', () => {
        it('returns true for dom elements', () => {
            let div = utils.stringToElements('<div></div>');
            utils.isElement(div).should.be.false;
            utils.isElement(div[0]).should.be.true;
            let header = utils.stringToElements('<h1>Some text</h1>');
            utils.isElement(header).should.be.false;
            utils.isElement(header[0]).should.be.true;
        });
    });

    describe('.extractBody', () => {
        it('returns the content inside the body', () => {
            utils.extractBody('<body>FOO</body>').should.eq('FOO');
            utils.extractBody('<body> 1234 </body>').should.eq(' 1234 ');
            utils.extractBody('<BODY>Hello</BODY>').should.eq('Hello');
        });

        it('retunrs the content inside the body with custom attrs', () => {
            utils.extractBody(
                '<body ng-app="foo" >Content</body>'
            ).should.eq('Content');

            utils.extractBody(
                '<body ng-app="foo" \n class="my-app">Content2</body>'
            ).should.eq('Content2');
        });

        it('returns an empty string if the body could not be found', () => {
            utils.extractBody('<body>Foo</').should.eq("");
            utils.extractBody('<head>Foo</head>').should.eq("");
        });
    });

    describe('.hideElement', () => {
        it('sets the display property to none', () => {
            let div = utils.stringToElements('<div></div>')[0];
            utils.hideElement(div);
            div.style.display.should.eq('none');
        });

        it('doesnt raise an error if the element is undefined', () => {
            let text = utils.stringToElements('Test...')[0];
            utils.hideElement(text);
        });
    });

    describe('.findElementByAttribute', () => {
        it('returns the element with the attribute and no value', () => {
            let elms = utils.stringToElements('<div data-foo="bar"></div>');
            let div = utils.findElementByAttribute(elms, 'data-foo');
            div.tagName.should.eq('DIV');
            div.getAttribute('data-foo').should.eq('bar');
        });

        it('returns the first element if no value is specified', () => {
            let elms = utils.stringToElements(
                '<div data-foo="first"></div><div data-foo="second"></div>'
            );
            let div = utils.findElementByAttribute(elms, 'data-foo');
            div.tagName.should.eq('DIV');
            div.getAttribute('data-foo').should.eq('first');
        });

        it('returns the element with the attribute and value', () => {
            let elms = utils.stringToElements(
                '<div data-foo="first"></div><div data-foo="second"></div>'
            );
            let div = utils.findElementByAttribute(elms, 'data-foo', 'second');
            div.tagName.should.eq('DIV');
            div.getAttribute('data-foo').should.eq('second');
        });

        it('returns children elements with attribute', () => {
            let elms = utils.stringToElements(
                '<div><div data-test="foo"></div></div>'
            );
            let div = utils.findElementByAttribute(elms, 'data-test');
            div.tagName.should.eq('DIV');
            div.getAttribute('data-test').should.eq('foo');
        });

        it('returns children elements with attribute and value', () => {
            let elms = utils.stringToElements(
                '<div></div><div><div data-test="first"></div><div data-test="second"></div></div>'
            );
            let div = utils.findElementByAttribute(elms, 'data-test', 'second');
            div.getAttribute('data-test').should.eq('second');
        });

        it('ignores plain text elements', () => {
            let elms = utils.stringToElements(
                'Simple text <div data-test="hello"></div>'
            );
            let div = utils.findElementByAttribute(elms, 'data-test');
            div.getAttribute('data-test').should.eq('hello');
        });
    });

    describe('.isString', () => {
        it('returns true in the following cases', () => {
            utils.isString('foo').should.be.true;
            utils.isString('').should.be.true;
            utils.isString('   ').should.be.true;
            utils.isString('1').should.be.true;
        });

        it('returns false in the following cases', () => {
            utils.isString().should.be.false;
            utils.isString([]).should.be.false;
            utils.isString(true).should.be.false;
            utils.isString(new Date()).should.be.false;
            utils.isString(1).should.be.false;
        });
    });

	describe('.removeElement', () => {
		it('ignores if the element is not valid', () => {
			utils.removeElement(null);
			utils.removeElement({});
		});

		it('removes the element from the parent', () => {
			let div = utils.stringToElements(
				'<div><p></p></div>'
			)[0];
			let paragraph = div.querySelector('p');
			utils.removeElement(paragraph);
			expect(paragraph.parentNode).to.be.null;
			div.childNodes.should.have.length(0);

			// Calling again does nothing
			utils.removeElement(paragraph);
		});
	});
});
