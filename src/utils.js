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