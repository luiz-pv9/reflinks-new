const EventEmitter = require('events');

/*
** The Request class is responsible for 
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