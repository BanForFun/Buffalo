const {SmartBuffer} = require("smart-buffer");

const {typeMap} = require("@buffela/parser");
const {calfUtils} = require("@buffela/tools-common");

/**
 * @param {Field|number} field
 * @param {SmartBuffer} packet
 * @param {number|undefined} dimension
 * @returns {unknown}
 */
function readField(field, packet, dimension = field.dimensions?.length) {
    if (typeof field !== 'object') return field; // Constant

    if (dimension > 0) {
        const dimensionField = field.dimensions[dimension - 1]
        const length = readField(dimensionField, packet);

        const array = [];
        for (let i = 0; i < length; i++) {
            array.push(readField(field, packet, dimension - 1))
        }

        return array
    }

    if (typeof field.base === 'number') {
        // Built-in type
        switch(field.base) {
            case typeMap.String.index:
                return packet.readStringNT()
            case typeMap.Boolean.index:
                return !!packet.readUInt8()
            case typeMap.Byte.index:
                return packet.readInt8()
            case typeMap.Short.index:
                return packet.readInt16LE()
            case typeMap.Int.index:
                return packet.readInt32LE()
            case typeMap.Long.index:
                return packet.readBigInt64LE()
            case typeMap.Float.index:
                return packet.readFloatLE()
            case typeMap.Double.index:
                return packet.readDoubleLE()
            case typeMap.UByte.index:
                return packet.readUInt8()
            case typeMap.UShort.index:
                return packet.readUInt16LE()
            case typeMap.UInt.index:
                return packet.readUInt32LE()
            case typeMap.ULong.index:
                return packet.readBigUInt64LE()
            case typeMap.IntArray.index:
                return new Int32Array(packet.readBuffer(
                    readField(field.size, packet) * Int32Array.BYTES_PER_ELEMENT))
            case typeMap.ShortArray.index:
                return new Int16Array(packet.readBuffer(
                    readField(field.size, packet) * Int16Array.BYTES_PER_ELEMENT))
            case typeMap.ByteArray.index:
                return new Int8Array(packet.readBuffer(
                    readField(field.size, packet) * Int8Array.BYTES_PER_ELEMENT))
            case typeMap.LongArray.index:
                return new BigInt64Array(packet.readBuffer(
                    readField(field.size, packet) * BigInt64Array.BYTES_PER_ELEMENT))
            case typeMap.FloatArray.index:
                return new Float32Array(packet.readBuffer(
                    readField(field.size, packet) * Float32Array.BYTES_PER_ELEMENT))
            case typeMap.DoubleArray.index:
                return new Float64Array(packet.readBuffer(
                    readField(field.size, packet) * Float64Array.BYTES_PER_ELEMENT))
            case typeMap.UByteArray.index:
                return new Uint8Array(packet.readBuffer(
                    readField(field.size, packet) * Uint8Array.BYTES_PER_ELEMENT))
            case typeMap.UShortArray.index:
                return new Uint16Array(packet.readBuffer(
                    readField(field.size, packet) * Uint16Array.BYTES_PER_ELEMENT))
            case typeMap.UIntArray.index:
                return new Uint32Array(packet.readBuffer(
                    readField(field.size, packet) * Uint32Array.BYTES_PER_ELEMENT))
            case typeMap.ULongArray.index:
                return new BigUint64Array(packet.readBuffer(
                    readField(field.size, packet) * BigUint64Array.BYTES_PER_ELEMENT))
            case typeMap.BooleanArray.index:
                return new Uint8ClampedArray(packet.readBuffer(
                    readField(field.size, packet) * Uint8ClampedArray.BYTES_PER_ELEMENT))
            case typeMap.Buffer.index:
                return packet.readBuffer(readField(field.size, packet))
            default:
                throw new Error(`Invalid built-in type with index ${field.base}`)
        }
    } else if (typeof field.base === 'object') {
        const calf = field.base
        if (calf.type === "enum")
            return calf.values[packet.readUInt8()]
        else {
            const object = {}
            readCalf(calf, object, packet)
            return object;
        }
    } else {
        // Invalid type
        throw new Error('Invalid field base type format')
    }
}

function validateOwnConstants(type, packet) {
    for (const constName in type.constants) {
        const field = type.constants[constName];
        if (typeof field === 'number') {
            if (packet.readUInt8() !== field)
                throw new Error(`Packet was not encoded with the same schema version`)
        } else {
            throw new Error('Invalid constant type')
        }
    }
}

function readOwnVariables(type, data, packet) {
    for (const varName in type.variables) {
        const field = type.variables[varName];
        data[varName] = readField(field, packet);
    }
}

function readCalf(calf, data, packet) {
    validateOwnConstants(calf, packet);

    const hasLeafTypeIndex = calfUtils.isTypeAmbiguousRoot(calf)
    const leafTypeIndex = hasLeafTypeIndex ? packet.readUInt8() : 0
    const relativePath = calf.leafPaths[leafTypeIndex];

    readOwnVariables(calf, data, packet);

    for (const type of relativePath) {
        validateOwnConstants(type, packet);
        readOwnVariables(type, data, packet);
    }
}

function deserializeCalf(calf, buffer) {
    const data = {}
    readCalf(calf, data, SmartBuffer.fromBuffer(buffer))
    return data
}

module.exports = deserializeCalf