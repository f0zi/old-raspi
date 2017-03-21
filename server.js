// server.js
// where your node app starts

// init project
const express = require('express');
const app = express();

const bodyParser = require('body-parser')
const urlParser = bodyParser.urlencoded({ extended: true })
const jsonParser = bodyParser.json()

const Player = require('./player')
var player

const { EventEmitter } = require('events')
const eventhub = new EventEmitter()
eventhub.on('meta', update => {
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

app.post("/play", function(request, response) {
  if(player) player.stop()
  if(request.body.url) {
    player = new Player({
      url: request.body.url
    })
    player.on('meta', update => {
      eventhub.emit('meta', update)
    })
  }
  if(player) {
    player.play()
    response.sendStatus(200)
  } else {
    response.sendStatus(404)
  }
})

app.post("/stop", function(request, response) {
  if(player) player.stop()
  response.sendStatus(200)
})

app.get("/nowplaying", function(request, response) {
  if(player) response.send(player.nowPlaying())
  else response.send({ playing: false })
})

app.get("/subscribe", function(request, response) {
  response.set('Content-Type', 'text/plain;charset=utf-8');
  response.set('Cache-Control', 'no-cache, must-revalidate');

  //console.log("Subscription...")
  eventhub.once('meta', nowplaying => {
    console.log("Response")
    response.send(nowplaying)
  })
})

// listen for requests :)
var listener = app.listen(process.env.PORT || "80", function () {
  console.log('Your app is listening on port ' + listener.address().port);
});