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
    let elm = stringToElements(opts.elm)[0];
    document.body.appendChild(elm);
    navigation.initializeHistory();
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

    describe.only('.findNestedViews', () => {
        it('returns an empty array if no view could be found');
        it('returns an array with a view inside the element');
        it('returns an array with views inside views');
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
                ready: (elm) => {
                    navigation.initializeHistory();
                    navigation.getDocumentRoot().should.be.ok;
                    elm.hasAttribute('data-active').should.be.true;
                }
            });
        });

        it('adds the current url to the history if the document root is cached', () => {
            navigationHelper({
                elm: '<div data-reflinks-root data-cached></div>',
                ready: (elm) => {
                    navigation.initializeHistory();
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
                ready: (elm) => {
                    navigation.initializeHistory({
                        cache: true // This option will cache the document-root
                    });
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
                ready: (elm) => {
                    navigation.initializeHistory();
                    elm.hasAttribute('data-cached').should.be.true;
                    let postView = elm.querySelector('[data-view="post"]');
                    postView.hasAttribute('data-cached').should.be.true;
                }
            });
        });

        it('caches nested views if cache:true is specified');

        it('adds data-active to data-view inside data-view (nested two or more)');
    });
});
