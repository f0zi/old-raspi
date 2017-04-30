// Plays music
// can play:
// - mp3 stream

const { EventEmitter } = require("events")
const { spawn } = require('child_process')

function mpg123parser(line, opts) {
	var match
	if(match = line.match(/^ICY-META: StreamTitle='(.*)';$/)) {
		var streamTitle = match[1]
		match = streamTitle.match(/';(?:([^=]+)='(.*)(?:'|$))*$/)
		if(!opts.quiet) console.log(match)
		if(match) {
			var other = {}
			for(var i = 1; i+1 < match.length; i+=2) {
				other[match[i]] = match[i+1]
			}
		}
		return { streamTitle: streamTitle.replace(/';StreamUrl='.*$/, ''), other: other }
	}
	if(match = line.match(/^ICY-NAME:\s+(.+)\s*$/)) {
		return { Name: match[1] }
	}
	if(match = line.match(/^ICY-URL:\s+(.+)\s*$/)) {
		return { URL: match[1] }
	}
}

function swr3parser(line) {
	var stream = mpg123parser(line, this.opts)
	if(stream && stream.streamTitle) {
		var match = stream.streamTitle.match(/^Am Mikrofon: (.+)$/)
		if(match) return {
			DJ: match[1]
		}
		match = stream.streamTitle.match(/^(.+) \/ (.+)$/)
		if(match) return {
			title: match[1],
			artist: match[2]
		}
		match = stream.streamTitle.match(/^\*?\s*(.+)\s+\*+$/)
		if(match) return {
			jingle: match[1]
		}
		return {
			show: stream.streamTitle
		}
	} else if(stream) {
		return stream
	}
}

class Player extends EventEmitter {
	constructor(options = {}) {
		super()
		if(options.url) {
			this.opts = options
			this.url = options.url.toString()
			if(!this.opts.quiet) console.log("Playing ", this.url)
			this.command = "mpg123"
			this.params = ['-@', this.url]
			this.parser = mpg123parser
			if(this.url.match(/swr3\.de/)) {
				this.parser = swr3parser
			}

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
		
		var data = function(data) {
			data.toString('binary').split('\n').map(this.parse.bind(this))
		}.bind(this)
		this.player.stdout.on('data', data)
		this.player.stderr.on('data', data)

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
		if(!this.opts.quiet) console.log(line)
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
