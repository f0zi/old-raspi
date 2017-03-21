// Plays music
// can play:
// - mp3 stream

const { EventEmitter } = require("events")
const { spawn } = require('child_process')

function mpg123parser(line) {
  var match = line.toString().match(/^ICY-META: StreamTitle='(.*)';$/)
  if(match) {
    return { streamTitle: match[1] }
  }
  return
}

function swr3parser(line) {
  var stream = mpg123parser(line)
  if(stream) {
    var match = stream.streamTitle.match(/^Am Mikrofon: (.+)$/)
    if(match) return {
      DJ: match[1]
    }
    match = stream.streamTitle.match(/^(.+) \/ (.+)$/)
    if(match) return {
      title: match[1],
      artist: match[2]
    }
    match = stream.streamTitle.match(/^\*?\s*(.+)\s+\*$/)
    if(match) return {
      jingle: match[1]
    }
    return {
      show: stream.streamTitle
    }
  }
}

function testparser(line) {
  var match = line.match(/^(..........)\s+(\d+)\s+(\w+)\s+(\w+)\s+(\d+)\s+(\w+ \d+ \d+:\d\d) (.*)$/)
  if(match) return {
    mode: match[1],
    links: parseInt(match[2]),
    user: match[3],
    group: match[4],
    size: parseInt(match[5]),
    date: new Date(match[6]),
    name: match[7]
  }
}

class Player extends EventEmitter {
  constructor(options) {
    super()
    if(options.url) {
      this.url = options.url.toString()
      console.log("Playing ", this.url)
      this.command = "mpg123"
      this.params = ['-@', this.url]
      this.parser = mpg123parser
      if(this.url.match(/swr3\.de/)) {
        this.parser = swr3parser
      }
      // testing
      this.command = 'ls'
      this.params = [ '-la' ]
      this.parser = testparser

      this.nowplaying = { url: this.url, playing: false }
    } else {
      throw new Error("Unsupported source")
    }
  }
  
  play() {
    if(this.playing) return

    this.playing = true
    this.nowplaying = { url: this.url, playing: true }

    this.player = spawn(this.command, this.params)
    this.player.stdout.on('data', function(data) {
      data.toString('utf-8').split('\n').map(this.parse.bind(this))
    }.bind(this))
    this.player.on('exit', function(code) {
      this.playing = false
      this.nowplaying.playing = false
      this.emit('meta', this.nowplaying)
    }.bind(this))

    this.emit('meta', this.nowplaying)
  }

  stop() {
    if(this.playing) this.player.kill()
  }

  parse(line) {
    var stuff = this.parser(line)
    if(stuff) {
      Object.assign(this.nowplaying, stuff, { url: this.url, playing: this.playing })
      this.emit('meta', this.nowplaying)
    }
  }

  nowPlaying() {
    return this.nowplaying
  }
}

module.exports = Player
