const {schemaTypeIndices} = require("../../buffaloTypes");

function printSerializerImports() {
    printer.line(`
import kotlinx.io.writeDoubleLe
import kotlinx.io.writeFloatLe
import kotlinx.io.writeUByte
import kotlinx.io.writeUIntLe
import kotlinx.io.writeULongLe
import kotlinx.io.writeUShortLe
import gr.elaevents.buffalo.utils.writeStringNt`)
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
        else if (calf.type === "data")
            printer.line(`${name}.serialize(packet)`)
        else
            throw new Error('Invalid type')
    } else {
        // Invalid type
        throw new Error('Invalid field base type format')
    }
}

module.exports = { printSerializerImports, printWriteField }