const process = require('node:process')
const path = require('node:path')
const readBuffalo = require('../buffaloReader')
const { nativeTypes } = require('../buffaloTypes')
const Printer = require('./models/Printer')
const {getOutputStream} = require("./utils/fileUtils");
const {isTypeAbstract, isTypeRoot} = require("./utils/calfUtils");

if (process.argv.length < 3 || process.argv.length > 4) {
    console.error("Usage: node generateTypescriptTypes.js BUFFALO_FILE [OUTPUT_FILE_OR_DIRECTORY]")
    process.exit(1)
}

const inputPath = process.argv[2]
const buffalo = readBuffalo(inputPath)
const objectName = path.basename(inputPath, ".yaml")

const outputStream = getOutputStream(process.argv[3], objectName + ".d.ts")
const printer = new Printer(outputStream)

printer.line(`type ValueOf<T extends object> = T[keyof T]`)

function printDataTypeInterface(type) {
    if (isTypeAbstract(type) || isTypeRoot(type)) {
        printer.blockStart(`readonly ${type.name} : {`)

        if (isTypeRoot(type))
            printer.line(`readonly _objectType: ${type.name}`)

        for (const subtype of type.subtypes) {
            printDataTypeInterface(subtype)
        } 

        printer.blockEnd('}')
    } else {
        printer.line(`readonly ${type.name}: unique symbol`)
    }
}

function printEnumTypeInterface(calf) {
    if (calf.values.length > 0) {
        printer.blockStart(`readonly ${calf.name} : {`)

        for (const {name} of calf.values)
            printer.line(`readonly ${name}: unique symbol`)

        printer.blockEnd('}')
    } else {
        printer.line(`readonly ${calf.name}: unique symbol`)
    }
}

printer.blockStart(`export type ${objectName} = {`)

for (const calfName in buffalo) {
    const calf = buffalo[calfName]

    if (calf.type === "enum") {
        printEnumTypeInterface(calf)
    } else if (calf.type === "data") {
        printDataTypeInterface(calf)
    } else {
        throw new Error(`Unknown definition type '${calf.type}' at '${calf.name}'`)
    }
}

printer.blockEnd('}')



function typeOf(...path) {
    return `${objectName}${path.map(p => `["${p}"]`).join("")}`
}

function nativeType(field) {
    const { base, dimensions } = field;
    const resolvedType = typeof base === 'number' ? nativeTypes[base].ts : base.name
    const arraySuffix = dimensions.map(() => "[]").join("")

    return resolvedType + arraySuffix
}

function printDataTypeObject(type, path, subtypeKey) {
    if (subtypeKey != null)
        printer.line(`${subtypeKey}: ${typeOf(...path)},`)

    for (const varName in type.variables) {
        const field = type.variables[varName];
        printer.line(`${varName}: ${nativeType(field)},`)
    }

    for (const constName in type.constants) {
        printer.line(`${constName}?: never,`)
    }

    if (!isTypeAbstract(type)) return false;

    printer.blockEndStart('} & (')

    for (let i = 0; i < type.subtypes.length; i++) {
        if (i === 0) printer.blockStart('{')

        const subtype = type.subtypes[i]
        const isAbstract = printDataTypeObject(subtype, path.concat(subtype.name), type.subtypeKey)

        if (i < type.subtypes.length - 1) {
            printer.blockEndStart(isAbstract ? ') | {' : '} | {')
        } else {
            printer.blockEnd(isAbstract ? ')' : '}')
        }
    }

    return true;
}

for (const calfName in buffalo) {
    const calf = buffalo[calfName]

    if (calf.type === "enum") {
        printer.line(`export type ${calfName} = ValueOf<${typeOf(calfName)}>\n\n`)
    } else if (calf.type === "data") {
        printer.blockStart(`type ${calfName} = {`)
        const isAbstract = printDataTypeObject(calf, [calfName], null)
        printer.blockEnd(isAbstract ? ')' : '}')
    } else {
        throw new Error(`Unknown definition type '${calf.type}' at '${calf.name}'`)
    }
}
