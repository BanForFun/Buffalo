const { SmartBuffer } = require('smart-buffer')

const { typeMap } = require('@buffela/parser')
const { calfUtils } = require("@buffela/tools-common");

/**
 * @typedef {object} Field
 * @property {object|number} base
 * @property {Field[]} dimensions
 * @property {Field?} size
 */

/**
 * 
 * @param {Field|number} field
 * @param {any} value 
 * @param {SmartBuffer} packet
 * @param {number|undefined} dimension
 * @returns 
 */
function writeField(field, value, packet, dimension = field.dimensions?.length) {
    if (typeof field !== 'object') return; // Is constant

    if (dimension > 0) {
        const dimensionField = field.dimensions[dimension - 1]
        writeField(dimensionField, value.length, packet);
        
        for (const item of value)
            writeField(field, item, packet, dimension - 1)

        return
    }

    if (typeof field.base === 'number') {
        // console.log("Writing field", schemaTypes[field.base], "at", packet.writeOffset)

        // Built-in type
        switch(field.base) {
        case typeMap.String.index:
            packet.writeStringNT(value)
            break;
        case typeMap.Boolean.index:
            packet.writeUInt8(value ? 1 : 0)
            break;
        case typeMap.Byte.index:
            packet.writeInt8(value)
            break;
        case typeMap.Short.index:
            packet.writeInt16LE(value)
            break;
        case typeMap.Int.index:
            packet.writeInt32LE(value)
            break;
        case typeMap.Long.index:
            packet.writeBigInt64LE(value)
            break;
        case typeMap.Float.index:
            packet.writeFloatLE(value)
            break;
        case typeMap.Double.index:
            packet.writeDoubleLE(value)
            break;
        case typeMap.UByte.index:
            packet.writeUInt8(value)
            break;
        case typeMap.UShort.index:
            packet.writeUInt16LE(value)
            break;
        case typeMap.UInt.index:
            packet.writeUInt32LE(value)
            break;
        case typeMap.ULong.index:
            packet.writeBigUInt64LE(value)
            break;
        case typeMap.IntArray.index:
        case typeMap.ShortArray.index:
        case typeMap.ByteArray.index:
        case typeMap.LongArray.index:
        case typeMap.FloatArray.index:
        case typeMap.DoubleArray.index:
        case typeMap.UByteArray.index:
        case typeMap.UShortArray.index:
        case typeMap.UIntArray.index:
        case typeMap.ULongArray.index:
        case typeMap.BooleanArray.index:
            writeField(field.size, value.length, packet)
            packet.writeBuffer(Buffer.from(value))
            break;
        case typeMap.Buffer.index:
            writeField(field.size, value.size, packet)
            packet.writeBuffer(value)
            break;
        default:
            throw new Error(`Invalid built-in type with index ${field.base}`)
        }
    } else if (typeof field.base === 'object') {
        const calf = field.base
        if (calf.type === "enum")
            packet.writeUInt8(value.index)
        else
            writeCalf(calf, value, packet)
    } else {
        // Invalid type
        throw new Error('Invalid field base type format')
    }
}

function writeOwnConstants(type, packet) {
    for (const constName in type.constants) {
        const field = type.constants[constName]
        if (typeof field === 'number') {
            packet.writeUInt8(field) // Writing the field and not the value on purpose
        } else {
            throw new Error('Invalid constant type')
        }
    }
}

function writeOwnVariables(type, data, packet) {
    for (const varName in type.variables) {
        const field = type.variables[varName]
        writeField(field, data[varName], packet)
    }
}

function writeSubtype(type, data, packet) {
    return calfUtils.isTypeAbstract(type)
        ? writeFields(data[type.subtypeKey], data, packet)
        : type.leafIndex;
}

function writeFields(type, data, packet) {
    writeOwnConstants(type, packet)
    writeOwnVariables(type, data, packet)
    return writeSubtype(type, data, packet)
}

function writeCalf(calf, data, packet) {
    writeOwnConstants(calf, packet)

    const leafIndexOffset = packet.writeOffset;
    if (calfUtils.isTypeAmbiguousRoot(calf))
        packet.writeUInt8(0) //Will get replaced

    writeOwnVariables(calf, data, packet)

    const leafIndex = writeSubtype(calf, data, packet)
    if (calfUtils.isTypeAmbiguousRoot(calf))
        packet.writeUInt8(leafIndex, leafIndexOffset)
}

function serializeCalf(calf, data) {
    const packet = new SmartBuffer()
    writeCalf(calf, data, packet)
    return packet.toBuffer()
}

module.exports = serializeCalf