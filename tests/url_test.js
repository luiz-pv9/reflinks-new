import Url from '../src/url';
let should = require('chai').should();

describe('url specs', () => {
    it('is a class', () => {
        let dixte = new Url('dixte.com');
        dixte.should.be.an.Object;
    });

    describe('constructor - string', () => {
        it('identifies from a string with all data', () => {
            let dixte = new Url('https://dixte.com:8000/my/path?name=foo#bar');
            dixte.should.be.an.Object;
            dixte.protocol.should.eq('https');
            dixte.domain.should.eq('dixte.com');
            dixte.port.should.eq('8000');
            dixte.path.should.eq('/my/path');
            dixte.query.should.eq('?name=foo');
            dixte.hash.should.eq('#bar');
        });

        it('identifies from a string without port', () => {
            let dixte = new Url('https://dixte.com/my/path?name=foo#bar');
            dixte.should.be.an.Object;
            dixte.protocol.should.eq('https');
            dixte.domain.should.eq('dixte.com');
            dixte.port.should.eq('');
            dixte.path.should.eq('/my/path');
            dixte.query.should.eq('?name=foo');
            dixte.hash.should.eq('#bar');
        });

        it('identifies from a string without port, hash', () => {
            let dixte = new Url('https://dixte.com/my/path?name=foo');
            dixte.should.be.an.Object;
            dixte.protocol.should.eq('https');
            dixte.domain.should.eq('dixte.com');
            dixte.port.should.eq('');
            dixte.path.should.eq('/my/path');
            dixte.query.should.eq('?name=foo');
            dixte.hash.should.eq('');
        });

        it('identifies from a string without port, hash, query', () => {
            let dixte = new Url('https://dixte.com/my/path');
            dixte.should.be.an.Object;
            dixte.protocol.should.eq('https');
            dixte.domain.should.eq('dixte.com');
            dixte.port.should.eq('');
            dixte.path.should.eq('/my/path');
            dixte.query.should.eq('');
            dixte.hash.should.eq('');
        });

        it('identifies from a string without port, hash, query, path', () => {
            let dixte = new Url('https://dixte.com');
            dixte.should.be.an.Object;
            dixte.protocol.should.eq('https');
            dixte.domain.should.eq('dixte.com');
            dixte.port.should.eq('');
            dixte.path.should.eq('');
            dixte.query.should.eq('');
            dixte.hash.should.eq('');
        });

        it('identifies from a string without port, hash, query, path, protocol', () => {
            let dixte = new Url('dixte.com');
            dixte.should.be.an.Object;
            dixte.protocol.should.eq('');
            dixte.domain.should.eq('dixte.com');
            dixte.port.should.eq('');
            dixte.path.should.eq('');
            dixte.query.should.eq('');
            dixte.hash.should.eq('');
        });

        it('identifies from a string without port, domain, hash, query, protocol', () => {
            let dixte = new Url('/posts/10');
            dixte.should.be.an.Object;
            dixte.protocol.should.eq('');
            dixte.domain.should.eq('');
            dixte.port.should.eq('');
            dixte.path.should.eq('/posts/10');
            dixte.query.should.eq('');
            dixte.hash.should.eq('');
        });

        it('identifies from a string without port, domain, hash, protocol', () => {
            let dixte = new Url('/posts/10?view=column');
            dixte.should.be.an.Object;
            dixte.protocol.should.eq('');
            dixte.domain.should.eq('');
            dixte.port.should.eq('');
            dixte.path.should.eq('/posts/10');
            dixte.query.should.eq('?view=column');
            dixte.hash.should.eq('');
        });
    });

    describe('.queryObject', () => {
        it('returns a map from a single query', () => {
            let dixte = new Url('/posts?search=cat');
            dixte.queryObject().should.eql({'search': 'cat'});
        })

        it('returns a map from multiple params', () => {
            let dixte = new Url('/posts?search=cat&type=feline');
            dixte.queryObject().should.eql({
                'search': 'cat',
                'type': 'feline'
            });
        });

        it('returns a map from an array of values', () => {
            let dixte = new Url('/posts?color=red&color=blue&size[]=small&size[]=big');
            dixte.queryObject().should.eql({
                'color': ['red', 'blue'],
                'size[]': ['small', 'big']
            });
        });

        it('returns a map from nested values', () => {
            let dixte = new Url('/posts?post[name]=foo&post[title]=bar');
            dixte.queryObject().should.eql({
                'post[name]': 'foo',
                'post[title]': 'bar'
            });

            dixte.queryObject(true).should.eql({
                'post': {
                    'name': 'foo',
                    'title': 'bar'
                }
            });
        });

        it('returns deep nested maps', () => {
            let dixte = new Url('/posts?post[name]=foo&post[details][type]=public');
            dixte.queryObject(true).should.eql({
                'post': {
                    'name': 'foo',
                    'details': {
                        'type': 'public'
                    }
                }
            });
        });

        it('returns nested maps with array values', () => {
            let dixte = new Url('/posts?post[color]=red&post[color]=blue');
            dixte.queryObject().should.eql({
                'post[color]': ['red', 'blue']
            });
            dixte.queryObject(true).should.eql({
                'post': {
                    'color': ['red', 'blue']
                }
            });
        });
    });

    describe('.setQueryObject', () => {
        it('overrides the previous query with the specified one', () => {
            let url = new Url('reflinks.com?param=one');
            url.setQueryObject({param: 'two'});
            url.query.should.eql("?param=two");
        });

        it('encodes nested properties', () => {
            let url = new Url('reflinks.com');
            url.setQueryObject({post: {author: {name: 'Luiz'}}});
            url.query.should.eql('?post[author][name]=Luiz');
        });
    });

    describe('.toString', () => {
        it('returns the url with with the curren protocol if none is specified', () => {
            let url = new Url('www.reflinks.com/path');
            url.toString().should.eql("http://www.reflinks.com/path");
        });

        it('returns the url with hash content', () => {
            let url = new Url('www.reflinks.com/path#target')
            url.toString().should.eql("http://www.reflinks.com/path#target");
        });

        it('returns the current domain if none is specified',() => {
            let url = new Url('/users/10?foo=bar');
            url.toString().should.eql('http://localhost:9876/users/10?foo=bar');
        });
    });
});
