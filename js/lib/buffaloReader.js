const fs = require("node:fs")
const util = require("node:util")
const yaml = require('yaml')
const Ajv = require("ajv");

const { schemaTypes, typeType } = require('./buffaloTypes')
const buffaloSchema = require("./buffaloSchema");

const ajv = new Ajv()
const validateBuffalo = ajv.compile(buffaloSchema)

const sizePattern = /^\d+$/
const baseTypePattern = /^[A-Z][a-zA-Z]+/
const parameterPattern = /\(([A-Z][a-zA-Z]+|\d+)\)/y
const dimensionPattern = /\[([A-Z][a-zA-Z]+|\d+)]/gy

function resolveType(buffalo, typeString, path) {
    const schemaTypeIndex = schemaTypes.indexOf(typeString)
    if (schemaTypeIndex >= 0) return schemaTypeIndex

    const resolved = buffalo[typeString]
    if (!resolved) throw new Error(`Unknown type '${typeString}' at '${path}'.`)

    return resolved
}

function parseType(buffalo, typeString, fieldPath) {
    if (sizePattern.test(typeString)) return +(typeString)

    const baseType = baseTypePattern.exec(typeString)?.[0]
    if (baseType == null) throw new Error(`Expected type at '${fieldPath}'.`)

    const type = {
        base: resolveType(buffalo, baseType, fieldPath),
        dimensions: [],
        size: null
    }

    parameterPattern.lastIndex = baseType.length
    const sizeParameter = parameterPattern.exec(typeString)?.[1]
    if (sizeParameter != null) {
        type.size = parseType(buffalo, sizeParameter, fieldPath)
        dimensionPattern.lastIndex = parameterPattern.lastIndex
    } else {
        dimensionPattern.lastIndex = baseType.length
    }

    type.dimensions = Array.from(typeString.matchAll(dimensionPattern))
        .map(match => parseType(buffalo, match[1], fieldPath))

    return type
}

function linkDataDefinition(buffalo, leafTypes, type, path, fieldScope = {}, ) {
    const fullPath = [...path, type]

    const subtypes = []
    const variables = {}
    const constants = {}

    for (const memberName in type) {
        const child = type[memberName]
        if (typeof child === 'object') {
            linkDataDefinition(buffalo, leafTypes, child, fullPath, {...fieldScope})

            child.name = memberName
            child[util.inspect.custom] = function() {
                return `<BuffaloSubtype ${this.name}>`
            }

            // child.index = subtypes.length
            subtypes.push(child)
        } else {
            if (memberName in fieldScope) {
                throw new Error(`Multiple definitions for field '${memberName}' in '${fullPath}' (first defined in '${fieldScope[memberName]}').`)
            } else {
                fieldScope[memberName] = fullPath
            }

            if (child === typeType) {
                if (type.subtypeKey != null)
                    throw new Error(`Duplicate type field '${memberName}' in '${fullPath}' (conflicting with '${type.subtypeKey}')`)

                type.subtypeKey = memberName
            } else {
                const fieldType = parseType(buffalo, child, fullPath)
                if (typeof fieldType === 'object')
                    variables[memberName] = fieldType
                else
                    constants[memberName] = fieldType
            }

            delete type[memberName]
        }
    }

    const isAbstract = subtypes.length > 0
    if (isAbstract && type.subtypeKey == null)
        throw new Error(`No type field defined for abstract type '${path}'`)

    if (!isAbstract) {
        type.leafIndex = leafTypes.length
        fullPath.shift() //Remove root from start
        leafTypes.push(fullPath)
    }

    type.subtypes = subtypes;
    type.variables = variables;
    type.constants = constants;
}

function parseEnum(calf, enumName) {
    const parsed = {};
    for (let i = 0; i < calf.length; i++) {
        const name = calf[i];
        if (name in parsed)
            throw new Error(`Duplicate enum value '${name}' at '${enumName}'.`)

        parsed[name] = {
            index: i,
            name: name,
            [util.inspect.custom]() {
                return `<BuffaloEnum ${this.name}>`
            }
        }
    }

    parsed.values = calf.map((name) => parsed[name])
    parsed.type = "enum"
    parsed.name = enumName

    return Object.freeze(parsed);
}

function readBuffalo(path) {
    const buffalo = yaml.parse(fs.readFileSync(path, "utf8"))

    if (!validateBuffalo(buffalo)) {
        console.error(ajv.errors?.reverse())
        throw new Error('Schema validation failed')
    }

    for (const calfName in buffalo) {
        const calf = buffalo[calfName];
        if (Array.isArray(calf)) {
            buffalo[calfName] = parseEnum(calf, calfName)
        } else {
            const leafTypes = []
            linkDataDefinition(buffalo, leafTypes, calf, [])
            calf.type = "data"
            calf.name = calfName
            calf.leafTypes = leafTypes
        }
    }

    return buffalo
}

module.exports = readBuffalo