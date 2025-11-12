const Ajv = require("ajv");

const { typeMap, subtypeType } = require('../constants/buffelaTypes')
const buffelaSchema = require("../constants/buffelaSchema");

const inspectSymbol = Symbol.for("nodejs.util.inspect.custom");

const ajv = new Ajv()
const validateBuffela = ajv.compile(buffelaSchema)

const sizePattern = /^\d+$/
const baseTypePattern = /^[A-Z][a-zA-Z]+/
const parameterPattern = /\(([A-Z][a-zA-Z]+|\d+)\)/y
const dimensionPattern = /\[([A-Z][a-zA-Z]+|\d+)]/gy

function resolveType(buffela, typeString, path) {
    const schemaType = typeMap[typeString]
    if (schemaType != null) return schemaType.index

    const resolved = buffela[typeString]
    if (!resolved) throw new Error(`Unknown type '${typeString}' at '${path}'.`)

    return resolved
}

function parseType(buffela, typeString, fieldPath) {
    if (sizePattern.test(typeString)) return +(typeString)

    const baseType = baseTypePattern.exec(typeString)?.[0]
    if (baseType == null) throw new Error(`Expected type at '${fieldPath}'.`)

    const type = {
        base: resolveType(buffela, baseType, fieldPath),
        dimensions: [],
        size: null
    }

    parameterPattern.lastIndex = baseType.length
    const sizeParameter = parameterPattern.exec(typeString)?.[1]
    if (sizeParameter != null) {
        type.size = parseType(buffela, sizeParameter, fieldPath)
        dimensionPattern.lastIndex = parameterPattern.lastIndex
    } else {
        dimensionPattern.lastIndex = baseType.length
    }

    type.dimensions = Array.from(typeString.matchAll(dimensionPattern))
        .map(match => parseType(buffela, match[1], fieldPath))

    return type
}

function linkDataDefinition(buffela, leafPaths, type, path, fieldScope = {}) {
    const fullPath = [...path, type]

    const subtypes = []
    const variables = {}
    const constants = {}

    for (const memberName in type) {
        const child = type[memberName]
        if (typeof child === 'object') {
            linkDataDefinition(buffela, leafPaths, child, fullPath, {...fieldScope})

            child.name = memberName
            child[inspectSymbol] = function() {
                return `<BuffelaSubtype ${this.name}>`
            }

            subtypes.push(child)
        } else {
            if (memberName in fieldScope) {
                throw new Error(`Multiple definitions for field '${memberName}' in '${fullPath}' (first defined in '${fieldScope[memberName]}').`)
            } else {
                fieldScope[memberName] = fullPath
            }

            if (child === subtypeType) {
                if (type.subtypeKey != null)
                    throw new Error(`Duplicate type field '${memberName}' in '${fullPath}' (conflicting with '${type.subtypeKey}')`)

                type.subtypeKey = memberName
            } else {
                const fieldType = parseType(buffela, child, fullPath)
                if (typeof fieldType === 'object') {
                    variables[memberName] = fieldType
                } else {
                    constants[memberName] = fieldType
                }
            }

            delete type[memberName]
        }
    }

    const isAbstract = subtypes.length > 0
    if (isAbstract && type.subtypeKey == null)
        throw new Error(`No type field defined for abstract type '${path}'`)

    type.subtypes = subtypes;
    type.variables = variables;
    type.constants = constants;

    if (!isAbstract) {
        type.leafIndex = leafPaths.length

        fullPath.shift()
        leafPaths.push(fullPath)
    }
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
            [inspectSymbol]() {
                return `<BuffelaEnum ${this.name}>`
            }
        }
    }

    parsed.values = calf.map((name) => parsed[name])
    parsed.type = "enum"
    parsed.name = enumName

    return Object.freeze(parsed);
}

/**
 * @template T
 * @param {any} buffela
 * @returns {T}
 */
function parseBuffelaSchema(buffela) {
    if (!validateBuffela(buffela)) {
        console.error(ajv.errors?.reverse())
        throw new Error('Schema validation failed')
    }

    for (const calfName in buffela) {
        const calf = buffela[calfName];
        if (Array.isArray(calf)) {
            buffela[calfName] = parseEnum(calf, calfName)
        } else {
            const leafPaths = []
            linkDataDefinition(buffela, leafPaths, calf, [])
            calf.type = "data"
            calf.name = calfName
            calf.leafPaths = leafPaths
        }
    }

    return buffela
}

module.exports = parseBuffelaSchema