const { SmartBuffer } = require('smart-buffer')

const { schemaTypeIndices} = require('./buffaloTypes')

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
        case schemaTypeIndices.String:
            packet.writeStringNT(value)
            break;
        case schemaTypeIndices.Boolean:
            packet.writeUInt8(value ? 1 : 0)
            break;
        case schemaTypeIndices.Byte:
            packet.writeInt8(value)
            break;
        case schemaTypeIndices.Short:
            packet.writeInt16LE(value)
            break;
        case schemaTypeIndices.Int:
            packet.writeInt32LE(value)
            break;
        case schemaTypeIndices.Long:
            packet.writeBigInt64LE(value)
            break;
        case schemaTypeIndices.Float:
            packet.writeFloatLE(value)
            break;
        case schemaTypeIndices.Double:
            packet.writeDoubleLE(value)
            break;
        case schemaTypeIndices.UByte:
            packet.writeUInt8(value)
            break;
        case schemaTypeIndices.UShort:
            packet.writeUInt16LE(value)
            break;
        case schemaTypeIndices.UInt:
            packet.writeUInt32LE(value)
            break;
        case schemaTypeIndices.ULong:
            packet.writeBigUInt64LE(value)
            break;
        case schemaTypeIndices.IntArray:
        case schemaTypeIndices.ShortArray:
        case schemaTypeIndices.ByteArray:
        case schemaTypeIndices.LongArray:
        case schemaTypeIndices.FloatArray:
        case schemaTypeIndices.DoubleArray:
        case schemaTypeIndices.UByteArray:
        case schemaTypeIndices.UShortArray:
        case schemaTypeIndices.UIntArray:
        case schemaTypeIndices.ULongArray:
        case schemaTypeIndices.BooleanArray:
            writeField(field.size, value.length, packet)
            packet.writeBuffer(Buffer.from(value))
            break;
        case schemaTypeIndices.Buffer:
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

function writeSubtypeConstants(type, object, packet) {
    const subtypeKey = type.subtypeKey
    if (subtypeKey != null)
        writeTypeConstants(object[subtypeKey], object, packet)
}

function writeTypeConstants(type, object, packet) {
    writeOwnConstants(type, packet)
    writeSubtypeConstants(type, object, packet)
}

function writeOwnVariables(type, object, packet) {
    for (const varName in type.variables) {
        const field = type.variables[varName]
        writeField(field, object[varName], packet)
    }
}

function writeSubtypeVariables(type, object, packet) {
    const subtypeKey = type.subtypeKey
    if (subtypeKey != null)
        return writeTypeVariables(object[subtypeKey], object, packet)

    return type.leafIndex
}

function writeTypeVariables(type, object, packet) {
    writeOwnVariables(type, object, packet)
    return writeSubtypeVariables(type, object, packet)
}

function writeCalf(calf, object, packet) {
    writeOwnConstants(calf, packet)

    const leafTypeIndexOffset = packet.writeOffset
    const writeLeafTypeIndex = calf.leafTypes.length > 1
    if (writeLeafTypeIndex) {
        packet.writeUInt8(0) //Will get replaced
    }

    writeSubtypeConstants(calf, object, packet)

    const leafTypeIndex = writeTypeVariables(calf, object, packet)
    if (writeLeafTypeIndex) {
        packet.writeUInt8(leafTypeIndex, leafTypeIndexOffset)
    }
}

/**
 * @template T
 * @param {T} calf 
 * @param {T["_objectType"]} object
 * @returns {Buffer}
 */
function serializeCalf(calf, object) {
    const packet = new SmartBuffer()
    writeCalf(calf, object, packet)
    return packet.toBuffer()
}

module.exports = serializeCalf