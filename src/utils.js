/*
** Copies the properties in the first and second object to a third object. The
** specified objects are not modified. If both objects have the same key, the
** value from the first object will override the second.
*/
export function mergeObjects(first, secnd) {
    let merged = {};
    for(var attr in secnd) { merged[attr] = secnd[attr]; }
    for(var attr in first) { merged[attr] = first[attr]; }
    return merged;
}

/*
** Creates a new in-memory DOM elements from the specified html.
*/
export function stringToElements(html) {
    let div = document.createElement('div');
    div.innerHTML = html;
    return div.childNodes;
}

/*
** Returns true if the specified argument is a DOM element and false if not.
** Extract from underscore's isElement function.
*/
export function isElement(arg) {
    return !!(arg && arg.nodeType === 1);
}

/*
** Returns true if the specified argument is a string and false if not.
*/
export function isString(arg) {
    return '[object String]' === Object.prototype.toString.call(arg);
}

/*
** Returns the content inside the body tag in the specified html snippet. An
** empty string is returned if the body couldn't be found.
*/
export function extractBody(html) {
    let matches = /<body[\s\S]*?>([\s\S]*?)<\/body>/i.exec(html);
    if(matches && matches[1]) {
        return matches[1];
    }
    return "";
}

/*
** Iterates through the specified elements trying to find by the attribute.
*/
export function findElementByAttribute(elements, attribute, value) {
    for(let i = 0, len = elements.length; i < len; i++) {
        let elm = elements[i];
        if(elm.hasAttribute && elm.hasAttribute(attribute)) {
            if(value) {
                if(elm.getAttribute(attribute) === value) {
                    return elm;
                }
            } else {
                return elm;
            }
        }
        if(elm.querySelector) {
            let selector;
            if(value) {
                selector = '*['+attribute+'="'+value+'"]';
            } else {
                selector = '*['+attribute+']';
            }
            let found = elm.querySelector(selector);
            if(found) return found;
        }
    }
}

/*
** Hides the specified element setting the display property to none. Just that.
*/
export function hideElement(elm) {
    if(elm && elm.style) elm.style.display = 'none';
}

/*
** Receives html snippet the server responded 
*/
export function extractAndUpdateTitle(html) {
    let matches = /<title[\s\S]*?>(.*?)<\/title>/i.exec(html);
    if(matches && matches[1]) {
        document.title = matches[1];
    }
}