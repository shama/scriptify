var scriptify = require('./')
var http = require('http')
var fs = require('fs')
http.createServer(function(req, res) {
  if (req.url !== '/') return res.end('')
  res.writeHead(200, {'Content-Type': 'text/html'})
  fs.createReadStream('index.html').pipe(scriptify()).pipe(res)
}).listen(8080)
console.log('Server running at http://localhost:8080/')
