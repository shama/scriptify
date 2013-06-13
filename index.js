var through = require('through')
var cheerio = require('cheerio')
var path = require('path')
var fs = require('fs')
var spawn = require('child_process').spawn

module.exports = function(opts) {
  opts = opts || {}
  opts.selector = opts.selector || 'script[type="text/browserify"]'
  opts.args = opts.args || []
  
  var html = ''
  return through(write, end)

  function write(buf) { html += buf }
  function end() {
    var self = this
    var $ = cheerio.load(html)
    var scripts = $(opts.selector)
    if (scripts.length < 1) return self.queue(null)
    var at = 0;
    (function done() {
      if (at >= scripts.length) {
        self.queue($.html())
        self.queue(null)
      } else {
        var script = $(scripts[at])
        bfy(script.text(), opts.args, function(text) {
          script.attr('type', 'text/javascript')
          replaceText.call(script, text)
          at++
          done()
        })
      }
    }())
  }
}

function whichbfy() {
  var local = path.join(__dirname, 'node_modules/.bin/browserify')
  if (process.platform === 'win32') local += '.cmd'
  return (fs.existsSync(local)) ? local : 'browserify'
}

function bfy(text, args, done) {
  var tmpfile = 'scriptify_' + Date.now() + '.js'
  if (fs.existsSync(path.join(process.cwd(), tmpfile))) {
    return done(text)
  }
  fs.writeFileSync(tmpfile, text)
  args.unshift('-e', tmpfile)

  var bundled = ''
  var errors = ''
  var b = spawn(whichbfy(), args)
  b.stderr.on('data', function(buf) {
    buf = String(buf).replace(/^\s+|\s+$/g, '')
    errors += "console.error('" + buf + "')"
  })
  b.stdout.on('data', function(buf) {
    bundled += buf
  })
  b.on('close', function() {
    fs.unlinkSync(tmpfile)
    if (errors.length > 0) {
      done(errors)
    } else {
      done(bundled)
    }
  })
}

// because cheerio encodes everything
function replaceText(str) {
  var updateDOM = require('cheerio/lib/parse').update
  var elem = {
    data: str,
    type: 'text',
    parent: null,
    prev: null,
    next: null,
    children: []
  }
  this.each(function(i, el) {
    el.children = elem
    updateDOM(el.children, el)
  })
}
