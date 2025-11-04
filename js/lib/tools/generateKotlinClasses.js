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
const { out } = new Printer(outputStream)

function outEnumValues(calf) {
    out('\n')
    if (calf.values.length > 0) {
        out(`enum class ${calf.name} {\n`, +1)

        for (const {name} of calf.values)
            out(`${name},\n`)

        out('}\n', -1)
    } else {
        out(`enum class ${calf.name} { }\n`)
    }
}

function nativeType(field) {
    const { base, dimensions } = field;
    const resolvedType = typeof base === 'number' ? nativeTypes[base].kt : base.name
    const arrayPrefix = dimensions.map(() => "Array<").join("")
    const arraySuffix = dimensions.map(() => ">").join("")

    return arrayPrefix + resolvedType + arraySuffix
}

function outPrimitive(typeIndex, name) {
    switch (typeIndex) {
        case schemaTypeIndices.String:
            out(`packet.writeStringNt(${name})\n`)
            break;
        case schemaTypeIndices.Boolean:
            out(`packet.writeUByte(if (${name}) 1u else 0u)\n`)
            break;
        case schemaTypeIndices.Byte:
            out(`packet.writeByte(${name})\n`)
            break;
        case schemaTypeIndices.Short:
            out(`packet.writeShortLe(${name})\n`)
            break;
        case schemaTypeIndices.Int:
            out(`packet.writeIntLe(${name})\n`)
            break;
        case schemaTypeIndices.Long:
            out(`packet.writeLongLe(${name})\n`)
            break;
        case schemaTypeIndices.Float:
            out(`packet.writeFloatLe(${name})\n`)
            break;
        case schemaTypeIndices.Double:
            out(`packet.writeDoubleLe(${name})\n`)
            break;
        case schemaTypeIndices.UByte:
            out(`packet.writeUByte(${name})\n`)
            break;
        case schemaTypeIndices.UShort:
            out(`packet.writeUShortLe(${name})\n`)
            break;
        case schemaTypeIndices.UInt:
            out(`packet.writeUIntLe(${name})\n`)
            break;
        case schemaTypeIndices.ULong:
            out(`packet.writeULongLe(${name})\n`)
            break;
        default:
            throw new Error(`Invalid primitive type with index ${typeIndex}`)
    }
}

function outSize(field, name) {
    if (typeof field !== "object") return

    switch (field.base) {
        case schemaTypeIndices.UByte:
            out(`packet.writeUByte(${name}.toUByte())\n`)
            break;
        case schemaTypeIndices.UShort:
            out(`packet.writeUShortLe(${name}.toUShort())\n`)
            break;
        case schemaTypeIndices.Int:
            out(`packet.writeIntLe(${name})\n`)
            break;
        default:
            throw new Error(`Invalid size type with index ${field.base}`)
    }
}

function outArray(field, name, typeIndex) {
    outSize(field.size, `${name}.size`)
    const itemName = `${name}1`;
    out(`for (${itemName} in ${name}) {\n`, +1)
    outPrimitive(typeIndex, itemName)
    out('}\n', -1)
}

function outField(field, name, dimension = field.dimensions?.length) {
    if (dimension > 0) {
        const dimensionField = field.dimensions[dimension - 1]
        outSize(dimensionField, `${name}.size`)

        const itemName = `${name}${dimension}`;
        out(`for (${itemName} in ${name}) {\n`, +1)
        outField(field, itemName, dimension - 1)
        out('}\n', -1)

        return
    }

    if (typeof field.base === 'number') {
        // console.log("Writing field", schemaTypes[field.base], "at", packet.writeOffset)

        // Built-in type
        switch(field.base) {
            case schemaTypeIndices.IntArray:
                outArray(field, name, schemaTypeIndices.Int)
                break;
            case schemaTypeIndices.ShortArray:
                outArray(field, name, schemaTypeIndices.Short)
                break;
            case schemaTypeIndices.ByteArray:
                outArray(field, name, schemaTypeIndices.Byte)
                break;
            case schemaTypeIndices.LongArray:
                outArray(field, name, schemaTypeIndices.Long)
                break;
            case schemaTypeIndices.FloatArray:
                outArray(field, name, schemaTypeIndices.Float)
                break;
            case schemaTypeIndices.DoubleArray:
                outArray(field, name, schemaTypeIndices.Double)
                break;
            case schemaTypeIndices.UByteArray:
                outArray(field, name, schemaTypeIndices.UByte)
                break;
            case schemaTypeIndices.UShortArray:
                outArray(field, name, schemaTypeIndices.UShort)
                break;
            case schemaTypeIndices.UIntArray:
                outArray(field, name, schemaTypeIndices.UInt)
                break;
            case schemaTypeIndices.ULongArray:
                outArray(field, name, schemaTypeIndices.ULong)
                break;
            case schemaTypeIndices.BooleanArray:
                outArray(field, name, schemaTypeIndices.Boolean)
                break;
            case schemaTypeIndices.Buffer:
                outSize(field.size, `${name}.size`)
                out(`packet.write(${name})\n`)
                break;
            default:
                outPrimitive(field.base, name)
        }
    } else if (typeof field.base === 'object') {
        const calf = field.base
        if (calf.type === "enum")
            out(`packet.writeUByte(${name}.ordinal.toUByte())\n`)
        else if (calf.type === "data") {
            out(`${name}.serializeHeader(packet)\n`)
            out(`${name}.serializeBody(packet)\n`)
        } else
            throw new Error('Invalid type')
    } else {
        // Invalid type
        throw new Error('Invalid field base type format')
    }
}

function outDataType(calf, superName, superVars) {
    out('\n')

    const isAbstract = calf.subtypes.length > 0
    if (isAbstract) {
        if (superName)
            out(`sealed interface ${calf.name}: ${superName} {`, +1)
        else
            out(`sealed interface ${calf.name} {`, +1)

        if (!isEmpty(calf.variables)) out('\n')

        for (const varName in calf.variables) {
            const field = calf.variables[varName];
            out(`val ${varName}: ${nativeType(field)}\n`)
        }

        for (const subtype of calf.subtypes) {
            outDataType(
                subtype,
                calf.name,
                { ...calf.variables, ...superVars },
            )
        }
    } else {
        out(`class ${calf.name} (`, +1)

        if (!isEmpty(superVars) || !isEmpty(calf.variables)) out('\n')

        for (const varName in calf.variables) {
            const field = calf.variables[varName];
            out(`val ${varName}: ${nativeType(field)},\n`)
        }

        for (const superVarName in superVars) {
            const field = superVars[superVarName];
            out(`override val ${superVarName}: ${nativeType(field)},\n`)
        }

        if (superName)
            out(`): ${superName}`, -1)
        else
            out(')', -1)

        out(' {\n', +1)

        out(`override val leafIndex: UByte = ${calf.leafIndex}u\n\n`)
    }

    out(`override fun serializeHeader(packet: kotlinx.io.Buffer) {\n`, +1)

    out (`super.serializeHeader(packet)\n`)

    for (const constName in calf.constants) {
        const field = calf.constants[constName];
        if (typeof field === 'number') {
            out(`packet.writeUByte(${field}u)\n`)
        } else {
            throw new Error('Invalid constant type')
        }
    }

    if (calf.leafTypes?.length > 1)
        out(`packet.writeUByte(leafIndex)\n`)

    out('}\n', -1)

    out(`override fun serializeBody(packet: kotlinx.io.Buffer) {\n`, +1)

    out(`super.serializeBody(packet)\n`)

    for (const varName in calf.variables) {
        const field = calf.variables[varName];
        outField(field, varName)
    }

    out('}\n', -1)

    out('}\n', -1)
}

out(`
import kotlinx.io.writeDoubleLe
import kotlinx.io.writeFloatLe
import kotlinx.io.writeUByte
import kotlinx.io.writeUIntLe
import kotlinx.io.writeULongLe
import kotlinx.io.writeUShortLe
import gr.elaevents.buffalo.utils.writeStringNt
`)

for (const calfName in buffalo) {
    const calf = buffalo[calfName]

    if (calf.type === "enum") {
        outEnumValues(calf)
    } else if (calf.type === "data") {
        outDataType(calf, "gr.elaevents.buffalo.schema.BuffaloType", {})
    } else {
        throw new Error(`Unknown definition type '${calf.type}' at '${calf.name}'`)
    }
}
