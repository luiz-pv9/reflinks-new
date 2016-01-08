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
    let nestedViews = [];
    let nestedView = elm.querySelector('*[data-view]');
    while(nestedView) {
        nestedViews.push(nestedView);
        nestedView = nestedView.querySelector('*[data-view]');
    }
    return nestedViews;
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
        cacheElement(url, element);
    }
}

/*
**
*/
function cacheElement(url, element) {
    let docRoot = getDocumentRoot();
    let elements = [];
    if(docRoot === element) {
        elements.push(element);
        // TODO: crawl the element for possible data-views.
    } else {
        // If it's a target it means the previous document root is still the
        // same.
        elements.push(docRoot);

        // I need to check the current document for hints... what hints?
    }
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

    if(docRoot && docRoot.hasAttribute(CACHED_ATTR)) {
        let url = new Url(document.location).withoutHash();
        cacheElement(url.toString(), docRoot);
    }
}
