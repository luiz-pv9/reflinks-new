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

    describe('.page - cache limit', () => {
        let root;
        beforeEach(() => {
            navigation.clearHistory();
            window.history.pushState(null, null, '/reset');
            root = stringToElements(
                '<div>' +
                    '<div id="first" data-reflinks-root></div>' +
                '</div>'
            )[0];
            document.body.appendChild(root);
            navigation.initializeHistory({cache: true});
            visit.page('/second', { cache: true });
            requests[0].respond(200, {},
                '<body><div id="second" data-reflinks-root></div></body>');
            Object.keys(navigation.getHistory()).should.have.length(2);
        });

        afterEach(() => {
            removeElement(root);
        });

        it('removes the oldest entry from the history', () => {
            let history = navigation.getHistory();

            // We should start with 2 entries in the history.
            Object.keys(history).should.have.length(2);

            // Set cache limit to 2 pages
            navigation.setCacheLimit(2);

            // Visit a new page and respond with a new document root
            visit.page('/third', { cache: true });
            requests[1].respond(200, {},
                '<body><div id="third" data-reflinks-root></div></body>');

            // Assert that:
            // * The history has only two elements.
            Object.keys(history).should.have.length(2);

            // * There is an entry for /second
            let secondUrl = new Url('/second').toString();
            history.should.have.property(secondUrl);

            // * There is an entry for /third
            let thirdUrl = new Url('/third').toString();
            history.should.have.property(thirdUrl);
        });

        it('removes the element associated with the oldest entry', () => {
            // Set cache limit to 2 pages
            navigation.setCacheLimit(2);

            // Visit a new page and respond with a new document root.
            visit.page('/third', { cache: true });
            requests[1].respond(200, {},
                '<body><div id="third" data-reflinks-root></div></body>');

            // There should only be two document roots in the document
            let docRoots = document.querySelectorAll('[data-reflinks-root]');
            docRoots.should.have.length(2);

            // One of them has id="second"
            docRoots[0].id.should.eql('second');

            // The other one has id="third"
            docRoots[1].id.should.eql('third');
        });
    });

    describe('target - without cache', () => {
        let root, post, url;

        beforeEach(() => {
            navigation.clearHistory();
            window.history.pushState(null, null, '/reset');
            root = stringToElements(
                '<div data-reflinks-root>' +
                    '<div data-view="post">' +
                        '<div id="first" data-view="comment"></div>' +
                    '</div>' +
                '</div>'
            )[0];
            document.body.appendChild(root);
            navigation.initializeHistory();
            post = root.querySelector('[data-view="post"]');
            url = new Url('/other-comment').toString();
            visit.target(url, post, "comment", { cache: true });
            requests[0].respond(200, {},
                '<body><div id="second" data-view="comment"></div></body>');
        });

        afterEach(() => {
            removeElement(root);
        });

        it('adds X-TARGET in the request header', () => {
            requests[0].should.be.ok;
            requests[0].requestHeaders.should.have.property('X-TARGET');
            requests[0].requestHeaders['X-TARGET'].should.eql('comment');
        });

        it('keeps data-active to the parent document root', () => {
            root.hasAttribute('data-active').should.be.true;
        });

        it('keeps data-active to the parent view', () => {
            post.hasAttribute('data-active').should.be.true;
        });

        it('adds the view from the request in the given element', () => {
            let second = post.querySelector('[id="second"]');
            second.getAttribute('data-view').should.eql("comment");
        });

        it('adds data-active to the new view', () => {
            let second = post.querySelector('[id="second"]');
            second.hasAttribute('data-active').should.be.true;
        });

        it('removes the sibling view', () => {
            let first = post.querySelector('[id="first"]');
            expect(first).to.be.null;
        });

        it('adds data-cached to the view', () => {
            let second = post.querySelector('[id="second"]');
            second.hasAttribute('data-cached').should.be.true;
        });

        it('adds an entry to the history', () => {
            let second = post.querySelector('[id="second"]');
            let history = navigation.getHistory();
            history.should.have.property(url);
            history[url].should.eql([root, post, second]);
        });
    });

    describe('target - cached views', () => {
        let root, post, url;

        beforeEach(() => {
            navigation.clearHistory();
            window.history.pushState(null, null, '/reset');
            root = stringToElements(
                '<div data-reflinks-root>' +
                    '<div data-view="post">' +
                        '<div id="first" data-view="comment"></div>' +
                    '</div>' +
                '</div>'
            )[0];
            document.body.appendChild(root);
            navigation.initializeHistory({ cache: true });
            post = root.querySelector('[data-view="post"]');
            url = new Url('/second').toString();
            visit.target(url, post, "comment", { cache: true });
            requests[0].respond(200, {},
                '<body><div id="second" data-view="comment"></div></body>');
        });

        afterEach(() => {
            removeElement(root);
        });

        it('keeps the parents data-active attribute', () => {
            root.hasAttribute('data-active').should.be.true;
            post.hasAttribute('data-active').should.be.true;
        });

        it('hides the sibling view and removes data-active', () => {
            let first = post.querySelector('[id="first"]');
            first.style.display.should.eql('none');
            first.hasAttribute('data-active').should.be.false;
        });

        it('adds data-active to the new target', () => {
            let second = post.querySelector('[id="second"]');
            second.hasAttribute('data-active').should.be.true;
        });

        it('adds the new entry to history', () => {
            let second = post.querySelector('[id="second"]');
            let history = navigation.getHistory();
            history[url].should.eql([root, post, second]);
        });

        it('keeps the old view in the history', () => {
        });
    });

    describe('target - without target element', () => {
        it('doesnt add X-TARGET header');
        it('tries to match document-root by id');
        it('throws an error if the response doesnt have an id');
        it('inserts the view inside the existing matching document-root by id');
    });

    describe('target - without target element nested view', () => {
        it('inserts to match parent view by id');
        it('throws an error if couldnt find parent view');
    });

    describe('target - response without view', () => {
        it('adds data-view to the top most element');
        it('inserts the elements inside a div if the body contain multiple elements');
    });

    describe('target - cache limit', () => {
    });
});
