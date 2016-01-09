import * as visit from '../src/visit';
import * as navigation from '../src/navigation';
import Url from '../src/url';
import {stringToElements, removeElement} from '../src/utils';

describe('visit specs', () => {
    let xhr, requests;

    beforeEach(() => {
        xhr = sinon.useFakeXMLHttpRequest();
        xhr.onCreate = (req) => {
            requests.push(req);
        }
        requests = [];
    });


    describe('.page - document root not cached', () => {
        let root;
        beforeEach(() => {
            navigation.clearHistory();
            root = stringToElements(
                '<div>' +
                    '<div data-reflinks-root></div>' +
                '</div>'
            )[0];
            document.body.appendChild(root);
            navigation.initializeHistory();
        });

        afterEach(() => {
            removeElement(root);
        });

        it('has a document root', () => {
            navigation.getDocumentRoot().should.be.ok;
        });

        it('sends a GET request to the specified url', () => {
            visit.page('/reflinks', {cache: false});
            requests.length.should.eq(1);
            requests[0].method.should.eq('GET');
            requests[0].url.should.eq('http://localhost:9876/reflinks');
        });

        it('updates the page title', () => {
            visit.page('/page', {cache: false});
            requests[0].respond(200, {}, 
                '<title>My title</title><body><div data-reflinks-root>Hello</div></body>'
            );
            document.title.should.eq('My title');
        });

        it('removes the previous document root with the response from the server', () => {
            visit.page('/reflinks', {cache: false});
            requests[0].respond(200, {}, '<body><div data-reflinks-root>New content!</div></body>');
            navigation.getDocumentRoot().innerHTML.should.eq('New content!');
            let roots = document.querySelectorAll('*[data-reflinks-root]');
            roots.length.should.eq(1); // The previous one wasn't cached
        });

        it('pushes a new state to the history', () => {
            let beforeLength = window.history.length;
            visit.page('/some/path', {cache: false});
            requests[0].respond(200, {}, 
                '<title>My title</title><body><div data-reflinks-root>Hello</div></body>'
            );
            window.history.length.should.eq(beforeLength + 1);
        });

        it('inserts a new entry in navigation history with the new document root', () => {
            let url = new Url('/cached-reflinks').toString();
            visit.page(url, {cache: true});
            requests[0].respond(200, {},
                '<title>My title</title><body><div data-reflinks-root>Hello</div></body>'
            );
            let pages = navigation.getHistory();
            pages[url].should.be.ok;
            pages[url].should.eql([navigation.getDocumentRoot()]);
        });
    });

    describe('.page - cached documnet root', () => {
        let root;
        beforeEach(() => {
            window.history.pushState(null, null, "/reset");
            root = stringToElements(
                '<div>' +
                    '<div id="first" data-reflinks-root>First</div>' +
                '</div>'
            )[0];
            navigation.clearHistory();
            document.body.appendChild(root);
            navigation.initializeHistory({cache: true}); // Caching...
        });

        afterEach(() => {
            removeElement(root);
        });

        it('keeps the previous document root in the body', () => {
            visit.page('/test', { cache: false });
            requests[0].respond(200, {}, '<body><div data-reflinks-root>Second</div></body>');
            let docRoots = document.querySelectorAll('[data-reflinks-root]');
            docRoots.should.have.length(2);
        });

        it('removes data-active from the previous document root', () => {
            visit.page('/test', { cache: false });
            requests[0].respond(200, {},
                '<body><div data-reflinks-root>Second</div></body>');
            let previous = root.querySelector('[id="first"]');
            previous.hasAttribute('data-active').should.be.false;
        });

        it('keeps history entry for the previous doument root', () => {
            visit.page('/test', { cache: false });
            requests[0].respond(200, {},
                '<body><div data-reflinks-root>Second</div></body>');
            let history = navigation.getHistory();
            Object.keys(history).should.have.length(1);
            let url = Object.keys(history)[0];
            history[url].should.eql([root.querySelector('[id="first"]')]);
        });

        it('adds data-active to the current document root', () => {
            visit.page('/test', { cache: false });
            requests[0].respond(200, {},
                '<body><div id="second" data-reflinks-root>Second</div></body>');
            let current = root.querySelector('[id="second"]');
            current.hasAttribute('data-active').should.be.true;
            navigation.getDocumentRoot().should.eql(current);
        });

        it('adds a history entry if cached', () => {
            let url = new Url('/test').toString();
            visit.page('/test', { cache: true });
            requests[0].respond(200, {},
                '<body><div id="second" data-reflinks-root>Second</div></body>');
            let current = root.querySelector('[id="second"]');
            let history = navigation.getHistory();
            Object.keys(history).should.have.length(2);
            history[url].should.eql([current]);
        });

        it('adds data-cached to the current document root if specified', () => {
            visit.page('/test', { cache: true });
            requests[0].respond(200, {},
                '<body><div id="second" data-reflinks-root>Second</div></body>');
            let current = root.querySelector('[id="second"]');
            current.hasAttribute('data-cached').should.be.true;
        });
    });
});
