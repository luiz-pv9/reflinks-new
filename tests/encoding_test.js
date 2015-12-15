import * as lib from '../src/encoding';
let should = require('chai').should();

describe('encoding specs', () => {
    describe('.encodeQueryStringToFlatJson', () => {
        it('encodes all values as strings', () => {
            let obj = lib.encodeQueryStringToFlatJson('name=foo&age=20&switch=on');
            obj.should.eql({
                'name': 'foo',
                'age': '20',
                'switch': 'on'
            });
        });

        it('encodes empty values as empty strings', () => {
            let obj = lib.encodeQueryStringToFlatJson('name=foo&color=');
            obj.should.eql({
                'name': 'foo',
                'color': ''
            });
        });

        it('encodes keys in brackets in the root object', () => {
            let obj = lib.encodeQueryStringToFlatJson('card[name]=foo&card[age]=10');
            obj.should.eql({
                'card[name]': 'foo',
                'card[age]': '10'
            });
        });

        it('encodes multiple values for the same key as an array', () => {
            let obj = lib.encodeQueryStringToFlatJson('color=red&color=blue');
            obj.should.eql({
                'color': ['red', 'blue']
            });
        });

        it('ignores bad format key-value', () => {
            let obj = lib.encodeQueryStringToFlatJson('color=red&namefoo&age=10');
            obj.should.eql({
                'color': 'red',
                'age': '10'
            });
        });

        it('encodes array with three or more elements', () => {
            let obj = lib.encodeQueryStringToFlatJson('color=red&color=blue&color=green');
            obj.should.eql({
                'color': ['red', 'blue', 'green']
            });
        });
    });

    describe('.encodeQueryStringToNestedJson', () => {
        it('encodes all values as strings', () => {
            let obj = lib.encodeQueryStringToNestedJson('name=foo&age=20&switch=on');
            obj.should.eql({
                'name': 'foo',
                'age': '20',
                'switch': 'on'
            });
        });

        it('encodes empty values as empty strings', () => {
            let obj = lib.encodeQueryStringToNestedJson('name=foo&color=');
            obj.should.eql({
                'name': 'foo',
                'color': ''
            });
        });

        it('encodes brackets properties in nested json object', () => {
            let obj = lib.encodeQueryStringToNestedJson('card[name]=foo&card[age]=10');
            obj.should.eql({
                'card': {
                    'name': 'foo',
                    'age': '10'
                }
            });
        });

        it('encodes multiple values for the same key as an array', () => {
            let obj = lib.encodeQueryStringToNestedJson('color=red&color=blue');
            obj.should.eql({
                'color': ['red', 'blue']
            });
        });

        it('ignores bad format key-value', () => {
            let obj = lib.encodeQueryStringToNestedJson('color=red&namefoo&age=10');
            obj.should.eql({
                'color': 'red',
                'age': '10'
            });
        });

        it('encodes nested object values', () => {
            let obj = lib.encodeQueryStringToNestedJson('post[author][name]=Luiz');
            obj.should.eql({
                post: {
                    author: {
                        name: 'Luiz'
                    }
                }
            });
        });

        it('encodes multiple values with three or more itens', () => {
            let obj = lib.encodeQueryStringToNestedJson('a[b]=10&a[b]=20&a[b]=30');
            obj.should.eql({
                a: { b: ['10', '20', '30'] }
            });
        });
    });

    describe('.encodeJsonToQueryString', () => {
        it('encodes objects with simple values', () => {
            let queryString = lib.encodeJsonToQueryString({foo: 'bar', trum: 'qux'});
            queryString.should.eql('foo=bar&trum=qux');
        });

        it('encodes nested objects with brackets', () => {
            let qs = lib.encodeJsonToQueryString({post: {title: 'foo', views: 20}});
            qs.should.eql('post[title]=foo&post[views]=20');
        });

        it('encodes deeply nested objects with brackets', () => {
            let qs = lib.encodeJsonToQueryString({post: {author: {name: 'Luiz'}}});
            qs.should.eql('post[author][name]=Luiz');
        });

        it('encodes array values', () => {
            let qs = lib.encodeJsonToQueryString({colors: ['red', 'green']});
            qs.should.eql('colors[0]=red&colors[1]=green');
        });

        it('encodes array values inside objects', () => {
            let qs = lib.encodeJsonToQueryString({post: {options: ['green', 'blue']}});
            qs.should.eql('post[options][0]=green&post[options][1]=blue');
        });
    });
});