import { arrayTypes, lengthTypes, subtypeType } from './buffelaTypes.js'

function enumPattern(...options) {
    return `(${options.join('|')})`
}

const arrayTypePattern = enumPattern(...arrayTypes)
const lengthTypePattern = enumPattern(...lengthTypes, "\\d+")
const arraySuffixPattern = `(\\[${lengthTypePattern}\\])*`

/** @type {object} **/
const buffelaSchema = {
    "$defs": {
        "DataDefinition": {
            "type": "object",
            "patternProperties": {
                "^[a-z][a-zA-Z]*$": {
                    "anyOf": [
                        { "type": "string", "pattern": `^${arrayTypePattern}\\(${lengthTypePattern}\\)${arraySuffixPattern}$` },
                        { "type": "string", "pattern": `^(?!${subtypeType})(?!${arrayTypePattern})[A-Z][a-zA-Z]+${arraySuffixPattern}$` },
                        { "type": "string", "const": subtypeType },
                        { "type": "number" },
                    ]
                },
                "^[A-Z][a-zA-Z]*$": { "$ref": "#/$defs/DataDefinition" }
            },
            "additionalProperties": false
        }
    },
    "type": "object",
    "patternProperties": {
        "^[A-Z][a-zA-Z]*$": {
            "oneOf": [
                { "$ref": "#/$defs/DataDefinition" },
                {
                    "type": "array",
                    "items": {
                        "type": "string",
                        "pattern": "^[A-Z_]+$"
                    }
                }
            ]
        }
    },
    "additionalProperties": false
}

export default buffelaSchema