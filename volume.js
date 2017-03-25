// Volume control

const { EventEmitter } = require("events")
const { spawn } = require('child_process')

class Volume extends EventEmitter {
  constructor(options = {}) {
    super()
    this.opt = options
  }
  
  getVolume() {
    return new Promise(function(resolve, reject) {
      var result = {}
      var amixer = spawn('amixer')
      amixer.stdout.on('data', function(data) {
        var line = data.toString('utf8').match(/^\s*(.+?)\s*:\s*(.*)\s*$/)
        if(line) {
          result[line[1]] = line[2]
        }
      })
      
      amixer.on('close', code => {
        if(code) reject(new Error("amixer returned error: " + code))
        else resolve(result)
      })
      amixer.on('error', err => reject(err))
    }.bind(this))
  }
}

module.exports = Volume
