const readBuffalo = require("../buffaloReader");
const Printer = require("./models/Printer");
const {getOutputStream} = require("./utils/fileUtils");
const path = require("node:path");
const {isEmpty} = require("./utils/objectUtils");
const {nativeTypes, schemaTypeIndices} = require("../buffaloTypes");

if (process.argv.length < 3 || process.argv.length > 4) {
    console.error("Usage: node generateKotlinClasses.js BUFFALO_FILE [OUTPUT_FILE_OR_DIRECTORY]")
    process.exit(1)
}

const inputPath = process.argv[2]
const buffalo = readBuffalo(inputPath)
const objectName = path.basename(inputPath, ".yaml")

const outputStream = getOutputStream(process.argv[3], objectName + ".kt")
const printer = new Printer(outputStream)

function repeatString(string, times) {
    return Array(times).fill(string).join("")
}

function outEnumValues(calf) {
    printer.blockStart(`enum class ${calf.name} {`)

    for (const {name} of calf.values)
        printer.line(`${name},`)

    printer.blockEnd('}')
}

function nativeType(field, dimensions = field.dimensions.length) {
    const { base } = field;
    const resolvedType = typeof base === 'number' ? nativeTypes[base].kt : base.name

    const arrayPrefix = repeatString("Array<", dimensions)
    const arraySuffix = repeatString( ">", dimensions)

    return arrayPrefix + resolvedType + arraySuffix
}

function printWritePrimitive(typeIndex, name) {
    switch (typeIndex) {
        case schemaTypeIndices.String:
            printer.line(`packet.writeStringNt(${name})`)
            break;
        case schemaTypeIndices.Boolean:
            printer.line(`packet.writeUByte(if (${name}) 1u else 0u)`)
            break;
        case schemaTypeIndices.Byte:
            printer.line(`packet.writeByte(${name})`)
            break;
        case schemaTypeIndices.Short:
            printer.line(`packet.writeShortLe(${name})`)
            break;
        case schemaTypeIndices.Int:
            printer.line(`packet.writeIntLe(${name})`)
            break;
        case schemaTypeIndices.Long:
            printer.line(`packet.writeLongLe(${name})`)
            break;
        case schemaTypeIndices.Float:
            printer.line(`packet.writeFloatLe(${name})`)
            break;
        case schemaTypeIndices.Double:
            printer.line(`packet.writeDoubleLe(${name})`)
            break;
        case schemaTypeIndices.UByte:
            printer.line(`packet.writeUByte(${name})`)
            break;
        case schemaTypeIndices.UShort:
            printer.line(`packet.writeUShortLe(${name})`)
            break;
        case schemaTypeIndices.UInt:
            printer.line(`packet.writeUIntLe(${name})`)
            break;
        case schemaTypeIndices.ULong:
            printer.line(`packet.writeULongLe(${name})`)
            break;
        default:
            throw new Error(`Invalid primitive type with index ${typeIndex}`)
    }
}

function printWriteSize(field, name) {
    if (typeof field !== "object") return

    switch (field.base) {
        case schemaTypeIndices.UByte:
            printer.line(`packet.writeUByte(${name}.toUByte())`)
            break;
        case schemaTypeIndices.UShort:
            printer.line(`packet.writeUShortLe(${name}.toUShort())`)
            break;
        case schemaTypeIndices.Int:
            printer.line(`packet.writeIntLe(${name})`)
            break;
        default:
            throw new Error(`Invalid size type with index ${field.base}`)
    }
}

function printWriteArray(field, name, typeIndex) {
    printWriteSize(field.size, `${name}.size`)
    const itemName = `item0`;
    printer.blockStart(`for (${itemName} in ${name}) {`)
    printWritePrimitive(typeIndex, itemName)
    printer.blockEnd('}')
}

function printWriteField(field, name, dimension = field.dimensions?.length) {
    if (dimension > 0) {
        const dimensionField = field.dimensions[dimension - 1]
        printWriteSize(dimensionField, `${name}.size`)

        const itemName = `item${dimension}`;
        printer.blockStart(`for (${itemName} in ${name}) {`)
        printWriteField(field, itemName, dimension - 1)
        printer.blockEnd('}')

        return
    }

    if (typeof field.base === 'number') {
        // Built-in type
        switch(field.base) {
            case schemaTypeIndices.IntArray:
                printWriteArray(field, name, schemaTypeIndices.Int)
                break;
            case schemaTypeIndices.ShortArray:
                printWriteArray(field, name, schemaTypeIndices.Short)
                break;
            case schemaTypeIndices.ByteArray:
                printWriteArray(field, name, schemaTypeIndices.Byte)
                break;
            case schemaTypeIndices.LongArray:
                printWriteArray(field, name, schemaTypeIndices.Long)
                break;
            case schemaTypeIndices.FloatArray:
                printWriteArray(field, name, schemaTypeIndices.Float)
                break;
            case schemaTypeIndices.DoubleArray:
                printWriteArray(field, name, schemaTypeIndices.Double)
                break;
            case schemaTypeIndices.UByteArray:
                printWriteArray(field, name, schemaTypeIndices.UByte)
                break;
            case schemaTypeIndices.UShortArray:
                printWriteArray(field, name, schemaTypeIndices.UShort)
                break;
            case schemaTypeIndices.UIntArray:
                printWriteArray(field, name, schemaTypeIndices.UInt)
                break;
            case schemaTypeIndices.ULongArray:
                printWriteArray(field, name, schemaTypeIndices.ULong)
                break;
            case schemaTypeIndices.BooleanArray:
                printWriteArray(field, name, schemaTypeIndices.Boolean)
                break;
            case schemaTypeIndices.Buffer:
                printWriteSize(field.size, `${name}.size`)
                printer.line(`packet.write(${name})`)
                break;
            default:
                printWritePrimitive(field.base, name)
        }
    } else if (typeof field.base === 'object') {
        const calf = field.base
        if (calf.type === "enum")
            printer.line(`packet.writeUByte(${name}.ordinal.toUByte())`)
        else if (calf.type === "data") {
            printer.line(`${name}.serializeHeader(packet)`)
            printer.line(`${name}.serializeBody(packet)`)
        } else
            throw new Error('Invalid type')
    } else {
        // Invalid type
        throw new Error('Invalid field base type format')
    }
}

function printValidateConstants(calf) {
    const values = Object.values(calf.constants)
    if (values.length === 0) return;

    printer.blockStart(`if (`)
    printer.lines(values.map(v => `packet.readUByte() != ${v}u.toUByte()`), "|| ")
    printer.blockEnd(') throw IllegalStateException("Invalid packet header")')
}

function readPrimitive(typeIndex) {
    switch (typeIndex) {
        case schemaTypeIndices.String:
            return `packet.readStringNt()`
        case schemaTypeIndices.Boolean:
            return `packet.readUByte() > 0u`
        case schemaTypeIndices.Byte:
            return `packet.readByte()`
        case schemaTypeIndices.Short:
            return `packet.readShortLe()`
        case schemaTypeIndices.Int:
            return `packet.readIntLe()`
        case schemaTypeIndices.Long:
            return `packet.readLongLe()`
        case schemaTypeIndices.Float:
            return `packet.readFloatLe()`
        case schemaTypeIndices.Double:
            return `packet.readDoubleLe()`
        case schemaTypeIndices.UByte:
            return `packet.readUByte()`
        case schemaTypeIndices.UShort:
            return `packet.readUShortLe()`
        case schemaTypeIndices.UInt:
            return `packet.readUIntLe()`
        case schemaTypeIndices.ULong:
            return `packet.readULongLe()`
        default:
            throw new Error(`Invalid primitive type with index ${typeIndex}`)
    }
}

function readSize(field) {
    if (typeof field !== "object") return field

    switch (field.base) {
        case schemaTypeIndices.UByte:
            return `packet.readUByte().toInt()`
        case schemaTypeIndices.UShort:
            return `packet.readUShortLe().toInt()`
        case schemaTypeIndices.Int:
            return `packet.readIntLe()`
        default:
            throw new Error(`Invalid size type with index ${field.base}`)
    }
}

function readArray(field, typeIndex) {
    const size = readSize(field.size)
    return `${nativeTypes[field.base].kt}(${size}) { _ -> ${readPrimitive(typeIndex)} }`
}

function readField(field, dimension = field.dimensions?.length) {
    if (dimension > 0) {
        const sizeField = field.dimensions[dimension - 1]
        const size = readSize(sizeField)

        return `Array(${size}) { _ -> ${readField(field,dimension - 1)} }`
    }

    if (typeof field.base === 'number') {
        // Built-in type
        switch(field.base) {
            case schemaTypeIndices.IntArray:
                return readArray(field, schemaTypeIndices.Int)
            case schemaTypeIndices.ShortArray:
                return readArray(field, schemaTypeIndices.Short)
            case schemaTypeIndices.ByteArray:
                return readArray(field, schemaTypeIndices.Byte)
            case schemaTypeIndices.LongArray:
                return readArray(field, schemaTypeIndices.Long)
            case schemaTypeIndices.FloatArray:
                return readArray(field, schemaTypeIndices.Float)
            case schemaTypeIndices.DoubleArray:
                return readArray(field, schemaTypeIndices.Double)
            case schemaTypeIndices.UByteArray:
                return readArray(field, schemaTypeIndices.UByte)
            case schemaTypeIndices.UShortArray:
                return readArray(field, schemaTypeIndices.UShort)
            case schemaTypeIndices.UIntArray:
                return readArray(field, schemaTypeIndices.UInt)
            case schemaTypeIndices.ULongArray:
                return readArray(field, schemaTypeIndices.ULong)
            case schemaTypeIndices.BooleanArray:
                return readArray(field, schemaTypeIndices.Boolean)
            case schemaTypeIndices.Buffer:
                const size = readSize(field.size)
                return `packet.readByteArray(${size})`
            default:
                return readPrimitive(field.base)
        }
    } else if (typeof field.base === 'object') {
        const calf = field.base
        if (calf.type === "enum")
            return `${calf.name}.entries[packet.readUByte().toInt()]`
        else if (calf.type === "data") {
            return `${calf.name}.deserialize(packet)`
        } else
            throw new Error('Invalid type')
    } else {
        // Invalid type
        throw new Error('Invalid field base type format')
    }
}

function printDataType(
    calf,
    superClass = "gr.elaevents.buffalo.schema.BuffaloType",
    superVars = {},
    depth = 0
) {
    const isAbstract = calf.subtypes.length > 0
    const isRootType = depth === 0

    printer.blockStart(`${isAbstract ? "sealed ": ""}class ${calf.name}: ${superClass} {`)

    if (calf.leafIndex != null)
        printer.line(`override val _leafIndex: UByte = ${calf.leafIndex}u`)

    for (const varName in calf.variables)
        printer.line(`val ${varName}: ${nativeType(calf.variables[varName])}`)

    printer.blockStart(`constructor(`)

    for (const superVarName in superVars)
        printer.line(`${superVarName}: ${nativeType(superVars[superVarName])},`)

    for (const varName in calf.variables)
        printer.line(`${varName}: ${nativeType(calf.variables[varName])},`)

    printer.blockEndStart(`): super(`)

    for (const superVarName in superVars)
        printer.line(`${superVarName},`)

    printer.blockEndStart(`) {`)

    for (const varName in calf.variables)
        printer.line(`this.${varName} = ${varName}`)

    printer.blockEnd('}')


    printer.blockStart(`${isAbstract ? "protected": "private"} constructor(packet: kotlinx.io.Buffer): super(${isRootType ? "" : "packet"}) {`)

    for (const varName in calf.variables)
        printer.line(`this.${varName} = ${readField(calf.variables[varName])}`)

    printer.blockEnd('}')


    if (isRootType) {
        printer.blockStart(`companion object Deserializer: gr.elaevents.buffalo.schema.BuffaloDeserializer<${calf.name}>() {`)
        printer.blockStart(`override fun deserialize(packet: kotlinx.io.Buffer): ${calf.name} {`)

        printValidateConstants(calf)

        const hasLeafTypeIndex = calf.leafTypes.length > 1
        if (!hasLeafTypeIndex) {
            const leafTypePath = calf.leafTypes[0]
            const leafTypeClass = leafTypePath.length > 0 ? leafTypePath.map(t => t.name).join('.') : calf.name
            printer.line(`return ${leafTypeClass}(packet)`)
        } else {
            printer.blockStart(`return when(packet.readUByte().toInt()) {`)

            for (let i = 0; i < calf.leafTypes.length; i++) {
                printer.line(`${i} -> ${calf.leafTypes[i].map(t => t.name).join('.')}.deserialize(packet)`)
            }
            printer.line(`else -> throw IllegalStateException("Invalid subtype index")`)

            printer.blockEnd('}')
        }

        printer.blockEnd('}')
        printer.blockEnd('}')
    } else if (isAbstract) {
        printer.blockStart(`internal companion object Deserializer {`)
        printer.blockStart(`internal fun validateSubtypeConstants(packet: kotlinx.io.Buffer) {`)

        if (depth > 1)
            printer.line(`${superClass}.validateSubtypeConstants(packet)`)

        printValidateConstants(calf)

        printer.blockEnd('}')
        printer.blockEnd('}')
    } else {
        printer.blockStart(`internal companion object Deserializer {`)
        printer.blockStart(`internal fun deserialize(packet: kotlinx.io.Buffer): ${calf.name} {`)

        if (depth > 1)
            printer.line(`validateSubtypeConstants(packet)`)

        printValidateConstants(calf)

        printer.line(`return ${calf.name}(packet)`)

        printer.blockEnd('}')
        printer.blockEnd('}')
    }


    const hasConstants = !isEmpty(calf.constants)
    const hasSubtypeIndex = calf.leafTypes?.length > 1
    if (hasConstants || hasSubtypeIndex) {
        printer.blockStart(`override fun serializeHeader(packet: kotlinx.io.Buffer) {`)

        if (!isRootType)
            printer.line(`super.serializeHeader(packet)`)

        for (const constName in calf.constants) {
            const field = calf.constants[constName];
            if (typeof field === 'number') {
                printer.line(`packet.writeUByte(${field}u)`)
            } else {
                throw new Error('Invalid constant type')
            }
        }

        if (hasSubtypeIndex)
            printer.line(`packet.writeUByte(_leafIndex)`)

        printer.blockEnd('}')
    }


    const hasVariables = !isEmpty(calf.variables)
    if (hasVariables) {
        printer.blockStart(`override fun serializeBody(packet: kotlinx.io.Buffer) {`)

        if (!isRootType)
            printer.line(`super.serializeBody(packet)`)

        for (const varName in calf.variables) {
            const field = calf.variables[varName];
            printWriteField(field, `this.${varName}`)
        }

        printer.blockEnd('}')
    }

    for (const subtype of calf.subtypes) {
        printDataType(
            subtype,
            calf.name,
            { ...superVars, ...calf.variables },
            depth + 1
        )
    }

    printer.blockEnd('}')
}

printer.line(`
import kotlinx.io.writeDoubleLe
import kotlinx.io.writeFloatLe
import kotlinx.io.writeUByte
import kotlinx.io.writeUIntLe
import kotlinx.io.writeULongLe
import kotlinx.io.writeUShortLe
import gr.elaevents.buffalo.utils.writeStringNt

import kotlinx.io.readDoubleLe
import kotlinx.io.readFloatLe
import kotlinx.io.readUByte
import kotlinx.io.readUIntLe
import kotlinx.io.readULongLe
import kotlinx.io.readUShortLe
import kotlinx.io.readByteArray
import gr.elaevents.buffalo.utils.readStringNt
`)

for (const calfName in buffalo) {
    const calf = buffalo[calfName]

    if (calf.type === "enum") {
        outEnumValues(calf)
    } else if (calf.type === "data") {
        printDataType(calf)
    } else {
        throw new Error(`Unknown definition type '${calf.type}' at '${calf.name}'`)
    }
}
