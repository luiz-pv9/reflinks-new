const EventEmitter = require('events');

/*
** The Request class is responsible for sending HTTP requests and managing
** events from the life cycle
*/
export default class Request extends EventEmitter {

    /*
    ** 
    */
    constructor(method, url) {
        super();
        this.method = method;
        this.url = url;
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