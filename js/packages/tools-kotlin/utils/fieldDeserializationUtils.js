const {typeMap} = require("@buffela/parser");

function printDeserializerImports() {
    printer.line(`
import kotlinx.io.readDoubleLe
import kotlinx.io.readFloatLe
import kotlinx.io.readUByte
import kotlinx.io.readUIntLe
import kotlinx.io.readULongLe
import kotlinx.io.readUShortLe
import kotlinx.io.readByteArray
import gr.elaevents.buffela.internal.utils.readStringNt`)
}

function readPrimitive(typeIndex) {
    switch (typeIndex) {
        case typeMap.String.index:
            return `packet.readStringNt()`
        case typeMap.Boolean.index:
            return `packet.readUByte() > 0u`
        case typeMap.Byte.index:
            return `packet.readByte()`
        case typeMap.Short.index:
            return `packet.readShortLe()`
        case typeMap.Int.index:
            return `packet.readIntLe()`
        case typeMap.Long.index:
            return `packet.readLongLe()`
        case typeMap.Float.index:
            return `packet.readFloatLe()`
        case typeMap.Double.index:
            return `packet.readDoubleLe()`
        case typeMap.UByte.index:
            return `packet.readUByte()`
        case typeMap.UShort.index:
            return `packet.readUShortLe()`
        case typeMap.UInt.index:
            return `packet.readUIntLe()`
        case typeMap.ULong.index:
            return `packet.readULongLe()`
        default:
            throw new Error(`Invalid primitive type with index ${typeIndex}`)
    }
}

function readSize(field) {
    if (typeof field !== "object") return field

    switch (field.base) {
        case typeMap.UByte.index:
            return `packet.readUByte().toInt()`
        case typeMap.UShort.index:
            return `packet.readUShortLe().toInt()`
        case typeMap.Int.index:
            return `packet.readIntLe()`
        default:
            throw new Error(`Invalid size type with index ${field.base}`)
    }
}

function readArray(field, typeIndex) {
    const size = readSize(field.size)
    return `${typeMap[field.base].kt}(${size}) { _ -> ${readPrimitive(typeIndex)} }`
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
            case typeMap.IntArray.index:
                return readArray(field, typeMap.Int.index)
            case typeMap.ShortArray.index:
                return readArray(field, typeMap.Short.index)
            case typeMap.ByteArray.index:
                return readArray(field, typeMap.Byte.index)
            case typeMap.LongArray.index:
                return readArray(field, typeMap.Long.index)
            case typeMap.FloatArray.index:
                return readArray(field, typeMap.Float.index)
            case typeMap.DoubleArray.index:
                return readArray(field, typeMap.Double.index)
            case typeMap.UByteArray.index:
                return readArray(field, typeMap.UByte.index)
            case typeMap.UShortArray.index:
                return readArray(field, typeMap.UShort.index)
            case typeMap.UIntArray.index:
                return readArray(field, typeMap.UInt.index)
            case typeMap.ULongArray.index:
                return readArray(field, typeMap.ULong.index)
            case typeMap.BooleanArray.index:
                return readArray(field, typeMap.Boolean.index)
            case typeMap.Buffer.index:
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