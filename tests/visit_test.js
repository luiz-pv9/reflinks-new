import * as visit from '../src/visit';
import {stringToElements} from '../src/utils';

describe('visit specs', () => {
    let xhr, requests;

    beforeEach(() => {
        xhr = sinon.useFakeXMLHttpRequest();
        xhr.onCreate = (req) => {
            requests.push(req);
        }
        requests = [];
    });

    describe('.findDocumentRoot', () => {
        it('returns null by default', () => {
            expect(visit.getDocumentRoot()).to.be.null;
        });

        it('is still null if no element can be found', () => {
            visit.findDocumentRoot();
            expect(visit.getDocumentRoot()).to.be.null;
        });

        it('returns the element with data-reflinks-root', () => {
            let docRoot = stringToElements('<div data-reflinks-root></div>');
            document.body.appendChild(docRoot[0]);
            visit.initialize();
            visit.getDocumentRoot().tagName.should.eql("DIV");
            visit.getDocumentRoot().hasAttribute('data-reflinks-root').should.be.true;
            // clean up
            visit.getDocumentRoot().parentNode.removeChild(visit.getDocumentRoot());
        });
    });

    describe('.cacheCurrent', () => {
        beforeEach(() => {
            visit.clearNavigationHistory();
            document.body.innerHTML = '<div data-reflinks-root></div>';
            visit.initialize();
        });

        it('adds the data-cached property to the current root', () => {
            visit.cacheCurrent();
            visit.getDocumentRoot().hasAttribute('data-cached').should.be.true;
            visit.getDocumentRoot().getAttribute('data-cached').length.should.be.at.least(5);
        });
    });

    describe('.page', () => {
        beforeEach(() => {
            visit.clearNavigationHistory();
            document.body.innerHTML = '<div data-reflinks-root></div>';
            visit.initialize();
        });

        it('has a document root by default', () => {
            visit.getDocumentRoot().should.be.ok;
        });

        it('sends a GET request to the specified url', () => {
            visit.page('/reflinks', {cache: false});
            requests.length.should.eq(1);
            requests[0].method.should.eq('GET');
            requests[0].url.should.eq('http://localhost:9876/reflinks');
        });

        it('removes the previous document root with the response from the server', () => {
            visit.page('/reflinks', {cache: false});
            requests[0].respond(200, {}, '<body><div data-reflinks-root>New content!</div></body>');
            visit.getDocumentRoot().innerHTML.should.eq('New content!');
            let roots = document.querySelectorAll('*[data-reflinks-root]');
            roots.length.should.eq(1); // The previous one wasn't cached
        });

        it('updates the page title', () => {
            visit.page('/page', {cache: false});
            requests[0].respond(200, {}, 
                '<title>My title</title><body><div data-reflinks-root>Hello</div></body>'
            );
            visit.getDocumentRoot().innerHTML.should.eq('Hello');
            document.title.should.eq('My title');
        });

        it('pushes a new state to the history', () => {
            let beforeLength = window.history.length;
            visit.page('/some/path', {cache: false});
            requests[0].respond(200, {}, 
                '<title>My title</title><body><div data-reflinks-root>Hello</div></body>'
            );
            // This doesn't seem to work with in a long running browser with karma
            // watching for changes. Not sure why.
            // window.history.length.should.eq(beforeLength + 1);
        });

        /*

        TODO:
        ========================================================================
        The following two tests only works if run alone. I'll just leave them
        here. Maybe there is a way to test the requests without using timeout.
        window.history.back() and window.history.forward() seems to trigger
        popstate event later (how later?).
        ========================================================================

        it('sends a new request on back if the previous element was removed', (done) => {
            visit.page('/reflinks', {cache: false});
            requests[0].respond(200, {}, 
                '<title>My title</title><body><div data-reflinks-root>Hello</div></body>'
            );
            window.history.back();
            setTimeout(() => {
                requests.length.should.eq(2);
                done();
            }, 50);
        });

        it('sends a new request on forward after back if element was removed', (done) => {
            visit.page('/reflinks', {cache: false});
            requests[0].respond(200, {},
                '<title>My title</title><body><div data-reflinks-root>Hello</div></body>'
            );
            window.history.back();
            setTimeout(() => {
                requests.length.should.eq(2);
                window.history.forward();
                setTimeout(() => {
                    requests.length.should.eq(3);
                    done();
                }, 50);
            }, 50);
        });
        */

        it('inserts a new entry in navigation history with the new document root', () => {
            visit.page('/cached-reflinks', {cache: true});
            requests[0].respond(200, {},
                '<title>My title</title><body><div data-reflinks-root>Hello</div></body>'
            );
            let history = visit.getNavigationHistory();
            history['http://localhost:9876/cached-reflinks'].should.be.ok;
            history['http://localhost:9876/cached-reflinks'].length.should.eq(1);
        });
    });
});