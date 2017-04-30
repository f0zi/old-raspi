// server.js
// where your node app starts

// init project
const args = require('yargs')
.argv

const express = require('express')
const app = express()

const bodyParser = require('body-parser')
const urlParser = bodyParser.urlencoded({ extended: true })
const jsonParser = bodyParser.json()

var settings = Object.assign(require('./package.json'), args)
const Player = require('./player')
const Volume = require('./volume')
var player

var volume = new Volume(settings.volume || {})

const { EventEmitter } = require('events')
const dispatch = new EventEmitter()
dispatch.on('meta', update => {
	if(!args.quiet) console.log('Update: ', update)
})

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'))
app.use(urlParser)
app.use(jsonParser)

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
	response.sendFile(__dirname + '/views/index.html')
})

app.post("/v1/play", function(request, response) {
	if(player) player.stop()
	if(request.body.url) {
		player = new Player(Object.assign({}, settings, {
			url: request.body.url
		}))
		player.on('meta', update => {
			dispatch.emit('meta', update)
		})
	}
	if(player) {
		player.play()
		response.sendStatus(200)
	} else {
		response.sendStatus(404)
	}
})

app.post("/v1/stop", function(request, response) {
	if(player) player.stop()
	response.sendStatus(200)
})

app.get("/v1/nowplaying", function(request, response) {
	if(player) response.send(player.nowPlaying())
	else response.send({ playing: false })
})

app.get("/v1/volume", function(request, response) {
	response.set('Content-Type', 'application/json;charset=utf-8')
	response.set('Cache-Control', 'no-cache, must-revalidate')

	volume.getVolume().then(result => {
		if(!args.quiet) console.log(result)
		response.send(result)
	}, error => {
		console.error(error)
		response.sendStatus(500)
	})
})

app.get("/v1/subscribe", function(request, response) {
	response.set('Content-Type', 'application/json;charset=utf-8')
	response.set('Cache-Control', 'no-cache, must-revalidate')

	//console.log("Subscription...")
	dispatch.once('meta', nowplaying => {
		if(!args.quiet) console.log("Response")
		response.send(nowplaying)
	})
})

// listen for requests :)
var listener = app.listen(process.env.PORT || "80", function () {
	console.log('Old-Raspi is listening on port ' + listener.address().port)
})
