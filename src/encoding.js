/*
** Receives a query string in the argument and returns a Json object that maps
** from keys to values present in the query. If the same key appears multiple
** times in the query, an array of all values are used. For example:
**
** 'color=blue&color=red' // => { 'color': ['blue', 'red'] }
**
** Nested properties are kept the same way they appear in the query string:
** If you want nested properties see the function encodeQueryStringToNestedJson.
**
** 'person[name]=luiz&person[age]=10' // => { 'person[name]': 'luiz', 'person[age]': '10' }
*/
export function encodeQueryStringToFlatJson(query) {
    if(query === '') return {};
    let parts = query.replace('?', '').split('&');
    let obj = {};
    parts.forEach(function(part) {
        let vals = part.split('=');
        if(vals.length !== 2) return;
        let key = vals[0];
        let value = vals[1];
        if(obj[key]) {
            obj[key] = [obj[key]];
            obj[key].push(value);
        } else {
            obj[key] = value;
        }
    });
    return obj;
}

/*
** Similar to encodeQueryStringToFlatJson but properties described using
** brackets notation are inserted in nested objects. For example, the 
** following queryString: "post[author][name]=Luiz"
** would be encoded as: "{ post: { author: { name: "Luiz" } } }"
*/
export function encodeQueryStringToNestedJson(query) {
    if(query === '') return {};
    let parts = query.replace('?', '').split('&');
    let obj = {};
    parts.forEach((part) => {
        let vals = part.split('=');
        if(vals.length !== 2) return;
        let key = vals[0];
        let value = vals[1];
        let objRef = obj;
        let keyParts = key.split('[').map((keyPart) => {
            return keyPart.replace(']', '');
        });
        keyParts.forEach((keyPart, index) => {
            if(index < keyParts.length - 1) {
                objRef[keyPart] = objRef[keyPart] || {};
                objRef = objRef[keyPart];
            } else {
                key = keyPart;
            }
        });
        if(objRef[key]) {
            objRef[key] = [objRef[key]];
            objRef[key].push(value);
        } else {
            objRef[key] = value;
        }
    });
    return obj;
}

/*
**
*/
export function encodeJsonToQueryString(data) {
    let qs = '';
    let keys = Object.keys(data);

    let valueString = (key, value) => {
        if(Object.prototype.toString.call(value) === '[object Object]') {
            let qs = '';
            let subkeys = Object.keys(value);
            subkeys.forEach((subkey, index) => {
                qs += valueString(key + '[' + subkey + ']', value[subkey]);
                if(index < subkeys.length - 1) qs += '&';
            });
            return qs;
        } else if(Object.prototype.toString.call(value) === '[object Array]') {
            let qs = '';
            value.forEach((item, index) => {
                qs += key + '['+index+']=' + item;
                if(index < value.length - 1) qs += '&'; 
            });
            return qs;
        } else {
            return key + '=' + value;
        }
    };

    keys.forEach(function(key, index) {
        let val = data[key];
        qs += valueString(key, val);
        if(index < keys.length - 1) qs += '&';
    });
    return qs;
}