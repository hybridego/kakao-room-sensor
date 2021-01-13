import DBM from './KDBManager.js'
import KMQ from './KMqtt.js'
const SerialPort = require('serialport')
const moment = require('moment')
const {app} = require('electron')
const {name} = require('../../package.json')
// const util = require('util')
const Readline = SerialPort.parsers.Readline

let serialBuffer = ''
let ACM0 = null
let ACM0Parser = null
let serialPortLists = []
export let sensorData = []
let serialPortIsUsed = false

function openNstart (spPath) {
  if (ACM0 == null) {
    console.log('make ACM0 ', spPath)
    // console.log('AAA:', util.inspect(SerialPort, {showHidden: false, depth: null}))
    // console.log('BBB:', util.inspect(SerialPort, false, null, true /* enable colors */))
    ACM0 = new SerialPort(spPath, {
      baudRate: 115200,
      spOptions: false
    })
    ACM0Parser = ACM0.pipe(new Readline({delimiter: '\r\n'}))
  }

  if (!serialPortIsUsed && ACM0 != null) {
    ACM0.open((err) => {
      console.log('Try to open serial port.')
      if (err) {
        console.log('Serial port state : ', err.message)
      }
    })

    ACM0.on('open', () => {
      console.log('ACM0 opened success.')
      ACM0.flush((error) => {
        if (error) {
          console.log('Serial port state : ', error.message)
        }
      })
    })

    ACM0Parser.on('data', (data) => {
      console.log('[', data.toString(), ']')
      const startP = /P/g
      if (data.toString().indexOf('P', 5) !== -1) {
        console.log('FLUSH : ', data.toString())
        return
      }

      if (startP.test(data.toString())) {
        const startPosition = serialBuffer.indexOf(':')
        const bufArr = serialBuffer.substr(startPosition + 1).split(',')
        if (!isNaN(bufArr[0]) && !isNaN(bufArr[2])) {
          sensorData.push({
            time: moment().format('YYYY-MM-DD HH:mm:ss'),
            location: parseInt(Number(bufArr[0]), 10),
            pir: bufArr[1] * 1,
            interval: bufArr[2] * 1,
            rssi: bufArr[3] * 1,
            ttl: bufArr[4] * 1,
            mv: bufArr[5] * 1
          })
          let sendData = `${parseInt(Number(bufArr[0]), 10)},${moment().format('YYYY-MM-DD HH:mm:ss')},${bufArr[1] * 1},${bufArr[2] * 1},${bufArr[3] * 1},${bufArr[4] * 1},${bufArr[5] * 1}`
          DBM.save(`${app.getPath('appData')}/${name}/${moment().format('YYYY-MM-DD')}.csv`,
            `${sendData}\n`
          )
          KMQ.KPublish('kakao', sendData, {qos: 0})
        }
        // console.log('Serial console:', serialBuffer)
        serialBuffer = ''
        serialBuffer += data.toString()
      } else {
        serialBuffer += data.toString()
      }
    })
  }
}

function checkDongle () {
  return new Promise((resolve, reject) => {
    SerialPort.list().then(ports => {
      let ACM0Check = false
      ports.map(port => {
        if (port.path.indexOf('usbmodem') !== -1) {
          console.log('동글을 찾았습니다.', port)
          ACM0Check = true
        }
        serialPortLists.push(port.path)
      })
      if (!ACM0Check) {
        reject(new Error('동글이 없습니다.'))
      }
      resolve({isThere: true, data: serialPortLists})
    })
  })
}

export {openNstart, checkDongle}
