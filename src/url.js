import {encodeQueryStringToFlatJson, encodeQueryStringToNestedJson} from './encoding';

export default class Url {

    /*
    ** Initializes internal attributes with the specified url. The url might be
    ** a string, document.location object or another instance of Url.
    ** - If no protocol is provided, the current protocol is used.
    ** - If no domain is provided, the current domain is used.
    ** - If no path is provided, "/" is used.
    ** - If no port is provided, 80 is used.
    */
    constructor(url) {
        if(url instanceof Url) {
            this.copyFromUrl(url);
        } else if(url && url.path && url.pathname) {
            this.copyFromLocation(url);
        } else if('string' === typeof url) {
            this.initializeFromString(url);
        } else {
            console.error("invalid url: " + url);
        }
    }

    /*
    ** Called by the constructor when the specified argument is an instance of
    ** the Url class. All values are copied from the other url.
    */
    copyFromUrl(url) {
        this.domain = url.domain;
        this.path = url.path;
        this.port = url.port;
        this.protocol = url.protocol;
        this.query = url.query;
        this.hash = url.hash;
    }

    /*
    ** Called by the constructor when the specified argument is of the type
    ** document.location. All values are copied from the specified location.
    */
    copyFromLocation(location) {
        this.domain = location.host;
        this.path = location.pathname;
        this.protocol = location.protocol.replace(':', '');
        this.port = location.protocol.port;
        this.query = location.search;
        this.hash = location.hash;
    }

    /*
    ** Called by the constructor when the specified argument is a string.
    */
    initializeFromString(url) {
        let regex = /(file|http[s]?:\/\/)?([^\/?#]*)?([^?#]*)([^#]*)([\s\S]*)/i;
        let matches = url.match(regex);
        if(matches) {
            this.protocol = (matches[1] || '').replace('://', '');
            this.domain = matches[2] || '';
            this.path = matches[3];
            this.query = matches[4];
            this.hash = matches[5];
            this.port = '';
            if(this.domain.indexOf(':') !== -1) {
                let index = this.domain.indexOf(':');
                this.port = this.domain.substring(index+1, this.domain.length);
                this.domain = this.domain.substring(0, index);
            }
        } else {
            console.error('invalid url: ' + url);
        }
    }

    /*
    ** Returns a hash map that maps from key -> value for each query parameter
    ** in the Url. For example: '?name=foo&age=10' would result in the map:
    ** { 'name': 'foo', 'age': '10' }. All values are treated as strings.
    **
    ** The 'nested' argument tells if the parameters should be parsed flat or
    ** nested. For example: '?post[name]=foo' would result in the nested map
    ** { 'post': { 'name': 'foo' } } or flat { 'post[name]': 'foo' } depending
    ** if the specified nested argument is true or false.
    */
    queryObject(nested) {
        return nested ? encodeQueryStringToNestedJson(this.query) : 
                        encodeQueryStringToFlatJson(this.query);
    }
}