/*
** Amount of pages that can be cached at the same time. Pages that are cached
** once do not count.
*/
let cacheLimit = 20;

/*
** Overrides the cacheLimit with the specified value. This function should
** ideally be called once when setting up reflinks.
*/
export function setCacheLimit(val) { cacheLimit = val; }

/*
** Refenrece to the element that is the current root view of the page.
*/
let documentRoot = null;

/*
** References to all cached pages. This includes 
*/
let cacheList = [];

/*
** Returns all cache references that are stored once.
*/
function cachedOnce() {
    return cacheList.filter(function(cache) {
        return cache.once;
    });
}

/*
** Returns all cache references that are not stored once.
*/
function cachedResponsive() {
    return cacheList.filter(function(cache) {
        return !cache.once;
    });
}

/*
** Called by the `set` function in case the amount of cached pages overflows
** cacheLimit. This function removes the oldest cache to make room to the
** next one.
*/
function unsetOldest(cacheList) {
    if(!cacheList || !cacheList.length) return;
    cacheList.sort(function(lhs, rhs) {
        return lhs.timestamp > rhs.timestamp;
    });
    return unset(cacheList[0].key);
};

/*
** Removes the cache associated with the specified key. If no cache is found,
** nothing is done.
*/
export function unset(key) {
    for(let i = 0, len = cacheList.length; i < len; i++) {
        if(cacheList[i].key === key) return cacheList.splice(i, 1);
    }
}

/*
** Here is a brief explanation about how caching works in reflinks.
*/
export function set(key, elm) {
    // remove previous instance of the cache.
    unset(key);
    let cached = cachedResponsive();
    if(cached.length >= cacheLimit) { 
        unsetOldest(cached);
    }
    let cache = {
        key: key,
        element: elm,
        timestamp: new Date(),
        once: false,
    };
    cacheList.push(cache);
    return cache;
}

export function get(key) {
    for(let i = 0, len = cacheList.length; i < len; i++) {
        if(cacheList[i].key === key) return cacheList[i];
    }
}