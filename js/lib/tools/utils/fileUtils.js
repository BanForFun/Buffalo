const fs = require('node:fs')
const path = require('path')
const process = require('node:process')

function getOutputStream(outputPath, defaultName) {
    if (!outputPath) return process.stdout

    if (fs.existsSync(outputPath) && fs.statSync(outputPath).isDirectory())
        outputPath = path.join(outputPath, defaultName)

    return fs.createWriteStream(outputPath)
}

module.exports = {
    getOutputStream
}