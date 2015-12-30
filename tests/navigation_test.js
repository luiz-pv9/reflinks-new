import * as navigation from '../src/navigation';
import {stringToElements} from '../src/utils';

describe.only('navigation specs', () => {
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
            let div = stringToElements('<div data-reflinks-root></div>');
            div = div[0];
            document.body.appendChild(div);
            expect(navigation.getDocumentRoot()).to.be.null;
            document.body.removeChild(div);
        });

        it('returns the element with both data-reflinks-root and data-active', () => {
            let elm = stringToElements('<div data-reflinks-root data-active></div>');
            elm = elm[0];
            document.body.appendChild(elm);
            navigation.getDocumentRoot().should.eq(elm);
            document.body.removeChild(elm);
        });

        it('returns nested data-view if active', () => {
            let elm = stringToElements(
                '<div data-reflinks-root data-active>' + 
                    '<div data-view="post" data-active></div>' +
                '</div>'
            );
            elm = elm[0];
            document.body.appendChild(elm);
            navigation.getDocumentRoot().getAttribute('data-view').should.eq('post');
            document.body.removeChild(elm);
        });

        it('returns deep nested (two or more) data-view if active', () => {
            let elm = stringToElements(
                '<div data-reflinks-root data-active>' + 
                    '<div data-view="post" data-active>' +
                        '<div data-view="comment" data-active></div>' +
                    '</div>' +
                '</div>'
            );
            elm = elm[0];
            document.body.appendChild(elm);
            navigation.getDocumentRoot().getAttribute('data-view').should.eq('comment');
            document.body.removeChild(elm);
        });
    });

    describe('.initializeHistory', function() {
        it('is a function', () => {
            navigation.initializeHistory.should.be.a.Function;
        });

        it('ignores if no document root can be found', () => {
            navigation.initializeHistory();
            expect(navigation.getDocumentRoot()).to.eq(null);
        });

        it('adds data-active to the document root if present', () => {
            // document.body.innerHTML = '<div data-reflinks-root></div>';
            // navigation.initializeHistory();
            // navigation.getDocumentRoot();
        });

        it('adds the current url to the history if the document root is cached');
        it('adds data-active to nested data-view');
        it('adds data-active to data-view inside data-view (nested two or more)');
    });
});