import * as cache from '../src/cache'; 
import {stringToElements} from '../src/utils';

describe('cache specs', () => {
    describe('cache function', () => {
        it('returns the cache object', () => {
            let div = stringToElements('<div></div>');
            let cacheRef = cache.set('my-key', div);
            cacheRef.should.be.an.Object;
            cacheRef.timestamp.should.be.at.most(new Date());
            cacheRef.element.should.eq(div);
        });

        it('retreives the cache object with get', () => {
            let div = stringToElements('<div></div>');
            let cacheRef = cache.set('my-key', div);
            cache.get('my-key').should.eql(cacheRef);
        });

        it('overrides the oldest cache if limit is reached', () => {
            cache.setCacheLimit(1);
            let div = stringToElements('<div></div>');
            let cacheRef = cache.set('my-key', div);
            let otherCache = cache.set('other-key', div);
            expect(cache.get('my-key')).to.be.undefined;
        });

        it('overrides the oldest cache if limit is reached with multiple elements', (done) => {
            cache.setCacheLimit(2);
            let div = stringToElements('<div></div>');
            let firstCache = cache.set('first', div);
            setTimeout(function() {
                let secondCache = cache.set('second', div);
                cache.get('first').should.be.ok;
                cache.get('second').should.be.ok;
                let thirdCache = cache.set('third', div);
                expect(cache.get('first')).to.be.undefined;
                cache.get('second').should.be.ok;
                cache.get('third').should.be.ok;
                done();
            }, 5);
        });
    });
});