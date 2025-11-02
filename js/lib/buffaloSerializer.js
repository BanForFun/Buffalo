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
function writeProperty(field, value, packet, dimension = field.dimensions?.length) {
    if (typeof field !== 'object') return; // Is constant

    if (dimension > 0) {
        const dimensionField = field.dimensions[dimension - 1]
        writeProperty(dimensionField, value.length, packet);
        
        for (const item of value)
            writeProperty(field, item, packet, dimension - 1)

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
            writeProperty(field.size, value.length, packet)
            packet.writeBuffer(Buffer.from(value))
            break;
        case schemaTypeIndices.Buffer:
            writeProperty(field.size, value.size, packet)
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
            writeProperties(calf, value, packet)
    } else {
        // Invalid type
        throw new Error('Invalid field base type format')
    }
}

function writeProperties(calf, object, packet) {
    // console.log("Writing", calf.typeName ?? calf.name)

    const subtypeKey = calf.subtypeKey
    if (subtypeKey != null) {
        // console.log("Writing subtype key")

        const subtype = object[subtypeKey]
        packet.writeUInt8(subtype.index)
        writeProperties(subtype, object, packet)
    }

    for (const fieldName in calf.fields) {
        const field = calf.fields[fieldName]
        if (typeof field === 'number') {
            packet.writeUInt32LE(field) // Writing the field and not the value on purpose
        } else {
            writeProperty(field, object[fieldName], packet)
        }
    }
}

/**
 * @template T
 * @param {T} calf 
 * @param {T["_objectType"]} object
 * @returns {Buffer}
 */
function serializeBuffalo(calf, object) {
    const packet = new SmartBuffer()
    writeProperties(calf, object, packet)
    return packet.toBuffer()
}

module.exports = serializeBuffalo