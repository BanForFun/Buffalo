import {arrayTypes, hybridTypes, lengthTypes, subtypeType, typeMap} from './buffelaTypes.js'

function enumPattern(...options) {
    return `(${options.join('|')})`
}

const sizePattern =  "\\d+"
const hybridTypeNamePattern = enumPattern(...hybridTypes)
const arrayTypeNamePattern = enumPattern(...arrayTypes)
const lengthTypeNamePattern = enumPattern(...lengthTypes, sizePattern)
const specialTypeNamePattern = enumPattern(...arrayTypes, subtypeType)

const parameterlessTypePattern = `[A-Z][a-zA-Z]+(?<!^${specialTypeNamePattern})`
const hybridTypePattern = `${hybridTypeNamePattern}\\(${sizePattern}\\)`
const arrayTypePattern = `${arrayTypeNamePattern}\\(${lengthTypeNamePattern}\\)`
const arraySuffixPattern = `(\\[${lengthTypeNamePattern}\\])*`

/** @type {object} **/
const buffelaSchema = {
    "$defs": {
        "DataDefinition": {
            "type": "object",
            "patternProperties": {
                "^[a-z][a-zA-Z]*$": {
                    "oneOf": [
                        { "type": "number" },
                        {
                            "type": "string",
                            "pattern": "[]",
                            "enum": Object.keys(typeMap) // For editor suggestions
                        },
                        {
                            "type": "string",
                            "const": subtypeType
                        },
                        {
                            "type": "string",
                            "pattern": `^(${parameterlessTypePattern}|${hybridTypePattern}|${arrayTypePattern})${arraySuffixPattern}$`
                        },
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