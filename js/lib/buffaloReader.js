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

function parseType(buffalo, typeString, path) {
    if (sizePattern.test(typeString)) return +(typeString)

    const baseType = baseTypePattern.exec(typeString)?.[0]
    if (baseType == null) throw new Error(`Expected type at '${path}'.`)

    const type = {
        base: resolveType(buffalo, baseType, path),
        dimensions: [],
        size: null
    }

    parameterPattern.lastIndex = baseType.length
    const sizeParameter = parameterPattern.exec(typeString)?.[1]
    if (sizeParameter != null) {
        type.size = parseType(buffalo, sizeParameter, path)
        dimensionPattern.lastIndex = parameterPattern.lastIndex
    } else {
        dimensionPattern.lastIndex = baseType.length
    }

    type.dimensions = Array.from(typeString.matchAll(dimensionPattern))
        .map(match => parseType(buffalo, match[1], path))

    return type
}

function linkDataDefinition(buffalo, calf, path, fieldScope = {}) {
    const subtypes = []
    const fields = {}

    for (const childName in calf) {
        const child = calf[childName]
        if (typeof child === 'object') {
            linkDataDefinition(buffalo, child, `${path}.${childName}`, {...fieldScope})

            child.name = childName
            child.index = subtypes.length
            child[util.inspect.custom] = function() {
                return `<${path}.${this.name}>`
            }

            subtypes.push(child)
        } else {
            if (childName in fieldScope) {
                throw new Error(`Multiple definitions for field '${childName}' in '${path}' (first defined in '${fieldScope[childName]}').`)
            } else {
                fieldScope[childName] = path
            }

            if (child === typeType) {
                if (calf.subtypeKey != null)
                    throw new Error(`Duplicate type field '${childName}' in '${path}' (conflicting with '${calf.subtypeKey}')`)

                calf.subtypeKey = childName
            } else {
                fields[childName] = parseType(buffalo, child, path)
            }

            delete calf[childName]
        }
    }

    const isAbstract = subtypes.length > 0
    if (isAbstract && calf.subtypeKey == null)
        throw new Error(`No type field defined for abstract type '${path}'`)

    calf.subtypes = subtypes;
    calf.fields = fields;
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
                return `<${enumName}.${this.name}>`
            }
        }
    }

    parsed.values = calf.map((name) => parsed[name])
    parsed.type = "enum"
    parsed.typeName = enumName

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
            linkDataDefinition(buffalo, calf, [calfName])
            calf.type = "data"
            calf.typeName = calfName
        }
    }

    return buffalo
}

module.exports = readBuffalo