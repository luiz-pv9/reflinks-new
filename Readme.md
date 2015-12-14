# Reflinks documentation

# Url

Reflinks uses a very simple Url class internally to decide things such as param matching and caching. The class is accessible via `Reflinks.Url`. You're free to use it.

```javascript
var site = new Reflinks.Url("http://www.reflinks.com:80/my/path?status=open#chart");

console.log(site.protocol); // => "http"
console.log(site.port);     // => "80"
console.log(site.domain);   // => "reflinks.com"
console.log(site.path);     // => "/my/path"
console.log(site.query);    // => "?status=open"
console.log(site.hash);     // => "#chart"

// Encodes the query part of the url as a Json object.
console.log(site.queryObject()); // => { 'status': 'open' }
```