import * as navigation from '../src/navigation';
import Url from '../src/url';
import {removeElement, stringToElements} from '../src/utils';

/*
** Returns the current URL.
*/
function currentUrl() {
    return new Url(document.location).withoutHash().toString();
}

/*
** Helper function used in the tests. This function receives a configuration and
** executes the following things:
**  - Convert the specified `elm` option to an element (DOM).
**  - Insert the element to the body.
**  - Call the `ready` callback. In this function you should assert whatever you want to test.
**  - Removes the element from the body.
*/
function navigationHelper(opts) {
    navigation.clearHistory();
    let elm = stringToElements(opts.elm)[0];
    document.body.appendChild(elm);
    navigation.initializeHistory(opts.historyOptions);
    opts.ready(elm);
    removeElement(elm); 
}

describe('navigation specs', () => {
    it('is an object', () => {
        navigation.should.be.an.Object;
    });

    describe('.getDocumentRoot', () => {
        it('is a function', () => {
            navigation.getDocumentRoot.should.be.a.Function;
        });

        it('returns undefined if no document root could be found', () => {
            expect(navigation.getDocumentRoot()).to.be.null;
        });

        it('returns undefined if data-reflinks-root is present but no data-active', () => {
            let div = stringToElements('<div data-reflinks-root></div>')[0];
            document.body.appendChild(div);
            expect(navigation.getDocumentRoot()).to.be.null;
            removeElement(div);
        });

        it('returns the element with both data-reflinks-root and data-active', () => {
            let elm = stringToElements('<div data-reflinks-root data-active></div>')[0];
            document.body.appendChild(elm);
            navigation.getDocumentRoot().should.eq(elm);
            removeElement(elm);
        });

        it('returns nested data-view if active', () => {
            let elm = stringToElements(
                '<div data-reflinks-root data-active>' + 
                    '<div data-view="post" data-active></div>' +
                '</div>'
            )[0];
            document.body.appendChild(elm);
            navigation.getDocumentRoot().getAttribute('data-view').should.eq('post');
            removeElement(elm);
        });

        it('returns deep nested (two or more) data-view if active', () => {
            let elm = stringToElements(
                '<div data-reflinks-root data-active>' + 
                    '<div data-view="post" data-active>' +
                        '<div data-view="comment" data-active></div>' +
                    '</div>' +
                '</div>'
            )[0];
            document.body.appendChild(elm);
            navigation.getDocumentRoot().getAttribute('data-view').should.eq('comment');
            removeElement(elm);
        });

        it('returns the element with data-active', () => {
            let elm = stringToElements(
                '<div data-reflinks-root data-active>' +
                    '<div data-view="post" id="first"></div>' +
                    '<div data-view="post" id="second" data-active></div>' +
                '</div>'
            )[0];

            document.body.appendChild(elm);
            navigation.getDocumentRoot().id.should.eq('second');
            removeElement(elm);
        });
    });

    describe('.findNestedViews', () => {
        it('returns an empty array if no view could be found', () => {
            let elm = stringToElements(
                '<div><div></div></div>'
            )[0];
            navigation.findNestedViews(elm).should.eql([]);
        });

        it('returns an array with a view inside the element', () => {
            let elm = stringToElements(
                '<div>' +
                    '<div data-view="post"></div>' +
                '</div>'
            )[0];
            let postView = elm.querySelector('[data-view="post"]');
            navigation.findNestedViews(elm).should.eql([postView]);
        });

        it('returns an array with views inside views in order', () => {
            let elm = stringToElements(
                '<div>' +
                    '<div data-view="post">' +
                        '<div data-view="comment"></div>' +
                    '</div>' +
                '</div>'
            )[0];
            let postView = elm.querySelector('[data-view="post"]');
            let commentView = elm.querySelector('[data-view="comment"]');
            navigation.findNestedViews(elm).should.eql([postView, commentView]);
        });

        it('finds the first data-view in the tree', () => {
            let elm = stringToElements(
                '<div>' +
                    '<div data-view="post"></div>' +
                    '<div data-view="comment"></div>' +
                '</div>'
            )[0];
            let postView = elm.querySelector('[data-view="post"]');
            navigation.findNestedViews(elm).should.eql([postView]);
        });
    });

	describe('.findParentViews', () => {
		it('returns an empty list if no parent can be found', () => {
			let elm = stringToElements(
				'<div></div>'
			)[0];
			navigation.findParentViews(elm).should.eql([]);
		});

		it('returns the parent document root', () => {
			let elm = stringToElements(
				'<div data-reflinks-root><div id="foo"></div></div>'
			)[0];
			let child = elm.querySelector('[id="foo"]');
			navigation.findParentViews(child).should.eql([elm]);
		});

		it('returns parent views and document root', () => {
			let elm = stringToElements(
				'<div data-reflinks-root>' +
					'<div data-view="post">' +
						'<div data-view="comment"></div>' +
					'</div>' +
				'</div>'
			)[0];
			let post = elm.querySelector('[data-view="post"]');
			let comment = elm.querySelector('[data-view="comment"]');
			navigation.findParentViews(comment).should.eql([elm, post]);
		});

		it('throws an error if no document root and `strict` is true', () => {
			let elm = stringToElements('<div></div>');
			let fn = () => { navigation.findParentViews(elm, true); };
			expect(fn).to.throw(/reflinks/);
		});
	});

    describe('.initializeHistory', () => {
        beforeEach(() => {
            navigation.clearHistory();
        });

        it('is a function', () => {
            navigation.initializeHistory.should.be.a.Function;
        });

        it('ignores if no document root can be found', () => {
            navigation.initializeHistory();
            expect(navigation.getDocumentRoot()).to.eq(null);
        });

        it('adds data-active to the document root if present', () => {
            navigationHelper({
                elm: '<div data-reflinks-root></div>',
                historyOptions: {},
                ready: (elm) => {
                    navigation.getDocumentRoot().should.be.ok;
                    elm.hasAttribute('data-active').should.be.true;
                }
            });
        });

        it('adds the current url to the history if the document root is cached', () => {
            navigationHelper({
                elm: '<div data-reflinks-root data-cached></div>',
                historyOptions: {},
                ready: (elm) => {
                    let history = navigation.getHistory();
                    let curl = currentUrl();
                    Object.keys(history).should.have.length(1);
                    history.should.have.property(curl);
                    history[curl].should.eql([elm]);
                }
            });
        });

        it('caches the root if cache: true is specified', () => {
            navigationHelper({
                elm: '<div data-reflinks-root></div>',
                historyOptions: {cache: true}, // This option will cache the document-root
                ready: (elm) => {
                    let history = navigation.getHistory();
                    let curl = currentUrl();
                    history[curl].should.eql([elm]);
                } 
            })
        });

        it('adds data-active to nested data-view', () => {
            navigationHelper({
                elm: (
                    '<div data-reflinks-root>' +
                        '<div data-view="post"></div>' +
                    '</div>'
                ),
                historyOptions: {},
                ready: (elm) => {
                    elm.hasAttribute('data-active').should.be.true;
                    let postView = elm.querySelector('[data-view="post"]');
                    postView.hasAttribute('data-active').should.be.true;
                }
            });
        });

        it('caches nested views if cache:true is specified', () => {
            navigationHelper({
                elm: (
                    '<div data-reflinks-root>' +
                        '<div data-view="post"></div>' +
                    '</div>'
                ),
                historyOptions: { cache: true },
                ready: (elm) => {
                    elm.hasAttribute('data-cached').should.be.true;
                    let postView = elm.querySelector('[data-view="post"]');
                    postView.hasAttribute('data-cached').should.be.true;
                }
            });
        });

        it('adds data-active to data-view inside data-view (nested two or more)', () => {
            navigationHelper({
                elm: (
                    '<div data-reflinks-root>' +
                        '<div data-view="post">' +
                            '<div data-view="comment"></div>' +
                        '</div>' +
                    '</div>'
                ),
                historyOptions: {},
                ready: (elm) => {
                    let postView = elm.querySelector('[data-view="post"]');
                    let commentView = elm.querySelector('[data-view="comment"]');

                    elm.hasAttribute('data-active').should.be.true;
                    postView.hasAttribute('data-active').should.be.true;
                    commentView.hasAttribute('data-active').should.be.true;
                }
            });
        });
    });

    describe('.pushState - root view with no views', () => {
		let elm, first, second;

		beforeEach(() => {
			navigation.clearHistory();
			elm = stringToElements(
				'<div>' +
					'<div id="first" data-reflinks-root></div>' +
					'<div id="second" data-reflinks-root data-active></div>' +
				'</div>'
			)[0];
			first = elm.querySelector('[id="first"]');
			second = elm.querySelector('[id="second"]');
			document.body.appendChild(elm);
		});

		afterEach(() => {
			removeElement(elm);
		});

		it('adds an entry to the browser history', () => {
			let beforeLength = window.history.length;
			navigation.pushState(new Url('/second'), second, { cache: false });
			window.history.length.should.eq(beforeLength + 1);
		});

		it('adds an entry to history if cached', () => {
			let url = new Url('/second');
			navigation.pushState(url, second, { cache: true });
			let history = navigation.getHistory();
			history[url.toString()].should.eql([second]);
		});

		it('adds data-cached to the root element', () => {
			navigation.pushState(new Url('/second'), second, { cache: true });
			second.hasAttribute('data-cached').should.be.true;
		});

		it('doesnt add an entry to history unless cached', () => {
			let url = new Url('/second');
			navigation.pushState(url, second, { cache: false });
			let history = navigation.getHistory();
			expect(history).not.to.have.property(url.toString());
		});
	});

    describe('.pushState - root view with nested views', () => {
		let elm, post, comment;
		beforeEach(() => {
			navigation.clearHistory();
			elm = stringToElements(
				'<div data-reflinks-root data-active>' +
					'<div data-view="post" data-active>' +
						'<div data-view="comment" data-active></div>' +
					'</div>' +
				'</div>'
			)[0];
			post = elm.querySelector('[data-view="post"]');
			comment = elm.querySelector('[data-view="comment"]');
			document.body.appendChild(elm);
		});

		afterEach(() => {
			removeElement(elm);
		});

		it('adds data-cached to all elements if cache:true is set', () => {
			navigation.pushState(new Url('/test'), elm, { cache: true });
			elm.hasAttribute('data-cached').should.be.true;
			post.hasAttribute('data-cached').should.be.true;
			comment.hasAttribute('data-cached').should.be.true;
		});

		it('adds an entry to history with all views', () => {
			let url = new Url('/test');
			navigation.pushState(url, elm, { cache: true });
			let history = navigation.getHistory();
			let entry = history[url.toString()];
			entry.should.eql([elm, post, comment]);
		});

		it('adds an entry to window.history', () => {
			let beforeLength = window.history.length;
			navigation.pushState(new Url('/test'), elm, { cache: false });
			window.history.length.should.eq(beforeLength + 1);
		});
	});

    describe('.pushState - nested view up to the root', () => {
		let elm, context, post, comment;
		beforeEach(() => {
			navigation.clearHistory();
			elm = stringToElements(
				'<div data-reflinks-root data-active>' +
					'<div data-view="context">' +
						'<div data-view="post">' +
							'<div data-view="comment"></div>' +
						'</div>' +
					'</div>' +
				'</div>'
			)[0];
			context = elm.querySelector('[data-view="context"]');
			post = elm.querySelector('[data-view="post"]');
			comment = elm.querySelector('[data-view="comment"]');
		});

		afterEach(() => {
			removeElement(elm);
		});

		it('caches parent view and document root', () => {
			navigation.pushState(new Url('/test'), post, {cache: true});
			elm.hasAttribute('data-cached').should.be.true;
			context.hasAttribute('data-cached').should.be.true;
		});

		it('caches nested view and the specified view', () => {
            navigation.pushState(new Url('/test'), post, {cache: true});
            post.hasAttribute('data-cached').should.be.true;
            comment.hasAttribute('data-cached').should.be.true;
        });

		it('adds an entry history with all parents and children', () => {
            let url = new Url('/his');
            navigation.pushState(url, post, {cache: true});
            let history = navigation.getHistory();
            history[url.toString()].should.eql([elm, context, post, comment]);
        });

		it('adds an entry to window.history', () => {
            let beforeLength = window.history.length;
            navigation.pushState(new Url('/test'), post, {cache: false});
            window.history.length.should.eq(beforeLength + 1);
        });
	});
});
