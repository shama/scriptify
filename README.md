# scriptify

Browserify inline script tags in HTML.

## example

We have a `index.html` page with:

```html
<!doctype html>
<html lang="en">
<body>
  <script type="text/browserify">
  var radical = require('./rad.js')
  radical('go!')
  </script>
</body>
</html>
```

Then as we serve the HTML we can transform it:

```js
var scriptify = require('scriptify')

// Bundle an HTML file
fs.createReadStream('index.html')
  .pipe(scriptify())
  .pipe(fs.createWriteStream('bundle.html'))

// Or bundle as the server requests it:
var http = require('http')
var fs = require('fs')
http.createServer(function(req, res) {
  if (req.url !== '/') return res.end('')
  res.writeHead(200, {'Content-Type': 'text/html'})
  fs.createReadStream('index.html').pipe(scriptify()).pipe(res)
}).listen(8080)
console.log('Server running at http://localhost:8080/')
```

## `require('scriptify')([options])`
Returns a `Stream`.

- `options`:
  - `selector`: Defaults to `script[type="text/browserify"]`.
  - `args`: Defaults to `[]`. Arguments to pass to `browserify`.

## Is this a good idea?
I don't know. Probably not. I'm just being lazy and sometimes don't want to have
a separate file for an entry point.

## install

With [npm](https://npmjs.org) do:

```
npm install scriptify
```

## release history
* 1.0.0 - Skip external sources. (@karissa)
* 0.2.0 - Use script src attribute if available. Upgrade browserify and cheerio. (@maxogden)
* 0.1.0 - initial release

## license
Copyright (c) 2013 Kyle Robinson Young<br/>
Licensed under the MIT license.
