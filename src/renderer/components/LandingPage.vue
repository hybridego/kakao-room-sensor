<template>
  <div id="wrapper">
    <img id="logo" src="~@/assets/kaen.png" alt="electron-vue">
    <main>
      <div class="left-side">
        <div class="doc">
          <div class="title">Person in room sensor - Monitor</div>
          <p>
            회의실에 사람이 있는지 모니터링하는 시스템입니다.<br>
            회의실 예약 시스템과 연동될 예정입니다. <br>
            예약 시간 후 5~10분이 지나서도 재실이 확인되지 않으면 경고메시지와 함께 예약이 자동 취소됩니다.<br><br>
          </p>
          <button @click="openLink('http://meetingroom.daumcorp.com/main')">회의실 예약 시스템 바로가기</button><br><br>
        </div>
        <div class="doc">
          <div class="title alt">Todo : 설정메뉴 위치할 곳.</div>
          <button class="alt" @click="checkDongle">USB동글 체크</button>
          <button class="alt" @click="openACM">{{COMPortOpen}}</button>
          <button class="alt" @click="checkDongle">테스트용 버튼</button>
        </div>
        <div id="map">
          <div class="image-wrapper">
            <img class="f3_map" src="~@/assets/3rd_floor_map.png" alt="F3 Map" width="550px">
          </div>
          <div class="rectangle-wrapper">
            <div class="rectangle" :style="styleObject(position)"></div>
          </div>
        </div>
      </div>
      <div class="right-side">
        <div class="item">
          <div class="name">App. status ({{$moment().format('YYYY-MM-DD')}}) : </div>
          <div class="value">{{ statusMassage }}</div>
        </div>
        <div class="sensor-data">
          <table class="sensor-data-table">
            <tr class="table-title">
              <td class="location">회의실</td>
              <td class="time">시간</td>
              <td class="pir">O/X</td>
              <td class="interval">Interval</td>
              <td class="rssi">RSSI</td>
              <td class="ttl">TTL</td>
              <td class="mv">mV</td>
            </tr>
            <tr :key="i" v-for="(dd,i) in sensorData.slice().reverse()">
              <td class="location">{{dd.location}}</td>
              <td class="time">{{dd.time}}</td>
              <td class="pir">{{dd.pir}}</td>
              <td class="interval">{{dd.interval}}</td>
              <td class="rssi">{{dd.rssi}}</td>
              <td class="ttl">{{dd.ttl}}</td>
              <td class="mv">{{dd.mv}}</td>
            </tr>
          </table>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
  const {name} = require('../../../package.json')
  const fs = require('fs')
  const log = require('electron-log')
  const { ipcRenderer } = require('electron')
  // const util = require('util')
  let displayCount = 0
  
  export default {
    name: 'landing-page',
    data () {
      return {
        COMPortOpen: 'COM port open',
        serialPortLists: [],
        sensorData: [],
        statusMassage: 'Init.',
        position: {x: 220, y: 121, w: 63, h: 35, c: '#339900', o: 0.4}
      }
    },
    methods: {
      // pubNSaveDB (room, date, inout, interval, rssi, ttl, mv) {
      //   ipcRenderer.send('dbmanager-save', {
      //     path: myDir + '/' + this.$moment().format('YYYY-MM-DD') + '.csv',
      //     data: `${room}, ${date}, ${inout}, ${interval}, ${rssi}, ${ttl}, ${mv} \n`
      //   })
      //   ipcRenderer.send('mqtt-message', `${room}, ${date}, ${inout}, ${interval}, ${rssi}, ${ttl}, ${mv}`)
      // },
      refreshACMMessage (sBuf) {
        this.sensorData = ipcRenderer.sendSync('serialport-getsensordata')
        setTimeout(this.refreshACMMessage, 5000)
        if (displayCount === 0) {
          this.statusMassage = '센서정보를 수집 중 입니다 .'
          this.position.x = 200
          displayCount++
          this.position.x = 220
          this.position.y = 121
          this.position.w = 63
          this.position.h = 35
        } else if (displayCount === 1) {
          this.statusMassage = '센서정보를 수집 중 입니다 . .'
          displayCount++
          this.position.x = 229
          this.position.y = 223
          this.position.w = 51
          this.position.h = 67
        } else if (displayCount === 2) {
          this.statusMassage = '센서정보를 수집 중 입니다 . . .'
          displayCount = 0
          this.position.x = 110
          this.position.y = 129
          this.position.w = 55
          this.position.h = 31
        }
      },
      openLink (link) {
        this.$electron.shell.openExternal(link)
      },
      checkDongle () {
        let SPListData = ipcRenderer.sendSync('serialport-checkdongle')
        if (SPListData.isThere) {
          this.serialPortLists = SPListData.data
          this.COMPortOpen = 'ACM0를 엽니다.'
          this.statusMassage = '동글을 찾았습니다.'
        }
        log.info('this.serialPortLists : ', this.serialPortLists)
      },
      openACM () {
        // log.info('AAA:', util.inspect(this.$moment, {showHidden: false, depth: null}))
        // log.info('BBB:', util.inspect(this.$moment, false, null, true /* enable colors */))
        log.info('현재시간:', this.$moment().format('YYYY-MM-DD HH:mm:ss'))
        let spPath = '/dev/tty.usbmodem14301'
        ipcRenderer.send('serialport-openNstart', spPath)
        this.statusMassage = '센서정보를 수집 중 입니다...'
        this.refreshACMMessage()
      },
      styleObject (obj) {
        let mig = (val) => { return `${val}px` }
        return {
          left: mig(obj.x),
          top: mig(obj.y),
          width: mig(obj.w),
          height: mig(obj.h),
          background: obj.c,
          opacity: obj.o
        }
      }
    },
    beforeCreate () {
      log.info('beforeCreate')
    },
    beforeMount () {
      log.info('beforeMount')
    },
    mounted () {
      log.info('mounted', name)
      const myDir = this.$electron.remote.app.getPath('appData') + `/${name}`
      log.info(myDir)
      !fs.existsSync(myDir) && fs.mkdirSync(myDir)

      this.$electron.ipcRenderer.on('serialport-RopenNstart', (event, data) => {
        log.info('renderer :::::::', data)
      })
    },
    beforeUpdate () {
      // log.info('beforeUpdate')
    },
    updated () {
      // log.info('updated')
    },
    beforeDestroy () {
      // log.info('beforeDestroy')
    },
    destroyed () {
      log.info('destroyed')
    }
  }
</script>

<style>
  @import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body { font-family: 'Source Sans Pro', sans-serif; }

  #wrapper {
    background:
      radial-gradient(
        ellipse at top left,
        rgba(255, 255, 255, 1) 40%,
        rgba(229, 229, 229, .9) 100%
      );
    height: 100vh;
    padding: 60px 80px;
    width: 100vw;
  }

  #logo {
    height: auto;
    margin-bottom: 20px;
    width: 420px;
  }

  main {
    display: flex;
    justify-content: space-between;
  }

  main > div { flex-basis: 50%; }

  .left-side {
    display: flex;
    flex-direction: column;
  }

  .welcome {
    color: #555;
    font-size: 23px;
    margin-bottom: 10px;
  }

  .title {
    color: #2c3e50;
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 6px;
  }

  .title.alt {
    font-size: 18px;
    margin-bottom: 10px;
  }

  .doc p {
    color: black;
    margin-bottom: 10px;
  }

  .doc button {
    font-size: .8em;
    cursor: pointer;
    outline: none;
    padding: 0.75em 2em;
    border-radius: 2em;
    display: inline-block;
    color: #fff;
    background-color: #4fc08d;
    transition: all 0.15s ease;
    box-sizing: border-box;
    border: 1px solid #4fc08d;
  }

  .doc button.alt {
    color: #42b983;
    background-color: transparent;
  }

  .item {
    display: flex;
    margin-bottom: 6px;
    margin-left: 10px;
  }

  .item .name {
    color: #6a6a6a;
    margin-right: 6px;
  }

  .item .value {
    color: #35495e;
    font-weight: bold;
  }

  .sensor-data {
    width: 100%;
    height: 520px;
    overflow: auto;
  }

  .sensor-data-table .table-title {
    background-color: #d2f5e2;
    padding: 3px 10px;
    text-align: center;
  }

  .sensor-data-table .location {
    background-color: #d2f5e2;
    padding: 3px 10px;
    text-align: center;
  }

  .sensor-data-table .time {
    background-color: #d2f5f5;
    padding: 3px 10px;
  }

  .sensor-data-table .pir {
    background-color: #d0e8ff;
    padding: 3px 10px;
    text-align: center;
  }
  .sensor-data-table .interval {
    background-color: #bbdeff;
    padding: 3px 10px;
    text-align: right;
  }
  .sensor-data-table .rssi {
    background-color: #9bcfff;
    padding: 3px 10px;
    text-align: right;
  }
  .sensor-data-table .ttl {
    background-color: #82c2ff;
    padding: 3px 10px;
    text-align: right;
  }
  .sensor-data-table .mv {
    background-color: #4da9ff;
    padding: 3px 10px;
    text-align: right;
  }
  #map {
    position: relative;
    background-color: #eee;    
  }
  #map .rectangle-wrapper {
    position: absolute;
    left: 0;
    top: 0;
  }
  #map .image-wrapper .f3_map {
    width: 100%;
    height: 100%;
  }
  #map .rectangle-wrapper .rectangle {
    position: absolute;
    border: solid 2px #FF1744;
  }

</style>
