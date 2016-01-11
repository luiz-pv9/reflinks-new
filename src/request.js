import EventEmitter from 'events';
import CSRF from './csrf';
import * as utils from './utils';

const EVENT_SERVER_ERROR = 'server_error';
const EVENT_REDIRECT     = 'redirect';
const EVENT_UNKNOWN      = 'unknown';
const EVENT_TIMEOUT      = 'timeout';
const EVENT_SUCCESS      = 'success';
const EVENT_ERROR        = 'error';

/*
** Status code the request must respond with in order for Reflinks to identify
** it as a redirect. The status code 280 is defined nas 'Unknown', so it's used
** as default. This is a variable rather than a constant because the user
** can change the status code.
*/
let customRedirectStatus = 280;

/*
** Amount of time (in milliseconds) a request may take before it's considered 
** as timeout.
*/
let requestTimeout = 4000;

/*
** Updates the requestTimeout variable to the specified amount. All requests
** after this funciton call with have `amount` of time before timing out. It
** should be specified in milliseconds.
*/
export function setRequestTimeout(amount) { requestTimeout = amount; }

/*
** Returns the current time for request timeout in milliseconds. 
*/
export function getRequestTimeout() { return requestTimeout; }

/*
** The 'send' function in the Request accept some options. This constant is the
** default values if the user doesn't specify options.
*/
const defaultSendOptions = {
    headers: {},
    body: '',
    withCredentials: true,
    abortIfTimeout: false,
}

/*
** The Request class is responsible for sending HTTP requests and managing
** events from the life cycle. It is possible to send multiple requests at
** the same time (e.g. loading multiple targets).
*/
export class Request extends EventEmitter {

    /*
    ** Constructor of the Request class. It excepts an http method and a url.
    ** The url might be a string or an instance of the Url class.
    */
    constructor(method, url) {
        super();
        this.method = method;
        this.url = url.toString();
        this.xhr = null;
    }

    /*
    ** Instantiates a new XmlHttpRequests and sends the AJAX request. This
    ** instance of Request will emit events as the xhr changes.
    */
    send(options) {
        options = utils.mergeObjects(options, defaultSendOptions);
        let xhr = this.xhr = new XMLHttpRequest();
        xhr.open(this.method, this.url, true);
        xhr.setRequestHeader('Accept', 'text/html, application/xhtml+xml, application/xml');
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        xhr.setRequestHeader('X-CSRF-TOKEN', CSRF.value());
        xhr.setRequestHeader('X-REFLINKS', 'true');

        // user defined custom headers
        Object.keys(options.headers).forEach(key => {
            xhr.setRequestHeader(key, options.headers[key]);
        });

        // withCredentials is a flag that indicates if cookies should be passed
        // with the request.
        xhr.withCredentials = options.withCredentials;

        let xhrTimeout = setTimeout(() => {
            this.emit(EVENT_TIMEOUT);
            if(options.abortIfTimeout) xhr.abort();
        }, requestTimeout);

        xhr.onerror = () => this.emit(EVENT_SERVER_ERROR);
        xhr.onreadystatechange = () => {
            if(xhr.readyState === 4) {
                clearTimeout(xhrTimeout);
                if(xhr.status === 200) {
                    this.emit(EVENT_SUCCESS, xhr.responseText, xhr.status, xhr);
                } else if(xhr.status === customRedirectStatus) {
                    this.emit(EVENT_REDIRECT, xhr.responseText, xhr.status, xhr);
                } else if(xhr.status < 200 || xhr.status >= 300) {
                    // Status 2XX are used for successful responses.
                    this.emit(EVENT_ERROR, xhr.responseText, xhr.status, xhr);
                } else {
                    this.emit(EVENT_UNKNOWN, xhr.responseText, xhr.status, xhr);
                }
            }
        };
        xhr.send(options.body);
        return this;
    }
}

/*
** The 'simple' function accept some options as the third parameter. This value 
** is the default options if the user doesn't specify one.
*/
const defaultSimpleRequestOptions = {
    success:  function() {},
    error:    function() {},
    redirect: function() {},
    timeout:  function() {},
};

/*
** The 'simple' method offers an API for sending AJAX requests with a single
** function call. This function is called by `get`. `post`, `put` and `delete`.
*/
Request.simple = (method, url, options) => {
    options = utils.mergeObjects(options, defaultSimpleRequestOptions);
    let request = new Request(method, url);
    request.on(EVENT_SUCCESS,  options.success);
    request.on(EVENT_ERROR,    options.error);
    request.on(EVENT_REDIRECT, options.redirect);
    request.on(EVENT_TIMEOUT,  options.timeout);
    return request.send(options);
}

/*
** Helper function to create a new request instance with 'GET' HTTP method.
*/
Request.get = Request.GET = (url, options) => {
    return Request.simple('GET', url, options);
}

/*
** Helper function to create a new request instance with 'POST' HTTP method.
*/
Request.post = Request.POST = (url, options) => {
    return Request.simple('POST', url, options);
}

/*
** Helper function to create a new request instance with 'PUT' HTTP method.
*/
Request.put = Request.PUT = (url, options) => {
    return Request.simple('PUT', url, options);
}

/*
** Helper function to create a new request instance with 'DELETE' HTTP method.
*/
Request.delete = Request.DELETE = (url, options) => {
    return Request.simple('DELETE', url, options);
}