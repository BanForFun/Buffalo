const fs = require('node:fs')
const buffaloSchema = require('../buffaloSchema')

fs.writeFileSync("schema.json", JSON.stringify(buffaloSchema, null, 2))