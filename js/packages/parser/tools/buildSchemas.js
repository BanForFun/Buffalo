import fs from 'node:fs'
import buffelaSchema from "../constants/buffelaSchema.js";

try {
    fs.mkdirSync('./schemas')
} catch (err) {
    if (err.code !== 'EEXIST') throw err;
}

fs.writeFileSync("./schemas/buffela.json", JSON.stringify(buffelaSchema, null, 2))