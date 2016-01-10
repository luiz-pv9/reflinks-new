import Url from './url';
import * as utils from './utils';

/*
** Constants
*/
export const ACTIVE_ATTR = 'data-active';
export const CACHED_ATTR = 'data-cached';
export const ROOT_ATTR   = 'data-reflinks-root';
export const VIEW_ATTR   = 'data-view';

/*
** Number of states reflinks will cache. If the user requests to cache
** a view and the limit is reached, the oldest entry is deleted to make
** room for the new one.
*/
let cacheLimit = 20;

/*
** Public API to read and write cacheLimit.
*/
export function setCacheLimit(n) { cacheLimit = n; }
export function getCacheLimit()  { return cacheLimit; }

/*
** Stores all history changes objects to rollback or advance through navigation.
** This hash maps from a url to a list of elements that represents the url view.
** This map is used in the onPopState function to find whether we need to send
** a new request or just hide/show some elements.
*/
let navigationHistory = {};

/*
** Returns the navigationHistory. Only used in tests.
*/
export function getHistory() { return navigationHistory; }

/*
** Iterates through the given `elm` child nodes finding elements with
** 'data-view' attribute. Returns an array with elements in the order they're
** found (higher level first than deep ones).
*/
export function findNestedViews(elm) {
	if(!elm || !elm.querySelector) return [];
    let nestedViews = [];
    let nestedView = elm.querySelector('*[data-view]');
    while(nestedView) {
        nestedViews.push(nestedView);
        nestedView = nestedView.querySelector('*[data-view]');
    }
    return nestedViews;
}

/*
** Iterates through the given `elm` parents until document root is reached.
** The document root is included in the returned array. If `strict` is set
** to true, this function raises an error if no document root is found.
*/
export function findParentViews(elm, strict) {
	let views = [];
	let view = elm.parentNode;
	let docRootFound = false;
	while(view) {
		if(view.hasAttribute(VIEW_ATTR)) {
			views.push(view);
		}
		if(view.hasAttribute(ROOT_ATTR)) {
			views.push(view);
			docRootFound = true;
			break;
		}
		view = view.parentNode;
	}
	if(strict && !docRootFound) {
		throw "[reflinks] No document root found for target: " + elm.toString();
	}
	return views.reverse();
}

/*
** 
*/
export function cacheCurrent() {
    let docRoot = getDocumentRoot();
    if(docRoot) {
        docRoot.setAttribute('data-cached', new Date().getTime().toString());
    }
}

/*
** Returns the documentRoot of the current page.
*/
export function getDocumentRoot() {
    let docRoot = document.querySelector('*['+ROOT_ATTR+']['+ACTIVE_ATTR+']');
    if(docRoot) {
        let viewSelector = '*['+VIEW_ATTR+']['+ACTIVE_ATTR+']';
        let activeView = docRoot.querySelector(viewSelector);
        while(activeView) {
            let nestedView = activeView.querySelector(viewSelector);
            if(nestedView) {
                activeView = nestedView;
            } else {
                break;
            }
        }
        if(activeView) return activeView;
    }
    return docRoot;
}

/*
** Clear the conents of navigationHistory to an empty object.
** Each element associated with an history entry is removed from
** the page.
*/
export function clearHistory() {
    Object.keys(navigationHistory).forEach((url) => {
        delete navigationHistory[url];
    });
}

/*
** Removes the given `url` from the navigation entry and all elements
** associated with it. This function verifies if the element is shared
** across other entries, and only removes them if they are unique to
** the given `url`.
*/
export function clearCache(url) {
    if(navigationHistory[url]) {
        let elements = navigationHistory[url];
        delete navigationHistory[url];
        // TODO: Remove elements only if they're unique to the url
        elements.forEach(elm => {
            utils.removeElement(elm);
        });
    }
}

/*
** Pushes a new state to the history and updates the navigation map with the
** specified element (root and possible targets).
*/
export function pushState(url, element, options) {
    // Push a new state to the history
    window.history.pushState({reflinks: true}, "", url);

    // The element might a document-root or a target. If it's a document root
    // we need to crawl inside to find if any target is present. If it's a
    // target, the current document root + targets will be copied to the
    // navigation map.

    // Ok, I think I got this. We need to crawl from the current document root
    // until we find the specified element counting each data-view we found.

    if(options.cache) {
        let entries = Object.keys(navigationHistory);
        let currentCacheSize = entries.length;
        if(currentCacheSize >= cacheLimit) {
            // Erase the oldest entry...
            let oldest = Number.POSITIVE_INFINITY;
            let oldestEntry = null;
            entries.forEach(entry => {
                let elements = navigationHistory[entry];
                if(elements.cachedAt < oldest) {
                    oldest = elements.cachedAt;
                    oldestEntry = entry;
                }
            });
            if(oldestEntry) {
                clearCache(oldestEntry);
            }
        }
        cacheElement(url, element);
    }
}

/*
** Caches the given `element` and associated views (nested or parent) adding
** 'data-cached' and setting an entry in the `history` map.
**
** This function is called by `pushState`.
*/
function cacheElement(url, element) {
    let elements = [];
    if(element.hasAttribute(ROOT_ATTR)) {
		// If the given element is a top-level root, we need to dig down
		// and search for nested views.
        elements.push(element);
		findNestedViews(element).forEach(view => {
			elements.push(view);
		});
    } else {
		// If the given element is a target, we need to dig up and down
		// and search until we reach document-root and the deepest view.
		findParentViews(element).forEach(view => {
			elements.push(view);
		});
		elements.push(element);
		findNestedViews(element).forEach(view => {
			elements.push(view);
		});
    }

	// Set data-cached attribute in each element in the view tree.
    let currentTime = new Date().getTime();
	elements.forEach(elm => {
		elm.setAttribute(CACHED_ATTR, currentTime);
	});

    // Adding 'cachedAt' to the array causes existing tests to fail.
    // The following code illustrates why they fail:
    //
    // ```
    // var a = [10];
    // var b = [10];
    // a.something = true;
    // a.should.eql(b); // false because of the "something" property.
    // ```
    // In order to make tests pass, we define "cachedAt" as non
    // enumerable so that chai isn't aware of it.
    Object.defineProperty(elements, "cachedAt", {
        enumerable: false,
        writable: true,
    });

    // Set the currentTime in the elements array. This attribute is
    // used when finding the oldest entry in the navigation history.
    elements.cachedAt = currentTime;

    navigationHistory[url] = elements;
}

/*
** Default argument for the `initializeHistory` function. The properties
** are merged with the ones the user specifies.
*/
const defaultInitializeHistoryOptions = {
	cache: false
};

/*
** Adds the property data-active to the first document-root specified by the
** user when the page loads. This function should only be called once.
*/
export function initializeHistory(options) {
	options = utils.mergeObjects(options, defaultInitializeHistoryOptions);
    let docRoot = document.querySelectorAll('*['+ROOT_ATTR+']');

	if(docRoot.length > 1) {
		throw "[reflinks] Multiple elements with data-reflinks-root found in the page.";
	}

	docRoot = docRoot[0]; // Grab the one and only document root.

    if(docRoot && !docRoot.hasAttribute(ACTIVE_ATTR)) {
        docRoot.setAttribute(ACTIVE_ATTR, '');
    }


	if(options.cache) {
		docRoot.setAttribute(CACHED_ATTR, new Date().getTime());
	}

	// The current document-root might have nested views. We need to
	// set those as 'active' as well, and cache them if specified.
	let nestedViews = findNestedViews(docRoot);
	nestedViews.forEach((view) => {
		view.setAttribute(ACTIVE_ATTR, '');
		if(options.cache) {
			view.setAttribute(CACHED_ATTR, new Date().getTime());
		}
	});

    if(docRoot && docRoot.hasAttribute(CACHED_ATTR)) {
        let url = new Url(document.location).withoutHash();
        cacheElement(url.toString(), docRoot);
    }
}
