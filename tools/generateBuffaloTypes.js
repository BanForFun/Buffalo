const process = require('node:process')
const path = require('node:path')
const readBuffalo = require('../buffaloReader')
const { typescriptTypes } = require('../buffaloTypes')

if (process.argv.length < 3) {
    console.error("Usage: node generateBuffaloTypes.js BUFFALO_FILE")
    process.exit(1)
}

const inputPath = process.argv[2]
const buffalo = readBuffalo(inputPath)

const objectName = path.basename(inputPath, ".yaml")

function typeOf(...path) {
    return `${objectName}${path.map(p => `["${p}"]`).join("")}`
}

let indent = 0;
let isNewLine = true;

function out(string, indentOffset = 0) {
    if (indentOffset < 0)
        indent += indentOffset

    const space = isNewLine ? "".padEnd(indent * 2) : ""
    const output = space + string

    if (indentOffset > 0)
        indent += indentOffset

    process.stdout.write(output)

    isNewLine = output.endsWith("\n")
}

out(`type ValueOf<T extends object> = T[keyof T]\n\n`)

function outConstType(calf, name) {
    const isRoot = calf.type != null

    if (!isEmpty(calf.types) || isRoot) {
        out(`readonly ${name} : {\n`, +1)

        if (isRoot)
            out(`readonly _objectType: ${name}\n`)

        for (const type of calf.types) {
            outConstType(type, type.name)
        } 

        out('}\n', -1)
    } else {
        out(`readonly ${name}: unique symbol\n`)
    }
}

function outEnumValues(calf, name) {
    if (!isEmpty(calf.values)) {
        out(`readonly ${name} : {\n`, +1)

        for (const name in calf.values) 
            out(`readonly ${name}: unique symbol\n`)

        out('}\n', -1)
    } else {
        out(`readonly ${name}: unique symbol\n`)
    }
}

out(`export type ${objectName} = {\n`, +1)
for (const calfName in buffalo) {
    const calf = buffalo[calfName]

    if (calf.type === "enum") {
        outEnumValues(calf, calfName)
    } else if (calf.type === "data") {
        outConstType(calf, calfName)
    } else {
        throw new Error(`Unknown definition type '${calf.type}' at '${calf.name}'`)
    }
}
out('}\n\n', -1)

function isEmpty(object) {
    for (let _ in object) {
        return false;
    }

    return true;
}

function resolveFieldType(field) {
    if (typeof field !== "object") return "never";

    const { base, dimensions } = field;
    const resolvedType = typeof base === 'number' ? typescriptTypes[base] : base.typeName
    const arrayNotation = dimensions.map(() => "[]").join("")

    return resolvedType + arrayNotation
}

function outDataType(calf, path, typeKey) {
    const hasFields = !isEmpty(calf.fields) || typeKey != null
    if (hasFields) {
        out('{\n', +1)

        if (typeKey != null)
            out(`"${typeKey}": ${typeOf(...path)},\n`)

        for (const fieldName in calf.fields) {
            const field = calf.fields[fieldName];
            out(`"${fieldName}": ${resolveFieldType(field)},\n`)
        }

        out('}', -1)
    }

    const hasTypes = calf.types.length > 0
    if (hasTypes && hasFields)
        out(" & (\n", +1)
    
    for (let i = 0; i < calf.types.length; i++) {
        const type = calf.types[i]
        outDataType(type, path.concat(type.name), calf.typeKey)

        if (i < calf.types.length - 1) 
            out(" | ")
        else
            out("\n")
    }

    if (hasTypes && hasFields)
        out(')', -1)
}

for (const calfName in buffalo) {
    const calf = buffalo[calfName]

    if (calf.type === "enum") {
        out(`export type ${calfName} = ValueOf<${typeOf(calfName)}>\n\n`)
    } else if (calf.type === "data") {
        out(`export type ${calfName} = `)
        outDataType(calf, [calfName])
        out("\n\n")
    } else {
        throw new Error(`Unknown definition type '${calf.type}' at '${calf.name}'`)
    }
}
