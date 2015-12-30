import * as visit from '../src/visit';
import * as navigation from '../src/navigation';
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

    /*
    describe('.cacheCurrent', () => {
        beforeEach(() => {
            navigation.clearNavigationHistory();
            document.body.innerHTML = '<div data-reflinks-root></div>';
            navigation.initializeHistory();
        });

        it('adds the data-cached property to the current root', () => {
            navigation.cacheCurrent();
            navigation.getDocumentRoot().hasAttribute('data-cached').should.be.true;
            navigation.getDocumentRoot().getAttribute('data-cached').length.should.be.at.least(5);
        });
    });
    */

    describe('.page', () => {
        // TODO: initializeHistory should find the documentRoot 
        beforeEach(() => {
            navigation.clearNavigationHistory();
            document.body.innerHTML = '<div data-reflinks-root></div>';
            navigation.initializeHistory();
        });

        it('has a document root by default', () => {
            navigation.getDocumentRoot().should.be.ok;
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
            navigation.getDocumentRoot().innerHTML.should.eq('New content!');
            let roots = document.querySelectorAll('*[data-reflinks-root]');
            roots.length.should.eq(1); // The previous one wasn't cached
        });

        it('updates the page title', () => {
            visit.page('/page', {cache: false});
            requests[0].respond(200, {}, 
                '<title>My title</title><body><div data-reflinks-root>Hello</div></body>'
            );
            navigation.getDocumentRoot().innerHTML.should.eq('Hello');
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
            window.history.length.should.eq(beforeLength + 1);
        });

        /*

        TODO:
        ========================================================================
        The following two tests only works if run alone. I'll just leave them
        here. Maybe there is a way to test the requests without using timeout.
        window.navigation.back() and window.navigation.forward() seems to trigger
        popstate event later (how later?).
        ========================================================================

        it('sends a new request on back if the previous element was removed', (done) => {
            visit.page('/reflinks', {cache: false});
            requests[0].respond(200, {}, 
                '<title>My title</title><body><div data-reflinks-root>Hello</div></body>'
            );
            window.navigation.back();
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
            window.navigation.back();
            setTimeout(() => {
                requests.length.should.eq(2);
                window.navigation.forward();
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
            let pages = navigation.getHistory();
            pages['http://localhost:9876/cached-reflinks'].should.be.ok;
            pages['http://localhost:9876/cached-reflinks'].length.should.eq(1);
        });
    });
});