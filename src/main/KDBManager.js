const fs = require('fs')

class KDBManager {
  static save (path, data) {
    fs.appendFileSync(path, data)
  }
}

export default KDBManager
