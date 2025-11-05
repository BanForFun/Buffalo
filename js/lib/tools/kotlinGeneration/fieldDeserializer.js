const {nativeTypes, schemaTypeIndices} = require("../../buffaloTypes");

function printDeserializerImports() {
    printer.line(`
import kotlinx.io.readDoubleLe
import kotlinx.io.readFloatLe
import kotlinx.io.readUByte
import kotlinx.io.readUIntLe
import kotlinx.io.readULongLe
import kotlinx.io.readUShortLe
import kotlinx.io.readByteArray
import gr.elaevents.buffalo.utils.readStringNt`)
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
        else if (calf.type === "data")
            return `${calf.name}.deserialize(packet)`
        else
            throw new Error('Invalid type')
    } else {
        // Invalid type
        throw new Error('Invalid field base type format')
    }
}

module.exports = {printDeserializerImports, readField}