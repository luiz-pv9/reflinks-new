import {Request} from './request';
import Url from './url';
import * as utils from './utils';

/*
** Constants
*/
const ACTIVE_ATTR = 'data-active';
const CACHED_ATTR = 'data-cached';
const ROOT_ATTR   = 'data-reflinks-root';

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
export function getNavigationHistory() { return navigationHistory; }

/*
** Clear the conents of navigationHistory to an empty object.
*/
export function clearNavigationHistory() {
    Object.keys(navigationHistory).forEach((url) => {
        delete navigationHistory[url];
    });
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
** Reference to the element that is currently being displayed as root.
*/
let documentRoot = null;

// Used to detect initial (useless) popstate.
// If history.state exists, assume browser isn't going to fire initial popstate.
let popped = ('state' in window.history), initialURL = location.href;

/*
** Callback called when the user press back or forward in the browser.
*/
function onPopState(e) {
    // Ignore inital popstate that some browsers fire on page load
    let initialPop = !popped && location.href == initialURL;
    popped = true;
    if(initialPop) return;


    let url = new Url(e.target.location);
    let navigation = navigationHistory[url.toString()];
    if(navigation) {
        // We can restore the page to the state the user is requesting!
    } else {
        // We need to send a new request... :(
        page(url);
    }
};

window.addEventListener('popstate', onPopState);

/*
** This function should be called in the boot process of Reflinks. It tries to
** find an element in the page that has the data-reflinks-root attribute.
*/
export function findDocumentRoot() {
    let docRoot = document.querySelector('*['+ROOT_ATTR+']');
    if(!docRoot) {
        console.error("[reflinks] could not find the document root element");
    }
    documentRoot = docRoot;
    return docRoot;
}

/*
** Adds the property data-active to the first document-root specified by the
** user when the page loads. This function should only be called once.
*/
export function initialize() {
    let docRoot = findDocumentRoot();
    if(docRoot && !docRoot.hasAttribute(ACTIVE_ATTR)) {
        docRoot.setAttribute(ACTIVE_ATTR, '');
    }
}

/*
** Returns the documentRoot of the current page.
*/
export function getDocumentRoot() {
    let docRoot = document.querySelector('*['+ROOT_ATTR+']['+ACTIVE_ATTR+']');
    return docRoot;
}


/*
** Pushes a new state to the history and updates the navigation map with the
** specified element (root and possible targets).
*/
function pushState(url, element, options) {
    // Push a new state to the history
    window.history.pushState({reflinks: true}, "", url);

    // The element might a document-root or a target. If it's a document root
    // we need to crawl inside to find if any target is present. If it's a
    // target, the current document root + targets will be copied to the
    // navigation map.

    // Ok, I think I got this. We need to crawl from the current document root
    // until we find the specified element counting each data-view we found.

    // Only if cached this should execute from here on...
    if(!options.cache) {
        return;
    }

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
** The default options for the onSuccess callback.
*/
const defaultOnSuccessOptions = {

    // This flags indicates if the response from the server should be cached or
    // not.
    cache: true
};

/*
** Callback called when a visit request succeds.
*/
function onSuccess(root, attribute, value, options) {
    options = utils.mergeObjects(options, defaultOnSuccessOptions);
    let selector;
    if(value) {
        selector = '*['+attribute+'="'+value+'"]';
    } else {
        selector = '*['+attribute+']';
    }
    return function(html, status, xhr) {
        // Get the content from the response body
        let bodyElements = utils.stringToElements(utils.extractBody(html));
        // Find the element that should replace the current one
        let element = utils.findElementByAttribute(bodyElements, attribute, value);

        // Update the title of the page if specified.
        utils.extractAndUpdateTitle(html);

        if(!element) {
            return console.error("[reflinks] could not find element with attribute: " + attribute);
        }

        // Remove (if not cached) or hide (if cached) all other elements
        let nodes = root.querySelectorAll(selector);
        for(let i = 0, len = nodes.length; i < len; i++) {
            let node = nodes[i];
            if(node.hasAttribute(CACHED_ATTR)) {
                node.removeAttribute(ACTIVE_ATTR);
                hideElement(node);
            } else {
                root.removeChild(node);
            }
        }

        // Insert the new target.
        // Change later: insert before the first node found from the selector.
        element.setAttribute(ACTIVE_ATTR, '');
        root.appendChild(element);

        // Add the element to the navigationHistory map.
        pushState(xhr.url, element, options);
    }
}

/*
** Callback called when a visit request results in a redirect to another page.
*/
function onRedirect(html, stauts, xhr) {
}

/*
** Callback called when the server returns an error from a visit call.
*/
function onError(html, status, xhr) {
}

/*
** Sends a GET request to the specified url.
*/
export function page(url, options) {
    if(utils.isString(url)) {
        url = new Url(url).withoutHash();
    }
    url = url.toString();
    if(!getDocumentRoot()) {
        return console.error("[reflinks] couldn't find document root in the page.");
    }
    Request.GET(url, {
        redirect: onRedirect,
        success:  onSuccess(documentRoot.parentNode, ROOT_ATTR, undefined, options),
        error:    onError,
    });
}

/*
** Similar to visiting a page but the received content from the server is
** inserted in the specified element.
*/
export function target(url, elm, viewName) {
    let id;
    if(!utils.isElement(elm)) {
        id = elm;
        elm = document.getElementById(elm);
    }
    if(!elm) {
        return console.error("[reflinks] - target not found: " + id);
    }
    Request.GET(url, {
        redirect: onRedirect,
        success:  onSuccess(documentRoot.parentNode, 'data-view', viewName),
        error:    onError,
    });
}