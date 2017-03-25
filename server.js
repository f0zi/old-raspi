// server.js
// where your node app starts

// init project
const express = require('express');
const app = express();

const bodyParser = require('body-parser')
const urlParser = bodyParser.urlencoded({ extended: true })
const jsonParser = bodyParser.json()

var settings = require('./package.json')
const Player = require('./player')
const Volume = require('./volume')
var player

var volume = new Volume(settings.volume || {})

const { EventEmitter } = require('events')
const dispatch = new EventEmitter()
dispatch.on('meta', update => {
  console.log('Update: ', update)
})

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));
app.use(urlParser)
app.use(jsonParser)

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.post("/v1/play", function(request, response) {
  if(player) player.stop()
  if(request.body.url) {
    player = new Player({
      url: request.body.url
    })
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
  response.set('Content-Type', 'application/json;charset=utf-8');
  response.set('Cache-Control', 'no-cache, must-revalidate');

  volume.getVolume().then(result => {
    console.log(result)
    response.send(result)
  }, error => {
    console.error(error)
    response.sendStatus(500)
  })
})

app.get("/v1/subscribe", function(request, response) {
  response.set('Content-Type', 'application/json;charset=utf-8');
  response.set('Cache-Control', 'no-cache, must-revalidate');

  //console.log("Subscription...")
  dispatch.once('meta', nowplaying => {
    console.log("Response")
    response.send(nowplaying)
  })
})

// listen for requests :)
var listener = app.listen(process.env.PORT || "80", function () {
  console.log('Your app is listening on port ' + listener.address().port);
});