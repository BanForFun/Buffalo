const fs = require("node:fs")
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
            linkDataDefinition(buffalo, child, `${path}/${childName}`, {...fieldScope})

            child.name = childName
            child.index = subtypes.length
            subtypes.push(child)
        } else {
            if (childName in fieldScope) {
                throw new Error(`Multiple definitions for field '${childName}' in '${path}' (first defined in '${fieldScope[childName]}').`)
            } else {
                fieldScope[childName] = path
            }

            if (child === typeType) {
                if (calf.typeKey != null)
                    throw new Error(`Duplicate type field '${childName}' in '${path}' (conflicting with '${calf.typeKey}')`)

                calf.typeKey = childName
            } else {
                fields[childName] = parseType(buffalo, child, path)
            }

            delete calf[childName]
        }
    }

    const isAbstract = subtypes.length > 0
    if (isAbstract && calf.typeKey == null)
        throw new Error(`No type field defined for abstract type '${path}'`)

    calf.subtypes = subtypes;
    calf.fields = fields;
}

function parseEnum(calf, name) {
    const values = {};
    for (let i = 0; i < calf.length; i++) {
        const value = calf[i];
        if (value in values)
            throw new Error(`Duplicate enum value '${value}' at '${name}'.`)

        values[value] = { index: i, name: value }
    }

    values.values = calf.map((name) => values[name])
    values.type = "enum"
    values.typeName = name

    return Object.freeze(values);
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