import Request from '../src/request';

describe('Request specs', () => {
    let xhr, requests = [];

    before(function() {
        xhr = sinon.useFakeXMLHttpRequest();
        xhr.onCreate = (req) => {
            requests.push(req);
        }
    });

    it('is a class', () => {
        Request.should.be.a.function;
    });

    it('sends a get request to the specified url', () => {
        let simple = new Request('GET', 'http://reflinks.com');
        simple.send();
        requests.length.should.eq(1);
    });
});