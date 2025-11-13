/**
 * @typedef {object} NativeType
 * @property {string} ts
 * @property {string} kt
 * @property {number} index
 */

/**
 * @param {number} index
 * @param {string} ts
 * @param {string} kt
 * @returns {NativeType}
 */
function NativeType(index, ts, kt) {
    return { ts, kt, index }
}

/**
 * @template {{ [K in keyof T]: NativeType }} T
 * @param {T} map
 * @returns {{ [K in keyof T]: NativeType }}
 */
function TypeMap(map) {
    return map
}


const lengthTypeMap = TypeMap({
    "UByte":            NativeType(0,  "number",            "UByte"),
    "UShort":           NativeType(1,  "number",            "UShort"),
    "Int":              NativeType(2,  "number",            "Int"),
})

const hybridTypeMap = TypeMap({
    "String":           NativeType(3,  "string",            "String"),
})

const primitiveTypeMap = TypeMap({
    ...lengthTypeMap,
    "Boolean":          NativeType(4,  "boolean",           "Boolean"),
    "Byte":             NativeType(5,  "number",            "Byte"),
    "Short":            NativeType(6,  "number",            "Short"),

    "Long":             NativeType(7,  "BigInt",            "Long"),
    "Float":            NativeType(8,  "number",            "Float"),
    "Double":           NativeType(9,  "number",            "Double"),
    "UInt":             NativeType(10, "number",            "UInt"),
    "ULong":            NativeType(11, "BigInt",            "ULong"),
})

const arrayTypeMap = TypeMap({
    "UByteArray":       NativeType(12, "Uint8Array",        "UByteArray"),
    "UShortArray":      NativeType(13, "Uint16Array",       "UShortArray"),
    "UIntArray":        NativeType(14, "Uint32Array",       "UIntArray"),
    "ULongArray":       NativeType(15, "BigUint64Array",    "ULongArray"),
    "BooleanArray":     NativeType(16, "Uint8ClampedArray", "BooleanArray"),
    "ByteArray":        NativeType(17, "Int8Array",         "ByteArray"),
    "ShortArray":       NativeType(18, "Int16Array",        "ShortArray"),
    "IntArray":         NativeType(19, "Int32Array",        "IntArray"),
    "LongArray":        NativeType(20, "BigInt64Array",     "LongArray"),
    "FloatArray":       NativeType(21, "Float32Array",      "FloatArray"),
    "DoubleArray":      NativeType(22, "Float64Array",      "DoubleArray"),
    "Buffer":           NativeType(23, "Buffer",            "ByteArray"),
})

export const subtypeType = "Type"

export const typeMap = TypeMap({
    ...primitiveTypeMap,
    ...hybridTypeMap,
    ...arrayTypeMap
})

export const lengthTypes = Object.keys(lengthTypeMap)
export const arrayTypes = Object.keys(arrayTypeMap)
export const hybridTypes = Object.keys(hybridTypeMap)