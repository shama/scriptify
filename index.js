var through = require('through')
var cheerio = require('cheerio')
var path = require('path')
var fs = require('fs')
var spawn = require('child_process').spawn

module.exports = function(opts) {
  opts = opts || {}
  opts.basedir = opts.basedir || process.cwd()
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
        self.queue($.html({decodeEntities: false}))
        self.queue(null)
      } else {
        var script = $(scripts[at])
        var entry = script.text()
        var src = script.attr('src')
        if (src) {
          if (!fs.existsSync(src)) {
            at++
            return done()
          }
          entry = fs.readFileSync(src).toString()
        }
        bfy(entry, opts.args, function(text) {
          script.attr('type', 'text/javascript')
          script.attr('src', null)
          script.text(text)
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
 let index = args.indexOf('-e');
  if (index > -1) {
    args.splice(index, 2);
  }
  args.unshift('-e', tmpfile)

  var bundled = ''
  var errors = ''
  var b = spawn(whichbfy(), args)
  b.stderr.on('data', function(buf) {
    buf = String(buf).replace(/^\s+|\s+$/g, '')
    errors += 'console.error("' + buf + '")'
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
