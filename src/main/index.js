'use strict'

import { app, BrowserWindow, ipcMain } from 'electron'
import KMQ from './KMqtt.js'
import DBM from './KDBManager.js'
import {openNstart, checkDongle, sensorData} from './KSerialPort.js'

KMQ.init('127.0.0.1', 1883, 'mqtt')

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 800,
    useContentSize: true,
    width: 1200
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

ipcMain.on('mqtt-message', (event, arg) => {
  console.log('=Main=(mqtt-message)', arg)
  KMQ.KPublish('kakao', arg, {qos: 0})
})

ipcMain.on('dbmanager-save', (event, arg) => {
  console.log('=Main=(dbmanager-save)', arg)
  DBM.save(arg.path, arg.data)
})

ipcMain.on('serialport-checkdongle', (event, arg) => {
  console.log('=Main=(serialport-checkdongle)', arg)
  checkDongle().then(value => {
    event.returnValue = value
  })
})

ipcMain.on('serialport-openNstart', (event, arg) => {
  console.log('=Main=(serialport-openNstart)', arg)
  openNstart(arg)
})

ipcMain.on('serialport-getsensordata', (event, arg) => {
  // console.log('=Main=(serialport-getsensordata)', arg)
  event.returnValue = sensorData
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
