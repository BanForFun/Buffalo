const process = require('node:process')
const path = require('node:path')
const readBuffalo = require('../buffaloReader')
const { nativeTypes } = require('../buffaloTypes')
const Printer = require('./models/Printer')
const { isEmpty } = require('./utils/objectUtils')
const {getOutputStream} = require("./utils/fileUtils");

if (process.argv.length < 3 || process.argv.length > 4) {
    console.error("Usage: node generateTypescriptTypes.js BUFFALO_FILE [OUTPUT_FILE_OR_DIRECTORY]")
    process.exit(1)
}

const inputPath = process.argv[2]
const buffalo = readBuffalo(inputPath)
const objectName = path.basename(inputPath, ".yaml")

const outputStream = getOutputStream(process.argv[3], objectName + ".d.ts")
const { out } = new Printer(outputStream)

function typeOf(...path) {
    return `${objectName}${path.map(p => `["${p}"]`).join("")}`
}

out(`type ValueOf<T extends object> = T[keyof T]\n\n`)

function outConstType(calf, name) {
    const isRoot = calf.type != null

    if (!isEmpty(calf.subtypes) || isRoot) {
        out(`readonly ${name} : {\n`, +1)

        if (isRoot)
            out(`readonly _objectType: ${name}\n`)

        for (const subtype of calf.subtypes) {
            outConstType(subtype, subtype.name)
        } 

        out('}\n', -1)
    } else {
        out(`readonly ${name}: unique symbol\n`)
    }
}

function outEnumValues(calf, name) {
    if (calf.values.length > 0) {
        out(`readonly ${name} : {\n`, +1)

        for (const {name} of calf.values)
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

function resolveFieldType(field) {
    if (typeof field !== "object") return "never";

    const { base, dimensions } = field;
    const resolvedType = typeof base === 'number' ? nativeTypes[base].ts : base.typeName
    const arrayNotation = dimensions.map(() => "[]").join("")

    return resolvedType + arrayNotation
}

function outDataType(calf, path, subtypeKey) {
    const hasFields = !isEmpty(calf.fields) || subtypeKey != null
    if (hasFields) {
        out('{\n', +1)

        if (subtypeKey != null)
            out(`"${subtypeKey}": ${typeOf(...path)},\n`)

        for (const fieldName in calf.fields) {
            const field = calf.fields[fieldName];
            out(`"${fieldName}": ${resolveFieldType(field)},\n`)
        }

        out('}', -1)
    }

    const isAbstract = calf.subtypes.length > 0
    if (isAbstract && hasFields)
        out(" & (\n", +1)
    
    for (let i = 0; i < calf.subtypes.length; i++) {
        const subtype = calf.subtypes[i]
        outDataType(subtype, path.concat(subtype.name), calf.subtypeKey)

        if (i < calf.subtypes.length - 1)
            out(" | ")
        else
            out("\n")
    }

    if (isAbstract && hasFields)
        out(')', -1)
}

for (const calfName in buffalo) {
    const calf = buffalo[calfName]

    if (calf.type === "enum") {
        out(`export type ${calfName} = ValueOf<${typeOf(calfName)}>\n\n`)
    } else if (calf.type === "data") {
        out(`export type ${calfName} = `)
        outDataType(calf, [calfName], null)
        out("\n\n")
    } else {
        throw new Error(`Unknown definition type '${calf.type}' at '${calf.name}'`)
    }
}
