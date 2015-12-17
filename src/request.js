import EventEmitter from 'events';
import CSRF from './csrf';
import * as utils from './utils';

/*
** 
*/
const defaultSendOptions = {
    headers: {},
}

/*
** The Request class is responsible for sending HTTP requests and managing
** events from the life cycle. It is possible to send multiple requests at
** the same time (e.g. loading multiple targets).
*/
export default class Request extends EventEmitter {

    /*
    ** 
    */
    constructor(method, url) {
        super();
        this.method = method;
        this.url = url.toString();
    }

    /*
    ** Instantiates a new XmlHttpRequests and sends the AJAX request. This
    ** instance of Request will trigger events as the xhr changes.
    */
    send(options) {
        options = utils.mergeObjects(options, defaultSendOptions);
        let xhr = new XMLHttpRequest();
        xhr.open(this.method, this.url, true);
        xhr.setRequestHeader('Accept', 'text/html, application/xhtml+xml, application/xml');
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        xhr.setRequestHeader('X-CSRF-TOKEN', CSRF.value());
        xhr.setRequestHeader('X-REFLINKS', true);
    }
}

/*
** Helper function to create a new request instance with 'GET' HTTP method.
*/
Request.get = (url) => {
    return new Request('GET', url);
}

/*
** Helper function to create a new request instance with 'POST' HTTP method.
*/
Request.post = (url) => {
    return new Request('POST', url);
}

/*
** Helper function to create a new request instance with 'PUT' HTTP method.
*/
Request.put = (url) => {
    return new Request('PUT', url);
}

/*
** Helper function to create a new request instance with 'DELETE' HTTP method.
*/
Request.delete = (url) => {
    return new Request('DELETE', url);
}