const fs = require('node:fs')
const buffelaSchema = require('../constants/buffelaSchema')

try {
    fs.mkdirSync('./schemas')
} catch (err) {
    if (err.code !== 'EEXIST') throw err;
}

fs.writeFileSync("./schemas/buffela.json", JSON.stringify(buffelaSchema, null, 2))