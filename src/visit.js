import {Request} from './request';
import * as navigation from './navigation';
import * as utils from './utils';
import Url from './url';

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
            if(node.hasAttribute(navigation.CACHED_ATTR)) {
                node.removeAttribute(navigation.ACTIVE_ATTR);
                hideElement(node);
            } else {
                root.removeChild(node);
            }
        }

        // Insert the new target.
        // Change later: insert before the first node found from the selector.
        element.setAttribute(navigation.ACTIVE_ATTR, '');
        root.appendChild(element);

        // Add the element to the navigationHistory map.
        navigation.pushState(xhr.url, element, options);
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
    if(!navigation.getDocumentRoot()) {
        return console.error("[reflinks] couldn't find document root in the page.");
    }
    Request.GET(url, {
        redirect: onRedirect,
        success:  onSuccess(navigation.getDocumentRoot().parentNode, navigation.ROOT_ATTR, undefined, options),
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
        success:  onSuccess(navigation.getDocumentRoot().parentNode, 'data-view', viewName),
        error:    onError,
    });
}


// Used to detect initial (useless) popstate.
// If navigation.state exists, assume browser isn't going to fire initial popstate.
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