const {SmartBuffer} = require("smart-buffer");
const {schemaTypeIndices} = require("./buffaloTypes");

/**
 *
 * @param {Field|number} field
 * @param {SmartBuffer} packet
 * @param {number|undefined} dimension
 * @returns {any}
 */
function readProperty(field, packet, dimension = field.dimensions?.length) {
    if (typeof field !== 'object') return field; // Constant

    if (dimension > 0) {
        const dimensionField = field.dimensions[dimension - 1]
        const length = readProperty(dimensionField, packet);

        const array = [];
        for (let i = 0; i < length; i++) {
            array.push(readProperty(field, packet, dimension - 1))
        }

        return array
    }

    if (typeof field.base === 'number') {
        // Built-in type
        switch(field.base) {
            case schemaTypeIndices.String:
                return packet.readStringNT()
            case schemaTypeIndices.Boolean:
                return !!packet.readUInt8()
            case schemaTypeIndices.Byte:
                return packet.readInt8()
            case schemaTypeIndices.Short:
                return packet.readInt16LE()
            case schemaTypeIndices.Int:
                return packet.readInt32LE()
            case schemaTypeIndices.Long:
                return packet.readBigInt64LE()
            case schemaTypeIndices.Float:
                return packet.readFloatLE()
            case schemaTypeIndices.Double:
                return packet.readDoubleLE()
            case schemaTypeIndices.UByte:
                return packet.readUInt8()
            case schemaTypeIndices.UShort:
                return packet.readUInt16LE()
            case schemaTypeIndices.UInt:
                return packet.readUInt32LE()
            case schemaTypeIndices.ULong:
                return packet.readBigUInt64LE()
            case schemaTypeIndices.IntArray:
                return new Int32Array(packet.readBuffer(
                    readProperty(field.size, packet) * Int32Array.BYTES_PER_ELEMENT))
            case schemaTypeIndices.ShortArray:
                return new Int16Array(packet.readBuffer(
                    readProperty(field.size, packet) * Int16Array.BYTES_PER_ELEMENT))
            case schemaTypeIndices.ByteArray:
                return new Int8Array(packet.readBuffer(
                    readProperty(field.size, packet) * Int8Array.BYTES_PER_ELEMENT))
            case schemaTypeIndices.LongArray:
                return new BigInt64Array(packet.readBuffer(
                    readProperty(field.size, packet) * BigInt64Array.BYTES_PER_ELEMENT))
            case schemaTypeIndices.FloatArray:
                return new Float32Array(packet.readBuffer(
                    readProperty(field.size, packet) * Float32Array.BYTES_PER_ELEMENT))
            case schemaTypeIndices.DoubleArray:
                return new Float64Array(packet.readBuffer(
                    readProperty(field.size, packet) * Float64Array.BYTES_PER_ELEMENT))
            case schemaTypeIndices.UByteArray:
                return new Uint8Array(packet.readBuffer(
                    readProperty(field.size, packet) * Uint8Array.BYTES_PER_ELEMENT))
            case schemaTypeIndices.UShortArray:
                return new Uint16Array(packet.readBuffer(
                    readProperty(field.size, packet) * Uint16Array.BYTES_PER_ELEMENT))
            case schemaTypeIndices.UIntArray:
                return new Uint32Array(packet.readBuffer(
                    readProperty(field.size, packet) * Uint32Array.BYTES_PER_ELEMENT))
            case schemaTypeIndices.ULongArray:
                return new BigUint64Array(packet.readBuffer(
                    readProperty(field.size, packet) * BigUint64Array.BYTES_PER_ELEMENT))
            case schemaTypeIndices.BooleanArray:
                return new Uint8ClampedArray(packet.readBuffer(
                    readProperty(field.size, packet) * Uint8ClampedArray.BYTES_PER_ELEMENT))
            case schemaTypeIndices.Buffer:
                return packet.readBuffer(readProperty(field.size, packet))
            default:
                throw new Error(`Invalid built-in type with index ${field.base}`)
        }
    } else if (typeof field.base === 'object') {
        const calf = field.base
        if (calf.type === "enum")
            return calf.values[packet.readUInt8()]
        else {
            const object = {}
            readProperties(calf, object, packet)
            return object;
        }
    } else {
        // Invalid type
        throw new Error('Invalid field base type format')
    }
}

function readProperties(calf, object, packet) {
    const subtypeKey = calf.subtypeKey
    if (subtypeKey != null) {
        const typeIndex = packet.readUInt8()
        const subtype = calf.subtypes[typeIndex];
        object[subtypeKey] = subtype
        readProperties(subtype, object, packet, )
    }

    for (const fieldName in calf.fields) {
        const field = calf.fields[fieldName];

        if (typeof field === 'number') {
            if (packet.readUInt32LE() !== field)
                throw new Error(`Packet was not encoded with the same schema version.`)
        } else {
            object[fieldName] = readProperty(field, packet);
        }
    }
}

/**
 * @template T
 * @param {T} calf
 * @param {Buffer} buffer
 * @returns {T["_objectType"]}
 */
function deserializeBuffalo(calf, buffer) {
    const object = {}
    readProperties(calf, object, SmartBuffer.fromBuffer(buffer))
    return object
}

module.exports = deserializeBuffalo