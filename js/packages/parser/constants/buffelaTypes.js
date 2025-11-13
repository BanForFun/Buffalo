/**
 * @typedef {object} NativeType
 * @property {string} ts
 * @property {string} kt
 * @property {number} index
 */

let typeCount = 0

/**
 * @param {string} ts
 * @param {string} kt
 * @returns {NativeType}
 */
function NativeType(ts, kt) {
    return { ts, kt, index: typeCount++ }
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
    "UByte":            NativeType("number",            "UByte"),
    "UShort":           NativeType("number",            "UShort"),
    "Int":              NativeType("number",            "Int"),
})

const primitiveTypeMap = TypeMap({
    ...lengthTypeMap,
    "String":           NativeType("string",            "String"),
    "Boolean":          NativeType("boolean",           "Boolean"),
    "Byte":             NativeType("number",            "Byte"),
    "Short":            NativeType("number",            "Short"),

    "Long":             NativeType("BigInt",            "Long"),
    "Float":            NativeType("number",            "Float"),
    "Double":           NativeType("number",            "Double"),
    "UInt":             NativeType("number",            "UInt"),
    "ULong":            NativeType("BigInt",            "ULong"),
})

const arrayTypeMap = TypeMap({
    "UByteArray":       NativeType("Uint8Array",        "UByteArray"),
    "UShortArray":      NativeType("Uint16Array",       "UShortArray"),
    "UIntArray":        NativeType("Uint32Array",       "UIntArray"),
    "ULongArray":       NativeType("BigUint64Array",    "ULongArray"),
    "BooleanArray":     NativeType("Uint8ClampedArray", "BooleanArray"),
    "ByteArray":        NativeType("Int8Array",         "ByteArray"),
    "ShortArray":       NativeType("Int16Array",        "ShortArray"),
    "IntArray":         NativeType("Int32Array",        "IntArray"),
    "LongArray":        NativeType("BigInt64Array",     "LongArray"),
    "FloatArray":       NativeType("Float32Array",      "FloatArray"),
    "DoubleArray":      NativeType("Float64Array",      "DoubleArray"),
    "Buffer":           NativeType("Buffer",            "ByteArray"),
})

export const subtypeType = "Type"

export const typeMap = TypeMap({ ...primitiveTypeMap, ...arrayTypeMap })

export const lengthTypes = Object.keys(lengthTypeMap)

export const arrayTypes = Object.keys(arrayTypeMap)
