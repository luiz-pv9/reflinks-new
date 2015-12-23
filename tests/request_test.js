import {Request, setRequestTimeout} from '../src/request';

describe('Request specs', () => {
    let xhr, requests;

    beforeEach(() => {
        xhr = sinon.useFakeXMLHttpRequest();
        xhr.onCreate = (req) => {
            requests.push(req);
        }
        requests = [];
    });

    it('is a class', () => {
        Request.should.be.a.function;
    });

    it('sends a get request with correct method, url and headers', () => {
        let simpleReq = new Request('GET', 'http://reflinks.com');
        simpleReq.send();
        requests.length.should.eq(1);
        let req = requests[0];
        req.method.should.eq('GET');
        req.url.should.eq('http://reflinks.com');
        req.requestHeaders['Accept'].should.eq('text/html, application/xhtml+xml, application/xml');
        req.requestHeaders['Content-type'].should.eq('application/x-www-form-urlencoded');
        req.requestHeaders['X-CSRF-TOKEN'].should.eq('');
        req.requestHeaders['X-REFLINKS'].should.eq('true');
    });

    it('triggers the success event when the server responds with 200', () => {
        let req = new Request('GET', 'http://reflinks.com');
        let onSuccess = sinon.spy();
        let onError = sinon.spy();
        let onRedirect = sinon.spy();

        req.on('success', onSuccess);
        req.on('error', onError);
        req.on('redirect', onRedirect);
        req.send();

        requests[0].respond(200, {}, '<h1>Hello</h1>');
        onSuccess.called.should.be.true;
        onError.called.should.be.false;
        onRedirect.called.should.be.false;
    });

    it('triggers the error event when the server responds with != 200/280', () => {
        let req = new Request('GET', 'http://reflinks.com');
        let onSuccess = sinon.spy();
        let onError = sinon.spy();
        let onRedirect = sinon.spy();

        req.on('success', onSuccess);
        req.on('error', onError);
        req.on('redirect', onRedirect);
        req.send();

        requests[0].respond(404, {}, '');
        onSuccess.called.should.be.false;
        onError.called.should.be.true;
        onRedirect.called.should.be.false;
    });

    it('triggers the redirect event when the server responds with 280', () => {
        let req = new Request('GET', 'http://reflinks.com');
        let onSuccess = sinon.spy();
        let onError = sinon.spy();
        let onRedirect = sinon.spy();

        req.on('success', onSuccess);
        req.on('error', onError);
        req.on('redirect', onRedirect);
        req.send();

        requests[0].respond(280, {}, '<h1>Hello</h1>');
        onSuccess.called.should.be.false;
        onError.called.should.be.false;
        onRedirect.called.should.be.true;
    });

    it('has helper methods for get, post, put and delete http methods', () => {
        let getReq = Request.get("reflinks.com");
        let postReq = Request.post("reflinks.com");
        let putReq = Request.put("reflinks.com");
        let deleteReq = Request.delete("reflinks.com");

        requests.length.should.eq(4);
        requests[0].method.should.eq("GET");
        requests[1].method.should.eq("POST");
        requests[2].method.should.eq("PUT");
        requests[3].method.should.eq("DELETE");
    });

    it('calls the timeout event if timedout', (done) => {
        setRequestTimeout(5);
        let simpleReq = Request.get('reflinks.com').send();
        let onTimeout = sinon.spy();
        simpleReq.on('timeout', onTimeout);
        setTimeout(() => {
            onTimeout.called.should.be.true;
            done();
        }, 5);
    });

    it('aborts the request if abortIfTimeout is set to true', (done) => {
        setRequestTimeout(5);
        let simpleReq = Request.get('reflinks.com', {abortIfTimeout: true});
        let onTimeout = sinon.spy();
        simpleReq.on('timeout', onTimeout);
        setTimeout(() => {
            onTimeout.called.should.be.true;
            requests[0].aborted.should.be.true;
            done();
        }, 6);
    });

    it('sets custom headers in the options', () => {
        let req = Request.get('reflinks.com', {
            headers: {'FOO-HEADER': 'BAR'}
        });
        requests[0].requestHeaders['FOO-HEADER'].should.eq('BAR');
    });
});