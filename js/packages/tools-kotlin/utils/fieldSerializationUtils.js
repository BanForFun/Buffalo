const {typeMap} = require("@buffela/parser");

function printSerializerImports() {
    printer.line(`
import kotlinx.io.writeDoubleLe
import kotlinx.io.writeFloatLe
import kotlinx.io.writeUByte
import kotlinx.io.writeUIntLe
import kotlinx.io.writeULongLe
import kotlinx.io.writeUShortLe
import kotlinx.io.writeString
import gr.elaevents.buffela.internal.utils.writeStringNt`)
}

function printWriteSimpleVariable(typeIndex, name) {
    switch (typeIndex) {
        case typeMap.Boolean.index:
            printer.line(`packet.writeUByte(if (${name}) 1u else 0u)`)
            break;
        case typeMap.Byte.index:
            printer.line(`packet.writeByte(${name})`)
            break;
        case typeMap.Short.index:
            printer.line(`packet.writeShortLe(${name})`)
            break;
        case typeMap.Int.index:
            printer.line(`packet.writeIntLe(${name})`)
            break;
        case typeMap.Long.index:
            printer.line(`packet.writeLongLe(${name})`)
            break;
        case typeMap.Float.index:
            printer.line(`packet.writeFloatLe(${name})`)
            break;
        case typeMap.Double.index:
            printer.line(`packet.writeDoubleLe(${name})`)
            break;
        case typeMap.UByte.index:
            printer.line(`packet.writeUByte(${name})`)
            break;
        case typeMap.UShort.index:
            printer.line(`packet.writeUShortLe(${name})`)
            break;
        case typeMap.UInt.index:
            printer.line(`packet.writeUIntLe(${name})`)
            break;
        case typeMap.ULong.index:
            printer.line(`packet.writeULongLe(${name})`)
            break;
        default:
            throw new Error(`Invalid type with index ${typeIndex}`)
    }
}

function printWriteSizeField(field, name) {
    if (typeof field === 'number') {
        printer.blockStart(`if (${name} != ${field}) {`)
        printer.line(`throw IllegalStateException("Expected size '${field}' got '\${${name}}'")`)
        printer.blockEnd('}')

        return;
    }

    if (typeof field !== "object")
        throw new Error('Invalid size type')

    switch (field.base) {
        case typeMap.UByte.index:
            printer.line(`packet.writeUByte(${name}.toUByte())`)
            break;
        case typeMap.UShort.index:
            printer.line(`packet.writeUShortLe(${name}.toUShort())`)
            break;
        case typeMap.Int.index:
            printer.line(`packet.writeIntLe(${name})`)
            break;
        default:
            throw new Error(`Invalid size type with index ${field.base}`)
    }
}

function printWriteArray(field, name, typeIndex) {
    printWriteSizeField(field.size, `${name}.size`)
    const itemName = `item0`;
    printer.blockStart(`for (${itemName} in ${name}) {`)
    printWriteSimpleVariable(typeIndex, itemName)
    printer.blockEnd('}')
}

function printWriteVariable(field, name, dimension = field.dimensions?.length) {
    if (typeof field !== 'object')
        throw new Error('Expected a variable')

    if (dimension > 0) {
        const dimensionField = field.dimensions[dimension - 1]
        printWriteSizeField(dimensionField, `${name}.size`)

        const itemName = `item${dimension}`;
        printer.blockStart(`for (${itemName} in ${name}) {`)
        printWriteVariable(field, itemName, dimension - 1)
        printer.blockEnd('}')

        return
    }

    if (typeof field.base === 'number') {
        // Built-in type
        switch(field.base) {
            case typeMap.String.index:
                if (typeof field.size === 'number') {
                    printer.blockStart(`if (${name}.length != ${field.size}) {`)
                    printer.line(`throw IllegalStateException("Expected string length '${field.size}' got '\${${name}.length}'")`)
                    printer.blockEnd('}')

                    printer.line(`packet.writeString(${name})`)
                } else if (field.size === null) {
                    printer.line(`packet.writeStringNt(${name})`)
                } else {
                    throw new Error('Invalid string constant size')
                }

                break;
            case typeMap.IntArray.index:
                printWriteArray(field, name, typeMap.Int.index)
                break;
            case typeMap.ShortArray.index:
                printWriteArray(field, name, typeMap.Short.index)
                break;
            case typeMap.ByteArray.index:
                printWriteArray(field, name, typeMap.Byte.index)
                break;
            case typeMap.LongArray.index:
                printWriteArray(field, name, typeMap.Long.index)
                break;
            case typeMap.FloatArray.index:
                printWriteArray(field, name, typeMap.Float.index)
                break;
            case typeMap.DoubleArray.index:
                printWriteArray(field, name, typeMap.Double.index)
                break;
            case typeMap.UByteArray.index:
                printWriteArray(field, name, typeMap.UByte.index)
                break;
            case typeMap.UShortArray.index:
                printWriteArray(field, name, typeMap.UShort.index)
                break;
            case typeMap.UIntArray.index:
                printWriteArray(field, name, typeMap.UInt.index)
                break;
            case typeMap.ULongArray.index:
                printWriteArray(field, name, typeMap.ULong.index)
                break;
            case typeMap.BooleanArray.index:
                printWriteArray(field, name, typeMap.Boolean.index)
                break;
            case typeMap.Buffer.index:
                printWriteSizeField(field.size, `${name}.size`)
                printer.line(`packet.write(${name})`)
                break;
            default:
                if (field.size !== null)
                    throw new Error('Unexpected size on simple type')

                printWriteSimpleVariable(field.base, name)
        }
    } else if (typeof field.base === 'object') {
        const calf = field.base
        if (calf.type === "enum")
            printer.line(`packet.writeUByte(${name}.ordinal.toUByte())`)
        else if (calf.type === "data")
            printer.line(`${name}.serialize(packet)`)
        else
            throw new Error('Invalid field base calf format')
    } else {
        throw new Error('Invalid field base type format')
    }
}

module.exports = { printSerializerImports, printWriteVariable }